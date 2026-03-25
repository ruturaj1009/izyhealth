import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
import { User } from '@/models/User';
import Report from '@/models/Report';
import { authorize } from '@/lib/auth';
import { ReportStatus } from '@/enums/report';
import { UserRole } from '@/types/user';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);
        const orgid = user.orgid;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const queryToday = {
            orgid,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        };

        // Run all 4 independent queries in parallel
        const [totalBills, paymentStats, totalPatients, totalReportsDelivered] = await Promise.all([
            Bill.countDocuments(queryToday),
            Bill.aggregate([
                { $match: queryToday },
                { $group: { _id: null, total: { $sum: "$paidAmount" } } }
            ]),
            User.countDocuments({
                orgid,
                role: UserRole.PATIENT,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }),
            Report.countDocuments({
                orgid,
                status: ReportStatus.DELIVERED,
                updatedAt: { $gte: startOfDay, $lte: endOfDay }
            })
        ]);

        const totalPaymentReceived = paymentStats.length > 0 ? paymentStats[0].total : 0;

        return NextResponse.json({
            status: 200,
            data: {
                totalBills,
                totalPaymentReceived,
                totalPatients,
                totalReportsDelivered
            }
        });

    } catch (error: any) {
        console.error('Stats API Error:', error);
        const status = error.message.startsWith('Unauthorized') ? 401 : 500;
        return NextResponse.json({ status: status, error: (error as Error).message }, { status: status });
    }
}
