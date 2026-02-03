import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { Auth } from '@/models/Auth';
import { verifyPassword, signToken, signRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const user = await Auth.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check Active Status
        if (!user.isActive) {
            return NextResponse.json({ error: 'Account is inactive. Please contact admin.' }, { status: 403 });
        }

        const isValid = await verifyPassword(password, user.password!);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Fetch Organization Details to get Lab Name
        const org = await Organization.findOne({ orgid: user.orgid });
        const labName = org ? org.name : 'X Pharma';

        // Generate access token (30m)
        const accessToken = signToken({
            userId: user._id,
            orgid: user.orgid,
            role: user.role,
            email: user.email
        }, '30m');

        // Generate refresh token (7d)
        const refreshToken = signRefreshToken({ userId: user._id });

        // Save refresh token to DB
        user.refreshToken = refreshToken;
        await user.save();

        const response = NextResponse.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            orgid: user.orgid,
            role: user.role,
            // Return profile info
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImage: user.profileImage
            },
            labName: labName // Return the actual lab name
        });

        // Set refresh token in HttpOnly cookie
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        // Also set access token in cookie for convenience (optional)
        response.cookies.set('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 30 // 30 mins
        });

        return response;

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
