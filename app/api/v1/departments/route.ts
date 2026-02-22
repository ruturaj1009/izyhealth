import { NextRequest, NextResponse } from 'next/server';
import { Department } from '@/models/Department';
import { authorize, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const user = await authorize(req);
        if (!hasPermission(user, 'department', 'read')) {
            return NextResponse.json({ success: false, error: 'Forbidden: Missing read permission' }, { status: 403 });
        }
        const departments = await Department.find({ orgid: user.orgid })
            .select('name description icon createdAt')
            .sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: departments });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        if (!hasPermission(user, 'department', 'create')) {
            return NextResponse.json({ success: false, error: 'Forbidden: Missing create permission' }, { status: 403 });
        }
        const body = await req.json();
        const { name, description, icon } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const existing = await Department.findOne({ name, orgid: user.orgid });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Department with this name already exists' }, { status: 400 });
        }

        const department = await Department.create({
            name,
            description,
            icon,
            orgid: user.orgid
        });
        return NextResponse.json({ success: true, data: department }, { status: 201 });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}
