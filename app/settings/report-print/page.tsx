'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { ReportPrint } from '@/app/components/ReportPrint';
import Cropper, { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
    initialAspect?: number;
}

function ImageCropper({ image, onCropComplete, onCancel, initialAspect }: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState<number | undefined>(initialAspect);
    const [removeBackground, setRemoveBackground] = useState(false);
    const [sensitivity, setSensitivity] = useState(200);
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

    async function getCroppedImg(imageSrc: string, pixelCrop: Area, removeBg: boolean, threshold: number): Promise<Blob> {
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

        if (removeBg) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Background removal using luminance-based thresholding
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Luminance calculation
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // If luminance is above threshold, make it transparent
                if (luminance > threshold) {
                    data[i + 3] = 0; // Alpha
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, removeBg ? 'image/png' : 'image/jpeg');
        });
    }

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, removeBackground, sensitivity);
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
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteInternal}
                    onZoomChange={onZoomChange}
                />
            </div>
            
            <div style={{ 
                marginTop: '10px', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px', 
                width: '100%', 
                maxWidth: '800px',
                background: 'white',
                padding: '20px',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>Aspect Ratio</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { label: 'Header (4:1)', value: 4/1 },
                                { label: 'Signature (3:2)', value: 3/2 },
                                { label: 'Square (1:1)', value: 1/1 },
                                { label: 'Free', value: undefined }
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => setAspect(opt.value)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        background: aspect === opt.value ? '#3b82f6' : 'white',
                                        color: aspect === opt.value ? 'white' : '#475569',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                                type="checkbox" 
                                id="removeBg" 
                                checked={removeBackground} 
                                onChange={(e) => setRemoveBackground(e.target.checked)} 
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="removeBg" style={{ fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Remove Background</label>
                        </div>
                        {removeBackground && (
                            <div style={{ width: '150px' }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Sensitivity: {sensitivity}</label>
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="250" 
                                    value={sensitivity} 
                                    onChange={(e) => setSensitivity(Number(e.target.value))} 
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#64748b' }}>Zoom: {zoom.toFixed(1)}x</label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
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
        </div>
    );
}

export default function ReportPrintSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showCropper, setShowCropper] = useState(false);
    const [tempFileUrl, setTempFileUrl] = useState('');
    const [croppingType, setCroppingType] = useState<'header' | 'footer' | 'sig1' | 'sig2'>('header');
    
    const [settings, setSettings] = useState({
        headerType: 'none' as 'none' | 'text' | 'image',
        footerType: 'none' as 'none' | 'text' | 'image',
        labName: '',
        labAddress: '',
        headerMargin: 20,
        fontSize: 14,
        headerImageUrl: '',
        footerImageUrl: '',
        footerText: '',
        showWatermark: true,
        watermarkText: 'Rutu Dev Labs',
        letterhead1Name: '',
        letterhead1SignatureUrl: '',
        showLetterhead1: true,
        letterhead2Name: '',
        letterhead2SignatureUrl: '',
        showLetterhead2: true
    });

    // Sample report data for preview
    const sampleReport = {
        _id: '507f1f77bcf86cd799439011',
        patient: { firstName: 'Ruturaj', lastName: 'Sahu', gender: 'Male', age: 23 },
        doctor: { firstName: 'SELF', lastName: '' },
        results: [
            {
                testId: { name: 'Hemoglobin', department: { name: 'Hematology' }, unit: 'g/dL', referenceRanges: [{ min: 13, max: 17 }] },
                testName: 'Hemoglobin',
                resultValue: '15.2',
                createdAt: new Date().toISOString()
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    useEffect(() => {
        fetchSettings();
        fetchOrgDetails();
    }, []);

    async function fetchSettings() {
        try {
            const data = await api.get('/api/v1/settings/print?type=report');
            if (data.status === 200) {
                setSettings(prev => ({
                    ...prev,
                    headerType: data.data.headerType || 'none',
                    footerType: data.data.footerType || 'none',
                    labName: data.data.labName || prev.labName,
                    labAddress: data.data.labAddress || prev.labAddress,
                    headerMargin: data.data.headerMargin || 20,
                    fontSize: data.data.fontSize || 14,
                    headerImageUrl: data.data.headerImageUrl || '',
                    footerImageUrl: data.data.footerImageUrl || '',
                    footerText: data.data.footerText || '',
                    showWatermark: data.data.showWatermark !== undefined ? data.data.showWatermark : true,
                    watermarkText: data.data.watermarkText || 'Health Amaze Demo Account',
                    letterhead1Name: data.data.letterhead1Name || '',
                    letterhead1SignatureUrl: data.data.letterhead1SignatureUrl || '',
                    showLetterhead1: data.data.showLetterhead1 !== undefined ? data.data.showLetterhead1 : true,
                    letterhead2Name: data.data.letterhead2Name || '',
                    letterhead2SignatureUrl: data.data.letterhead2SignatureUrl || '',
                    showLetterhead2: data.data.showLetterhead2 !== undefined ? data.data.showLetterhead2 : true
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
                type: 'report',
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

    function handleFileSelect(file: File, type: 'header' | 'footer' | 'sig1' | 'sig2') {
        const url = URL.createObjectURL(file);
        setTempFileUrl(url);
        setCroppingType(type);
        setShowCropper(true);
    }

    async function handleDirectUpload(file: File, field: string) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const data = await api.post('/api/v1/settings/upload', formData);
            if (data.status === 200) {
                const settingField = field === 'sig1' ? 'letterhead1SignatureUrl' : 'letterhead2SignatureUrl';
                setSettings(prev => ({ ...prev, [settingField]: data.data.url }));
                toast.success('Signature uploaded');
            }
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    }

    const onCropComplete = (croppedImage: Blob) => {
        let fileName = 'image.jpg';
        let extension = 'jpg';
        if (croppingType === 'header') fileName = 'header.jpg';
        else if (croppingType === 'footer') fileName = 'footer.jpg';
        else if (croppingType === 'sig1' || croppingType === 'sig2') {
            fileName = `signature_${croppingType}.png`;
            extension = 'png';
        }

        const file = new File([croppedImage], fileName, { type: extension === 'png' ? 'image/png' : 'image/jpeg' });
        
        if (croppingType === 'sig1' || croppingType === 'sig2') {
            handleDirectUpload(file, croppingType);
        } else {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(croppedImage));
        }
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
        return <div style={{ padding: '50px', textAlign: 'center' }}>Loading settings...</div>;
    }

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: '#1e293b' }}>
                        Report Print Settings
                    </h2>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Header Type</label>
                        <select
                            value={settings.headerType}
                            onChange={(e) => setSettings(prev => ({ ...prev, headerType: e.target.value as any }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                        >
                            <option value="none">No Header</option>
                            <option value="text">Header Text</option>
                            <option value="image">Header Image</option>
                        </select>
                    </div>

                    {settings.headerType === 'text' && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Lab Name</label>
                                <input
                                    type="text"
                                    value={settings.labName}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labName: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Lab Address</label>
                                <textarea
                                    value={settings.labAddress}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labAddress: e.target.value }))}
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                                />
                            </div>
                        </>
                    )}

                    {settings.headerType === 'image' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Header Image</label>
                            {settings.headerImageUrl && !selectedFile && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>
                                    <img src={settings.headerImageUrl} alt="Header" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}
                            {selectedFile && previewUrl && croppingType === 'header' && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#eff6ff', borderRadius: '4px', border: '2px solid #3b82f6' }}>
                                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file, 'header');
                            }} disabled={uploading} style={{ display: 'block', fontSize: '13px', width: '100%' }} />
                            {selectedFile && croppingType === 'header' && (
                                <button onClick={handleImageUpload} disabled={uploading} style={{ width: '100%', padding: '8px', background: '#10b981', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, marginTop: '8px', opacity: uploading ? 0.7 : 1 }}>
                                    {uploading ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                                </button>
                            )}
                        </div>
                    )}

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Footer Type</label>
                        <select
                            value={settings.footerType}
                            onChange={(e) => setSettings(prev => ({ ...prev, footerType: e.target.value as any }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                        >
                            <option value="none">No Footer</option>
                            <option value="text">Footer Text</option>
                            <option value="image">Footer Image</option>
                        </select>
                    </div>

                    {settings.footerType === 'text' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Footer Text</label>
                            <textarea
                                value={settings.footerText}
                                onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                                rows={2}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                            />
                        </div>
                    )}

                    {settings.footerType === 'image' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Footer Image</label>
                            {settings.footerImageUrl && !selectedFile && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>
                                    <img src={settings.footerImageUrl} alt="Footer" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}
                            {selectedFile && previewUrl && croppingType === 'footer' && (
                                <div style={{ marginBottom: '8px', padding: '10px', background: '#eff6ff', borderRadius: '4px', border: '2px solid #3b82f6' }}>
                                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file, 'footer');
                            }} disabled={uploading} style={{ display: 'block', fontSize: '13px', width: '100%' }} />
                            {selectedFile && croppingType === 'footer' && (
                                <button onClick={handleImageUpload} disabled={uploading} style={{ width: '100%', padding: '8px', background: '#10b981', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, marginTop: '8px', opacity: uploading ? 0.7 : 1 }}>
                                    {uploading ? 'UPLOADING...' : 'UPLOAD FOOTER'}
                                </button>
                            )}
                        </div>
                    )}

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Header Margin: {settings.headerMargin}px</label>
                        <input type="range" min="0" max="300" value={settings.headerMargin} onChange={(e) => setSettings(prev => ({ ...prev, headerMargin: Number(e.target.value) }))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Font Size: {settings.fontSize}px</label>
                        <input type="range" min="10" max="24" value={settings.fontSize} onChange={(e) => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" id="showWatermark" checked={settings.showWatermark} onChange={(e) => setSettings(prev => ({ ...prev, showWatermark: e.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <label htmlFor="showWatermark" style={{ fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Show Watermark</label>
                    </div>

                    {settings.showWatermark && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Watermark Text</label>
                            <input type="text" value={settings.watermarkText} onChange={(e) => setSettings(prev => ({ ...prev, watermarkText: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                        </div>
                    )}

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Signatories</h3>
                    
                    <div style={{ marginBottom: '24px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <input 
                                type="checkbox" 
                                id="showSig1" 
                                checked={settings.showLetterhead1} 
                                onChange={(e) => setSettings(prev => ({ ...prev, showLetterhead1: e.target.checked }))} 
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="showSig1" style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>Show Lab Technician</label>
                        </div>
                        
                        <div style={{ opacity: settings.showLetterhead1 ? 1 : 0.5, pointerEvents: settings.showLetterhead1 ? 'auto' : 'none' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Name</label>
                                <input 
                                    type="text" 
                                    value={settings.letterhead1Name} 
                                    onChange={(e) => setSettings(prev => ({ ...prev, letterhead1Name: e.target.value }))} 
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                                />
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Signature</label>
                                {settings.letterhead1SignatureUrl && (
                                    <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        <img src={settings.letterhead1SignatureUrl} alt="Sig 1" style={{ maxHeight: '40px', display: 'block' }} />
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'sig1')} 
                                    style={{ fontSize: '12px', width: '100%' }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <input 
                                type="checkbox" 
                                id="showSig2" 
                                checked={settings.showLetterhead2} 
                                onChange={(e) => setSettings(prev => ({ ...prev, showLetterhead2: e.target.checked }))} 
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="showSig2" style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>Show Pathologist</label>
                        </div>
                        
                        <div style={{ opacity: settings.showLetterhead2 ? 1 : 0.5, pointerEvents: settings.showLetterhead2 ? 'auto' : 'none' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Name</label>
                                <input 
                                    type="text" 
                                    value={settings.letterhead2Name} 
                                    onChange={(e) => setSettings(prev => ({ ...prev, letterhead2Name: e.target.value }))} 
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                                />
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>Signature</label>
                                {settings.letterhead2SignatureUrl && (
                                    <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        <img src={settings.letterhead2SignatureUrl} alt="Sig 2" style={{ maxHeight: '40px', display: 'block' }} />
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'sig2')} 
                                    style={{ fontSize: '12px', width: '100%' }} 
                                />
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', opacity: saving ? 0.7 : 1, marginBottom: '12px' }}>
                        {saving ? 'SAVING...' : 'SAVE SETTINGS'}
                    </button>
                    <button onClick={() => router.back()} style={{ width: '100%', padding: '12px', background: '#64748b', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                        ← BACK
                    </button>
                </div>

                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Report Preview</h2>
                    <div style={{ border: '1px solid #e2e8f0', background: 'white', overflow: 'auto', maxHeight: '90vh' }}>
                        <ReportPrint report={sampleReport} printSettings={settings} />
                    </div>
                </div>
            </div>

            {showCropper && (
                <ImageCropper 
                    image={tempFileUrl} 
                    onCropComplete={onCropComplete} 
                    onCancel={() => setShowCropper(false)} 
                    initialAspect={croppingType === 'header' || croppingType === 'footer' ? 4/1 : 3/2}
                />
            )}
        </div>
    );
}
