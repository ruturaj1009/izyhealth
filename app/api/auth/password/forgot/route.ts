import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
import { Organization } from '@/models/Organization';
import { OtpFactory } from '@/lib/otp-factory';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const authUser = await Auth.findOne({ email }).lean() as any;

        if (!authUser) {
            return NextResponse.json({ error: 'Email is not registered.' }, { status: 404 });
        }

        if (!authUser.isActive) {
            return NextResponse.json({ error: 'Account is inactive. Please contact admin.' }, { status: 403 });
        }

        const org = await Organization.findOne({ orgid: authUser.orgid }).lean() as any;
        if (!org) {
            return NextResponse.json({ error: 'Organization not found. Please contact admin.' }, { status: 404 });
        }

        const otpStrategy = OtpFactory.create('hmac');
        const otp = otpStrategy.generate({ orgid: authUser.orgid, spid: org.spid });

        await sendOtpEmail({ to: email, otp, labName: org.name });

        return NextResponse.json({ message: 'If this email is registered, an OTP has been sent.' });

    } catch (error: any) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }
}
