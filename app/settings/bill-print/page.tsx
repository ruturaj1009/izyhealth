'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { BillReceipt } from '@/app/components/BillReceipt';

export default function BillPrintSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    
    const [settings, setSettings] = useState({
        headerType: 'none' as 'none' | 'text' | 'image',
        labName: '',
        labAddress: '',
        headerMargin: 20,
        fontSize: 14,
        headerImageUrl: '',
        footerImageUrl: '',
        showWatermark: true,
        watermarkText: 'Health Amaze Demo Account'
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
                    labName: data.data.labName || prev.labName,
                    labAddress: data.data.labAddress || prev.labAddress,
                    headerMargin: data.data.headerMargin || 20,
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

    function handleFileSelect(file: File) {
        setSelectedFile(file);
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    }

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
                setSettings(prev => ({ ...prev, headerImageUrl: data.data.url }));
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
                                    if (file) handleFileSelect(file);
                                }}
                                disabled={uploading}
                                style={{ display: 'block', fontSize: '13px', marginBottom: '8px', width: '100%' }}
                            />

                            {selectedFile && (
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

                    {/* Header Margin */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Header Margin: {settings.headerMargin}px
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.headerMargin}
                            onChange={(e) => setSettings(prev => ({ ...prev, headerMargin: Number(e.target.value) }))}
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
                                labName: settings.labName,
                                labAddress: settings.labAddress,
                                headerImageUrl: settings.headerImageUrl,
                                headerMargin: settings.headerMargin,
                                fontSize: settings.fontSize,
                                showWatermark: settings.showWatermark,
                                watermarkText: settings.watermarkText
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
