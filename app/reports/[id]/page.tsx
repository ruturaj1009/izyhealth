'use client';
import { useState, useEffect, Fragment, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { ReportPrint } from '@/app/components/ReportPrint';
import { ReportStatus } from '@/enums/report';
import RichTextEditor from '@/app/components/RichTextEditor';
import { api } from '@/lib/api-client';

interface TestResult {
    testId: string | { 
        _id: string; 
        name: string; 
        unit?: string; 
        referenceRanges?: { name?: string; min?: string; max?: string }[];
        department?: { name: string };
        interpretation?: string;
        method?: string;
        type?: string;
    };
    testName: string;
    resultValue: string;
    unit?: string;
    referenceRange?: string;
    status: string;
    remarks?: string;
    method?: string;
    type?: string;
    groupResults?: TestResult[];
}

interface Report {
    _id: string;
    date: string;
    status: string;
    patient: { _id: string; firstName: string; lastName: string; phone: string; age: number; gender: string };
    doctor: { _id: string; firstName: string; lastName: string; title: string };
    bill: { _id: string; dueAmount: number };
    results: TestResult[];
    createdAt: string;
    impression?: string;
}

export default function ReportDetailsPage() {
    const params = useParams();
    const id = params?.id as string;

    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Track which rows are in edit mode by index (string key for nested)
    const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
    
    // Store temporary edits before saving
    const [tempEdits, setTempEdits] = useState<Record<string, Partial<TestResult>>>({});

    // Interpretation Modal State
    const [showInterpModal, setShowInterpModal] = useState(false);
    const [currentInterp, setCurrentInterp] = useState<{ key: string, text: string }>({ key: '-1', text: '' });

    // Impression State
    const [showImpressionInput, setShowImpressionInput] = useState(false);
    const [tempImpression, setTempImpression] = useState('');

    // Print Settings State
    const [showPrintSettings, setShowPrintSettings] = useState(false);
    const [watermarkText, setWatermarkText] = useState('Health Amaze Demo Account');
    const [printSettings, setPrintSettings] = useState<any>(null);

    // Print Handling
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Report_${report?.patient?.firstName || 'Patient'}`,
    });

    // Status Options & Mapping
    const statusOptions = ['Initial', 'In Process', 'Completed', 'Verified & Signed', 'Printed', 'Delivered'];
    const reportStatusMap: Record<string, string> = {
        'Initial': ReportStatus.INITIAL,
        'In Process': ReportStatus.IN_PROGRESS,
        'Completed': ReportStatus.COMPLETED,
        'Verified & Signed': ReportStatus.VERIFIED,
        'Printed': ReportStatus.PRINTED,
        'Delivered': ReportStatus.DELIVERED
    };

    useEffect(() => {
        if (id) {
            fetchReport(id);
            fetchPrintSettings();
        }
    }, [id]);

    async function fetchPrintSettings() {
        try {
            const data = await api.get('/api/v1/settings/print?type=report');
            if (data.status === 200) {
                setPrintSettings(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch print settings:', err);
        }
    }

    async function fetchReport(id: string) {
        try {
            const data = await api.get(`/api/v1/reports/${id}`);
            if (data.status === 200) {
                console.log('Report Data:', data.data);
                setReport(data.data);
            } else {
                toast.error('Failed to load report');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!report) return;
        setSaving(true);
        try {
            const data = await api.put(`/api/v1/reports/${report._id}`, { status: newStatus });
            
            if (data.status === 200) {
                setReport(data.data);
                toast.success(`Status updated to ${newStatus}`);
            } else {
                toast.error('Failed to update status');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleResultChange = (key: string, field: keyof TestResult, value: string) => {
        setTempEdits(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const toggleEdit = (key: string) => {
        const isEditing = !editingRows[key];
        setEditingRows(prev => ({ ...prev, [key]: isEditing }));
        
        if (isEditing && report) {
            // Need to find the result based on key (e.g. "0" or "0-1")
            const indices = key.split('-').map(Number);
            let targetResult: any = report.results[indices[0]];
            for (let i = 1; i < indices.length; i++) {
                if (targetResult && targetResult.groupResults) {
                    targetResult = targetResult.groupResults[indices[i]];
                }
            }

            // Initialize temp state with current values
            if (targetResult) {
                setTempEdits(prev => ({
                    ...prev,
                    [key]: { ...targetResult }
                }));
            }
        } else {
            // Clear temp state for this row
            setTempEdits(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });
        }
    };

    const cancelEdit = (key: string) => {
        setEditingRows(prev => ({ ...prev, [key]: false }));
        setTempEdits(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    };

    const openInterpModal = (key: string, defaultText: string) => {
        if (!report) return;
        
        // Find result
        const indices = key.split('-').map(Number);
        let result: any = report.results[indices[0]];
        for (let i = 1; i < indices.length; i++) {
             if (result && result.groupResults) {
                 result = result.groupResults[indices[i]];
             }
        }

        // For descriptive tests, we might want to use the default text (template) if remarks are empty
        const existing = result?.remarks || defaultText || '';
        setCurrentInterp({ key, text: existing });
        setShowInterpModal(true);
    };

    const saveInterp = () => {
        if (currentInterp.key && report) {
            // Optimistic update logic for nested structure is complex, 
            // easier to skip purely local state set and rely on refetch or smart recursive update
            // We will do a smart recursive update for local state to avoid flicker
            const newResults = JSON.parse(JSON.stringify(report.results));
            const indices = currentInterp.key.split('-').map(Number);
            let target = newResults[indices[0]];
            for (let i = 1; i < indices.length; i++) {
                if (target && target.groupResults) target = target.groupResults[indices[i]];
            }
            if (target) target.remarks = currentInterp.text;

            setReport({ ...report, results: newResults });
            setShowInterpModal(false);
            
            saveUpdatedResults(newResults);
        }
    };

    // Generalized Save Function that takes the FULL updated results array
    const saveUpdatedResults = async (updatedResults: TestResult[]) => {
         if (!report) return;
         setSaving(true);
         try {
            // Recursive cleaner function
            const clean = (results: any[]): any[] => {
                return results.map(r => ({
                    ...r,
                    testId: typeof r.testId === 'object' ? (r.testId as any)._id : r.testId,
                    groupResults: r.groupResults ? clean(r.groupResults) : undefined
                }));
            };
            const cleanResults = clean(updatedResults);

            const data = await api.put(`/api/v1/reports/${report._id}`, { results: cleanResults });

            if (data.status === 200) {
                 setReport(data.data);
                 toast.success('Saved successfully');
            } else {
                 toast.error('Failed to save');
            }
         } catch(err) {
             console.error(err);
         } finally {
             setSaving(false);
         }
    };

    const saveRow = async (key: string) => {
        if (!report) return;
        
        const edits = tempEdits[key];
        if (!edits) {
            toggleEdit(key); // Just close if no edits
            return;
        }

        // Apply edits to local copy
        const newResults = JSON.parse(JSON.stringify(report.results));
        const indices = key.split('-').map(Number);
        let target = newResults[indices[0]];
        for (let i = 1; i < indices.length; i++) {
             if (target && target.groupResults) target = target.groupResults[indices[i]];
        }
        
        if (target) {
            Object.assign(target, edits);
        }

        setEditingRows(prev => ({ ...prev, [key]: false }));
        setTempEdits(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });

        await saveUpdatedResults(newResults);
    };
    
    const handleSaveImpression = async () => {
        if (!report) return;
        try {
            const data = await api.put(`/api/v1/reports/${report._id}`, { impression: tempImpression });

            if (data.status === 200) {
                 // Update local state
                 setReport(prev => prev ? ({ ...prev, impression: tempImpression }) : null);
                 setShowImpressionInput(false);
                 toast.success('Impression saved');
            } else {
                 toast.error('Failed to save impression');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error saving impression');
        }
    };

    const handleCancelImpression = () => {
        setShowImpressionInput(false);
        setTempImpression(report?.impression || ''); // Reset to original
    };

    const openImpressionInput = () => {
        setTempImpression(report?.impression || '');
        setShowImpressionInput(true);
    };

    // Reference Range Helper
    const formatReferenceRanges = (ranges: any[]) => {
        if (!ranges || ranges.length === 0) return '';
        return ranges.map((r) => {
            let val = '';
            if (r.min && r.max) val = `${r.min} - ${r.max}`;
            else if (r.min) val = `> ${r.min}`;
            else if (r.max) val = `< ${r.max}`;
            
            if (!val) return null;
            
            // "Name : range value"
            // "Skip name if it is not there"
            return r.name ? `${r.name}: ${val}` : val;
        }).filter(Boolean).join(', ');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
             year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' 
        });
    };

    // Group tests by department
    const groupedResults: Record<string, { result: TestResult, originalIndex: number }[]> = {};
    if (report) {
        report.results.forEach((result, idx) => {
            // @ts-ignore
            const deptName = result.testId?.department?.name || 'General';
            if (!groupedResults[deptName]) {
                groupedResults[deptName] = [];
            }
            groupedResults[deptName].push({ result, originalIndex: idx });
        });
    }

    // Helper to render a Row
    const renderRow = (result: TestResult, key: string, isNested = false) => {
        // @ts-ignore
        const testDef = typeof result.testId === 'object' ? result.testId : null;
        
        // Robust check for Group Type
        const isGroup = result.type === 'group' || (testDef?.type === 'group' && result.groupResults && result.groupResults.length > 0);

        // Render Group Header
        if (isGroup) {
             return (
                 <Fragment key={key}>
                     <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={5} style={{ padding: '10px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <i className="fa fa-layer-group" style={{color:'#3b82f6'}}></i>
                                {result.testName}
                            </div>
                        </td>
                     </tr>
                     {result.groupResults?.map((sub, sIdx) => renderRow(sub, `${key}-${sIdx}`, true))}
                 </Fragment>
             );
        }

        const isEditing = editingRows[key]; 
        const editValues = tempEdits[key] || result;
        const displayUnit = result.unit || testDef?.unit;
        const method = result.method || testDef?.method;
        const isDescriptive = testDef?.type === 'descriptive' || result.type === 'descriptive';
        
        let displayRefRange = result.referenceRange;
        if (!displayRefRange && testDef?.referenceRanges && testDef.referenceRanges.length > 0) {
            displayRefRange = formatReferenceRanges(testDef.referenceRanges);
        }

        return (
            <tr key={key} style={{borderBottom: '1px solid #f1f5f9', background: 'white'}}>
                <td style={{padding: '15px 5px', paddingLeft: isNested ? '30px' : '5px', verticalAlign: 'middle'}}>
                    <div style={{fontWeight: 600, color: '#334155'}}>{result.testName}</div>
                    {method && <div style={{fontSize:'11px', color:'#94a3b8', marginTop:'2px'}}>{method}</div>}
                </td>
                
                <td style={{padding: '15px 5px'}}>
                    {isDescriptive ? null : (
                        isEditing ? (
                            <input 
                                value={editValues.resultValue || ''}
                                onChange={(e) => handleResultChange(key, 'resultValue', e.target.value)} 
                                placeholder="Enter Value"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    fontWeight: 600
                                }}
                                autoFocus
                            />
                        ) : (
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                                {result.resultValue || <span style={{color:'#cbd5e1', fontWeight: 400}}>Empty</span>}
                            </span>
                        )
                    )}
                </td>
                
                <td style={{padding: '15px 5px'}}>
                    {!isDescriptive && (
                        <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                            {displayRefRange}
                        </div>
                    )}
                </td>
                
                <td style={{padding: '15px 5px'}}>
                    {!isDescriptive && (
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {displayUnit}
                        </div>
                    )}
                </td>
                
                <td style={{padding: '15px 5px'}}>
                    <div style={{display: 'flex', gap: '8px', alignItems:'center'}}>
                        {!isDescriptive && (
                            isEditing ? (
                                <>
                                    <button 
                                        onClick={() => saveRow(key)}
                                        disabled={saving}
                                        style={{
                                            background: '#22c55e',
                                            color: 'white',
                                            padding: '6px 10px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            opacity: saving ? 0.7 : 1
                                        }}
                                    >
                                        SAVE
                                    </button>
                                    <button 
                                        onClick={() => cancelEdit(key)}
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            padding: '6px 10px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '11px'
                                        }}
                                    >
                                        CANCEL
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => toggleEdit(key)}
                                    style={{
                                        background: '#e2e8f0',
                                        color: '#475569',
                                        padding: '6px 10px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                >
                                    EDIT
                                </button>
                            )
                        )}

                        {!isEditing && (
                            <button 
                                onClick={() => openInterpModal(key, testDef?.interpretation || '')}
                                style={{
                                    background: '#fff7ed', 
                                    color: '#ea580c', 
                                    padding: '6px 10px', 
                                    border: '1px solid #ffedd5', 
                                    borderRadius: '4px', 
                                    fontWeight: 600, 
                                    cursor: 'pointer', 
                                    fontSize: '11px'
                                }}
                            >
                                EDIT INTERP
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading...</div>;
    if (!report) return <div style={{padding:'40px', textAlign:'center'}}>Report not found</div>;

    const actionBtnStyle = (bgColor: string) => ({
        background: bgColor,
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '12px',
        cursor: 'pointer',
        textTransform: 'uppercase' as const,
        // boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Removed to match bill page
    });

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <Toaster position="top-right" />
            
            {/* Main Card */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Information */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                    
                    {/* Patient Info */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px' }}>
                            <span style={{color: '#64748b'}}>Patient: </span> 
                            <span style={{fontWeight: 700}}>{report.patient?.firstName} {report.patient?.lastName}</span>
                        </div>
                        <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px' }}>
                            <span style={{color: '#64748b'}}>Sex / Age: </span> 
                            <span style={{fontWeight: 600}}>{report.patient?.gender} / {report.patient?.age} Years</span>
                        </div>
                        <div style={{ fontSize: '15px', color: '#1e293b' }}>
                            <span style={{color: '#64748b'}}>Referred By: </span> 
                            <span style={{fontWeight: 600}}>
                                {report.doctor?.firstName === 'SELF' ? 'Self' : `Dr. ${report.doctor?.firstName} ${report.doctor?.lastName}`}
                            </span>
                        </div>
                    </div>

                    {/* Report Info */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px' }}>
                            <span style={{color: '#64748b'}}>Sampling Date: </span> 
                            <span style={{fontWeight: 600}}>{formatDate(report.createdAt)}</span>
                        </div>
                         <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px' }}>
                            <span style={{color: '#64748b'}}>Report Date: </span> 
                            <span style={{fontWeight: 600}}>{formatDate(report.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: '15px', color: '#1e293b' }}>
                            <span style={{color: '#64748b'}}>Report ID: </span> 
                            <span style={{fontWeight: 600}}>{report._id ? report._id.substring(report._id.length - 6).toUpperCase() : 'N/A'}</span>
                        </div>
                    </div>

                    {/* Status & Due */}
                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                         <div style={{ fontSize: '15px', color: '#1e293b' }}>
                            <span style={{color: '#64748b'}}>Due Amount: </span> 
                            <span style={{
                                background: report.bill?.dueAmount > 0 ? '#ef4444' : '#22c55e', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                fontWeight: 600
                            }}>₹{report.bill?.dueAmount ?? 0}</span>
                        </div>

                        {/* Status Dropdown */}
                        <div style={{ position: 'relative', width: '200px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Report Status</label>
                            <select 
                                value={statusOptions.find(opt => reportStatusMap[opt] === report.status) || report.status}
                                onChange={(e) => handleStatusChange(reportStatusMap[e.target.value] || e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '10px', 
                                    background: '#f1f5f9', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    fontWeight: 600, 
                                    color: '#334155',
                                    cursor: 'pointer'
                                }}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* divider */}
                <hr style={{border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 20px 0'}} />

                {/* Tests Table */}
                <div style={{marginBottom: '30px'}}>
                     <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr style={{ textAlign: 'left', fontSize: '13px', color: '#1e293b', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{padding: '10px 5px', width: '30%'}}>Test Name</th>
                                <th style={{padding: '10px 5px', width: '20%'}}>Result</th>
                                <th style={{padding: '10px 5px', width: '25%'}}>Ref Range</th>
                                <th style={{padding: '10px 5px', width: '10%'}}>Unit</th>
                                <th style={{padding: '10px 5px', width: '15%'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedResults).map(([deptName, group]) => (
                                <Fragment key={deptName}>
                                    {/* Department Header */}
                                    <tr style={{ background: '#e2e8f0' }}>
                                        <td colSpan={5} style={{ padding: '8px 10px', fontWeight: 700, fontSize: '13px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                                            {deptName}
                                        </td>
                                    </tr>

                                    {/* Test Rows */}
                                    {group.map(({ result, originalIndex }) => renderRow(result, String(originalIndex)))}
                                </Fragment>
                            ))}
                        </tbody>
                     </table>
                     
                </div>

                {/* Impression UI */}
                <div style={{ marginBottom: '30px' }}>
                    {/* Display Existing Impression if not editing */}
                    {!showImpressionInput && report.impression && (
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>IMPRESSION:</div>
                            <div dangerouslySetInnerHTML={{ __html: report.impression }} style={{ fontSize: '14px', color: '#334155' }} />
                        </div>
                    )}

                    {!showImpressionInput ? (
                        <button 
                            onClick={openImpressionInput}
                            style={{
                                background: 'white',
                                border: '1px dashed #3b82f6',
                                color: '#3b82f6',
                                padding: '10px',
                                width: '100%',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '13px',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#eff6ff'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                            {report.impression ? '+ EDIT IMPRESSION' : '+ ADD IMPRESSION'}
                        </button>
                    ) : (
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                             <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>Add Impression</h4>
                             <textarea 
                                value={tempImpression}
                                onChange={(e) => setTempImpression(e.target.value)}
                                placeholder="Type your impression here..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    marginBottom: '10px'
                                }}
                             />
                             <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                 <button 
                                    onClick={handleCancelImpression}
                                    style={{
                                        border: '1px solid #cbd5e1',
                                        background: 'white',
                                        color: '#64748b',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '12px'
                                    }}
                                 >
                                    CANCEL
                                 </button>
                                 <button 
                                    onClick={handleSaveImpression}
                                    style={{
                                        border: 'none',
                                        background: '#22c55e',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '12px'
                                    }}
                                 >
                                    SAVE
                                 </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons Row */}
                 <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={() => handlePrint()} style={actionBtnStyle('#1565c0')}>PRINT</button>
                    <button style={actionBtnStyle('#1565c0')}>CUSTOM PRINT</button>
                    <button onClick={() => setShowPrintSettings(true)} style={actionBtnStyle('#1565c0')}>PRINT SETTINGS</button>
                    <button style={actionBtnStyle('#1565c0')}>SEND</button>
                    <Link href={`/bills/${report?.bill?._id}`}>
                        <button style={actionBtnStyle('#1565c0')}>VIEW BILL</button>
                    </Link>
                    <button style={actionBtnStyle('#2e7d32')}>VIDEO TUTORIAL</button>
                    <button style={actionBtnStyle('#1565c0')}>MORE ACTIONS</button>
                 </div>

            </div>

             {/* Footer Actions */}
             <div style={{maxWidth: '1200px', margin: '30px auto', textAlign: 'center'}}>
                 <Link href="/reports" style={{
                     display: 'inline-block', 
                     padding: '10px 20px', 
                     background: '#e2e8f0', 
                     color: '#475569', 
                     fontWeight: 600, 
                     borderRadius: '6px', 
                     textDecoration: 'none',
                     fontSize: '13px',
                     textTransform: 'uppercase',
                     marginBottom: '30px'
                 }}>
                    Go to Reports List
                 </Link>
             </div>
             
             {/* Interpretation Modal */}
             {showInterpModal && (
                 <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                     <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                         <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 700 }}>Test Interpretation</h3>
                         
                         <RichTextEditor 
                             content={currentInterp.text} 
                             onChange={(content) => setCurrentInterp(prev => ({ ...prev, text: content }))}
                         />

                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                             <button onClick={() => setShowInterpModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>CANCEL</button>
                             <button onClick={saveInterp} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>SAVE</button>
                         </div>
                     </div>
                 </div>
             )}

             
            {/* Print Settings Modal */}
            {showPrintSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700 }}>Print Settings</h3>
                        {/* Placeholder Content */}
                        <div style={{marginBottom: '20px', color: '#64748b'}}>
                            Settings configuration placeholder.
                        </div>
                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                             <button onClick={() => setShowPrintSettings(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>CLOSE</button>
                         </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Component */}
            <div style={{ display: 'none' }}>
                {report && <ReportPrint ref={printRef} report={{...report, watermarkText}} printSettings={printSettings} />}
            </div>
        </div>
    );
}
