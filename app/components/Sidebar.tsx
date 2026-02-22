'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface Props {
    isOpen: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export default function Sidebar({ isOpen, onMouseEnter, onMouseLeave }: Props) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleMenu = (key: string) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isActive = (path: string) => pathname === path;

    return (
        <aside 
            className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Action Button */}
            <div className={styles.createBtnWrapper}>
                <Link href="/bills/create" className={styles.createBtn}>
                    <i className="fa fa-bolt"></i> CREATE LAB BILL
                </Link>
            </div>

            <nav className={styles.nav}>
                <Link href="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
                    <div className={styles.navItemLeft}><i className={`fa fa-house ${styles.navIcon}`}></i> Home</div>
                </Link>

                <div className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-rocket ${styles.navIcon}`}></i> Getting Started</div>
                </div>

                <Link href="/bills" className={`${styles.navItem} ${isActive('/bills') ? styles.active : ''}`}>
                    <div className={styles.navItemLeft}><i className={`fa fa-file-invoice ${styles.navIcon}`}></i> Lab Bills</div>
                </Link>

                <div className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-file-lines ${styles.navIcon}`}></i> Lab Reports</div>
                </div>

                <div className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-magnifying-glass ${styles.navIcon}`}></i> Search Bills</div>
                </div>

                {/* DROPDOWN: Lab */}
                <div onClick={() => toggleMenu('lab')} className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-flask ${styles.navIcon}`}></i> Lab</div>
                    <i className={`fa ${openMenus['lab'] ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{fontSize:12}}></i>
                </div>
                <div className={`${styles.submenu} ${openMenus['lab'] ? styles.open : ''}`}>
                    <Link href="/tests" className={styles.submenuItem}>Tests & Departments</Link>
                    <Link href="/doctors" className={styles.submenuItem}>Doctors</Link>
                    <Link href="/patients" className={styles.submenuItem}>Patients</Link>
                </div>

                {/* DROPDOWN: Business */}
                <div onClick={() => toggleMenu('business')} className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-chart-column ${styles.navIcon}`}></i> Business Analysis</div>
                    <i className={`fa ${openMenus['business'] ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{fontSize:12}}></i>
                </div>
                <div className={`${styles.submenu} ${openMenus['business'] ? styles.open : ''}`}>
                    <Link href="/analytics" className={styles.submenuItem}>Overview Dashboard</Link>
                </div>

                {/* Settings & Admin */}
                <div className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-print ${styles.navIcon}`}></i> Print Settings</div>
                    <i className="fa fa-chevron-down" style={{fontSize:12}}></i>
                </div>
                <div className={styles.navItem}>
                    <div className={styles.navItemLeft}><i className={`fa fa-gear ${styles.navIcon}`}></i> General Settings</div>
                    <i className="fa fa-chevron-down" style={{fontSize:12}}></i>
                </div>
                {mounted && localStorage.getItem('role') === 'ADMIN' && (
                    <Link href="/administration" className={`${styles.navItem} ${isActive('/administration') ? styles.active : ''}`}>
                        <div className={styles.navItemLeft}><i className={`fa fa-shield-halved ${styles.navIcon}`}></i> Administration</div>
                    </Link>
                )}

                <div style={{marginTop:'auto'}}>
                   <div className={styles.navItem}>
                        <div className={styles.navItemLeft}><i className={`fa fa-gift ${styles.navIcon}`} style={{color:'orange'}}></i> Refer & Earn</div>
                    </div> 
                   <div className={styles.navItem}>
                        <div className={styles.navItemLeft}><i className={`fa fa-circle-question ${styles.navIcon}`} style={{color:'red'}}></i> Help</div>
                    </div> 
                </div>

            </nav>
        </aside>
    );
}
