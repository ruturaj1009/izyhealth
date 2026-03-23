'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface Props {
    isOpen: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onMouseEnter, onMouseLeave, onClose }: Props) {
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
        <>
            {/* Backdrop overlay */}
            <div 
                className={`${styles.backdrop} ${isOpen ? styles.visible : ''}`} 
                onClick={onClose || onMouseLeave}
            />

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
                    {/* Main Section */}
                    <div className={styles.sectionLabel}>Menu</div>

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

                    <div className={styles.divider}></div>

                    {/* Lab Section */}
                    <div className={styles.sectionLabel}>Workspace</div>

                    <div onClick={() => toggleMenu('lab')} className={styles.navItem}>
                        <div className={styles.navItemLeft}><i className={`fa fa-flask ${styles.navIcon}`}></i> Lab</div>
                        <i className={`fa fa-chevron-down ${styles.chevron} ${openMenus['lab'] ? styles.chevronOpen : ''}`}></i>
                    </div>
                    <div className={`${styles.submenu} ${openMenus['lab'] ? styles.open : ''}`}>
                        <Link href="/tests" className={styles.submenuItem}>Tests & Departments</Link>
                        <Link href="/doctors" className={styles.submenuItem}>Doctors</Link>
                        <Link href="/patients" className={styles.submenuItem}>Patients</Link>
                    </div>

                    <div onClick={() => toggleMenu('business')} className={styles.navItem}>
                        <div className={styles.navItemLeft}><i className={`fa fa-chart-column ${styles.navIcon}`}></i> Business Analysis</div>
                        <i className={`fa fa-chevron-down ${styles.chevron} ${openMenus['business'] ? styles.chevronOpen : ''}`}></i>
                    </div>
                    <div className={`${styles.submenu} ${openMenus['business'] ? styles.open : ''}`}>
                        <Link href="/analytics" className={styles.submenuItem}>Overview Dashboard</Link>
                    </div>

                    <div className={styles.divider}></div>

                    {/* Settings Section */}
                    <div className={styles.sectionLabel}>Settings</div>

                    <div onClick={() => toggleMenu('print')} className={styles.navItem}>
                        <div className={styles.navItemLeft}><i className={`fa fa-print ${styles.navIcon}`}></i> Print Settings</div>
                        <i className={`fa fa-chevron-down ${styles.chevron} ${openMenus['print'] ? styles.chevronOpen : ''}`}></i>
                    </div>
                    <div className={`${styles.submenu} ${openMenus['print'] ? styles.open : ''}`}>
                        <Link href="/settings/bill-print" className={styles.submenuItem}>Bill Print</Link>
                        <Link href="/settings/report-print" className={styles.submenuItem}>Report Print</Link>
                    </div>

                    <div onClick={() => toggleMenu('general')} className={styles.navItem}>
                        <div className={styles.navItemLeft}><i className={`fa fa-gear ${styles.navIcon}`}></i> General Settings</div>
                        <i className={`fa fa-chevron-down ${styles.chevron} ${openMenus['general'] ? styles.chevronOpen : ''}`}></i>
                    </div>
                    <div className={`${styles.submenu} ${openMenus['general'] ? styles.open : ''}`}>
                        <Link href="/settings" className={styles.submenuItem}>Preferences</Link>
                    </div>

                    {mounted && localStorage.getItem('role') === 'ADMIN' && (
                        <Link href="/administration" className={`${styles.navItem} ${isActive('/administration') ? styles.active : ''}`}>
                            <div className={styles.navItemLeft}><i className={`fa fa-shield-halved ${styles.navIcon}`}></i> Administration</div>
                        </Link>
                    )}

                    {/* Bottom Section */}
                    <div className={styles.bottomSection}>
                        <div className={styles.navItem}>
                            <div className={styles.navItemLeft}><i className={`fa fa-gift ${styles.navIcon} ${styles.iconRefer}`}></i> Refer & Earn</div>
                        </div>
                        <div className={styles.navItem}>
                            <div className={styles.navItemLeft}><i className={`fa fa-circle-question ${styles.navIcon} ${styles.iconHelp}`}></i> Help</div>
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}
