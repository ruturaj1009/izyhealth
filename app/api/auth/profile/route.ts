import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Auth } from '@/models/Auth';
import { authorize } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await dbConnect();

        // Authenticate the user
        const decodedUser = await authorize(req);
        const { userId } = decodedUser;

        const { firstName, lastName, profileImage } = await req.json();

        // Find and update the user in the Auth model
        const user = await Auth.findById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update fields if provided
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (profileImage !== undefined) user.profileImage = profileImage;

        await user.save();

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
                orgid: user.orgid,
                staffRoleName: user.role === 'STAFF' ? ((await user.populate('staffRole')).staffRole as any)?.name : null,
                permissions: user.role === 'STAFF' ? ((await user.populate('staffRole')).staffRole as any)?.permissions : null
            }
        });

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        const status = error.message?.includes('Unauthorized') ? 401 :
            error.message?.includes('Forbidden') ? 403 : 500;
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
    }
}
