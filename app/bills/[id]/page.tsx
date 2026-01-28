'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
}

export default function ViewBillPage() {
    const params = useParams();
    const [bill, setBill] = useState<BillDetail | null>(null);
    const [loading, setLoading] = useState(true);

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
                            <span className={styles.value}>Initial</span>
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
                    <button className={`${styles.btn} ${styles.btnGreen}`}>PRINT</button>
                    <button className={`${styles.btn} ${styles.btnGreen}`}>PRINT BARCODE</button>
                    <button className={`${styles.btn} ${styles.btnBlue}`}>VIEW REPORT</button>
                    <button className={`${styles.btn} ${styles.btnBlue}`}>PRINT SETTINGS</button>
                    <button className={`${styles.btn} ${styles.btnGreen}`}>SEND WHATSAPP</button>
                    <button className={`${styles.btn} ${styles.btnBlue}`}>MORE</button>
                </div>

            </div>

            <Link href="/bills" className={styles.backBtn}>
                GO TO BILLS LIST
            </Link>

        </div>
    );
}
