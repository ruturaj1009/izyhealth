import React from 'react';
import { IReport } from '@/types/report';
import { QRCodeSVG } from 'qrcode.react';

interface ReportPrintProps {
    report: any;
    printSettings?: {
        headerType?: 'none' | 'text' | 'image';
        footerType?: 'none' | 'text' | 'image';
        labName?: string;
        labAddress?: string;
        headerImageUrl?: string;
        footerImageUrl?: string;
        footerText?: string;
        headerMargin?: number;
        fontSize?: number;
        showWatermark?: boolean;
        watermarkText?: string;
        showLetterhead1?: boolean;
        showLetterhead2?: boolean;
        letterhead1Name?: string;
        letterhead1SignatureUrl?: string;
        letterhead2Name?: string;
        letterhead2SignatureUrl?: string;
    };
}

export const ReportPrint = React.forwardRef<HTMLDivElement, ReportPrintProps>(({ report, printSettings }, ref) => {
    
    // Helper function to format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleString('en-IN', {
                 year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' 
            });
        } catch (e) {
            return dateStr;
        }
    };

    // Flatten all results from all departments into a single array
    const allResults: any[] = [];
    if (report && report.results) {
        report.results.forEach((result: any) => {
            allResults.push(result);
        });
    }

    const totalPages = allResults.length;
    const fontSize = printSettings?.fontSize || 14;

    return (
        <div ref={ref} className="report-print-container" style={{ 
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto', 
            background: 'white', 
            fontFamily: 'Arial, sans-serif',
            fontSize: `${fontSize}px`,
            color: '#000',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                    }
                    .report-print-container {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        min-height: 100vh !important;
                    }
                    .report-page {
                        padding: 0 !important;
                        width: 100% !important;
                        min-height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                        page-break-after: always !important;
                    }
                    .report-page:last-child {
                        page-break-after: auto !important;
                    }
                }
                .rte-content table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 5px; }
                .rte-content th, .rte-content td { border: 1px solid #ccc; padding: 4px; text-align: left; }
                .rte-content th { background-color: #f1f1f1; font-weight: bold; }
            ` }} />
            
            {allResults.map((result, index) => {
                const currentPage = index + 1;
                const isLastPage = index === allResults.length - 1;
                
                const testDef = result.testId;
                const isGroup = result.type === 'group' || (testDef?.type === 'group' && result.groupResults && result.groupResults.length > 0);

                let rowsToRender: any[] = [];
                if (isGroup) {
                    if (result.groupResults) {
                         const flattenGroup = (items: any[], level = 0) => {
                             items.forEach(item => {
                                 rowsToRender.push({ ...item, isGroupHeader: item.type === 'group', level });
                                 if (item.type === 'group' && item.groupResults) {
                                     flattenGroup(item.groupResults, level + 1);
                                 }
                             });
                         };
                         flattenGroup(result.groupResults);
                    }
                } else {
                    rowsToRender.push(result);
                }

                return (
                    <div key={index} className="report-page" style={{ 
                        position: 'relative', 
                        width: '100%',
                        padding: '0', 
                        boxSizing: 'border-box',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1
                    }}>
                        {/* Watermark */}
                        {(printSettings?.showWatermark ?? true) && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                                fontSize: '60px', color: 'rgba(0, 0, 0, 0.05)', pointerEvents: 'none', whiteSpace: 'nowrap', fontWeight: 'bold', zIndex: 0,
                                textAlign: 'center', width: '100%'
                            }}>
                                {printSettings?.watermarkText || 'Health Amaze Demo Account'}
                            </div>
                        )}

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                            {/* Header Section */}
                            {(printSettings?.headerType === 'text') && (
                                <div style={{ textAlign: 'center', marginBottom: `${printSettings?.headerMargin || 10}px`, padding: '20px' }}>
                                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#000' }}>{printSettings?.labName || 'Raj Labs'}</h1>
                                    <p style={{ fontSize: '14px', margin: '5px 0', color: '#333' }}>{printSettings?.labAddress || 'Balasore'}</p>
                                    <div style={{ borderBottom: '1.5px solid #000', margin: '15px 0' }}></div>
                                </div>
                            )}

                            {printSettings?.headerType === 'image' && printSettings.headerImageUrl && (
                                <div style={{ marginBottom: `${printSettings.headerMargin || 10}px` }}>
                                    <div style={{ overflow: 'hidden' }}>
                                        <img 
                                            src={printSettings.headerImageUrl} 
                                            alt="Header" 
                                            style={{ 
                                                width: '100%', 
                                                height: 'auto', 
                                                display: 'block'
                                            }} 
                                        />
                                    </div>
                                    <div style={{ borderBottom: '1px solid #ccc', margin: '15px 0' }}></div>
                                </div>
                            )}

                            {printSettings?.headerType === 'none' && (
                                <div style={{ height: '40px' }} />
                            )}

                            {/* Padded Content Wrapper */}
                            <div style={{ padding: '0 40px 40px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Patient Meta Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
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
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reports/${report._id}/view`} 
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
                                <div style={{ flex: 1 }}>
                                     {/* Department Header */}
                                     <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px', fontSize: '14px', background: '#e0e0e0', marginBottom: '15px' }}>
                                        {result.testId?.department?.name || 'General'}
                                    </div>

                                    {/* Group Header Title if Group */}
                                    {isGroup && (
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px', textDecoration: 'underline' }}>
                                            {result.testName}
                                        </div>
                                    )}

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1.5px solid #000' }}>
                                                <th style={{ textAlign: 'left', padding: '8px 5px', width: '35%' }}>Test Name</th>
                                                <th style={{ textAlign: 'left', padding: '8px 5px', width: '20%' }}>Result</th>
                                                <th style={{ textAlign: 'left', padding: '8px 5px', width: '30%' }}>Ref Range</th>
                                                <th style={{ textAlign: 'left', padding: '8px 5px', width: '15%' }}>Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rowsToRender.map((row: any, rIdx) => {
                                                const rTestDef = row.testId || {};
                                                const rIsDescriptive = rTestDef.type === 'descriptive' || row.type === 'descriptive';
                                                
                                                let displayRefRange = row.referenceRange;
                                                if (!displayRefRange && rTestDef.referenceRanges?.length > 0) {
                                                        displayRefRange = rTestDef.referenceRanges.map((r: any) => {
                                                            let val = '';
                                                            if (r.min && r.max) val = `${r.min} - ${r.max}`;
                                                            else if (r.min) val = `> ${r.min}`;
                                                            else if (r.max) val = `< ${r.max}`;
                                                            return r.name ? `${r.name}: ${val}` : val;
                                                        }).filter(Boolean).join(', ');
                                                }

                                                const paddingLeft = (row.level || 0) * 20 + 5;
                                                
                                                if (row.isGroupHeader) {
                                                    return (
                                                        <tr key={rIdx} style={{ background: '#f8f9fa' }}>
                                                            <td colSpan={4} style={{ padding: '10px 5px', paddingLeft: `${paddingLeft}px`, fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                                                                {row.testName}
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return (
                                                    <tr key={rIdx} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '8px 5px', paddingLeft: `${paddingLeft}px`, verticalAlign: 'top' }}>
                                                            <div style={{ fontWeight: 'bold' }}>{row.testName}</div>
                                                            {row.method && <div style={{ fontSize:'10px', color: '#666' }}>Method: {row.method}</div>}
                                                        </td>
                                                        <td style={{ padding: '8px 5px', verticalAlign: 'top', fontWeight: 'bold' }}>
                                                            {rIsDescriptive ? '' : row.resultValue}
                                                        </td>
                                                        <td style={{ padding: '8px 5px', verticalAlign: 'top', color: '#444' }}>
                                                                {rIsDescriptive ? '' : displayRefRange}
                                                        </td>
                                                        <td style={{ padding: '8px 5px', verticalAlign: 'top', color: '#444' }}>
                                                                {rIsDescriptive ? '' : (row.unit || rTestDef.unit)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {rowsToRender.map((row: any, rIdx) => {
                                        if (!isGroup) return null;
                                        const interp = row.remarks || row.testId?.interpretation;
                                        if (!interp) return null;
                                        return (
                                            <div key={rIdx} style={{ marginTop: '15px' }} className="rte-content">
                                                <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #ddd', marginBottom: '8px', color: '#333' }}>
                                                    INTERPRETATION: {row.testName}
                                                </div>
                                                <div dangerouslySetInnerHTML={{ __html: interp }} style={{ fontSize: '12px', lineHeight: '1.5' }} />
                                            </div>
                                        );
                                    })}
                                    
                                    {!isGroup && (result.remarks || result.testId?.interpretation) && (
                                        <div style={{ marginTop: '25px' }} className="rte-content">
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #ddd', marginBottom: '10px', color: '#000' }}>INTERPRETATION</div>
                                            <div dangerouslySetInnerHTML={{ __html: result.remarks || result.testId?.interpretation }} style={{ fontSize: '13px', lineHeight: '1.5' }} />
                                        </div>
                                    )}

                                     {report.impression && (
                                        <div style={{ marginTop: '25px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fcfcfc' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#000' }}>IMPRESSION:</div>
                                            <div dangerouslySetInnerHTML={{ __html: report.impression }} style={{ fontSize: '13px', lineHeight: '1.5' }} />
                                        </div>
                                    )}
                                </div>

                                {/* Signatures and Signatory Block */}
                                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: '15px', gap: '40px' }}>
                                        {(printSettings?.showLetterhead1 !== false) && (
                                            <div style={{ textAlign: 'center', minWidth: '180px' }}>
                                                {printSettings?.letterhead1SignatureUrl && (
                                                    <img src={printSettings.letterhead1SignatureUrl} alt="Signature 1" style={{ maxHeight: '40px', marginBottom: '8px', mixBlendMode: 'multiply' }} />
                                                )}
                                                <div style={{ fontWeight: 'bold', borderTop: '1.5px solid #000', paddingTop: '8px', fontSize: '14px' }}>{printSettings?.letterhead1Name || 'Signatory 1'}</div>
                                                <div style={{ fontSize: '12px', color: '#333', marginTop: '2px' }}>Lab Technician</div>
                                            </div>
                                        )}
                                        {(printSettings?.showLetterhead2 !== false) && (
                                            <div style={{ textAlign: 'center', minWidth: '180px' }}>
                                                {printSettings?.letterhead2SignatureUrl && (
                                                    <img src={printSettings.letterhead2SignatureUrl} alt="Signature 2" style={{ maxHeight: '40px', marginBottom: '8px', mixBlendMode: 'multiply' }} />
                                                )}
                                                <div style={{ fontWeight: 'bold', borderTop: '1.5px solid #000', paddingTop: '8px', fontSize: '14px' }}>{printSettings?.letterhead2Name || 'Signatory 2'}</div>
                                                <div style={{ fontSize: '12px', color: '#333', marginTop: '2px' }}>Pathologist</div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '10px' }}>
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    {isLastPage && (
                                        <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                                            ~ End of Report ~
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Rendering */}
                        {printSettings?.footerType === 'image' && printSettings?.footerImageUrl && (
                            <div style={{ width: '100%' }}>
                                <div style={{ borderTop: '1px solid #eee', width: '100%' }}></div>
                                <img 
                                    src={printSettings.footerImageUrl} 
                                    alt="Footer" 
                                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                                />
                            </div>
                        )}

                        {printSettings?.footerType === 'text' && printSettings?.footerText && (
                            <div style={{ padding: '15px 40px', textAlign: 'center', borderTop: '1.5px solid #000' }}>
                                <p style={{ fontSize: '12px', color: '#000', margin: 0, lineHeight: '1.4' }}>{printSettings.footerText}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

ReportPrint.displayName = 'ReportPrint';
