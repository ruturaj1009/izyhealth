import { Types } from 'mongoose';

export interface IPrintSettings {
    _id?: Types.ObjectId;
    orgid: number;
    type: 'bill' | 'report';

    // Common settings
    headerType?: 'none' | 'text' | 'image';
    labName?: string;
    labAddress?: string;
    headerMargin: number;
    fontSize: number;
    headerImageUrl?: string;
    footerImageUrl?: string;
    showWatermark?: boolean;
    watermarkText?: string;

    // Report-specific settings
    letterhead1Name?: string;
    letterhead1SignatureUrl?: string;
    letterhead2Name?: string;
    letterhead2SignatureUrl?: string;

    createdAt?: Date;
    updatedAt?: Date;
}
