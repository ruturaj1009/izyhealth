import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StaffRole from '@/models/StaffRole';
import { authorize } from '@/lib/auth';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const params = await props.params;
    const { id } = params;

    try {
        const user = await authorize(req);
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        const body = await req.json();
        const { name, permissions } = body;

        const updatedRole = await StaffRole.findOneAndUpdate(
            { _id: id, orgid: user.orgid },
            { name, permissions },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedRole });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'Role name already exists' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const params = await props.params;
    const { id } = params;

    try {
        const user = await authorize(req);
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        const deletedRole = await StaffRole.findOneAndDelete({ _id: id, orgid: user.orgid });

        if (!deletedRole) {
            return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Role deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
