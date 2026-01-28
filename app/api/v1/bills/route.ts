import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bill from '@/models/Bill';
import { User, Doctor } from '@/models/User';
import { ApiResponse } from '@/types/api';
import { UserRole } from '@/types/user';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();

        let { patientId, doctorId, tests, paymentType, totalAmount, discountAmount, paidAmount, status } = body;

        // --- VALIDATION ---
        const errors = [];
        if (!patientId && body.patientMode !== 'create') errors.push('Patient is required');
        if (!doctorId) errors.push('Doctor is required');
        if (!tests || !Array.isArray(tests) || tests.length === 0) errors.push('At least one test is required');

        if (errors.length > 0) {
            return NextResponse.json({ status: 400, error: errors.join(', ') }, { status: 400 });
        }

        // Handle SELF doctor
        if (doctorId === 'SELF') {
            let selfDoc = await User.findOne({
                role: UserRole.DOCTOR,
                firstName: 'SELF'
            });

            if (!selfDoc) {
                // Create SELF doctor if not exists
                selfDoc = await Doctor.create({
                    title: 'Dr.',
                    firstName: 'SELF',
                    gender: 'Other',
                    age: 0,
                    role: UserRole.DOCTOR,
                    hospitalName: 'In House',
                    revenueSharing: 0
                });
            }
            if (selfDoc) {
                doctorId = selfDoc._id;
            } else {
                throw new Error("Failed to initialize SELF doctor");
            }
        }

        // Create Bill
        const due = totalAmount - discountAmount - paidAmount;

        const bill = await Bill.create({
            patient: patientId,
            doctor: doctorId,
            tests,
            totalAmount,
            discountAmount,
            paidAmount,
            dueAmount: due,
            paymentType,
            discountType: body.discountType || 'AMOUNT',
            status: status || (due > 0 ? 'PARTIAL' : 'PAID') // Simple logic, can depend on due
        });

        // Populate to return full data
        await bill.populate(['patient', 'doctor', 'tests.test']);

        return NextResponse.json({
            status: 201,
            data: bill
        });

    } catch (error) {
        console.error('Bill Create Error:', error);
        return NextResponse.json({
            status: 500,
            error: (error as Error).message
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    let query: any = {};

    // Search by Bill ID (if search is a valid ObjectId) or Patient Name logic could go here
    // For now, let's simplistic search if possible or just standard pagination
    // Since Bill doesn't duplicate patient name, complex search needs aggregation or just searching by ID/Date if stored string.
    // For MVP, if search looks like a mongoID, search by _id. 
    // Date Filter
    const dateParam = searchParams.get('date');
    if (dateParam) {
        const startDate = new Date(dateParam);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dateParam);
        endDate.setHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }

    if (search) {
        if (search.match(/^[0-9a-fA-F]{24}$/)) {
            query._id = search;
        }
        // Note: Advanced search by Patient Name requires lookup/aggregation which is heavier. 
        // We will skip strict name search for now unless requested to keep performance high, 
        // or we can add a basic population match if needed.
    }

    try {
        const total = await Bill.countDocuments(query);
        const bills = await Bill.find(query)
            .populate('patient')
            .populate('doctor')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            status: 200,
            data: bills,
            metadata: {
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return NextResponse.json({ status: 500, error: (error as Error).message }, { status: 500 });
    }
}
