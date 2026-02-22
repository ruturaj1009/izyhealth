import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StaffRole from '@/models/StaffRole';
import { authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        // Only ADMIN can manage roles
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const roles = await StaffRole.find({ orgid: user.orgid }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: roles });
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
        const { name, permissions } = body;

        if (!name) {
            return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
        }

        const role = await StaffRole.create({
            name,
            orgid: user.orgid,
            permissions
        });

        return NextResponse.json({ success: true, data: role }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'Role name already exists' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
