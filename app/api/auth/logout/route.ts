import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
import { verifyRefreshToken } from '@/lib/auth';

export async function POST() {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (refreshToken) {
            // Optional: Decode to find user and clear DB token
            // This ensures safe logout even if cookie is stolen
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded?.userId) {
                await Auth.findByIdAndUpdate(decoded.userId, {
                    $unset: { refreshToken: 1 }
                });
            }
        }

        const response = NextResponse.json({ message: 'Logged out successfully' });

        // Clear Cookies
        response.cookies.delete('refreshToken');
        response.cookies.delete('token'); // If we set this previously

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
