import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
import { User, Doctor } from '@/models/User';
import { ApiResponse } from '@/types/api';
import { UserRole } from '@/types/user';
import { ReportStatus } from '@/enums/report';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);
        const body = await request.json();

        let { patientId, doctorId, tests, paymentType, totalAmount, discountAmount, paidAmount, status } = body;

        // --- VALIDATION ---
        const errors = [];
        if (!patientId && body.patientMode !== 'create') errors.push('Patient is required');
        if (!doctorId) errors.push('Doctor is required');
        if (!tests || !Array.isArray(tests) || tests.length === 0) errors.push('At least one test is required');

        if (errors.length > 0) {
            return NextResponse.json({ status: 400, error: errors.join(', ') }, { status: 400 });
        }

        // Handle SELF doctor
        if (doctorId === 'SELF') {
            let selfDoc = await User.findOne({
                role: UserRole.DOCTOR,
                firstName: 'SELF',
                orgid: user.orgid // Scoped to Org
            });

            if (!selfDoc) {
                // Create SELF doctor if not exists
                selfDoc = await Doctor.create({
                    orgid: user.orgid,
                    title: 'Dr.',
                    firstName: 'SELF',
                    gender: 'Other',
                    age: 0,
                    role: UserRole.DOCTOR,
                    hospitalName: 'In House',
                    revenueSharing: 0
                });
            }
            if (selfDoc) {
                doctorId = selfDoc._id;
            } else {
                throw new Error("Failed to initialize SELF doctor");
            }
        }

        // Create Bill
        const due = totalAmount - discountAmount - paidAmount;

        const bill = await Bill.create({
            orgid: user.orgid, // Assign orgid
            patient: patientId,
            doctor: doctorId,
            tests,
            totalAmount,
            discountAmount,
            paidAmount,
            dueAmount: due,
            paymentType,
            discountType: body.discountType || 'AMOUNT',
            status: status || (due > 0 ? 'PARTIAL' : 'PAID')
        });

        // Populate to return full data
        await bill.populate([
            'patient',
            'doctor',
            { path: 'tests.test', populate: { path: 'subTests' } }
        ]);

        // --- Create Linked Report ---
        try {
            const Report = (await import('@/models/Report')).default;

            // Expand Group Tests
            const reportResults: any[] = [];

            bill.tests.forEach((t: any) => {
                const testDef = t.test;
                if (!testDef) return;

                if (testDef.type === 'group' && testDef.subTests && testDef.subTests.length > 0) {
                    // Group: Create nested object
                    const groupResult = {
                        testId: testDef._id,
                        testName: testDef.name,
                        type: 'group',
                        status: 'PENDING',
                        groupResults: testDef.subTests.map((sub: any) => ({
                            testId: sub._id,
                            testName: sub.name,
                            type: sub.type || 'normal',
                            status: 'PENDING',
                            unit: sub.unit || '',
                            referenceRange: ''
                        }))
                    };
                    reportResults.push(groupResult);
                } else {
                    // Normal or Descriptive
                    reportResults.push({
                        testId: testDef._id,
                        testName: testDef.name,
                        type: testDef.type || 'normal',
                        status: 'PENDING',
                        unit: testDef.unit || '',
                        referenceRange: ''
                    });
                }
            });

            await Report.create({
                orgid: user.orgid, // Assign orgid
                bill: bill._id,
                patient: bill.patient._id,
                doctor: bill.doctor._id,
                results: reportResults,
                status: ReportStatus.INITIAL
            });

        } catch (reportError) {
            console.error("Failed to auto-create report:", reportError);
            return NextResponse.json({
                status: 201,
                data: bill,
                warning: "Report auto-creation failed: " + (reportError as Error).message
            });
        }

        console.info(`[Bill] Created bill ${bill._id} for patient ${bill.patient._id}`);
        return NextResponse.json({
            status: 201,
            data: bill
        });

    } catch (error: any) {
        console.error('Bill Create Error:', error);
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({
            status: status,
            error: (error as Error).message
        }, { status: status });
    }
}

export async function GET(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        let query: any = { orgid: user.orgid }; // Filter by orgid

        const dateParam = searchParams.get('date');
        if (dateParam) {
            const startDate = new Date(dateParam);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(dateParam);
            endDate.setHours(23, 59, 59, 999);

            query.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        if (search) {
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = search;
            }
        }

        const total = await Bill.countDocuments(query);
        const bills = await Bill.find(query)
            .select('patient doctor totalAmount dueAmount status createdAt')
            .populate('patient', 'firstName lastName mobile')
            .populate('doctor', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            status: 200,
            data: bills,
            metadata: {
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ status: status, error: (error as Error).message }, { status: status });
    }
}
