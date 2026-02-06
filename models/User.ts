import mongoose, { Schema, Model } from 'mongoose';
import { IUser, IPatient, IDoctor, UserRole } from '@/types/user';

const UserSchema: Schema<IUser> = new Schema(
    {
        orgid: { type: Number, required: true },
        title: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String }, // Optional
        gender: { type: String, required: true },
        bloodGroup: { type: String },
        age: { type: Number, required: true },
        dob: { type: Date },
        email: { type: String, unique: true, sparse: true }, // Optional but unique if present
        mobile: { type: String }, // Optional
        address: { type: String },
        role: {
            type: String,
            enum: Object.values(UserRole),
            required: true,
        },
    },
    {
        timestamps: true,
        discriminatorKey: 'role',
    }
);

// Prevent overwrite during hot reload
export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

// --- Discriminators ---

const PatientSchema = new Schema({});

export const Patient = User.discriminators?.PATIENT || User.discriminator<IPatient>('PATIENT', PatientSchema);

const DoctorSchema = new Schema({
    hospitalName: { type: String },
    revenueSharing: { type: Number, min: 0, max: 100 },
});

export const Doctor = User.discriminators?.DOCTOR || User.discriminator<IDoctor>('DOCTOR', DoctorSchema);
