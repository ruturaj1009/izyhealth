import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Department } from '@/models/Department';
import { authorize } from '@/lib/auth';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-pharma';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(MONGODB_URI);
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    try {
        const user = await authorize(req);
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
    await connectDB();
    try {
        const user = await authorize(req);
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
