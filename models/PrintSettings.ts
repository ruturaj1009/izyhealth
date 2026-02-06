import mongoose, { Schema, model, models } from 'mongoose';
import { IPrintSettings } from '@/types/printSettings';

const PrintSettingsSchema = new Schema<IPrintSettings>({
    orgid: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['bill', 'report']
    },

    // Common settings
    headerType: { type: String, enum: ['none', 'text', 'image'], default: 'none' },
    labName: { type: String },
    labAddress: { type: String },
    headerMargin: { type: Number, default: 20 },
    fontSize: { type: Number, default: 14 },
    headerImageUrl: { type: String },
    footerImageUrl: { type: String },
    showWatermark: { type: Boolean, default: true },
    watermarkText: { type: String, default: 'Health Amaze Demo Account' },

    // Report-specific settings
    letterhead1Name: { type: String },
    letterhead1SignatureUrl: { type: String },
    letterhead2Name: { type: String },
    letterhead2SignatureUrl: { type: String }
}, { timestamps: true });

// Compound index to ensure one settings doc per org per type
PrintSettingsSchema.index({ orgid: 1, type: 1 }, { unique: true });

export default models.PrintSettings || model<IPrintSettings>('PrintSettings', PrintSettingsSchema);
