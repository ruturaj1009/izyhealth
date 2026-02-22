import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth, AuthRole } from '@/models/Auth';
import StaffRole from '@/models/StaffRole';
import { authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const user = await authorize(req);
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        const [staffCount, roleCount, activeLogins] = await Promise.all([
            Auth.countDocuments({ orgid: user.orgid, role: AuthRole.STAFF }),
            StaffRole.countDocuments({ orgid: user.orgid }),
            Auth.countDocuments({ orgid: user.orgid, isActive: true })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalStaff: staffCount,
                totalRoles: roleCount,
                activeUsers: activeLogins
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
