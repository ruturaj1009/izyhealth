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

        // If groupId is provided, link this test to the group
        if (body.groupId) {
            body.parentGroup = body.groupId; // Set parentGroup on creation
            const test = await Test.create(body);

            await Test.findByIdAndUpdate(body.groupId, {
                $addToSet: { subTests: test._id }
            });
            return NextResponse.json({ success: true, data: test }, { status: 201 });
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

        // Hide subtests from the main list (unless they are orphans or main tests)
        // Check if query should include subtests? For now, user requested to hide them.
        // If we need them for selection, we might need a flag.
        // Assuming "Select Tests" modal still works because it might filter by nothing or just department?
        // Wait, if we hide them here, the "Select Tests" modal won't find them if it uses this API?
        // The user said "newly created subtests only display under the parent test".
        // Let's add a flag `includeSubtests`

        const includeSubtests = searchParams.get('includeSubtests');
        if (!includeSubtests) {
            query.parentGroup = { $exists: false };
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const tests = await Test.find(query).sort({ createdAt: -1 }).populate('department');
        return NextResponse.json({ success: true, data: tests });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
