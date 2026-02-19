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

        // 1. Total Bills Today
        const totalBills = await Bill.countDocuments(queryToday);

        // 2. Total Payment Received Today
        // Note: Summing paidAmount of bills created today. 
        // In a real system, we might track individual payment records.
        const paymentStats = await Bill.aggregate([
            { $match: queryToday },
            { $group: { _id: null, total: { $sum: "$paidAmount" } } }
        ]);
        const totalPaymentReceived = paymentStats.length > 0 ? paymentStats[0].total : 0;

        // 3. Total Patients Today
        const totalPatients = await User.countDocuments({
            orgid,
            role: UserRole.PATIENT,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // 4. Total Reports DELIVERED Today
        // We check reports that were updated to DELIVERED status today.
        const totalReportsDelivered = await Report.countDocuments({
            orgid,
            status: ReportStatus.DELIVERED,
            updatedAt: { $gte: startOfDay, $lte: endOfDay }
        });

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
