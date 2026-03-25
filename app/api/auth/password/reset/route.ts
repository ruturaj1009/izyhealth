import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
import { Organization } from '@/models/Organization';
import { OtpFactory } from '@/lib/otp-factory';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const authUser = await Auth.findOne({ email });
        if (!authUser) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const org = await Organization.findOne({ orgid: authUser.orgid }).lean() as any;
        if (!org) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const otpStrategy = OtpFactory.create('hmac');
        const isValid = otpStrategy.verify({ orgid: authUser.orgid, spid: org.spid }, otp);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(newPassword);
        authUser.password = hashedPassword;
        authUser.refreshToken = undefined;
        await authUser.save();

        return NextResponse.json({ message: 'Password reset successfully. Please log in with your new password.' });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
    }
}
