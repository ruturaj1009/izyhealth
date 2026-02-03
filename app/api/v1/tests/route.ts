import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { Department } from '@/models/Department'; // Ensure Department is registered
import { authorize } from '@/lib/auth';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);

        const body = await req.json();

        // Enforce orgid from token
        body.orgid = user.orgid;

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

            // Verify group belongs to same org (security check)
            await Test.findOneAndUpdate(
                { _id: body.groupId, orgid: user.orgid },
                { $addToSet: { subTests: test._id } }
            );
            return NextResponse.json({ success: true, data: test }, { status: 201 });
        }

        const test = await Test.create(body);
        return NextResponse.json({ success: true, data: test }, { status: 201 });
    } catch (error: any) {
        // Different status for Auth errors vs Server errors could be cleaner, but using 500/401 based on message or generic
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}

export async function GET(req: NextRequest) {
    await dbConnect();
    console.log("Department Model Registered:", !!Department);
    try {
        const user = await authorize(req);

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const department = searchParams.get('department');

        let query: any = { orgid: user.orgid }; // Scoped to Org

        if (type) query.type = type;
        if (department) query.department = department; // Filter by department

        const includeSubtests = searchParams.get('includeSubtests');

        // Only hide subtests if NOT searching and NOT explicitly asked to include them
        if (!includeSubtests && !search) {
            query.parentGroup = { $exists: false };
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const tests = await Test.find(query).sort({ createdAt: -1 }).populate('department');
        return NextResponse.json({ success: true, data: tests });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}

