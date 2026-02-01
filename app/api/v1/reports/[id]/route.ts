
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import Bill from '@/models/Bill';
import { User } from '@/models/User';
import '@/models/Test'; // Register Test model for population
import '@/models/Department'; // Register Department model for population

// GET: Fetch Report Details
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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
            });

        if (!report) {
            return NextResponse.json({ status: 404, error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            data: report
        });
    } catch (error) {
        return NextResponse.json({ status: 500, error: (error as Error).message }, { status: 500 });
    }
}

// PUT: Update Report (Status, Results, Patient/Doctor)
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await context.params;

    try {
        const body = await request.json();
        const { status, results, patientId, doctorId, impression } = body;
        console.log(`[PUT Report] ID: ${id}, Payload:`, body);

        const report = await Report.findById(id);
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
            await Bill.findByIdAndUpdate(report.bill, billUpdates);
        }

        // Return updated report
        const updatedReport = await Report.findById(id)
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
            });

        return NextResponse.json({
            status: 200,
            data: updatedReport,
            message: 'Report updated successfully'
        });

    } catch (error) {
        console.error("Report Update Error Detailed:", error);
        return NextResponse.json({ status: 500, error: (error as Error).message }, { status: 500 });
    }
}
