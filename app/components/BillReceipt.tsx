
import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';

interface BillReceiptProps {
    bill: {
        _id: string;
        patient: {
            title: string;
            firstName: string;
            lastName: string;
            gender: string;
            age: number;
        };
        doctor: {
            firstName: string;
            lastName: string;
        };
        tests: {
            test: { name: string };
            price: number;
        }[];
        totalAmount: number;
        discountAmount: number;
        paidAmount: number;
        dueAmount: number;
        paymentType?: string;
        duePaymentType?: string;
        createdAt: string;
    };
    showWatermark?: boolean;
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
    };
}


export const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(({ bill, showWatermark = false, printSettings }, ref) => {
    
    const formattedDate = new Date(bill.createdAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const billIdShort = bill._id.substring(bill._id.length - 6).toUpperCase();
    const grandTotal = bill.totalAmount - bill.discountAmount;

    // Determine header type (default to text with hardcoded values if no settings)
    const headerType = printSettings?.headerType || 'text';
    const labName = printSettings?.labName || 'Raj Labs';
    const labAddress = printSettings?.labAddress || 'Balasore';
    const headerMargin = printSettings?.headerMargin || 20;

    return (
        <div ref={ref} className="bill-receipt-container" style={{ 
            width: '100%', 
            maxWidth: '800px', 
            margin: '0 auto', 
            backgroundColor: 'white',
            fontFamily: 'Arial, sans-serif',
            color: '#000',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            fontSize: `${printSettings?.fontSize || 14}px`,
            minHeight: '100vh'
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        margin: 0;
                    }
                    .bill-receipt-container {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        min-height: 100vh !important;
                    }
                }
            ` }} />
            
            {/* Watermark */}
            {(printSettings?.showWatermark ?? showWatermark) && (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '60px',
                color: 'rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 0,
                textAlign: 'center',
                width: '100%'
            }}>
                {printSettings?.watermarkText || 'IzyHealth By Rutu Dev Labs'}
            </div>
            )}

            {/* Content Section with flex-grow to push footer down */}
            <div style={{ flex: 1 }}>
                {/* Header - Conditional based on settings */}
                {headerType === 'text' && (
                    <div style={{ textAlign: 'center', marginBottom: `${headerMargin}px` }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{labName}</h1>
                        <p style={{ fontSize: '14px', margin: '5px 0' }}>{labAddress}</p>
                        <div style={{ borderBottom: '1px solid #ccc', margin: '15px 0' }}></div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>BILL RECEIPT</h2>
                    </div>
                )}

                {headerType === 'image' && printSettings?.headerImageUrl && (
                    <div style={{ marginBottom: `${headerMargin}px` }}>
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
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>BILL RECEIPT</h2>
                    </div>
                )}

                {headerType === 'none' && (
                    <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>BILL RECEIPT</h2>
                    </div>
                )}

                {/* Content Wrapper with Padding */}
                <div style={{ padding: '0 40px 40px 40px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Meta Grid */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex' }}>
                                <span style={{ width: '80px', color: '#666' }}>Patient:</span>
                                <span style={{ fontWeight: 600 }}>{bill.patient.title} {bill.patient.firstName} {bill.patient.lastName}</span>
                            </div>
                            <div style={{ display: 'flex' }}>
                                <span style={{ width: '80px', color: '#666' }}>Sex / Age:</span>
                                <span>{bill.patient.gender} / {bill.patient.age} Years</span>
                            </div>
                            <div style={{ display: 'flex' }}>
                                <span style={{ width: '80px', color: '#666' }}>Ref. by:</span>
                                <span>{bill.doctor.firstName === 'SELF' ? 'Self' : `Dr. ${bill.doctor.firstName} ${bill.doctor.lastName}`}</span>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '40px' }}>
                             <div style={{ display: 'flex' }}>
                                <span style={{ width: '60px', color: '#666' }}>Date:</span>
                                <span style={{ fontWeight: 600 }}>{formattedDate}</span>
                            </div>
                             <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '60px', color: '#666' }}>Bill ID:</span>
                                <span style={{ fontWeight: 600 }}>{billIdShort}</span>
                            </div>
                        </div>

                        <div style={{ width: '120px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                            <Barcode 
                                value={billIdShort} 
                                height={30} 
                                width={1.5} 
                                displayValue={true} 
                                fontSize={10} 
                                margin={0}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                 <QRCodeSVG 
                                    value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://x-pharma.vercel.app'}/bills/${bill._id}/view`} 
                                    size={50} 
                                />
                                 <div style={{ fontSize: '9px', marginTop: '2px', color: '#666' }}>Scan to View</div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ borderTop: '2px solid #000', borderBottom: '1px solid #000' }}>
                                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '14px' }}>Sl.</th>
                                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '14px' }}>Test Name</th>
                                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '14px' }}>Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.tests.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 0', fontSize: '14px' }}>{index + 1}</td>
                                    <td style={{ padding: '8px 0', fontSize: '14px' }}>{item.test.name}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 0', fontSize: '14px' }}>{item.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '10px' }}>
                        <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>Subtotal</span>
                            <span style={{ fontSize: '14px' }}>{bill.totalAmount}</span>
                        </div>
                        {bill.discountAmount > 0 && (
                            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '14px', color: '#666' }}>Discount</span>
                                <span style={{ fontSize: '14px' }}>- {bill.discountAmount}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginBottom: '5px', padding: '5px 0', borderTop: '1px solid #eee' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Grand Total</span>
                            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#000' }}>{grandTotal}</span>
                        </div>
                        <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>Paid Amount</span>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{bill.paidAmount}</span>
                        </div>
                        <div style={{ display: 'flex', width: '220px', justifyContent: 'flex-end', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', color: '#666', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Mode: {bill.paymentType || 'CASH'}</span>
                        </div>
                        {bill.dueAmount > 0 && (
                            <>
                                <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginBottom: '5px', paddingTop: '5px', borderTop: '1px dashed #ccc' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#ef4444' }}>Due Balance</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#ef4444' }}>{bill.dueAmount}</span>
                                </div>
                                {bill.duePaymentType && (
                                    <div style={{ display: 'flex', width: '220px', justifyContent: 'flex-end', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '11px', color: '#666', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>Due Pay Mode: {bill.duePaymentType}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer Signatory */}
                    <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'right' }}>
                         <div style={{ display: 'inline-block', textAlign: 'center' }}>
                            <div style={{ borderTop: '2px solid #000', width: '200px', marginBottom: '5px' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Authorized Signatory</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Footer Rendering */}
            {printSettings?.footerType === 'image' && printSettings?.footerImageUrl && (
                <div style={{ marginTop: '20px' }}>
                    <div style={{ borderTop: '1px solid #ccc', margin: '15px 0' }}></div>
                    <img 
                        src={printSettings.footerImageUrl} 
                        alt="Footer" 
                        style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                    />
                </div>
            )}

            {printSettings?.footerType === 'text' && printSettings?.footerText && (
                <div style={{ marginTop: '20px', padding: '10px 40px', textAlign: 'center', borderTop: '1px solid #ccc' }}>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{printSettings.footerText}</p>
                </div>
            )}
        </div>
    );
});

BillReceipt.displayName = 'BillReceipt';
