import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { UserRole, IUser } from '@/types/user';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { authorize } from '@/lib/auth';

const userCreateSchema = z.object({
    title: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    gender: z.string(),
    bloodGroup: z.string().optional(),
    age: z.number(),
    dob: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    email: z.union([z.string().email(), z.literal('')]).optional().transform(e => e === '' ? undefined : e),
    mobile: z.string().optional().transform(e => e === '' ? undefined : e),
    address: z.string().optional(),
    role: z.nativeEnum(UserRole),
    // Doctor specific
    hospitalName: z.string().optional(),
    revenueSharing: z.number().min(0).max(100).optional(),
});

export async function GET(request: Request) {
    await dbConnect();

    try {
        const user = await authorize(request); // Auth Check

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const search = searchParams.get('search');

        let query: any = { orgid: user.orgid }; // Filter by Org
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const response: ApiResponse<IUser[]> = {
            status: 200,
            data: users,
            metadata: {
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        };
        return NextResponse.json(response);
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        const response: ApiResponse<null> = {
            status: status,
            error: (error as Error).message,
        };
        return NextResponse.json(response, { status: status });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const currentUser = await authorize(request); // Auth Check

        const body = await request.json();
        const result = userCreateSchema.safeParse(body);

        if (!result.success) {
            const response: ApiResponse<null> = {
                status: 400,
                error: 'Validation Error',
                metadata: { issues: result.error.errors }
            };
            return NextResponse.json(response, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { role, ...rest } = result.data as any;

        // Explicitly remove empty strings to avoid duplicate key errors
        if (result.data.email === '') delete result.data.email;
        if (result.data.mobile === '') delete result.data.mobile;

        // Update rest object
        if (rest.email === '') delete rest.email;
        if (rest.mobile === '') delete rest.mobile;

        // Validate role specific requirements
        // if (role === UserRole.DOCTOR) {
        //     if (!rest.hospitalName || rest.revenueSharing === undefined) {
        //         const response: ApiResponse<null> = {
        //             status: 400,
        //             error: 'Doctor requires hospitalName and revenueSharing'
        //         };
        //         return NextResponse.json(response, { status: 400 });
        //     }
        // }

        // Check dupe email within Org? Or globally?
        // Emails usually unique globally per SaaS logic if they login, but this is `User` model (Patients/Doctors) not `Auth`.
        // If they don't login, duplicate emails across orgs might be fine.
        // But schema `User` has `email: { type: String, unique: true, sparse: true }`.
        // Mongoose unique index is collection-wide. So currently email must be unique globally.
        // If we want same email in different orgs, we'd need compound index {orgid, email}.
        // For now, let's keep it global unique.

        if (rest.email) {
            const existing = await User.findOne({ email: rest.email });
            if (existing) {
                const response: ApiResponse<null> = {
                    status: 400,
                    error: 'Email already exists'
                };
                return NextResponse.json(response, { status: 400 });
            }
        }

        // Add Org ID
        const userData = {
            ...result.data,
            orgid: currentUser.orgid
        };

        const user = await User.create(userData);
        const response: ApiResponse<IUser> = {
            status: 201,
            data: user,
        };
        return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        const response: ApiResponse<null> = {
            status: status === 500 ? 400 : status, // Preserve 400 for validation/bad request vs actual server error
            error: (error as Error).message
        };
        return NextResponse.json(response, { status: status === 500 ? 400 : status });
    }
}
