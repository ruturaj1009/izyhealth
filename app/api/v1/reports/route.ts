import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import { User } from '@/models/User';
import { UserRole } from '@/types/user';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const date = searchParams.get('date');
        const skip = (page - 1) * limit;

        let query: any = { orgid: user.orgid }; // Filter by orgid

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (search) {
            // Strategy: Find patients (Users) that match the search, then query by patient ID OR reportId
            try {
                const users = await User.find({
                    orgid: user.orgid, // Scope user search to org
                    role: "PATIENT",
                    $or: [
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { phone: { $regex: search, $options: 'i' } }
                    ]
                }).select('_id');

                const userIds = users.map(u => u._id);

                query.$or = [
                    // { reportId: { $regex: search, $options: 'i' } }, // Legacy
                    { patient: { $in: userIds } }
                ];
            } catch (err) {
                console.error("Search lookup failed", err);
            }
        }

        const total = await Report.countDocuments(query);
        const reports = await Report.find(query)
            .select('patient doctor date status')
            .populate('patient', 'firstName lastName mobile age gender')
            .populate('doctor', 'firstName lastName title')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            status: 200,
            data: reports,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({ status: status, error: (error as Error).message }, { status: status });
    }
}
