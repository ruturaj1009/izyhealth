import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
import { User } from '@/models/User';
import Test from '@/models/Test';
import { Organization } from '@/models/Organization';
import { authorize } from '@/lib/auth';


export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        const orgid = user.orgid;
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || 'month'; // day, month, year

        const now = new Date();
        let startDate: Date;
        let prevStartDate: Date;
        let prevEndDate: Date;
        let groupBy: any;

        if (range === 'day') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - 1);
            prevEndDate = new Date(startDate);
            prevEndDate.setMilliseconds(-1);
            groupBy = { hour: { $hour: "$createdAt" } };
        } else if (range === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            prevStartDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            prevEndDate = new Date(startDate);
            prevEndDate.setMilliseconds(-1);
            groupBy = { month: { $month: "$createdAt" } };
        } else {
            // Default: month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            prevStartDate = new Date(startDate);
            prevStartDate.setMonth(prevStartDate.getMonth() - 1);
            prevEndDate = new Date(startDate);
            prevEndDate.setMilliseconds(-1);
            groupBy = { day: { $dayOfMonth: "$createdAt" } };
        }

        // Execute all queries in parallel for maximum performance
        const [
            currentStatsQuery,
            prevStatsQuery,
            trendData,
            deptDistribution,
            topDoctors,
            summaryData
        ] = await Promise.all([
            // 1. Current Stats
            Bill.aggregate([
                { $match: { orgid, createdAt: { $gte: startDate } } },
                { $group: { _id: null, total: { $sum: "$paidAmount" }, count: { $sum: 1 } } }
            ]),
            // 2. Previous Stats (for growth comparison)
            Bill.aggregate([
                { $match: { orgid, createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
                { $group: { _id: null, total: { $sum: "$paidAmount" }, count: { $sum: 1 } } }
            ]),
            // 3. Trend Data (Line Chart)
            Bill.aggregate([
                { $match: { orgid, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: groupBy,
                        value: { $sum: "$paidAmount" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            // 4. Dept Distribution (Pie Chart) - Optimized Lookups
            Bill.aggregate([
                { $match: { orgid, createdAt: { $gte: startDate } } },
                { $project: { tests: 1 } },
                { $unwind: "$tests" },
                {
                    $lookup: {
                        from: "tests",
                        localField: "tests.test",
                        foreignField: "_id",
                        pipeline: [{ $project: { department: 1 } }],
                        as: "testDetails"
                    }
                },
                { $unwind: "$testDetails" },
                {
                    $lookup: {
                        from: "departments",
                        localField: "testDetails.department",
                        foreignField: "_id",
                        pipeline: [{ $project: { name: 1 } }],
                        as: "deptInfo"
                    }
                },
                { $unwind: "$deptInfo" },
                {
                    $group: {
                        _id: "$deptInfo.name",
                        value: { $sum: "$tests.price" }
                    }
                },
                { $sort: { value: -1 } }
            ]),
            // 5. Top Performers
            Bill.aggregate([
                { $match: { orgid, createdAt: { $gte: startDate } } },
                { $group: { _id: "$doctor", revenue: { $sum: "$paidAmount" }, count: { $sum: 1 } } },
                { $sort: { revenue: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        pipeline: [{ $project: { title: 1, firstName: 1, lastName: 1 } }],
                        as: "doctorInfo"
                    }
                },
                { $unwind: "$doctorInfo" },
                {
                    $project: {
                        name: { $concat: ["$doctorInfo.title", " ", "$doctorInfo.firstName", " ", "$doctorInfo.lastName"] },
                        revenue: 1,
                        count: 1
                    }
                }
            ]),
            // 6. Business Summary (System-wide counts)
            Promise.all([
                Test.countDocuments({ orgid }),
                User.countDocuments({ orgid, role: 'PATIENT' }),
                User.countDocuments({ orgid, role: 'DOCTOR' }),
                Organization.findOne({ orgid }).select('name')
            ])
        ]);

        const currentStats = currentStatsQuery[0] || { total: 0, count: 0 };
        const prevStats = prevStatsQuery[0] || { total: 0, count: 0 };
        const [totalTests, totalPatients, totalDoctors, organization] = summaryData as [number, number, number, any];

        return NextResponse.json({
            success: true,
            data: {
                revenue: {
                    current: currentStats.total,
                    previous: prevStats.total,
                    range
                },
                volume: {
                    current: currentStats.count,
                    previous: prevStats.count
                },
                trend: trendData.map((item: any) => ({
                    label: Object.values(item._id as any)[0] as string,
                    value: item.value
                })),
                distribution: deptDistribution.map((d: any) => ({
                    name: d._id,
                    value: d.value
                })),
                topDoctors,
                summary: {
                    totalTests,
                    totalDoctors,
                    totalPatients,
                    businessName: organization?.name || 'Your Clinic'
                }
            }
        });

    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
