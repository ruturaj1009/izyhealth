import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Test from '@/models/Test';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();

        // Basic Validation
        if (!body.name) {
            return NextResponse.json({ success: false, error: 'Test name is required' }, { status: 400 });
        }
        if (body.price === undefined || body.price < 0) {
            return NextResponse.json({ success: false, error: 'Valid price is required' }, { status: 400 });
        }

        const test = await Test.create(body);
        return NextResponse.json({ success: true, data: test }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const department = searchParams.get('department');

        let query: any = {};
        if (type) query.type = type;
        if (department) query.department = department; // Filter by department
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const tests = await Test.find(query).sort({ createdAt: -1 }).populate('department');
        return NextResponse.json({ success: true, data: tests });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
