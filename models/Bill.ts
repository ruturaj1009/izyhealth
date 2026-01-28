import mongoose, { Schema, Document, model, models } from 'mongoose';
import { IUser } from '@/types/user';
import { ITest } from './Test';

export enum PaymentType {
    CASH = 'CASH',
    UPI = 'UPI',
    CARD = 'CARD',
    NET_BANKING = 'NET_BANKING'
}

export enum BillStatus {
    DRAFT = 'DRAFT',
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    PENDING = 'PENDING'
}

export interface IBill extends Document {
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
    status: BillStatus;

    notes?: string;

    createdAt: Date;
    updatedAt: Date;
}

const BillSchema = new Schema<IBill>({
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    tests: [{
        test: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
        price: { type: Number, required: true }
    }],

    totalAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },

    paymentType: {
        type: String,
        enum: Object.values(PaymentType),
        default: PaymentType.CASH
    },

    discountType: {
        type: String,
        enum: ['AMOUNT', 'PERCENTAGE'],
        default: 'AMOUNT'
    },
    status: {
        type: String,
        enum: Object.values(BillStatus),
        default: BillStatus.PENDING
    },

    notes: { type: String }

}, { timestamps: true });

// Check logic for Pre-save to auto-calc due amount or status if needed? 
// For now, trust frontend/API to calculate correct values or perform simple check.

export default models.Bill || model<IBill>('Bill', BillSchema);
