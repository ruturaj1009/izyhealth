import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { Auth, AuthRole } from '@/models/Auth';
import { hashPassword, generateOrgId, generateSPID } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, organizationName, address, phone } = await req.json();

        // 1. Validation (No password required from user)
        if (!email || !organizationName || !address || !phone) {
            return NextResponse.json({ error: 'Missing required fields: Email, Organization Name, Address, Phone are mandatory.' }, { status: 400 });
        }

        // Check availability
        const existingAuth = await Auth.findOne({ email });
        if (existingAuth) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        // Generate IDs
        let orgid = generateOrgId();
        let spid = generateSPID();

        // Ensure uniqueness
        while (await Organization.findOne({ orgid })) {
            orgid = generateOrgId();
        }
        while (await Organization.findOne({ spid })) {
            spid = generateSPID();
        }

        // Create Org
        const org = await Organization.create({
            name: organizationName,
            orgid,
            spid,
            address,
            phone,
            email
        });

        // 2. Create Inactive Admin Auth with Default Password
        const DEFAULT_PASSWORD = '12345678';
        const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

        const newAuth = await Auth.create({
            email,
            password: hashedPassword,
            firstName: organizationName, // Set First Name as Lab Name
            lastName: 'Owner',           // Set Last Name as 'Owner'
            orgid: org.orgid,
            isActive: false, // Default to inactive as per requirements
            role: AuthRole.ADMIN
        });

        return NextResponse.json({
            message: 'Registration successful. Please wait for admin approval.',
            orgid: org.orgid,
            spid: org.spid
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
