'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { BillReceipt } from '../../../components/BillReceipt';

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
    reportMongoId?: string;
}

export default function PatientBillViewPage() {
    const params = useParams();
    const [bill, setBill] = useState<BillDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Bill-${bill?._id || 'Receipt'}`,
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <div style={{ fontSize: '18px', color: '#64748b' }}>Loading bill...</div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <div style={{ fontSize: '18px', color: '#64748b' }}>Bill not found</div>
            </div>
        );
    }

    const grandTotal = bill.totalAmount - bill.discountAmount;

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

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>Bill Receipt</h1>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Patient Portal - View Only</p>
            </div>

            {/* Bill Info Card */}
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Patient Name</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {bill.patient.title} {bill.patient.firstName} {bill.patient.lastName}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Age / Gender</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {bill.patient.age} Years / {bill.patient.gender}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Referred By</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {bill.doctor.firstName === 'SELF' ? 'Self' : `Dr. ${bill.doctor.firstName} ${bill.doctor.lastName}`}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Bill Date</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                                {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tests Table */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                        Tests
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Sl.</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Test Name</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.tests.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 8px', fontSize: '14px', color: '#64748b' }}>{index + 1}</td>
                                    <td style={{ padding: '12px 8px', fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{item.test.name}</td>
                                    <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>₹{item.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Payment Summary */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '15px' }}>Payment Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Total Amount</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>₹{bill.totalAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Discount</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>- ₹{bill.discountAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #e2e8f0' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Grand Total</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>₹{grandTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Paid Amount</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>₹{bill.paidAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Due Amount</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: bill.dueAmount > 0 ? '#dc2626' : '#16a34a' }}>
                                ₹{bill.dueAmount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={() => handlePrint()} style={actionBtnStyle('#1565c0')}>
                        Print Bill
                    </button>
                    {bill.reportMongoId && (
                        <Link href={`/reports/${bill.reportMongoId}/view`} style={actionBtnStyle('#2e7d32')}>
                            View Report
                        </Link>
                    )}
                </div>
            </div>

            {/* Hidden Print Component */}
            <div style={{ display: 'none' }}>
                {bill && <BillReceipt ref={componentRef} bill={bill} showWatermark={true} />}
            </div>
        </div>
    );
}
