import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Test from '@/models/Test';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const test = await Test.findById(id).populate('department').populate('subTests');
        if (!test) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: test });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const body = await req.json();
        const test = await Test.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).populate('subTests');

        if (!test) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: test });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const test = await Test.findByIdAndDelete(id);
        if (!test) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
