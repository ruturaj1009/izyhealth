import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
import { Organization } from '@/models/Organization';
import { signToken, signRefreshToken } from '@/lib/auth';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'ID Token required' }, { status: 400 });
        }

        // Verify Token
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (error) {
            console.error('Google Verify Error:', error);
            // Fallback for development/testing with dummy tokens if needed, 
            // but strict verification is better. 
            // For now, if verify fails, we return generic error.
            return NextResponse.json({ error: 'Invalid Google Token' }, { status: 401 });
        }

        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid Token Payload' }, { status: 400 });
        }

        const email = payload.email;

        // Check if user exists
        const user = await Auth.findOne({ email });

        if (!user) {
            // User not found -> 404 (Prompt client to signup)
            return NextResponse.json({
                error: 'Account not found. Please sign up first.',
                needSignup: true,
                email: email,
                googleId: payload.sub,
                profileImage: payload.picture,
                firstName: payload.given_name,
                lastName: payload.family_name
            }, { status: 404 });
        }

        // User found
        // If inactive -> 403
        if (!user.isActive) {
            return NextResponse.json({ error: 'Account is inactive. Please contact admin.' }, { status: 403 });
        }

        // Update Google ID/Image if missing (link account)
        if (!user.googleId || !user.profileImage) {
            user.googleId = payload.sub;
            if (!user.profileImage && payload.picture) user.profileImage = payload.picture;
            await user.save();
        }

        // Fetch Organization Details
        const org = await Organization.findOne({ orgid: user.orgid });
        const labName = org ? org.name : 'X Pharma';

        // Generate tokens
        const accessToken = signToken({
            userId: user._id,
            orgid: user.orgid,
            role: user.role,
            email: user.email
        }, '30m');

        const refreshToken = signRefreshToken({ userId: user._id });

        user.refreshToken = refreshToken;
        await user.save();

        const response = NextResponse.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            orgid: user.orgid,
            role: user.role,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImage: user.profileImage
            },
            labName
        });

        // Set Cookie
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error('Google Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
