import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
import Report from '@/models/Report';
import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const decodedUser = await authorize(req);
        const { orgid } = decodedUser;

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json({ bills: [], reports: [] });
        }

        const upperQuery = query.toUpperCase();

        // Search in Bills
        const bills = await Bill.find({
            orgid,
            $or: [
                ...(mongoose.Types.ObjectId.isValid(query) ? [{ _id: query }] : []),
                {
                    $expr: {
                        $gt: [
                            {
                                $indexOfCP: [
                                    { $toUpper: { $substrCP: [{ $toString: "$_id" }, 18, 6] } },
                                    upperQuery
                                ]
                            },
                            -1
                        ]
                    }
                }
            ]
        })
            .limit(5)
            .populate('patient', 'firstName lastName');

        // Search in Reports
        const reports = await Report.find({
            orgid,
            $or: [
                ...(mongoose.Types.ObjectId.isValid(query) ? [{ _id: query }] : []),
                {
                    $expr: {
                        $gt: [
                            {
                                $indexOfCP: [
                                    { $toUpper: { $substrCP: [{ $toString: "$_id" }, 18, 6] } },
                                    upperQuery
                                ]
                            },
                            -1
                        ]
                    }
                }
            ]
        })
            .limit(5)
            .populate('patient', 'firstName lastName');

        return NextResponse.json({
            bills: bills.map(b => ({
                id: b._id,
                shortId: b._id.toString().substring(18).toUpperCase(),
                patientName: `${b.patient?.firstName || ''} ${b.patient?.lastName || ''}`.trim(),
                url: `/bills/${b._id}`
            })),
            reports: reports.map(r => ({
                id: r._id,
                shortId: r._id.toString().substring(18).toUpperCase(),
                patientName: `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim(),
                url: `/reports/${r._id}/view`
            }))
        });

    } catch (error: any) {
        console.error('Search Error:', error);
        const status = error.message?.includes('Unauthorized') ? 401 :
            error.message?.includes('Forbidden') ? 403 : 500;
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
    }
}
