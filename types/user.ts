import { Document } from 'mongoose';

export enum UserRole {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR',
    LAB_TECHNICIAN = 'LAB_TECHNICIAN',
    LAB_ADMIN = 'LAB_ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUser extends Document {
    orgid: number;
    title: string;
    firstName: string;
    lastName: string;
    gender: string;
    bloodGroup?: string;
    age: number;
    dob?: Date;
    email: string;
    mobile: string;
    address?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPatient extends IUser {
    // Add patient specific fields if any in future
}

export interface IDoctor extends IUser {
    hospitalName: string;
    revenueSharing: number;
}
