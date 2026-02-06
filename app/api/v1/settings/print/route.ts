import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PrintSettings from '@/models/PrintSettings';
import { authorize } from '@/lib/auth';

// GET: Fetch print settings by type
export async function GET(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'bill' or 'report'

        if (!type || !['bill', 'report'].includes(type)) {
            return NextResponse.json({
                status: 400,
                error: 'Type parameter is required and must be "bill" or "report"'
            }, { status: 400 });
        }

        let settings = await PrintSettings.findOne({ orgid: user.orgid, type });

        // Create default settings if none exist
        if (!settings) {
            settings = await PrintSettings.create({
                orgid: user.orgid,
                type,
                headerMargin: 20,
                fontSize: 14
            });
        }

        return NextResponse.json({
            status: 200,
            data: settings
        });

    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({
            status: status,
            error: (error as Error).message
        }, { status: status });
    }
}

// PUT: Update print settings
export async function PUT(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);
        const body = await request.json();
        const { type, ...updates } = body;

        if (!type || !['bill', 'report'].includes(type)) {
            return NextResponse.json({
                status: 400,
                error: 'Type is required and must be "bill" or "report"'
            }, { status: 400 });
        }

        const settings = await PrintSettings.findOneAndUpdate(
            { orgid: user.orgid, type },
            updates,
            { new: true, upsert: true, runValidators: true }
        );

        return NextResponse.json({
            status: 200,
            data: settings,
            message: 'Settings updated successfully'
        });

    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({
            status: status,
            error: (error as Error).message
        }, { status: status });
    }
}
