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

// --- INDEXES ---
DepartmentSchema.index({ orgid: 1, _id: 1 }); // Optimize single department lookup
DepartmentSchema.index({ orgid: 1, name: 1 });

const Department = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export { Department };
export default Department;
