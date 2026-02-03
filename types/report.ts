import mongoose, { Document } from 'mongoose';
import { IUser } from '@/types/user';
import { IBill } from '@/types/bill';
import { ReportStatus } from '@/enums/report';

export interface ITestResult {
    testId: mongoose.Types.ObjectId;
    testName: string;
    type: 'normal' | 'descriptive' | 'group';
    resultValue?: string;
    unit?: string;
    referenceRange?: string;
    status: 'PENDING' | 'COMPLETED';
    remarks?: string;
    groupResults?: ITestResult[];
}

export interface IReport extends Document {
    orgid: number;
    bill: mongoose.Types.ObjectId | IBill;
    patient: mongoose.Types.ObjectId | IUser;
    doctor: mongoose.Types.ObjectId | IUser;
    date: Date;
    status: ReportStatus;
    results: ITestResult[];
    impression?: string;
    createdAt: Date;
    updatedAt: Date;
}
