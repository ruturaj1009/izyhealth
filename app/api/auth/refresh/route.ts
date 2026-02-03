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
            return NextResponse.json({ error: 'Refresh token required' }, { status: 401 });
        }

        // 1. Verify Signature
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        // 2. Check DB match
        const user = await Auth.findById(decoded.userId);

        if (!user) {
            console.log('Refresh: User not found', decoded.userId);
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        if (user.refreshToken !== refreshToken) {
            console.log('Refresh: Token Mismatch');
            console.log('Received:', refreshToken.substring(0, 10) + '...');
            console.log('Stored:', user.refreshToken ? user.refreshToken.substring(0, 10) + '...' : 'undefined');
            return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
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
