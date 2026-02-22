import { NextRequest, NextResponse } from 'next/server';
import { Department } from '@/models/Department';
import { authorize, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const user = await authorize(req);
        const method = req.method;
        const requiredAction = method === 'PUT' ? 'update' : 'delete';
        if (!hasPermission(user, 'department', requiredAction)) {
            return NextResponse.json({ success: false, error: `Forbidden: Missing ${requiredAction} permission` }, { status: 403 });
        }
        const { id } = await params;
        const body = await req.json();
        const { name, description, icon } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const updatedDepartment = await Department.findOneAndUpdate(
            { _id: id, orgid: user.orgid },
            { name, description, icon },
            { new: true, runValidators: true }
        );

        if (!updatedDepartment) {
            return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedDepartment });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const user = await authorize(req);
        const method = req.method;
        const requiredAction = method === 'PUT' ? 'update' : 'delete';
        if (!hasPermission(user, 'department', requiredAction)) {
            return NextResponse.json({ success: false, error: `Forbidden: Missing ${requiredAction} permission` }, { status: 403 });
        }
        const { id } = await params;
        const deletedDepartment = await Department.findOneAndDelete({ _id: id, orgid: user.orgid });

        if (!deletedDepartment) {
            return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deletedDepartment });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}
