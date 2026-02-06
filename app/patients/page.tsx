'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import styles from './page.module.css';

interface Patient {
    _id?: string;
    firstName: string;
    lastName?: string;
    gender?: string;
    age?: number;
    mobile?: string;
    email?: string;
}

export default function PatientsPage() {
    const [searchVal, setSearchVal] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);
    const limit = 10;

    useEffect(() => {
        fetchPatients(currentPage);
    }, [currentPage]);

    async function fetchPatients(page: number) {
        setLoading(true);
        try {
            const data = await api.get(`/users?role=PATIENT&page=${page}&limit=${limit}`);
            if (data.status === 200) {
                setPatients(data.data);
                if (data.metadata?.pagination) {
                    setTotalPages(data.metadata.pagination.totalPages);
                    setTotalPatients(data.metadata.pagination.total);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredPatients = patients.filter(p => {
        const fullVal = searchVal.toLowerCase();
        const name = `${p.firstName} ${p.lastName || ''}`.toLowerCase();
        const phone = p.mobile || '';
        return name.includes(fullVal) || phone.includes(fullVal);
    });

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    return (
        <div style={{ padding: '20px', background: 'linear-gradient(135deg,#e3f2fd,#f7fbff)', minHeight: 'calc(100vh - 60px)' }}>
            <div className={styles.box}>
                <div className={styles.header}>
                    <h2>Patients</h2>

                    <div className={styles.actions}>
                        <input 
                            id="searchInput" 
                            placeholder="Search patients..."
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                        />
                        <Link href="/patients/create" className={styles.btn}>+ Add Patient</Link>
                        <button className={`${styles.outline} ${styles.icon}`} onClick={() => alert('Download clicked')}>⬇</button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Age</th>
                                <th>Phone</th>
                                <th>Email</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{textAlign:'center', padding: '30px'}}>Loading patients...</td></tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr><td colSpan={6} style={{textAlign:'center', padding: '30px'}}>No patients found</td></tr>
                            ) : (
                                filteredPatients.map((patient, i) => (
                                    <tr key={patient._id || i}>
                                        <td data-label="ID">
                                            <span style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontFamily:'monospace'}}>
                                                {patient._id ? patient._id.slice(-6).toUpperCase() : '-'}
                                            </span>
                                        </td>
                                        <td data-label="Name" style={{fontWeight:'bold'}}>
                                            {patient.firstName} {patient.lastName}
                                        </td>
                                        <td data-label="Gender">{patient.gender || '-'}</td>
                                        <td data-label="Age">{patient.age}</td>
                                        <td data-label="Phone">{patient.mobile || '-'}</td>
                                        <td data-label="Email">{patient.email || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.footer}>
                    <span style={{fontSize: '14px'}}>
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalPatients)} of {totalPatients} entries
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
