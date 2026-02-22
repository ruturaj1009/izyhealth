import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
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
        const { firstName, lastName, email, staffRoleId, isActive } = body;

        // SAFEGUARD: Check if target is ADMIN
        const targetStaff = await Auth.findOne({ _id: id, orgid: user.orgid });
        if (targetStaff && targetStaff.role === 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden: Cannot modify Admin accounts' }, { status: 403 });
        }

        const updatedStaff = await Auth.findOneAndUpdate(
            { _id: id, orgid: user.orgid },
            {
                firstName,
                lastName,
                email,
                staffRole: staffRoleId,
                isActive
            },
            { new: true, runValidators: true }
        ).select('-password').populate('staffRole');

        if (!updatedStaff) {
            return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedStaff });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 });
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

        // SAFEGUARD: Check if target is ADMIN
        const targetStaff = await Auth.findOne({ _id: id, orgid: user.orgid });
        if (targetStaff && targetStaff.role === 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden: Cannot delete Admin accounts' }, { status: 403 });
        }

        // Prevent self-deletion if they are the only admin (optional but good practice)
        // For now, basic scoped delete
        const deletedStaff = await Auth.findOneAndDelete({ _id: id, orgid: user.orgid });

        if (!deletedStaff) {
            return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
