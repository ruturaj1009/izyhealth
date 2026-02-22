import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { ApiResponse } from '@/types/api';
import { UserRole, IUser } from '@/types/user';
import { authorize, hasPermission } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const currentUser = await authorize(request);
        const { id } = await params;
        const user = await User.findOne({ _id: id, orgid: currentUser.orgid })
            .select('-__v -orgid');
        if (!user) {
            const response: ApiResponse<null> = { status: 404, error: 'User not found' };
            return NextResponse.json(response, { status: 404 });
        }
        const response: ApiResponse<IUser> = { status: 200, data: user };
        return NextResponse.json(response);
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        const response: ApiResponse<null> = { status: status, error: (error as Error).message };
        return NextResponse.json(response, { status: status });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const currentUser = await authorize(request);
        const { id } = await params;
        const body = await request.json();

        // Ensure not accidentally updating orgid
        delete body.orgid;

        const targetUser = await User.findOne({ _id: id, orgid: currentUser.orgid });
        if (!targetUser) {
            const response: ApiResponse<null> = { status: 404, error: 'User not found' };
            return NextResponse.json(response, { status: 404 });
        }

        // RBAC check based on role
        if (targetUser.role === UserRole.PATIENT && !hasPermission(currentUser, 'patient', 'update')) {
            return NextResponse.json({ status: 403, error: 'Forbidden: You do not have permission to update patients' }, { status: 403 });
        }
        if (targetUser.role === UserRole.DOCTOR && !hasPermission(currentUser, 'doctor', 'update')) {
            return NextResponse.json({ status: 403, error: 'Forbidden: You do not have permission to update doctors' }, { status: 403 });
        }

        const user = await User.findOneAndUpdate(
            { _id: id, orgid: currentUser.orgid }, // Org Scope
            body,
            { new: true, runValidators: true }
        );
        if (!user) {
            const response: ApiResponse<null> = { status: 404, error: 'User not found' };
            return NextResponse.json(response, { status: 404 });
        }
        const response: ApiResponse<IUser> = { status: 200, data: user };
        return NextResponse.json(response);
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        const response: ApiResponse<null> = { status: status, error: (error as Error).message };
        return NextResponse.json(response, { status: status });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const currentUser = await authorize(request);
        const { id } = await params;
        const targetUser = await User.findOne({ _id: id, orgid: currentUser.orgid });
        if (!targetUser) {
            const response: ApiResponse<null> = { status: 404, error: 'User not found' };
            return NextResponse.json(response, { status: 404 });
        }

        // RBAC check based on role
        if (targetUser.role === UserRole.PATIENT && !hasPermission(currentUser, 'patient', 'delete')) {
            return NextResponse.json({ status: 403, error: 'Forbidden: You do not have permission to delete patients' }, { status: 403 });
        }
        if (targetUser.role === UserRole.DOCTOR && !hasPermission(currentUser, 'doctor', 'delete')) {
            return NextResponse.json({ status: 403, error: 'Forbidden: You do not have permission to delete doctors' }, { status: 403 });
        }

        const user = await User.findOneAndDelete({ _id: id, orgid: currentUser.orgid }); // Org Scope
        if (!user) {
            const response: ApiResponse<null> = { status: 404, error: 'User not found' };
            return NextResponse.json(response, { status: 404 });
        }
        const response: ApiResponse<object> = { status: 200, data: {} };
        return NextResponse.json(response);
    } catch (error: any) {
        const status = error.message.startsWith('Unauthorized') ? 401 : (error.message.startsWith('Forbidden') ? 403 : 500);
        const response: ApiResponse<null> = { status: status, error: (error as Error).message };
        return NextResponse.json(response, { status: status });
    }
}
