'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { BillReceipt } from '@/app/components/BillReceipt';
import Cropper, { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => setCrop(crop);
    const onZoomChange = (zoom: number) => setZoom(zoom);
    const onCropCompleteInternal = (_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg');
        });
    }

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
            toast.error('Failed to crop image');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '800px', 
                height: '500px', 
                background: '#000',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={8 / 2} // Aspect ratio for header (approx wide)
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteInternal}
                    onZoomChange={onZoomChange}
                />
            </div>
            
            <div style={{ 
                marginTop: '10px', 
                display: 'flex', 
                gap: '12px', 
                width: '100%', 
                maxWidth: '800px',
                justifyContent: 'center',
                background: 'white',
                padding: '15px',
                borderRadius: '8px'
            }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#64748b' }}>Zoom: {zoom.toFixed(1)}x</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                    >
                        Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BillPrintSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showCropper, setShowCropper] = useState(false);
    const [tempFileUrl, setTempFileUrl] = useState('');
    const [croppingType, setCroppingType] = useState<'header' | 'footer'>('header');
    
    const [settings, setSettings] = useState({
        headerType: 'none' as 'none' | 'text' | 'image',
        footerType: 'none' as 'none' | 'text' | 'image',
        labName: '',
        labAddress: '',
        headerMargin: 20,
        footerText: '',
        fontSize: 14,
        headerImageUrl: '',
        footerImageUrl: '',
        showWatermark: true,
        watermarkText: 'Rutu Dev Labs'
    });

    // Sample bill data for preview
    const sampleBill = {
        _id: '507f1f77bcf86cd799439011',
        patient: {
            title: 'Mr.',
            firstName: 'Ruturaj',
            lastName: 'Sahu',
            gender: 'Male',
            age: 23
        },
        doctor: {
            firstName: 'SELF',
            lastName: ''
        },
        tests: [
            { test: { name: 'Group Test' }, price: 100 }
        ],
        totalAmount: 100,
        discountAmount: 0,
        paidAmount: 100,
        dueAmount: 0,
        createdAt: new Date().toISOString()
    };

    useEffect(() => {
        fetchSettings();
        fetchOrgDetails();
    }, []);

    async function fetchSettings() {
        try {
            const data = await api.get('/api/v1/settings/print?type=bill');
            if (data.status === 200) {
                setSettings(prev => ({
                    ...prev,
                    headerType: data.data.headerType || 'none',
                    footerType: data.data.footerType || 'none',
                    labName: data.data.labName || prev.labName,
                    labAddress: data.data.labAddress || prev.labAddress,
                    headerMargin: data.data.headerMargin || 20,
                    footerText: data.data.footerText || '',
                    fontSize: data.data.fontSize || 14,
                    headerImageUrl: data.data.headerImageUrl || '',
                    footerImageUrl: data.data.footerImageUrl || '',
                    showWatermark: data.data.showWatermark !== undefined ? data.data.showWatermark : true,
                    watermarkText: data.data.watermarkText || 'Health Amaze Demo Account'
                }));
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }

    async function fetchOrgDetails() {
        try {
            const data = await api.get('/api/v1/organization');
            if (data.status === 200) {
                setSettings(prev => ({
                    ...prev,
                    labName: prev.labName || data.data.name,
                    labAddress: prev.labAddress || data.data.address
                }));
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const data = await api.put('/api/v1/settings/print', {
                type: 'bill',
                ...settings
            });
            if (data.status === 200) {
                toast.success('Settings saved successfully');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    }

    function handleFileSelect(file: File, type: 'header' | 'footer') {
        const url = URL.createObjectURL(file);
        setTempFileUrl(url);
        setCroppingType(type);
        setShowCropper(true);
    }

    const onCropComplete = (croppedImage: Blob) => {
        const fileName = croppingType === 'header' ? 'header.jpg' : 'footer.jpg';
        const file = new File([croppedImage], fileName, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(croppedImage));
        setShowCropper(false);
    };

    async function handleImageUpload() {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const data = await api.post('/api/v1/settings/upload', formData);
            if (data.status === 200) {
                if (croppingType === 'header') {
                    setSettings(prev => ({ ...prev, headerImageUrl: data.data.url }));
                } else {
                    setSettings(prev => ({ ...prev, footerImageUrl: data.data.url }));
                }
                setSelectedFile(null);
                setPreviewUrl('');
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                Loading settings...
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
                {/* Left Panel - Controls */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: '#1e293b' }}>
                        Print Settings
                    </h2>

                    {/* Header Type Dropdown */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Header Type
                        </label>
                        <select
                            value={settings.headerType}
                            onChange={(e) => setSettings(prev => ({ ...prev, headerType: e.target.value as any }))}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                borderRadius: '4px', 
                                border: '1px solid #cbd5e1', 
                                fontSize: '14px',
                                background: 'white'
                            }}
                        >
                            <option value="none">No Header</option>
                            <option value="text">Header Text</option>
                            <option value="image">Header Image</option>
                        </select>
                    </div>

                    {/* Header Text Fields */}
                    {settings.headerType === 'text' && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                                    Lab Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.labName}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labName: e.target.value }))}
                                    placeholder="Enter lab name"
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                                    Lab Address
                                </label>
                                <textarea
                                    value={settings.labAddress}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labAddress: e.target.value }))}
                                    placeholder="Enter lab address"
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                                />
                            </div>
                        </>
                    )}

                    {/* Header Image Upload */}
                    {settings.headerType === 'image' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                                Header Image
                            </label>
                            
                            {/* Show current saved image */}
                            {settings.headerImageUrl && !selectedFile && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Current Image:</p>
                                    <div style={{ overflow: 'hidden', borderRadius: '4px' }}>
                                        <img 
                                            src={settings.headerImageUrl} 
                                            alt="Header" 
                                            style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Show preview of selected file */}
                            {selectedFile && previewUrl && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#eff6ff', borderRadius: '4px', border: '2px solid #3b82f6' }}>
                                    <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>Selected Image (not saved yet):</p>
                                    <div style={{ overflow: 'hidden', borderRadius: '4px' }}>
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                                        />
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file, 'header');
                                }}
                                disabled={uploading}
                                style={{ display: 'block', fontSize: '13px', marginBottom: '8px', width: '100%' }}
                            />

                            {selectedFile && croppingType === 'header' && (
                                <button
                                    onClick={handleImageUpload}
                                    disabled={uploading}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        opacity: uploading ? 0.7 : 1
                                    }}
                                >
                                    {uploading ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                                </button>
                            )}
                        </div>
                    )}

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    {/* Footer Settings */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Footer Type
                        </label>
                        <select
                            value={settings.footerType}
                            onChange={(e) => setSettings(prev => ({ ...prev, footerType: e.target.value as any }))}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                borderRadius: '4px', 
                                border: '1px solid #cbd5e1', 
                                fontSize: '14px',
                                background: 'white'
                            }}
                        >
                            <option value="none">No Footer</option>
                            <option value="text">Footer Text</option>
                            <option value="image">Footer Image</option>
                        </select>
                    </div>

                    {settings.footerType === 'text' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                                Footer Text
                            </label>
                            <textarea
                                value={settings.footerText}
                                onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                                placeholder="Enter footer text"
                                rows={2}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                            />
                        </div>
                    )}

                    {settings.footerType === 'image' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                                Footer Image
                            </label>
                            
                            {settings.footerImageUrl && !selectedFile && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Current Footer:</p>
                                    <div style={{ overflow: 'hidden', borderRadius: '4px' }}>
                                        <img 
                                            src={settings.footerImageUrl} 
                                            alt="Footer" 
                                            style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedFile && previewUrl && croppingType === 'footer' && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#eff6ff', borderRadius: '4px', border: '2px solid #3b82f6' }}>
                                    <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>Selected Footer (not saved yet):</p>
                                    <div style={{ overflow: 'hidden', borderRadius: '4px' }}>
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                                        />
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file, 'footer');
                                }}
                                disabled={uploading}
                                style={{ display: 'block', fontSize: '13px', marginBottom: '8px', width: '100%' }}
                            />

                            {selectedFile && croppingType === 'footer' && (
                                <button
                                    onClick={handleImageUpload}
                                    disabled={uploading}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        opacity: uploading ? 0.7 : 1
                                    }}
                                >
                                    {uploading ? 'UPLOADING...' : 'UPLOAD FOOTER'}
                                </button>
                            )}
                        </div>
                    )}

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    {/* Header Margin */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Header Margin: {settings.headerMargin}px
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="300"
                            value={settings.headerMargin}
                            onChange={(e) => setSettings(prev => ({ ...prev, headerMargin: Number(e.target.value) }))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Font Size */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Font Size: {settings.fontSize}px
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="24"
                            value={settings.fontSize}
                            onChange={(e) => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Watermark Toggle */}
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="showWatermark"
                            checked={settings.showWatermark}
                            onChange={(e) => setSettings(prev => ({ ...prev, showWatermark: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="showWatermark" style={{ fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
                            Show Watermark
                        </label>
                    </div>

                    {/* Watermark Text */}
                    {settings.showWatermark && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                                Watermark Text
                            </label>
                            <input
                                type="text"
                                value={settings.watermarkText}
                                onChange={(e) => setSettings(prev => ({ ...prev, watermarkText: e.target.value }))}
                                placeholder="Enter watermark text"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            />
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                            opacity: saving ? 0.7 : 1,
                            marginBottom: '12px'
                        }}
                    >
                        {saving ? 'SAVING...' : 'SAVE SETTINGS'}
                    </button>

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#64748b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}
                    >
                        ← BACK
                    </button>
                </div>

                {/* Right Panel - Preview using actual BillReceipt component */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
                        Preview (Actual Print Layout)
                    </h2>
                    <div style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '4px', 
                        background: 'white',
                        overflow: 'auto',
                        maxHeight: '90vh'
                    }}>
                        {/* Actual BillReceipt Component with settings */}
                        <BillReceipt 
                            bill={sampleBill} 
                            showWatermark={false}
                            printSettings={{
                                headerType: settings.headerType,
                                footerType: settings.footerType,
                                labName: settings.labName,
                                labAddress: settings.labAddress,
                                headerImageUrl: settings.headerImageUrl,
                                footerImageUrl: settings.footerImageUrl,
                                footerText: settings.footerText,
                                headerMargin: settings.headerMargin,
                                fontSize: settings.fontSize,
                                showWatermark: settings.showWatermark,
                                watermarkText: settings.watermarkText
                            }}
                        />
                    </div>
                </div>
            </div>

            {showCropper && (
                <ImageCropper 
                    image={tempFileUrl} 
                    onCropComplete={onCropComplete} 
                    onCancel={() => setShowCropper(false)} 
                />
            )}
        </div>
    );
}
