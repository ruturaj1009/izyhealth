import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import '@/models/Department'; // Register Department model for population

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

        // If subTests field is being updated, handle parentGroup linkage
        if (body.subTests) {
            const currentTest = await Test.findById(id);
            if (!currentTest) return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });

            const oldSubTests = currentTest.subTests.map((t: any) => t.toString());
            const newSubTests = body.subTests;

            // Find removed tests and unset parentGroup
            const removedTests = oldSubTests.filter((t: string) => !newSubTests.includes(t));
            if (removedTests.length > 0) {
                await Test.updateMany({ _id: { $in: removedTests } }, { $unset: { parentGroup: 1 } });
            }

            // Find added tests and set parentGroup
            const addedTests = newSubTests.filter((t: string) => !oldSubTests.includes(t));
            if (addedTests.length > 0) {
                await Test.updateMany({ _id: { $in: addedTests } }, { $set: { parentGroup: id } });
            }
        }

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
