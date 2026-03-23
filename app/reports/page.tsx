'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { checkPermission } from '@/lib/permissions';
import { ReportStatus } from '@/enums/report';
import Preloader from '@/app/components/Preloader';
import styles from './page.module.css';

interface Report {
    _id: string;
    date: string;
    patient: { firstName: string; lastName: string; phone: string; age: number; gender: string };
    doctor: { firstName: string; lastName: string; title: string };
    status: string;
}

const statusMap: Record<string, string> = {
    [ReportStatus.INITIAL]: 'Initial',
    [ReportStatus.IN_PROGRESS]: 'In Process',
    [ReportStatus.PENDING]: 'In Process',
    [ReportStatus.COMPLETED]: 'Completed',
    [ReportStatus.VERIFIED]: 'Verified',
    [ReportStatus.PRINTED]: 'Printed',
    [ReportStatus.DELIVERED]: 'Delivered'
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'COMPLETED': return styles.statusCompleted;
        case 'VERIFIED': return styles.statusVerified;
        case 'PRINTED': return styles.statusPrinted;
        case 'DELIVERED': return styles.statusDelivered;
        case 'IN_PROGRESS': return styles.statusInProgress;
        default: return styles.statusInitial;
    }
};

export default function ReportsPage() {
    const [searchVal, setSearchVal] = useState('');
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const limit = 10;

    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        setMounted(true);
        fetchReports(currentPage, selectedDate);
    }, [currentPage, selectedDate]); 

    const handleSearch = () => {
        setCurrentPage(1);
        fetchReports(1, selectedDate);
    };

    async function fetchReports(page: number, date: string) {
        setLoading(true);
        try {
            let url = `/api/v1/reports?page=${page}&limit=${limit}`;
            if (date) url += `&date=${date}`;
            if (searchVal) url += `&search=${searchVal}`;
            
            const data = await api.get(url);
            if (data.status === 200) {
                setReports(data.data);
                if (data.metadata) {
                    setTotalPages(data.metadata.totalPages);
                    setTotalReports(data.metadata.total);
                }
            }
        } catch (err) {
            // console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Header Section */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Reports</h2>
                    <div className={styles.actions}>
                        <input 
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            placeholder="Search"
                            className={styles.searchInput}
                        />
                        <button onClick={handleSearch} className={styles.btn}>SEARCH</button>
                        {/* <button className={styles.iconBtn}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </button>
                        <button className={styles.iconBtn}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </button> */}
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={styles.dateInput}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Report Date</th>
                                <th>Report ID</th>
                                <th>Patient Name</th>
                                <th>Age</th>
                                <th>Phone</th>
                                <th>Doctor</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{padding: '0px'}}><Preloader text="Fetching Reports..." /></td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={7} style={{textAlign:'center', padding: '40px', color: '#64748b'}}>No reports found</td></tr>
                            ) : (
                                reports.map((rpt) => (
                                    <tr 
                                        key={rpt._id} 
                                        onClick={() => window.location.href = `/reports/${rpt._id}`}
                                    >
                                        <td data-label="Date">{formatDate(rpt.date)}</td>
                                        <td data-label="Report ID">
                                            <span className={styles.idBadge}>
                                                #{rpt._id.substring(rpt._id.length - 6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td data-label="Patient">
                                            <div className={styles.patientCell}>
                                                <div className={styles.patientDot}></div>
                                                <span className={styles.patientName}>{rpt.patient?.firstName} {rpt.patient?.lastName}</span>
                                            </div>
                                        </td>
                                        <td data-label="Age">{rpt.patient?.age} Years</td>
                                        <td data-label="Phone">{rpt.patient?.phone}</td>
                                        <td data-label="Doctor">
                                            {rpt.doctor?.firstName === 'SELF' ? 'Self' : `Dr. ${rpt.doctor?.firstName} ${rpt.doctor?.lastName}`}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`${styles.statusBadge} ${getStatusClass(rpt.status)}`}>
                                                {statusMap[rpt.status] || rpt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className={styles.footer}>
                    <span>
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalReports)} of {totalReports} entries
                    </span>
                    <div className={styles.paginationGroup}>
                        <button 
                            onClick={() => setCurrentPage(1)} 
                            disabled={currentPage === 1}
                            className={styles.paginationBtn}
                        >«</button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                            disabled={currentPage === 1}
                            className={styles.paginationBtn}
                        >‹</button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                            disabled={currentPage === totalPages}
                            className={styles.paginationBtn}
                        >›</button>
                        <button 
                            onClick={() => setCurrentPage(totalPages)} 
                            disabled={currentPage === totalPages}
                            className={styles.paginationBtn}
                        >»</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
