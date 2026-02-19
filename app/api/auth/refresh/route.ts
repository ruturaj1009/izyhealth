import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
import { verifyRefreshToken, signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await dbConnect();

        // Try getting refreshToken from body first, then cookie
        const body = await req.json().catch(() => ({}));
        let refreshToken = body.refreshToken;

        if (!refreshToken) {
            const cookieStore = await (await import('next/headers')).cookies();
            refreshToken = cookieStore.get('refreshToken')?.value;
        }

        if (!refreshToken) {
            console.error('Refresh Failure: No refresh token found in body or cookies');
            return NextResponse.json({ error: 'Refresh token required' }, { status: 401 });
        }

        // 1. Verify Signature
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            console.error('Refresh Failure: Token signature verification failed');
            return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        // 2. Check if user is logged in (has any refresh token in DB)
        const user = await Auth.findById(decoded.userId);

        if (!user) {
            console.error('Refresh: User not found', decoded.userId);
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // We allow the refresh if:
        // 1. The token signature is valid (verified in step 1)
        // 2. The user has NOT logged out (user.refreshToken is not empty)
        // Note: We don't require an exact string match here to support concurrent sessions
        // produced by multiple logins/devices.
        if (!user.refreshToken) {
            console.warn('Refresh: Revoked or missing token in DB');
            return NextResponse.json({ error: 'Session expired or logged out' }, { status: 401 });
        }

        // 3. Issue new Access Token (30m)
        const accessToken = signToken({
            userId: user._id,
            orgid: user.orgid,
            role: user.role,
            email: user.email
        }, '30m');

        return NextResponse.json({
            success: true,
            accessToken
        });

    } catch (error: any) {
        console.error('Refresh Token Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
