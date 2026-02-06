
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import Bill from '@/models/Bill';
import { User } from '@/models/User';
import '@/models/Test'; // Register Test model for population
import '@/models/Department'; // Register Department model for population
import { authorize } from '@/lib/auth';

// GET: Fetch Report Details
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await context.params;

    try {
        const user = await authorize(request);
        const report = await Report.findOne({ _id: id, orgid: user.orgid })
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
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ status: status, error: (error as Error).message }, { status: status });
    }
}

// PUT: Update Report (Status, Results, Patient/Doctor)
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await context.params;

    try {
        const user = await authorize(request);
        const body = await request.json();
        const { status, results, patientId, doctorId, impression } = body;

        const report = await Report.findOne({ _id: id, orgid: user.orgid });
        if (!report) {
            return NextResponse.json({ status: 404, error: 'Report not found' }, { status: 404 });
        }

        // 1. Update Basic Fields
        if (status) report.status = status;
        if (results) report.results = results; // Full array replacement or merge? Assuming full replacement/merge from UI state
        if (impression !== undefined) report.impression = impression;

        // 2. Handle Patient/Doctor Re-assignment (Sync with Bill)
        let billUpdates: any = {};

        if (patientId && patientId !== report.patient.toString()) {
            report.patient = patientId;
            billUpdates.patient = patientId;
        }

        if (doctorId && doctorId !== report.doctor.toString()) {
            // Find doctor to confirm exists? Assuming ID comes from trusted list
            report.doctor = doctorId;
            billUpdates.doctor = doctorId;
        }

        await report.save();

        // 3. Sync to Bill if needed
        if (Object.keys(billUpdates).length > 0) {
            // Update Bill but Ensure it also belongs to org
            await Bill.findOneAndUpdate({ _id: report.bill, orgid: user.orgid }, billUpdates);
        }

        // Return updated report
        const updatedReport = await Report.findOne({ _id: id, orgid: user.orgid })
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

        return NextResponse.json({
            status: 200,
            data: updatedReport,
            message: 'Report updated successfully'
        });

    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ status: status, error: (error as Error).message }, { status: status });
    }
}
