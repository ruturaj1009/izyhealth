import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import '@/models/User';
import '@/models/Test';
import '@/models/Department';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await context.params;

    try {
        const report = await Report.findById(id)
            .populate('patient', 'firstName lastName phone age gender')
            .populate('doctor', 'firstName lastName title')
            .populate('bill')
            .populate({
                path: 'results.testId',
                select: 'name type department unit referenceRanges interpretation method',
                populate: {
                    path: 'department',
                    select: 'name'
                }
            })
            .populate({
                path: 'results.groupResults.testId',
                select: 'name type department unit referenceRanges interpretation method'
            });

        if (!report) {
            return NextResponse.json({ status: 404, error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            data: report
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            error: (error as Error).message
        }, { status: 500 });
    }
}
