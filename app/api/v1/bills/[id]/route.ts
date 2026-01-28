import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
// Force registration of models
import '@/models/User';
import '@/models/Test';
import { ApiResponse } from '@/types/api';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    const id = params.id;

    try {
        const bill = await Bill.findById(id)
            .populate('patient')
            .populate('doctor')
            .populate('tests.test');

        if (!bill) {
            return NextResponse.json({ status: 404, error: 'Bill not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            data: bill
        });

    } catch (error) {
        return NextResponse.json({
            status: 500,
            error: (error as Error).message
        }, { status: 500 });
    }
}
