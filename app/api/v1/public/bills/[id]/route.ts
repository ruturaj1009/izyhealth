import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
// Force registration of models
import '@/models/User';
import '@/models/Test';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    const id = params.id;

    try {
        const bill = await Bill.findById(id)
            .populate('patient', 'firstName lastName title gender age mobile')
            .populate('doctor', 'firstName lastName')
            .populate('tests.test', 'name price');

        if (!bill) {
            return NextResponse.json({ status: 404, error: 'Bill not found' }, { status: 404 });
        }

        // Fetch associated report status if exists
        const Report = (await import('@/models/Report')).default;
        const report = await Report.findOne({ bill: id }).select('status _id');

        const billData = bill.toObject();
        billData.reportStatus = report ? report.status : 'INITIAL';
        billData.reportMongoId = report ? report._id : null;

        return NextResponse.json({
            status: 200,
            data: billData
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            error: (error as Error).message
        }, { status: 500 });
    }
}
