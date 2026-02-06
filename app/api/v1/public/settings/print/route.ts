import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PrintSettings from '@/models/PrintSettings';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const orgidQuery = searchParams.get('orgid');
        const orgid = orgidQuery ? Number(orgidQuery) : NaN;

        if (!type || isNaN(orgid)) {
            return NextResponse.json({
                status: 400,
                error: 'Valid Type and OrgID parameters are required'
            }, { status: 400 });
        }

        const settings = await PrintSettings.findOne({ orgid, type });

        if (!settings) {
            return NextResponse.json({
                status: 404,
                error: 'Settings not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            data: settings
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            error: (error as Error).message
        }, { status: 500 });
    }
}
