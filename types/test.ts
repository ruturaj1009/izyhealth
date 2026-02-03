import mongoose, { Document } from 'mongoose';
import { IDepartment } from '@/models/Department'; // Circular? Department model has interface. 
// Ideally Department interface should also be moved. But likely IDepartment is exported from models/Department.ts. 
// I'll leave import from model for now or move it if I see it. 
// Wait, Department.ts has IDepartment. I should probably move that too or just reference.
// The user said "move ALL interface or type". So I should move IDepartment too.
// I'll reference it as 'any' or check if I move it.
// Checking models/Department.ts again... it has IDepartment. I'll move it later.
// For now, I'll import from model to avoid break, or just use mongoose.Types.ObjectId since it's a ref.

export interface ITest extends Document {
    orgid: number;
    name: string;
    type: 'normal' | 'descriptive' | 'group';
    shortCode?: string;
    tags?: string[];
    price: number;
    revenueShare: number;
    department?: mongoose.Types.ObjectId; // | IDepartment

    // Normal Test Fields
    unit?: string;
    method?: string;
    formula?: string;
    interpretation?: string;
    referenceRanges?: {
        name?: string;
        min?: string;
        max?: string;
    }[];



    // Group Test Fields
    subTests?: mongoose.Types.ObjectId[];
    parentGroup?: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}
