import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
// Force registration of models
import '@/models/User';
import '@/models/Test';
import { ApiResponse } from '@/types/api';
import { authorize } from '@/lib/auth';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    const id = params.id;

    try {
        const user = await authorize(request);
        const bill = await Bill.findOne({ _id: id, orgid: user.orgid })
            .populate('patient')
            .populate('doctor')
            .populate('tests.test');

        console.log('API FETCH BILL:', id);
        console.log('PATIENT:', bill?.patient);
        console.log('DOCTOR:', bill?.doctor);
        console.log('TESTS:', JSON.stringify(bill?.tests));

        if (!bill) {
            return NextResponse.json({ status: 404, error: 'Bill not found' }, { status: 404 });
        }

        // Fetch associated report status
        const Report = (await import('@/models/Report')).default;
        const report = await Report.findOne({ bill: id, orgid: user.orgid }).select('status reportId _id');

        const billData = bill.toObject();
        billData.reportStatus = report ? report.status : 'INITIAL';
        billData.reportId = report ? report.reportId : null;
        billData.reportMongoId = report ? report._id : null;

        return NextResponse.json({
            status: 200,
            data: billData
        });

    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({
            status: status,
            error: (error as Error).message
        }, { status: status });
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    const { id } = params;

    try {
        await authorize(request);
        const body = await request.json();
        // Extract fields we allow updating
        // We expect: tests, totalAmount, discountAmount, paidAmount, dueAmount, paymentType, discountType, status
        // AND maybe collectDueAmount, duePaymentType (for "Collect Due" and "Add Test" extra payment)
        const {
            tests, totalAmount, discountAmount, paidAmount, dueAmount,
            paymentType, discountType, status,
            collectDueAmount, duePaymentType
        } = body;

        let finalPaidAmount = paidAmount;
        let finalDueAmount = dueAmount;
        let finalStatus = status;

        // Special handling for "Collect Due" or "Add Test" payment
        if (collectDueAmount !== undefined && collectDueAmount !== null) {
            // Frontend might send the NEW total paidAmount, or we might need to increment. 
            // Existing logic in "Add Test" sends the NEW `paidAmount` (totalPaid).
            // But "Collect Due" modal might send just the incremental amount?
            // Let's check frontend implementation.

            // "Add Test" logic: sends `paidAmount` (which is total).
            // "Collect Due" logic: sends `collectDueAmount`. 

            // If `paidAmount` is provided in body, trust it as the TOTAL paid.
            // If `collectDueAmount` is provided (from Collect Due modal), we need to fetch current bill to increment?
            // OR frontend can send total.

            // Let's look at "Collect Due" frontend: sends `collectDueAmount`. It does NOT send `paidAmount`.
            // So we need to fetch current bill to update.

            if (paidAmount === undefined) {
                const currentBill = await Bill.findById(id);
                if (!currentBill) return NextResponse.json({ status: 404, error: 'Bill not found' }, { status: 404 });

                finalPaidAmount = currentBill.paidAmount + Number(collectDueAmount);
                finalDueAmount = Math.max(0, currentBill.totalAmount - currentBill.discountAmount - finalPaidAmount);
            }
        }

        // Auto-update status based on due amount
        if (finalDueAmount <= 0) {
            finalStatus = 'PAID';
        } else if (finalDueAmount < (totalAmount - discountAmount)) {
            finalStatus = 'PARTIAL'; // Or keep existing if logic differs
        } else {
            finalStatus = 'PENDING';
        }

        // 1. Update Bill
        const updatedBill = await Bill.findByIdAndUpdate(
            id,
            {
                tests,
                totalAmount,
                discountAmount,
                paidAmount: finalPaidAmount,
                dueAmount: finalDueAmount,
                paymentType,
                duePaymentType, // Save the secondary payment type
                discountType,
                status: finalStatus
            },
            { new: true }
        ).populate('patient').populate('doctor').populate('tests.test');

        if (!updatedBill) {
            return NextResponse.json({ status: 404, error: 'Bill not found' }, { status: 404 });
        }

        // 2. Sync Report
        const Report = (await import('@/models/Report')).default;
        const report = await Report.findOne({ bill: id });

        if (report) {
            let reportModified = false;
            const existingTestIds = report.results.map((r: any) => r.testId.toString());

            // Check for new tests
            updatedBill.tests.forEach((t: any) => {
                // t.test is populated object due to .populate('tests.test') above
                // Check safety if population failed?
                if (t.test && t.test._id) {
                    const tId = t.test._id.toString();
                    if (!existingTestIds.includes(tId)) {
                        // Add new test result placeholder
                        report.results.push({
                            testId: t.test._id,
                            testName: t.test.name,
                            status: 'PENDING',
                            resultValue: '',
                            unit: t.test.unit || '',
                            referenceRange: '' // Simplification
                        });
                        reportModified = true;
                    }
                }
            });

            if (reportModified) {
                await report.save();
            }
        }

        const billData = updatedBill.toObject();
        billData.reportStatus = report ? report.status : 'INITIAL';
        billData.reportId = report ? report.reportId : null;
        billData.reportMongoId = report ? report._id : null;

        return NextResponse.json({
            status: 200,
            data: billData,
            message: 'Bill updated and Report synced'
        });

    } catch (error) {
        console.error("Bill PUT Error:", error);
        return NextResponse.json({
            status: 500,
            error: (error as Error).message
        }, { status: 500 });
    }
}
