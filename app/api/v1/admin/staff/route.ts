import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth, AuthRole } from '@/models/Auth';
import { authorize, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        const staff = await Auth.find({
            orgid: user.orgid,
            role: { $in: [AuthRole.STAFF, AuthRole.ADMIN] }
        }).populate('staffRole').select('-password').sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: staff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        const body = await req.json();
        const { email, password, firstName, lastName, staffRoleId } = body;

        if (!email || !password || !firstName || !staffRoleId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if email already exists
        const existingAuth = await Auth.findOne({ email });
        if (existingAuth) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        const newStaff = await Auth.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            orgid: user.orgid,
            isActive: true,
            role: AuthRole.STAFF,
            staffRole: staffRoleId
        });

        const staffData = newStaff.toObject();
        delete staffData.password;

        return NextResponse.json({ success: true, data: staffData }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
