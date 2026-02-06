import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authorize } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
    try {
        await authorize(request);

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({
                status: 400,
                error: 'No file provided'
            }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataURI = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'x-pharma/print-settings',
            resource_type: 'auto'
        });

        return NextResponse.json({
            status: 200,
            data: {
                url: result.secure_url,
                publicId: result.public_id
            },
            message: 'Image uploaded successfully'
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        const status = error.message?.startsWith('Unauthorized') ? 401 : 500;
        return NextResponse.json({
            status: status,
            error: error.message || 'Upload failed'
        }, { status: status });
    }
}
