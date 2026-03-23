'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { checkPermission } from '@/lib/permissions';
import styles from './page.module.css';
import Preloader from '@/app/components/Preloader';

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
    const [mounted, setMounted] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBills, setTotalBills] = useState(0);
    const limit = 10;

    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        setMounted(true);
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
            // console.error(err);
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
        <div className={styles.pageWrapper}>
            <div className={styles.cardBox}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Bills</h2>
                    <div className={styles.actions}>
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <input 
                            id="searchInput" 
                            placeholder="Search Bills..."
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                        />
                        {mounted && checkPermission('bill', 'create') && (
                            <Link href="/bills/create" className={styles.btnPrimary}>+ Create Bill</Link>
                        )}
                    </div>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Bill ID</th>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Total (₹)</th>
                                <th>Due (₹)</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{padding: '0px'}}><Preloader text="Loading bills..." /></td></tr>
                            ) : filteredBills.length === 0 ? (
                                <tr><td colSpan={7} style={{textAlign:'center', padding: '30px', color: '#64748b'}}>No bills found</td></tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr 
                                        key={bill._id} 
                                        onClick={() => window.location.href = `/bills/${bill._id}`}
                                    >
                                        <td data-label="Date">{formatDate(bill.createdAt)}</td>
                                        <td data-label="Bill ID">
                                            <span className={styles.idBadge}>{bill._id.substring(bill._id.length - 6).toUpperCase()}</span>
                                        </td>
                                        <td data-label="Patient">
                                            <div>
                                                <span className={styles.patientName}>{bill.patient?.firstName} {bill.patient?.lastName}</span>
                                                <div className={styles.patientPhone}>{bill.patient?.mobile}</div>
                                            </div>
                                        </td>
                                        <td data-label="Doctor">
                                            {bill.doctor?.firstName === 'SELF' ? 'Self' : `Dr. ${bill.doctor?.firstName} ${bill.doctor?.lastName}`}
                                        </td>
                                        <td data-label="Total (₹)"><span className={styles.amountBold}>{bill.totalAmount}</span></td>
                                        <td data-label="Due (₹)">
                                            <span className={bill.dueAmount > 0 ? styles.dueDanger : styles.dueSafe}>{bill.dueAmount}</span>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`${styles.statusBadge} ${
                                                bill.status === 'PAID' ? styles.statusPaid : 
                                                bill.status === 'PARTIAL' ? styles.statusPartial : 
                                                styles.statusUnpaid
                                            }`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.footer}>
                    <span>
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalBills)} of {totalBills} entries
                    </span>
                    <div className={styles.paginationGroup}>
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={styles.paginationBtn}>«</button>
                        <button onClick={handlePrev} disabled={currentPage === 1} className={styles.paginationBtn}>‹</button>
                        <button onClick={handleNext} disabled={currentPage === totalPages} className={styles.paginationBtn}>›</button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={styles.paginationBtn}>»</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
