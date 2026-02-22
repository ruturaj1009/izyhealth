import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { authorize } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json({ success: true, data: [] });
        }

        const upperQuery = query.toUpperCase();
        const orgid = user.orgid;

        const results = await Test.find({
            orgid,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { shortCode: { $regex: query, $options: 'i' } },
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
            .limit(10)
            .populate('department', 'name')
            .select('name shortCode price type department');

        const formattedResults = results.map(t => ({
            id: t._id,
            name: t.name,
            shortCode: t.shortCode,
            shortId: t._id.toString().substring(18).toUpperCase(),
            type: t.type,
            price: t.price,
            departmentId: t.department?._id || '',
            url: t.department
                ? `/tests/${t.department._id}/${t._id}`
                : `/tests/all/${t._id}` // Fallback if no dept
        }));

        return NextResponse.json({ success: true, data: formattedResults });
    } catch (error: any) {
        console.error('Test Search Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
