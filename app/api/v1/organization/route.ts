import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request);

        const org = await Organization.findOne({ orgid: user.orgid });

        if (!org) {
            return NextResponse.json({
                status: 404,
                error: 'Organization not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            data: {
                name: org.name,
                address: org.address || '',
                phone: org.phone || '',
                email: org.email || ''
            }
        });

    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        return NextResponse.json({
            status: status,
            error: (error as Error).message
        }, { status: status });
    }
}
