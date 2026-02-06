'use client';
import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { ReportPrint } from '@/app/components/ReportPrint';
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
        groupResults?: TestResult[];
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

export default function PatientReportViewPage() {
    const params = useParams();
    const id = params?.id as string;

    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [watermarkText] = useState('Health Amaze Demo Account');
    const [interpretationModal, setInterpretationModal] = useState<{title: string, text: string} | null>(null);
    const [printSettings, setPrintSettings] = useState<any>(null);

    // Print Handling
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Report_${report?.patient?.firstName || 'Patient'}`,
    });

    useEffect(() => {
        if (id) {
            fetchReport(id);
        }
    }, [id]);

    async function fetchPrintSettings(orgid: number) {
        try {
            const res = await fetch(`/api/v1/public/settings/print?type=report&orgid=${orgid}`);
            const data = await res.json();
            if (data.status === 200) {
                setPrintSettings(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch print settings:', err);
        }
    }

    async function fetchReport(id: string) {
        try {
            const res = await fetch(`/api/v1/public/reports/${id}`);
            const data = await res.json();
            if (data.status === 200) {
                setReport(data.data);
                if (data.data.orgid) {
                    fetchPrintSettings(data.data.orgid);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <div style={{ fontSize: '18px', color: '#64748b' }}>Loading report...</div>
            </div>
        );
    }

    if (!report) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <div style={{ fontSize: '18px', color: '#64748b' }}>Report not found</div>
            </div>
        );
    }

    // Group results by department
    const groupedResults: Record<string, TestResult[]> = {};
    report.results.forEach((result) => {
        const deptName = typeof result.testId === 'object' ? result.testId.department?.name || 'General' : 'General';
        if (!groupedResults[deptName]) {
            groupedResults[deptName] = [];
        }
        groupedResults[deptName].push(result);
    });

    const cardStyle = {
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    };

    const actionBtnStyle = (bgColor: string) => ({
        padding: '10px 20px',
        background: bgColor,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '13px',
        textTransform: 'uppercase' as const,
        textDecoration: 'none',
        display: 'inline-block'
    });



    const renderRow = (result: TestResult, key: string, isNested = false) => {
         // @ts-ignore
         const testDef = typeof result.testId === 'object' ? result.testId : null;
         
         // Robust check for Group Type
         // @ts-ignore
         const isGroup = result.type === 'group' || (testDef?.type === 'group' && result.groupResults && result.groupResults.length > 0);
 
         // Render Group Header
         if (isGroup) {
              return (
                  <Fragment key={key}>
                      <tr style={{ background: '#f8fafc' }}>
                         <td colSpan={4} style={{ padding: '10px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                             {result.testName}
                         </td>
                      </tr>
                      {/* @ts-ignore */}
                      {result.groupResults?.map((sub, sIdx) => renderRow(sub, `${key}-${sIdx}`, true))}
                  </Fragment>
              );
         }

         const isDescriptive = testDef?.type === 'descriptive' || (result as any).type === 'descriptive';
         
         let displayRefRange = result.referenceRange;
         if (!displayRefRange && testDef?.referenceRanges && testDef.referenceRanges.length > 0) {
             displayRefRange = testDef.referenceRanges.map((r: any) => {
                 let val = '';
                 if (r.min && r.max) val = `${r.min} - ${r.max}`;
                 else if (r.min) val = `> ${r.min}`;
                 else if (r.max) val = `< ${r.max}`;
                 return r.name ? `${r.name}: ${val}` : val;
             }).filter(Boolean).join(', ');
         }

         return (
             <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                 <td style={{ padding: '12px 8px', paddingLeft: isNested ? '30px' : '8px', fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                     {result.testName}
                     {testDef?.interpretation && (
                         <button
                             onClick={() => setInterpretationModal({
                                 title: result.testName,
                                 text: testDef.interpretation || ''
                             })}
                             style={{
                                 marginLeft: '8px',
                                 width: '18px',
                                 height: '18px',
                                 borderRadius: '50%',
                                 background: '#3b82f6',
                                 color: 'white',
                                 border: 'none',
                                 fontSize: '11px',
                                 fontWeight: 'bold',
                                 cursor: 'pointer',
                                 display: 'inline-flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 fontFamily: 'serif',
                                 fontStyle: 'italic'
                             }}
                             title="View Interpretation"
                         >
                             i
                         </button>
                     )}
                 </td>
                 <td style={{ padding: '12px 8px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
                     {isDescriptive ? '-' : result.resultValue}
                 </td>
                 <td style={{ padding: '12px 8px', fontSize: '14px', color: '#64748b' }}>
                     {isDescriptive ? '-' : displayRefRange || '-'}
                 </td>
                 <td style={{ padding: '12px 8px', fontSize: '14px', color: '#64748b' }}>
                     {isDescriptive ? '-' : result.unit || '-'}
                 </td>
             </tr>
         );
    };

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>Test Report</h1>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Patient Portal - View Only</p>
            </div>

            {/* Patient & Report Info Card */}
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Patient Name</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {report.patient.firstName} {report.patient.lastName}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Age / Gender</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {report.patient.age} Years / {report.patient.gender}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Referred By</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {report.doctor.firstName === 'SELF' ? 'Self' : `Dr. ${report.doctor.firstName} ${report.doctor.lastName}`}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Report Date</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {new Date(report.createdAt).toLocaleDateString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Results by Department */}
                {Object.entries(groupedResults).map(([deptName, results]) => (
                    <div key={deptName} style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                            {deptName}
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Test Name</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Result</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Reference Range</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, idx) => renderRow(result, String(idx)))}
                            </tbody>
                        </table>
                    </div>
                ))}

                {/* Impression */}
                {report.impression && (
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>Impression</h3>
                        <div dangerouslySetInnerHTML={{ __html: report.impression }} style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }} />
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={() => handlePrint()} style={actionBtnStyle('#1565c0')}>
                        Print Report
                    </button>
                    <Link href={`/bills/${report.bill._id}/view`} style={actionBtnStyle('#2e7d32')}>
                        View Bill
                    </Link>
                </div>
            </div>

            {/* Interpretation Modal */}
            {interpretationModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                        <button 
                            onClick={() => setInterpretationModal(null)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                        >
                            ✕
                        </button>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '15px', paddingRight: '30px' }}>
                            Interpretation: {interpretationModal.title}
                        </h3>
                        <div dangerouslySetInnerHTML={{ __html: interpretationModal.text }} style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }} />
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
