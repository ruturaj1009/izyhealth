import React from 'react';
import { IReport } from '@/types/report';
import { QRCodeSVG } from 'qrcode.react';

interface ReportPrintProps {
    report: any; // Using any for flexibility with populated fields, or strict IReport
}

export const ReportPrint = React.forwardRef<HTMLDivElement, ReportPrintProps>(({ report }, ref) => {
    
    // Helper to format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('en-IN', {
             year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' 
        });
    };

    // Flatten all results from all departments into a single array
    const allResults: any[] = [];
    if (report && report.results) {
        report.results.forEach((result: any) => {
            allResults.push(result);
        });
    }

    const totalPages = allResults.length;

    return (
        <div ref={ref} style={{ width: '210mm', margin: '0 auto', background: 'white', fontFamily: 'Arial, sans-serif' }}>
            {allResults.map((result, index) => {
                const currentPage = index + 1;
                const isLastPage = index === allResults.length - 1;
                
                // Get interpretation for THIS test only
                const interpretation = result.testId?.interpretation 
                    ? { title: result.testName, text: result.testId.interpretation }
                    : null;

                // Format ref range
                let displayRefRange = result.referenceRange;
                if (!displayRefRange && result.testId?.referenceRanges?.length > 0) {
                        displayRefRange = result.testId.referenceRanges.map((r: any) => {
                        let val = '';
                        if (r.min && r.max) val = `${r.min} - ${r.max}`;
                        else if (r.min) val = `> ${r.min}`;
                        else if (r.max) val = `< ${r.max}`;
                        return r.name ? `${r.name}: ${val}` : val;
                        }).filter(Boolean).join(', ');
                }
                const isDescriptive = result.testId?.type === 'descriptive';

                return (
                    <div key={index} style={{ 
                        position: 'relative', 
                        width: '210mm',
                        padding: '20px', 
                        pageBreakAfter: isLastPage ? 'auto' : 'always',
                        boxSizing: 'border-box'
                    }}>
                        {/* Watermark */}
                        {report.watermarkText !== false && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                                fontSize: '60px', color: 'rgba(0, 0, 0, 0.05)', pointerEvents: 'none', whiteSpace: 'nowrap', fontWeight: 'bold', zIndex: 0
                            }}>
                                {report.watermarkText || 'IzyHealth By Rutu Dev Labs'}
                            </div>
                        )}

                        {/* Header (Repeated on every page) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                            <div style={{ flex: 2 }}>
                                <div style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '80px', fontWeight: 'bold' }}>Name:</span>
                                    <span style={{ fontWeight: 'bold' }}>{report.patient?.firstName} {report.patient?.lastName}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '80px', fontWeight: 'bold' }}>Sex / Age:</span>
                                    <span>{report.patient?.gender} / {report.patient?.age} Years</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '80px', fontWeight: 'bold' }}>Ref. by:</span>
                                    <span>{report.doctor?.firstName === 'SELF' ? 'Self' : `Dr. ${report.doctor?.firstName} ${report.doctor?.lastName}`}</span>
                                </div>
                            </div>
                            <div style={{ flex: 2 }}>
                                <div style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Sampling Date:</span>
                                    <span>{formatDate(report.createdAt)}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Report Date:</span>
                                    <span>{formatDate(report.updatedAt || report.createdAt)}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Report ID:</span>
                                    <span>{report._id ? report._id.substring(report._id.length - 6).toUpperCase() : ''}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <QRCodeSVG 
                                    value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://x-pharma.vercel.app'}/reports/${report._id}/view`} 
                                    size={60} 
                                />
                                <div style={{ fontSize: '10px', marginTop: '2px' }}>Online Access</div>
                            </div>
                        </div>

                        {/* Title */}
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px', textTransform: 'uppercase' }}>
                            TEST REPORT
                        </div>

                        {/* Content Area */}
                        <div>
                             {/* Department Header */}
                             <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px', fontSize: '14px', background: '#e0e0e0', marginBottom: '10px' }}>
                                {result.testId?.department?.name || 'General'}
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #000' }}>
                                        <th style={{ textAlign: 'left', padding: '5px', width: '35%' }}>Test Name</th>
                                        <th style={{ textAlign: 'left', padding: '5px', width: '20%' }}>Result</th>
                                        <th style={{ textAlign: 'left', padding: '5px', width: '30%' }}>Ref Range</th>
                                        <th style={{ textAlign: 'left', padding: '5px', width: '15%' }}>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px 5px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 'bold' }}>{result.testName}</div>
                                            {result.method && <div style={{ fontSize:'10px', color: '#666' }}>Method: {result.method}</div>}
                                        </td>
                                        <td style={{ padding: '8px 5px', verticalAlign: 'top', fontWeight: 'bold' }}>
                                            {isDescriptive ? '' : result.resultValue}
                                        </td>
                                        <td style={{ padding: '8px 5px', verticalAlign: 'top' }}>
                                                {isDescriptive ? '' : displayRefRange}
                                        </td>
                                        <td style={{ padding: '8px 5px', verticalAlign: 'top' }}>
                                                {isDescriptive ? '' : (result.unit || result.testId?.unit)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Interpretation for THIS test */}
                            {interpretation && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>INTERPRETATION</div>
                                    <div dangerouslySetInnerHTML={{ __html: interpretation.text }} style={{ fontSize: '12px', lineHeight: '1.4' }} />
                                </div>
                            )}

                             {/* Impression - On Every Page */}
                             {report.impression && (
                                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>IMPRESSION:</div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{report.impression}</div>
                                </div>
                            )}
                            

                        </div>

                        {/* Footer (Signatures + Page Number) - Flow naturally after content */}
                        <div style={{ marginTop: '120px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                                    <div style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '5px' }}>Lab Technician</div>
                                </div>
                                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                                    <div style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '5px' }}>Pathologist</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                                Page {currentPage} of {totalPages}
                            </div>
                            {isLastPage && (
                                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                    ~ End of Report ~
                                </div>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
    );
});

ReportPrint.displayName = 'ReportPrint';
