import mongoose, { Schema, model, models } from 'mongoose';
import { ITest } from '@/types/test';

const ReferenceRangeSchema = new Schema({
    name: { type: String },
    min: { type: String },
    max: { type: String }
}, { _id: false });


const TestSchema = new Schema<ITest>({
    name: { type: String, required: [true, 'Test name is required'] },
    type: {
        type: String,
        required: [true, 'Test type is required'],
        enum: ['normal', 'descriptive', 'group'],
        default: 'normal'
    },
    shortCode: { type: String },
    tags: { type: [String], default: [] }, // 'Blood Test', etc.
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    revenueShare: { type: Number, default: 0, min: 0, max: 100 },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },

    // Normal Test Specifics
    unit: { type: String },
    method: { type: String },
    formula: { type: String },
    interpretation: { type: String },
    referenceRanges: {
        type: [ReferenceRangeSchema],
        validate: {
            validator: function (ranges: any[]) {
                if (!ranges || ranges.length === 0) return true;
                return ranges.every((range: any) => {
                    const hasMin = range.min && range.min.trim().length > 0;
                    const hasMax = range.max && range.max.trim().length > 0;
                    return hasMin || hasMax;
                });
            },
            message: 'Each Reference Range must have at least one of Min or Max'
        }
    },



    // Group Test Specifics
    subTests: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
    parentGroup: { type: Schema.Types.ObjectId, ref: 'Test' }

}, { timestamps: true });

export default models.Test || model<ITest>('Test', TestSchema);
