import mongoose, { Schema, Document, Model } from 'mongoose';

export enum AuthRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export interface IAuth extends Document {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    googleId?: string;
    isActive: boolean;
    orgid: number;
    role: AuthRole;
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AuthSchema: Schema<IAuth> = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        profileImage: { type: String },
        googleId: { type: String },
        isActive: { type: Boolean, default: false },
        orgid: { type: Number, required: true }, // Reference to Organization.orgid (not _id) for easier queries
        role: {
            type: String,
            enum: Object.values(AuthRole),
            default: AuthRole.ADMIN
        },
        refreshToken: { type: String },
    },
    {
        timestamps: true,
    }
);

// Force model recompilation in dev to apply schema changes
if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.Auth;
}

export const Auth = (mongoose.models.Auth as Model<IAuth>) || mongoose.model<IAuth>('Auth', AuthSchema);
