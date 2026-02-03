import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
    orgid: number;
    name: string;
    description?: string;
    icon?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DepartmentSchema: Schema<IDepartment> = new Schema(
    {
        orgid: { type: Number, required: true },
        name: { type: String, required: true, unique: true },
        description: { type: String },
        icon: { type: String, default: '🏥' },
    },
    {
        timestamps: true,
    }
);

// Standard singleton pattern is sufficient

export const Department = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
