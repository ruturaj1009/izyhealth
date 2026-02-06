'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import styles from './page.module.css';

interface Doctor {
    _id?: string;
    firstName: string;
    lastName?: string;
    gender?: string;
    mobile?: string;
    email?: string;
}

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchVal, setSearchVal] = useState('');
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const limit = 10;

    useEffect(() => {
        fetchDoctors(currentPage);
    }, [currentPage]);

    async function fetchDoctors(page: number) {
        setLoading(true);
        try {
            const data = await api.get(`/users?role=DOCTOR&page=${page}&limit=${limit}`);
            if (data.status === 200) {
                setDoctors(data.data);
                if (data.metadata?.pagination) {
                    setTotalPages(data.metadata.pagination.totalPages);
                    setTotalDoctors(data.metadata.pagination.total);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredDoctors = doctors.filter(p => {
        const name = `${p.firstName} ${p.lastName || ''}`.toLowerCase();
        return name.includes(searchVal.toLowerCase());
    });

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    return (
        <div style={{ padding: '20px', background: 'linear-gradient(135deg,#e3f2fd,#f1f8ff)', minHeight: 'calc(100vh - 60px)' }}>
            <div className={styles.box}>
                <div className={styles.header}>
                    <h2>Doctors</h2>
                    <div className={styles.actions}>
                        <input 
                            type="text" 
                            placeholder="Search doctors..." 
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                        />
                        <Link href="/doctors/create" className={styles.btn} style={{ padding: '0 16px' }}>+ Add Doctor</Link>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Full Name</th>
                                <th>Gender</th>
                                <th>Phone</th>
                                <th>Email</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{textAlign:'center', padding: '30px'}}>Loading doctors...</td></tr>
                            ) : filteredDoctors.length === 0 ? (
                                <tr><td colSpan={5} style={{textAlign:'center', padding: '30px'}}>No doctors found</td></tr>
                            ) : (
                                filteredDoctors.map((doc, i) => (
                                    <tr key={doc._id || i}>
                                        <td data-label="ID">
                                            <span style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontFamily:'monospace'}}>
                                                {doc._id ? doc._id.slice(-6).toUpperCase() : '-'}
                                            </span>
                                        </td>
                                        <td data-label="Full Name" style={{fontWeight:'bold'}}>{doc.firstName} {doc.lastName}</td>
                                        <td data-label="Gender">{doc.gender || '—'}</td>
                                        <td data-label="Phone">{doc.mobile || '—'}</td>
                                        <td data-label="Email">{doc.email || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.footer}>
                    <span style={{fontSize: '14px'}}>
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalDoctors)} of {totalDoctors} entries
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setCurrentPage(1)} 
                            disabled={currentPage === 1}
                            className={styles.paginationBtn}
                            title="First Page"
                        >
                            «
                        </button>
                        <button 
                            onClick={handlePrev} 
                            disabled={currentPage === 1}
                            className={styles.paginationBtn}
                            title="Previous Page"
                        >
                            ‹
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={currentPage === totalPages}
                            className={styles.paginationBtn}
                            title="Next Page"
                        >
                            ›
                        </button>
                        <button 
                            onClick={() => setCurrentPage(totalPages)} 
                            disabled={currentPage === totalPages}
                            className={styles.paginationBtn}
                            title="Last Page"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
