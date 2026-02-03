import mongoose, { Document } from 'mongoose';
import { IUser } from '@/types/user';
import { ITest } from '@/types/test';
import { PaymentType, BillStatus } from '@/enums/bill';

export interface IBill extends Document {
    orgid: number;
    patient: mongoose.Types.ObjectId | IUser;
    doctor: mongoose.Types.ObjectId | IUser; // Can be a "SELF" doctor record

    tests: {
        test: mongoose.Types.ObjectId | ITest;
        price: number; // Snapshot of price at billing
    }[];

    totalAmount: number;
    discountAmount: number;
    discountType: 'AMOUNT' | 'PERCENTAGE';
    paidAmount: number;
    dueAmount: number;

    paymentType: PaymentType;
    duePaymentType?: PaymentType;
    status: BillStatus;

    notes?: string;

    createdAt: Date;
    updatedAt: Date;
}
