import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import '@/models/Department'; // Register Department model for population
import { authorize, hasPermission } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const user = await authorize(req);
        const test = await Test.findOne({ _id: id, orgid: user.orgid })
            .populate('department', 'name')
            .populate('subTests')
            .select('-__v -orgid');

        if (!test) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: test });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const user = await authorize(req);

        if (!hasPermission(user, 'test', 'update')) {
            return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to update tests' }, { status: 403 });
        }

        const body = await req.json();

        // Security: Remove orgid from body
        delete body.orgid;

        // If subTests field is being updated, handle parentGroup linkage
        if (body.subTests) {
            const currentTest = await Test.findOne({ _id: id, orgid: user.orgid });
            if (!currentTest) return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });

            const oldSubTests = currentTest.subTests.map((t: any) => t.toString());
            const newSubTests = body.subTests;

            // Find removed tests and unset parentGroup
            const removedTests = oldSubTests.filter((t: string) => !newSubTests.includes(t));
            if (removedTests.length > 0) {
                await Test.updateMany({ _id: { $in: removedTests }, orgid: user.orgid }, { $unset: { parentGroup: 1 } });
            }

            // Find added tests and set parentGroup
            const addedTests = newSubTests.filter((t: string) => !oldSubTests.includes(t));
            if (addedTests.length > 0) {
                await Test.updateMany({ _id: { $in: addedTests }, orgid: user.orgid }, { $set: { parentGroup: id } });
            }
        }

        const test = await Test.findOneAndUpdate(
            { _id: id, orgid: user.orgid },
            body,
            { new: true, runValidators: true }
        ).populate('subTests').select('-__v -orgid');

        if (!test) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: test });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const user = await authorize(req);

        if (!hasPermission(user, 'test', 'delete')) {
            return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to delete tests' }, { status: 403 });
        }

        const test = await Test.findOneAndDelete({ _id: id, orgid: user.orgid });
        if (!test) {
            return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ success: false, error: error.message }, { status: status });
    }
}
