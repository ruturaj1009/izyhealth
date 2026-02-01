'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { BillReceipt } from '../../components/BillReceipt';
import { BarcodeStickerSheet } from '../../components/BarcodeStickerSheet';
import styles from './page.module.css';

interface BillDetail {
    _id: string;
    patient: { 
        firstName: string; 
        lastName: string; 
        gender: string; 
        age: number; 
        mobile: string;
        title: string;
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
    status: string;
    createdAt: string;
    discountType: 'AMOUNT' | 'PERCENTAGE';
    reportStatus?: string;
    reportId?: string;
    reportMongoId?: string;
}

import { ReportStatus } from '@/enums/report';

const statusMap: Record<string, string> = {
    [ReportStatus.INITIAL]: 'Initial',
    [ReportStatus.IN_PROGRESS]: 'In Process',
    [ReportStatus.COMPLETED]: 'Completed',
    [ReportStatus.VERIFIED]: 'Verified',
    [ReportStatus.PRINTED]: 'Printed',
    [ReportStatus.DELIVERED]: 'Delivered',
    // Legacy mapping if needed, or rely on enum value match if string matches
    'PENDING': 'Initial' 
};

export default function ViewBillPage() {
    const params = useParams();
    const [bill, setBill] = useState<BillDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);
    const barcodeRef = useRef<HTMLDivElement>(null);

    // Barcode Modal State
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [barcodeSettings, setBarcodeSettings] = useState({
        includeName: true,
        includeMeta: true,
        count: 1
    });

    // Collect Due Modal State
    const [showCollectDueModal, setShowCollectDueModal] = useState(false);
    const [collectAmount, setCollectAmount] = useState<number | ''>('');
    const [collectPaymentType, setCollectPaymentType] = useState('CASH');
    const [submittingDue, setSubmittingDue] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Bill-${bill?._id || 'Receipt'}`,
    });

    const handleBarcodePrint = useReactToPrint({
        contentRef: barcodeRef,
        documentTitle: `Barcode-${bill?._id || 'Stickers'}`,
        onAfterPrint: () => setShowBarcodeModal(false)
    });

    useEffect(() => {
        if (params.id) {
            fetchBill(params.id as string);
        }
    }, [params.id]);

    async function fetchBill(id: string) {
        try {
            const res = await fetch(`/api/v1/bills/${id}`);
            const data = await res.json();
            if (data.status === 200) {
                setBill(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleCollectDueSubmit = async () => {
        if (!bill || !collectAmount) return;

        if (Number(collectAmount) > bill.dueAmount) {
            alert('Cannot collect more than the due amount');
            return;
        }

        setSubmittingDue(true);
        try {
            const res = await fetch(`/api/v1/bills/${bill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectDueAmount: Number(collectAmount),
                    duePaymentType: collectPaymentType
                })
            });
            const data = await res.json();
            if (data.status === 200) {
                setBill(data.data); // Update with new bill data (status PAID etc)
                setShowCollectDueModal(false);
                setCollectAmount('');
                // Success toast?
            } else {
                console.error(data.error);
                // Error toast?
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingDue(false);
        }
    };

    if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading Bill...</div>;
    if (!bill) return <div style={{padding:'50px', textAlign:'center'}}>Bill not found</div>;

    const formattedDate = new Date(bill.createdAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const billIdShort = bill._id.substring(bill._id.length - 6).toUpperCase();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                
                {/* HEADER */}
                <div className={styles.headerGrid}>
                    {/* Patient Info */}
                    <div>
                        <div style={{marginBottom:'5px'}}>
                            <span className={styles.label}>Patient:</span>
                            <span className={styles.value} style={{fontSize:'16px'}}>{bill.patient.title} {bill.patient.firstName} {bill.patient.lastName}</span>
                        </div>
                        <div style={{marginBottom:'5px'}}>
                            <span className={styles.label}>Sex / Age:</span>
                            <span className={styles.value}>{bill.patient.gender} / {bill.patient.age} Years</span>
                        </div>
                        <div>
                            <span className={styles.label}>Referred By:</span>
                            <span className={styles.value}>
                                {bill.doctor.firstName === 'SELF' ? 'Self' : `Dr. ${bill.doctor.firstName} ${bill.doctor.lastName}`}
                            </span>
                        </div>
                    </div>

                    {/* Bill Meta */}
                    <div style={{textAlign:'center'}}>
                        <div style={{marginBottom:'5px'}}>
                            <span className={styles.label}>Date:</span>
                            <span className={styles.value}>{formattedDate}</span>
                        </div>
                        <div style={{marginBottom:'5px'}}>
                            <span className={styles.label}>Report Status:</span>
                            {/* Use mapped status or fallback to raw or Initial */}
                            <span className={styles.value} style={{fontWeight:700, color:'#2563eb'}}>
                                {bill.reportStatus ? (statusMap[bill.reportStatus] || bill.reportStatus) : 'Initial'}
                            </span>
                        </div>
                        <div>
                            <span className={styles.label}>Bill ID:</span>
                            <span className={styles.value} style={{fontFamily:'monospace'}}>{billIdShort}</span>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className={styles.amountGrid}>
                        <div className={styles.amountRow}>
                            <span className={styles.amountLabel}>Test Total:</span>
                            <span className={styles.amountValue}>₹{bill.totalAmount}</span>
                        </div>
                        <div className={styles.amountRow}>
                            <span className={styles.amountLabel}>Discount:</span>
                            <span className={styles.amountValue}>₹{bill.discountAmount}</span>
                        </div>
                        <div className={styles.amountRow}>
                            <span className={styles.amountLabel}>Bill Total:</span>
                            <span className={styles.amountValue}>₹{bill.totalAmount - bill.discountAmount}</span>
                        </div>
                         <div className={styles.amountRow}>
                            <span className={styles.amountLabel}>Paid:</span>
                            <span className={styles.amountValue}>₹{bill.paidAmount}</span>
                        </div>
                        <div className={styles.amountRow}>
                            <span className={styles.amountLabel}>Due Amount:</span>
                            <span className={styles.amountValue}>
                                <span className={styles.dueBadge} style={{background: bill.dueAmount > 0 ? '#ef4444' : '#22c55e'}}>
                                    ₹{bill.dueAmount}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{width:'50px'}}>Sl.</th>
                            <th>Test Name</th>
                            <th style={{textAlign:'right'}}>Price (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.tests.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <i className="fa fa-file-lines" style={{color:'#f97316', marginRight:'8px'}}></i>
                                    {item.test?.name}
                                </td>
                                <td style={{textAlign:'right', fontWeight:600}}>{item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ACTIONS */}
                <div className={styles.actions}>
                    <button onClick={() => handlePrint()} className={`${styles.btn} ${styles.btnGreen}`}>PRINT</button>
                    <button onClick={() => setShowBarcodeModal(true)} className={`${styles.btn} ${styles.btnGreen}`}>PRINT BARCODE</button>
                    
                    {bill.reportMongoId ? (
                        <Link href={`/reports/${bill.reportMongoId}`} style={{display: 'contents'}}>
                             <button className={`${styles.btn} ${styles.btnBlue}`}>VIEW REPORT</button>
                        </Link>
                    ) : (
                        <button className={`${styles.btn} ${styles.btnBlue}`} disabled>VIEW REPORT (N/A)</button>
                    )}

                    <Link href={`/bills/${bill._id}/add-test`} style={{display: 'contents'}}>
                        <button className={`${styles.btn} ${styles.btnGreen}`} style={{background:'#f59e0b'}}>+ ADD TEST</button>
                    </Link>

                    {bill.dueAmount > 0 && (
                        <button 
                            onClick={() => {
                                setCollectAmount(bill.dueAmount); 
                                setShowCollectDueModal(true);
                            }} 
                            className={`${styles.btn} ${styles.btnGreen}`}
                            style={{background:'#8b5cf6'}}
                        >
                            COLLECT DUE
                        </button>
                    )}

                    <button className={`${styles.btn} ${styles.btnBlue}`}>PRINT SETTINGS</button>
                    <button className={`${styles.btn} ${styles.btnGreen}`}>SEND WHATSAPP</button>
                    <button className={`${styles.btn} ${styles.btnBlue}`}>MORE</button>
                </div>

            </div>

            <Link href="/bills" className={styles.backBtn}>
                GO TO BILLS LIST
            </Link>

            {/* Hidden Receipt Component for Printing */}
            <div style={{ display: 'none' }}>
                {bill && <BillReceipt ref={componentRef} bill={bill} />}
                {bill && (
                    <BarcodeStickerSheet 
                        ref={barcodeRef}
                        billId={bill._id}
                        patientName={`${bill.patient.title} ${bill.patient.firstName} ${bill.patient.lastName}`}
                        patientAge={bill.patient.age}
                        patientGender={bill.patient.gender}
                        includeName={barcodeSettings.includeName}
                        includeMeta={barcodeSettings.includeMeta}
                        count={barcodeSettings.count}
                    />
                )}
            </div>

            {/* Barcode Print Modal */}
            {showBarcodeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Print Barcode Sticker</h2>
                        
                        {/* ... Existing Barcode Modal Content ... */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <input 
                                type="checkbox" 
                                id="includeName" 
                                checked={barcodeSettings.includeName} 
                                onChange={e => setBarcodeSettings({...barcodeSettings, includeName: e.target.checked})}
                                style={{ width: '18px', height: '18px', marginRight: '10px' }}
                            />
                            <label htmlFor="includeName" style={{ fontSize: '14px' }}>Include Patient Name</label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <input 
                                type="checkbox" 
                                id="includeMeta" 
                                checked={barcodeSettings.includeMeta} 
                                onChange={e => setBarcodeSettings({...barcodeSettings, includeMeta: e.target.checked})}
                                style={{ width: '18px', height: '18px', marginRight: '10px' }}
                            />
                            <label htmlFor="includeMeta" style={{ fontSize: '14px' }}>Include Age & Gender</label>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Count</label>
                            <input 
                                type="number" 
                                value={barcodeSettings.count} 
                                onChange={e => setBarcodeSettings({...barcodeSettings, count: Math.max(1, Number(e.target.value))})}
                                min="1"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                onClick={() => setShowBarcodeModal(false)}
                                style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#333' }}
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={() => handleBarcodePrint()}
                                style={{ padding: '10px 20px', border: 'none', background: '#1d4ed8', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                PRINT BARCODE STICKER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collect Due Modal */}
            {showCollectDueModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '350px' }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Collect Due Amount</h2>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#64748b' }}>Due Amount</label>
                             <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>₹{bill?.dueAmount}</div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#64748b' }}>Collect Amount</label>
                            <input 
                                type="number" 
                                value={collectAmount} 
                                onChange={e => setCollectAmount(Number(e.target.value))}
                                max={bill?.dueAmount}
                                min={0}
                                placeholder="Enter Amount"
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }} 
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#64748b' }}>Payment Type</label>
                            <select 
                                value={collectPaymentType} 
                                onChange={e => setCollectPaymentType(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                            >
                                <option value="CASH">CASH</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">CARD</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                onClick={() => setShowCollectDueModal(false)}
                                style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#333' }}
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleCollectDueSubmit}
                                disabled={submittingDue}
                                style={{ 
                                    padding: '10px 20px', 
                                    border: 'none', 
                                    background: '#8b5cf6', 
                                    color: 'white', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontWeight: 600,
                                    opacity: submittingDue ? 0.7 : 1
                                }}
                            >
                                {submittingDue ? 'Collecting...' : 'COLLECT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
