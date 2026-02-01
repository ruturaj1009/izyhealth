import mongoose, { Schema, model, models } from 'mongoose';
import { IBill } from '@/types/bill';
import { PaymentType, BillStatus } from '@/enums/bill';

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

    duePaymentType: {
        type: String,
        enum: Object.values(PaymentType),
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
