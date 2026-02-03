import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    address?: string; // Optional
    phone?: string;   // Optional
    email?: string;   // Optional
    orgid: number;    // 6 digit unique
    spid: string;     // 6 char alphanumeric unique
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema: Schema<IOrganization> = new Schema(
    {
        name: { type: String, required: true },
        address: { type: String },
        phone: { type: String },
        email: { type: String },
        orgid: { type: Number, required: true, unique: true },
        spid: { type: String, required: true, unique: true },
    },
    {
        timestamps: true,
    }
);

export const Organization = (mongoose.models.Organization as Model<IOrganization>) || mongoose.model<IOrganization>('Organization', OrganizationSchema);
