import React from 'react';
import { IReport } from '@/types/report';
import { QRCodeSVG } from 'qrcode.react';

interface ReportPrintProps {
    report: any; // Using any for flexibility with populated fields, or strict IReport
    printSettings?: {
        headerType?: 'none' | 'text' | 'image';
        labName?: string;
        labAddress?: string;
        headerImageUrl?: string;
        headerMargin?: number;
        fontSize?: number;
        showWatermark?: boolean;
        watermarkText?: string;
    };
}

export const ReportPrint = React.forwardRef<HTMLDivElement, ReportPrintProps>(({ report, printSettings }, ref) => {
    
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
            <style type="text/css" media="print">
                {`
                @page { size: A4; margin: 0; }
                body { margin: 0; }
                .rte-content table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 5px; }
                .rte-content th, .rte-content td { border: 1px solid #ccc; padding: 4px; text-align: left; }
                .rte-content th { background-color: #f1f1f1; font-weight: bold; }
                `}
            </style>
            {allResults.map((result, index) => {
                const currentPage = index + 1;
                const isLastPage = index === allResults.length - 1;
                
                // Helper to determine if it's a group
                const testDef = result.testId;
                const isGroup = result.type === 'group' || (testDef?.type === 'group' && result.groupResults && result.groupResults.length > 0);

                // Flatten rows for this page (either single result or group sub-results)
                let rowsToRender = [];
                if (isGroup) {
                    // For groups, we render the header row, then all sub-results
                    // We can add a flag to distinguish styling
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
                    <div key={index} style={{ 
                        position: 'relative', 
                        width: '210mm',
                        padding: '20px', 
                        pageBreakAfter: isLastPage ? 'auto' : 'always',
                        boxSizing: 'border-box',
                        minHeight: '296mm' // Reduced slightly to prevent spillover
                    }}>
                        {/* Watermark */}
                        {(printSettings?.showWatermark ?? (report.watermarkText !== false)) && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                                fontSize: '60px', color: 'rgba(0, 0, 0, 0.05)', pointerEvents: 'none', whiteSpace: 'nowrap', fontWeight: 'bold', zIndex: 0,
                                textAlign: 'center', width: '100%'
                            }}>
                                {printSettings?.watermarkText || report.watermarkText || 'IzyHealth By Rutu Dev Labs'}
                            </div>
                        )}

                        {/* Header (Repeated on every page) - Conditional based on settings */}
                        {(!printSettings || printSettings.headerType === 'text') && (
                            <div style={{ textAlign: 'center', marginBottom: `${printSettings?.headerMargin || 10}px` }}>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{printSettings?.labName || 'Raj Labs'}</h1>
                                <p style={{ fontSize: '14px', margin: '5px 0' }}>{printSettings?.labAddress || 'Balasore'}</p>
                                <div style={{ borderBottom: '1px solid #ccc', margin: '15px 0' }}></div>
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
                                            height: '100px', 
                                            objectFit: 'cover',
                                            display: 'block'
                                        }} 
                                    />
                                </div>
                                <div style={{ borderBottom: '1px solid #ccc', margin: '15px 0' }}></div>
                            </div>
                        )}

                        {/* Patient Meta Bar */}
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

                            {/* Group Header Title if Group */}
                            {isGroup && (
                                <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '10px', textDecoration: 'underline' }}>
                                    {result.testName}
                                </div>
                            )}

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
                                    {rowsToRender.map((row: any, rIdx) => {
                                        // Row specific logic
                                        const rTestDef = row.testId || {};
                                        const rIsDescriptive = rTestDef.type === 'descriptive' || row.type === 'descriptive';
                                        
                                        // Ref Range Format
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

                                        // Indentation style for nested
                                        const paddingLeft = (row.level || 0) * 20 + 5;
                                        
                                        // If this row is actually a nested group header
                                        if (row.isGroupHeader) {
                                            return (
                                                <tr key={rIdx} style={{ background: '#f9f9f9' }}>
                                                    <td colSpan={4} style={{ padding: '8px 5px', paddingLeft: `${paddingLeft}px`, fontWeight: 'bold' }}>
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
                                                <td style={{ padding: '8px 5px', verticalAlign: 'top' }}>
                                                        {rIsDescriptive ? '' : displayRefRange}
                                                </td>
                                                <td style={{ padding: '8px 5px', verticalAlign: 'top' }}>
                                                        {rIsDescriptive ? '' : (row.unit || rTestDef.unit)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Interpretations */}
                            {/* We show interpretation for the main test if it exists, or maybe for subtests? 
                                Current design shows logic for single test. 
                                For groups, let's just show the group's interpretation if any, 
                                but arguably sub-tests might have them. 
                                Let's loop through rows and show interpretations if they exist. 
                            */}
                            {rowsToRender.map((row: any, rIdx) => {
                                // Skip loop interpretation for single tests to avoid duplication
                                if (!isGroup) return null;
                                const interp = row.remarks || row.testId?.interpretation;
                                if (!interp) return null;
                                return (
                                    <div key={rIdx} style={{ marginTop: '10px' }} className="rte-content">
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #ddd', marginBottom: '5px' }}>
                                            INTERPRETATION: {row.testName}
                                        </div>
                                        <div dangerouslySetInnerHTML={{ __html: interp }} style={{ fontSize: '11px', lineHeight: '1.4' }} />
                                    </div>
                                );
                            })}
                            
                            {/* Interpretation for the Top Level Result (if it wasn't in rowsToRender e.g. single test) */}
                            {!isGroup && (result.remarks || result.testId?.interpretation) && (
                                <div style={{ marginTop: '20px' }} className="rte-content">
                                    <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>INTERPRETATION</div>
                                    <div dangerouslySetInnerHTML={{ __html: result.remarks || result.testId?.interpretation }} style={{ fontSize: '12px', lineHeight: '1.4' }} />
                                </div>
                            )}

                             {/* Impression - On Every Page */}
                             {report.impression && (
                                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>IMPRESSION:</div>
                                    <div dangerouslySetInnerHTML={{ __html: report.impression }} style={{ fontSize: '12px', lineHeight: '1.4' }} />
                                </div>
                            )}
                            
                        </div>

                        {/* Footer (Signatures + Page Number) */}
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
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
