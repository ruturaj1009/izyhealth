import mongoose, { Schema, model, models } from 'mongoose';
import { IReport, ITestResult } from '@/types/report';
import { ReportStatus } from '@/enums/report';

const ResultSchema = new Schema({
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    testName: { type: String, required: true },
    resultValue: { type: String },
    unit: { type: String },
    referenceRange: { type: String },
    status: { type: String, default: 'PENDING' },
    remarks: { type: String }
}, { _id: false });

const ReportSchema = new Schema<IReport>({
    bill: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: Object.values(ReportStatus),
        default: ReportStatus.INITIAL
    },
    results: [ResultSchema],
    impression: { type: String }
}, { timestamps: true });

export default models.Report || model<IReport>('Report', ReportSchema);
