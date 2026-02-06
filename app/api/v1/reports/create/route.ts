import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
import Report from '@/models/Report';
import { ReportStatus } from '@/enums/report';
import { authorize } from '@/lib/auth';

// Helper function to format reference ranges
function formatReferenceRange(referenceRanges: any[]): string {
    if (!referenceRanges || referenceRanges.length === 0) return '';

    return referenceRanges.map((r: any) => {
        let val = '';
        if (r.min && r.max) val = `${r.min} - ${r.max}`;
        else if (r.min) val = `> ${r.min}`;
        else if (r.max) val = `< ${r.max}`;
        return r.name ? `${r.name}: ${val}` : val;
    }).filter(Boolean).join(', ');
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const user = await authorize(request);
        const { billId } = await request.json();

        if (!billId) {
            return NextResponse.json({ status: 400, error: 'Bill ID is required' }, { status: 400 });
        }

        const bill = await Bill.findOne({ _id: billId, orgid: user.orgid })
            .populate('patient')
            .populate('doctor')
            .populate({ path: 'tests.test', populate: { path: 'subTests' } });

        if (!bill) {
            return NextResponse.json({ status: 404, error: 'Bill not found' }, { status: 404 });
        }

        let report = await Report.findOne({ bill: billId });

        if (!report) {
            // Create New
            const reportResults: any[] = [];

            bill.tests.forEach((t: any) => {
                const testDef = t.test;
                if (!testDef) return;

                if (testDef.type === 'group' && testDef.subTests && testDef.subTests.length > 0) {
                    // Group: Nested
                    const groupResult = {
                        testId: testDef._id,
                        testName: testDef.name,
                        type: 'group',
                        status: 'PENDING',
                        groupResults: testDef.subTests.map((sub: any) => ({
                            testId: sub._id,
                            testName: sub.name || 'Unknown Test',
                            type: sub.type || 'normal',
                            status: 'PENDING',
                            unit: sub.unit || '',
                            referenceRange: formatReferenceRange(sub.referenceRanges)
                        }))
                    };
                    reportResults.push(groupResult);
                } else {
                    // Normal or Descriptive
                    reportResults.push({
                        testId: testDef._id,
                        testName: testDef.name || 'Unknown Test',
                        type: testDef.type || 'normal',
                        status: 'PENDING',
                        unit: testDef.unit || '',
                        referenceRange: formatReferenceRange(testDef.referenceRanges)
                    });
                }
            });

            report = await Report.create({
                orgid: user.orgid,
                bill: bill._id,
                patient: bill.patient._id,
                doctor: bill.doctor._id,
                results: reportResults,
                status: ReportStatus.INITIAL
            });
        }

        return NextResponse.json({
            status: 201,
            data: report,
            message: 'Report synced successfully'
        });

    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({
            status: status,
            error: (error as Error).message
        }, { status: status });
    }
}

