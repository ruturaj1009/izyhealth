'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';

export default function ReportPrintSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    
    const [settings, setSettings] = useState({
        headerMargin: 20,
        fontSize: 14,
        headerImageUrl: '',
        footerImageUrl: '',
        letterhead1Name: '',
        letterhead1SignatureUrl: '',
        letterhead2Name: '',
        letterhead2SignatureUrl: '',
        showWatermark: true,
        watermarkText: 'Health Amaze Demo Account'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const data = await api.get('/api/v1/settings/print?type=report');
            if (data.status === 200) {
                setSettings({
                    headerMargin: data.data.headerMargin || 20,
                    fontSize: data.data.fontSize || 14,
                    headerImageUrl: data.data.headerImageUrl || '',
                    footerImageUrl: data.data.footerImageUrl || '',
                    letterhead1Name: data.data.letterhead1Name || '',
                    letterhead1SignatureUrl: data.data.letterhead1SignatureUrl || '',
                    letterhead2Name: data.data.letterhead2Name || '',
                    letterhead2SignatureUrl: data.data.letterhead2SignatureUrl || '',
                    showWatermark: data.data.showWatermark !== undefined ? data.data.showWatermark : true,
                    watermarkText: data.data.watermarkText || 'Health Amaze Demo Account'
                });
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
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

    async function handleImageUpload(field: string, file: File) {
        setUploading(field);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const data = await api.post('/api/v1/settings/upload', formData);
            if (data.status === 200) {
                setSettings(prev => ({ ...prev, [field]: data.data.url }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload image');
        } finally {
            setUploading(null);
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
            {/* Header */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Report Print Settings
                </h1>
                <button
                    onClick={() => router.back()}
                    style={{
                        padding: '10px 20px',
                        background: '#64748b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    ← BACK
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
                {/* Left Panel - Controls */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: '#1e293b' }}>
                        Print Settings
                    </h2>

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

                    {/* Font Size */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Font Size: {settings.fontSize}px
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="20"
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

                    {/* Header Image */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Header Image
                        </label>
                        {settings.headerImageUrl && (
                            <div style={{ marginBottom: '8px' }}>
                                <img src={settings.headerImageUrl} alt="Header" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: '4px' }} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('headerImageUrl', file);
                            }}
                            disabled={uploading === 'headerImageUrl'}
                            style={{ display: 'block', fontSize: '13px' }}
                        />
                        {uploading === 'headerImageUrl' && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>Uploading...</p>}
                    </div>

                    {/* Footer Image */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Footer Image
                        </label>
                        {settings.footerImageUrl && (
                            <div style={{ marginBottom: '8px' }}>
                                <img src={settings.footerImageUrl} alt="Footer" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: '4px' }} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('footerImageUrl', file);
                            }}
                            disabled={uploading === 'footerImageUrl'}
                            style={{ display: 'block', fontSize: '13px' }}
                        />
                        {uploading === 'footerImageUrl' && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>Uploading...</p>}
                    </div>

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    {/* Letterhead 1 */}
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
                        Letterhead 1
                    </h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={settings.letterhead1Name}
                            onChange={(e) => setSettings(prev => ({ ...prev, letterhead1Name: e.target.value }))}
                            placeholder="e.g., Dr. John Smith"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Signature
                        </label>
                        {settings.letterhead1SignatureUrl && (
                            <div style={{ marginBottom: '8px' }}>
                                <img src={settings.letterhead1SignatureUrl} alt="Signature 1" style={{ maxWidth: '100%', maxHeight: '60px', borderRadius: '4px' }} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('letterhead1SignatureUrl', file);
                            }}
                            disabled={uploading === 'letterhead1SignatureUrl'}
                            style={{ display: 'block', fontSize: '13px' }}
                        />
                        {uploading === 'letterhead1SignatureUrl' && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>Uploading...</p>}
                    </div>

                    {/* Letterhead 2 */}
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
                        Letterhead 2
                    </h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={settings.letterhead2Name}
                            onChange={(e) => setSettings(prev => ({ ...prev, letterhead2Name: e.target.value }))}
                            placeholder="e.g., Dr. Jane Doe"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                            Signature
                        </label>
                        {settings.letterhead2SignatureUrl && (
                            <div style={{ marginBottom: '8px' }}>
                                <img src={settings.letterhead2SignatureUrl} alt="Signature 2" style={{ maxWidth: '100%', maxHeight: '60px', borderRadius: '4px' }} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('letterhead2SignatureUrl', file);
                            }}
                            disabled={uploading === 'letterhead2SignatureUrl'}
                            style={{ display: 'block', fontSize: '13px' }}
                        />
                        {uploading === 'letterhead2SignatureUrl' && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>Uploading...</p>}
                    </div>

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
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'SAVING...' : 'SAVE SETTINGS'}
                    </button>
                </div>

                {/* Right Panel - Preview */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
                        Preview
                    </h2>
                    <div style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '4px', 
                        padding: '20px',
                        background: 'white',
                        minHeight: '800px'
                    }}>
                        {/* Header Image */}
                        {settings.headerImageUrl && (
                            <div style={{ marginBottom: `${settings.headerMargin}px`, textAlign: 'center' }}>
                                <img src={settings.headerImageUrl} alt="Header" style={{ maxWidth: '100%', maxHeight: '150px' }} />
                            </div>
                        )}

                        {/* Sample Report Content */}
                        <div style={{ fontSize: `${settings.fontSize}px`, fontFamily: 'Arial, sans-serif' }}>
                            <h3 style={{ fontSize: `${settings.fontSize + 4}px`, fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
                                LABORATORY REPORT
                            </h3>
                            <div style={{ marginBottom: '20px' }}>
                                <p><strong>Patient:</strong> John Doe</p>
                                <p><strong>Age/Gender:</strong> 35 Years / Male</p>
                                <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                            
                            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', fontSize: `${settings.fontSize}px` }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #000' }}>
                                        <th style={{ textAlign: 'left', padding: '8px' }}>Test Name</th>
                                        <th style={{ textAlign: 'center', padding: '8px' }}>Result</th>
                                        <th style={{ textAlign: 'center', padding: '8px' }}>Reference Range</th>
                                        <th style={{ textAlign: 'center', padding: '8px' }}>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '8px' }}>Hemoglobin</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>14.5</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>13.0 - 17.0</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>g/dL</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px' }}>WBC Count</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>7500</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>4000 - 11000</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>cells/μL</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Letterhead Signatures */}
                            <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                {settings.letterhead1Name && (
                                    <div style={{ textAlign: 'center' }}>
                                        {settings.letterhead1SignatureUrl && (
                                            <img src={settings.letterhead1SignatureUrl} alt="Signature 1" style={{ maxHeight: '50px', marginBottom: '8px' }} />
                                        )}
                                        <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: `${settings.fontSize - 2}px` }}>
                                            {settings.letterhead1Name}
                                        </div>
                                    </div>
                                )}
                                {settings.letterhead2Name && (
                                    <div style={{ textAlign: 'center' }}>
                                        {settings.letterhead2SignatureUrl && (
                                            <img src={settings.letterhead2SignatureUrl} alt="Signature 2" style={{ maxHeight: '50px', marginBottom: '8px' }} />
                                        )}
                                        <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: `${settings.fontSize - 2}px` }}>
                                            {settings.letterhead2Name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Image */}
                        {settings.footerImageUrl && (
                            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                <img src={settings.footerImageUrl} alt="Footer" style={{ maxWidth: '100%', maxHeight: '100px' }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
