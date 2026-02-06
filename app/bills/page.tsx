'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import styles from './page.module.css';

interface Bill {
    _id: string;
    patient: { firstName: string; lastName: string; mobile: string };
    doctor: { firstName: string; lastName: string };
    totalAmount: number;
    discountAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    createdAt: string;
}

export default function BillsPage() {
    const [searchVal, setSearchVal] = useState('');
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBills, setTotalBills] = useState(0);
    const limit = 10;

    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        fetchBills(currentPage, selectedDate);
    }, [currentPage, selectedDate]);

    async function fetchBills(page: number, date: string) {
        setLoading(true);
        try {
            let url = `/api/v1/bills?page=${page}&limit=${limit}`;
            if (date) url += `&date=${date}`;
            
            const data = await api.get(url);
            if (data.status === 200) {
                setBills(data.data);
                if (data.metadata?.pagination) {
                    setTotalPages(data.metadata.pagination.totalPages);
                    setTotalBills(data.metadata.pagination.total);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // ... (rest of search filter logic)
    const filteredBills = bills.filter(b => {
        const fullVal = searchVal.toLowerCase();
        const pName = `${b.patient?.firstName} ${b.patient?.lastName}`.toLowerCase();
        const dName = `${b.doctor?.firstName} ${b.doctor?.lastName}`.toLowerCase();
        const id = b._id.toLowerCase();
        return pName.includes(fullVal) || dName.includes(fullVal) || id.includes(fullVal);
    });

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div style={{ padding: '20px', background: 'linear-gradient(135deg,#e3f2fd,#f7fbff)', minHeight: 'calc(100vh - 60px)' }}>
            <div className={styles.box} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
                <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>Bills</h2>

                    <div className={styles.actions} style={{ display: 'flex', gap: '15px' }}>
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on filter change
                            }}
                            style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                        />
                        <input 
                            id="searchInput" 
                            placeholder="Search Bills..."
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                        />
                        <Link href="/bills/create" style={{ background: '#3b82f6', color: 'white', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>+ Create Bill</Link>
                    </div>
                </div>

                <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
                    <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '13px', textAlign: 'left' }}>
                                <th style={{ padding: '12px 15px' }}>Date</th>
                                <th style={{ padding: '12px 15px' }}>Bill ID</th>
                                <th style={{ padding: '12px 15px' }}>Patient</th>
                                <th style={{ padding: '12px 15px' }}>Doctor</th>
                                <th style={{ padding: '12px 15px' }}>Total (₹)</th>
                                <th style={{ padding: '12px 15px' }}>Due (₹)</th>
                                <th style={{ padding: '12px 15px' }}>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{textAlign:'center', padding: '30px', color: '#64748b'}}>Loading bills...</td></tr>
                            ) : filteredBills.length === 0 ? (
                                <tr><td colSpan={7} style={{textAlign:'center', padding: '30px', color: '#64748b'}}>No bills found</td></tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr 
                                        key={bill._id} 
                                        style={{ borderBottom: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', cursor: 'pointer' }}
                                        onClick={() => window.location.href = `/bills/${bill._id}`}
                                    >
                                        <td style={{ padding: '15px' }}>{formatDate(bill.createdAt)}</td>
                                        <td style={{ padding: '15px', fontFamily: 'monospace', color: '#64748b' }}>{bill._id.substring(bill._id.length - 6).toUpperCase()}</td>
                                        <td style={{ padding: '15px', fontWeight: 600 }}>
                                            {bill.patient?.firstName} {bill.patient?.lastName}
                                            <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>{bill.patient?.mobile}</div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            {bill.doctor?.firstName === 'SELF' ? 'Self' : `Dr. ${bill.doctor?.firstName} ${bill.doctor?.lastName}`}
                                        </td>
                                        <td style={{ padding: '15px', fontWeight: 600 }}>{bill.totalAmount}</td>
                                        <td style={{ padding: '15px', color: bill.dueAmount > 0 ? '#ef4444' : '#16a34a' }}>{bill.dueAmount}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '20px', 
                                                fontSize: '11px', 
                                                fontWeight: 600,
                                                background: bill.status === 'PAID' ? '#dcfce7' : bill.status === 'PARTIAL' ? '#fef9c3' : '#fee2e2',
                                                color: bill.status === 'PAID' ? '#166534' : bill.status === 'PARTIAL' ? '#854d0e' : '#991b1b'
                                            }}>
                                                {bill.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.footer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                    <span>
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalBills)} of {totalBills} entries
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setCurrentPage(1)} 
                            disabled={currentPage === 1}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            «
                        </button>
                        <button 
                            onClick={handlePrev} 
                            disabled={currentPage === 1}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            ‹
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={currentPage === totalPages}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            ›
                        </button>
                        <button 
                            onClick={() => setCurrentPage(totalPages)} 
                            disabled={currentPage === totalPages}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
