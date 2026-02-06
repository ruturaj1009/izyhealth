'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { ReportStatus } from '@/enums/report';

interface Report {
    _id: string;
    // reportId: string;
    date: string;
    patient: { firstName: string; lastName: string; phone: string; age: number; gender: string };
    doctor: { firstName: string; lastName: string; title: string };
    status: string;
}

const statusMap: Record<string, string> = {
    [ReportStatus.INITIAL]: 'Initial',
    [ReportStatus.IN_PROGRESS]: 'In Process',
    [ReportStatus.PENDING]: 'In Process', // Legacy
    [ReportStatus.COMPLETED]: 'Completed',
    [ReportStatus.VERIFIED]: 'Verified',
    [ReportStatus.PRINTED]: 'Printed',
    [ReportStatus.DELIVERED]: 'Delivered'
};

export default function ReportsPage() {
    const [searchVal, setSearchVal] = useState('');
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const limit = 10;

    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'numeric', // 29/1/2026 format in screenshot
            day: 'numeric'
        });
    };

    return (
        <div style={{ padding: '20px', background: 'linear-gradient(135deg,#e3f2fd,#f7fbff)', minHeight: 'calc(100vh - 60px)' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Reports</h2>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative' }}>
                            <input 
                                value={searchVal}
                                onChange={(e) => setSearchVal(e.target.value)}
                                placeholder="Search"
                                style={{ 
                                    padding: '10px 15px', 
                                    borderRadius: '6px', 
                                    border: '1px solid #e2e8f0', 
                                    outline: 'none',
                                    width: '250px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        
                        {/* Search Button */}
                        <button 
                            onClick={handleSearch}
                            style={{ 
                                background: '#1565c0', // Darker blue from screenshot
                                color: 'white', 
                                padding: '10px 20px', 
                                borderRadius: '6px', 
                                border: 'none', 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                fontSize: '13px',
                                letterSpacing: '0.5px'
                            }}
                        >
                            SEARCH
                        </button>

                        {/* Download Buttons (Placeholders) */}
                        <button style={{ background: '#1565c0', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </button>
                        <button style={{ background: '#1565c0', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </button>

                        {/* Date Picker */}
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    // Optionally trigger fetch here too
                                }}
                                style={{ 
                                    padding: '9px 15px', 
                                    borderRadius: '6px', 
                                    border: '1px solid #e2e8f0', 
                                    outline: 'none', 
                                    color: '#334155',
                                    fontSize: '14px',
                                    background: 'white'
                                }}
                            />
                            {/* Label overlay trick or just placeholder? Native date picker is fine. */}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Report Date</th>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Report ID</th>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Patient Name</th>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Age</th>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Phone</th>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Doctor</th>
                                <th style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{textAlign:'center', padding: '40px', color: '#64748b'}}>Loading reports...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={7} style={{textAlign:'center', padding: '40px', color: '#64748b'}}>No reports found</td></tr>
                            ) : (
                                reports.map((rpt) => (
                                    <tr 
                                        key={rpt._id} 
                                        style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155', cursor: 'pointer' }}
                                        onClick={() => window.location.href = `/reports/${rpt._id}`}
                                    >
                                        <td style={{ padding: '20px 15px' }}>{formatDate(rpt.date)}</td>
                                        <td style={{ padding: '20px 15px' }}>
                                            <span style={{fontFamily:'monospace', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px'}}>
                                                #{rpt._id.substring(rpt._id.length - 6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                                <span style={{ fontWeight: 500 }}>{rpt.patient?.firstName} {rpt.patient?.lastName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 15px' }}>{rpt.patient?.age} Years</td>
                                        <td style={{ padding: '20px 15px' }}>{rpt.patient?.phone}</td>
                                        <td style={{ padding: '20px 15px' }}>
                                            {rpt.doctor?.firstName === 'SELF' ? 'Self' : `Dr. ${rpt.doctor?.firstName} ${rpt.doctor?.lastName}`}
                                        </td>
                                        <td style={{ padding: '20px 15px' }}>
                                            <span style={{ 
                                                padding: '8px 20px', 
                                                borderRadius: '20px', 
                                                fontSize: '12px', 
                                                fontWeight: 500,
                                                background: rpt.status === 'COMPLETED' || rpt.status === 'VERIFIED' || rpt.status === 'PRINTED' || rpt.status === 'DELIVERED' ? '#2e7d32' : 
                                                            rpt.status === 'IN_PROGRESS' ? '#ef6c00' : 
                                                            '#64748b', // Grey for Initial
                                                color: 'white',
                                                display: 'inline-block',
                                                minWidth: '80px',
                                                textAlign: 'center'
                                            }}>
                                                {statusMap[rpt.status] || rpt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                    <span>
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalReports)} of {totalReports} entries
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
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                            disabled={currentPage === 1}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            ‹
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
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
