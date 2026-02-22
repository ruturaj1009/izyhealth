import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IPermissions {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

export interface IStaffRole extends Document {
    name: string;
    orgid: number;
    permissions: {
        bill: IPermissions;
        report: IPermissions;
        patient: IPermissions;
        test: IPermissions;
        doctor: IPermissions;
        department: IPermissions;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PermissionSchema = new Schema({
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
}, { _id: false });

const StaffRoleSchema = new Schema<IStaffRole>({
    name: { type: String, required: true },
    orgid: { type: Number, required: true },
    permissions: {
        bill: { type: PermissionSchema, default: () => ({}) },
        report: { type: PermissionSchema, default: () => ({}) },
        patient: { type: PermissionSchema, default: () => ({}) },
        test: { type: PermissionSchema, default: () => ({}) },
        doctor: { type: PermissionSchema, default: () => ({}) },
        department: { type: PermissionSchema, default: () => ({}) }
    }
}, { timestamps: true });

StaffRoleSchema.index({ orgid: 1, name: 1 }, { unique: true });

export default models.StaffRole || model<IStaffRole>('StaffRole', StaffRoleSchema);
