
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import Bill from '@/models/Bill';
import { User } from '@/models/User';
import Test from '@/models/Test';
import '@/models/Department'; // Register Department model for population
import { authorize, hasPermission } from '@/lib/auth';

// GET: Fetch Report Details
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await context.params;

    try {
        const user = await authorize(request);
        if (!hasPermission(user, 'report', 'read')) {
            return NextResponse.json({ status: 403, error: 'Forbidden: You do not have permission to view reports' }, { status: 403 });
        }

        // Step 1: Fetch raw report (no populates — very fast)
        const raw = await Report.findOne({ _id: id, orgid: user.orgid })
            .select('-__v -orgid')
            .lean() as any;

        if (!raw) {
            return NextResponse.json({ status: 404, error: 'Report not found' }, { status: 404 });
        }

        // Step 2: Collect all unique test IDs from results + groupResults
        const testIdSet = new Set<string>();
        for (const r of raw.results || []) {
            if (r.testId) testIdSet.add(r.testId.toString());
            for (const gr of r.groupResults || []) {
                if (gr.testId) testIdSet.add(gr.testId.toString());
            }
        }

        // Step 3: Run all reference lookups in parallel
        const [patient, doctor, bill, tests] = await Promise.all([
            User.findById(raw.patient).select('firstName lastName mobile age gender').lean(),
            User.findById(raw.doctor).select('firstName lastName title').lean(),
            Bill.findById(raw.bill).lean(),
            Test.find({ _id: { $in: Array.from(testIdSet) } })
                .select('name type department unit referenceRanges interpretation method')
                .populate('department', 'name')
                .lean()
        ]);

        // Step 4: Build a fast testId → testDef lookup map
        const testMap: Record<string, any> = {};
        for (const t of tests as any[]) {
            testMap[t._id.toString()] = t;
        }

        // Step 5: Merge test definitions into results
        const results = (raw.results || []).map((r: any) => ({
            ...r,
            testId: testMap[r.testId?.toString()] || r.testId,
            groupResults: (r.groupResults || []).map((gr: any) => ({
                ...gr,
                testId: testMap[gr.testId?.toString()] || gr.testId,
            }))
        }));

        return NextResponse.json({
            status: 200,
            data: { ...raw, patient, doctor, bill, results }
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
        if (!hasPermission(user, 'report', 'update')) {
            return NextResponse.json({ status: 403, error: 'Forbidden: You do not have permission to update reports' }, { status: 403 });
        }
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
            report.doctor = doctorId;
            billUpdates.doctor = doctorId;
        }

        await report.save();

        // 3. Sync to Bill if needed
        if (Object.keys(billUpdates).length > 0) {
            await Bill.findOneAndUpdate({ _id: report.bill, orgid: user.orgid }, billUpdates);
        }

        // Return updated report
        const updatedReport = await Report.findOne({ _id: id, orgid: user.orgid })
            .populate('patient', 'firstName lastName mobile age gender')
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
            })
            .select('-__v -orgid');

        return NextResponse.json({
            status: 200,
            data: updatedReport,
            message: 'Report updated successfully'
        });

    } catch (error: any) {
        console.error('Report PUT Error:', error);
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ status: status, error: (error as Error).message }, { status: status });
    }
}
