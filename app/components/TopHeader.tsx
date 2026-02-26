'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './TopHeader.module.css';

interface Props {
    onMenuClick: () => void;
    onMenuHover: () => void;
}

export default function TopHeader({ onMenuClick, onMenuHover }: Props) {
    const router = useRouter();
    const [labName, setLabName] = useState('Rutu Dev Lab');
    const [user, setUser] = useState<any>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ bills: any[], reports: any[] }>({ bills: [], reports: [] });
    const [searching, setSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Debounced Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults({ bills: [], reports: [] });
            setShowSearchResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const token = localStorage.getItem('token');
                const orgid = localStorage.getItem('orgid');

                const response = await fetch(`/api/v1/search?query=${searchQuery.trim()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-org-id': orgid || ''
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    setSearchResults(result);
                    setShowSearchResults(true);
                }
            } catch (error) {
// console.error('Search failed:', error);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        // Load data from localStorage on mount
        const loadUserData = () => {
            const storedLabName = localStorage.getItem('labName');
            const storedUser = localStorage.getItem('user');
            
            if (storedLabName) {
                setLabName(storedLabName);
            }
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
// console.error('Failed to parse user data');
                }
            }
        };

        loadUserData();
        setMounted(true);

        // Listen for user data changes (useful when profile is updated)
        window.addEventListener('storage', loadUserData);
        // Custom event for same-tab updates
        window.addEventListener('user-updated', loadUserData);

        // Close menu when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener('storage', loadUserData);
            window.removeEventListener('user-updated', loadUserData);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('orgid');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            localStorage.removeItem('labName');

            // Redirect
            router.push('/login');
        } catch (error) {
// console.error('Logout failed', error);
        }
    };

    const userInitials = user 
        ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() 
        : 'U';
    
    const userName = user 
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
        : 'User';

    const handleResultClick = (url: string) => {
        router.push(url);
        setShowSearchResults(false);
        setSearchQuery('');
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <div 
                    onMouseEnter={onMenuHover} 
                    onClick={onMenuClick}
                    className={styles.menuBtnWrapper}
                >
                    <i className={`fa fa-bars ${styles.menuBtn}`}></i>
                </div>
                <Link href="/" className={styles.title}>
                    IzyHealth | {labName}
                </Link>
            </div>

            <div className={styles.right}>
                <div className={styles.searchWrapper} ref={searchRef}>
                    <div className={styles.searchBar}>
                        <i className={`fa ${searching ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'}`} style={{opacity:0.7}}></i>
                        <input 
                            type="text" 
                            placeholder="Search Bills | Reports by ID" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                        />
                    </div>

                    {showSearchResults && (
                        <div className={styles.searchResults}>
                            {searchResults.bills.length === 0 && searchResults.reports.length === 0 ? (
                                <div className={styles.noResults}>No matches found for "{searchQuery}"</div>
                            ) : (
                                <>
                                    {searchResults.bills.length > 0 && (
                                        <div className={styles.resultSection}>
                                            <div className={styles.sectionHeader}>Bills</div>
                                            {searchResults.bills.map((bill) => (
                                                <div 
                                                    key={bill.id} 
                                                    className={styles.resultItem}
                                                    onClick={() => handleResultClick(bill.url)}
                                                >
                                                    <div className={`${styles.resultIcon} ${styles.billIcon}`}>
                                                        <i className="fa fa-file-invoice-dollar"></i>
                                                    </div>
                                                    <div className={styles.resultInfo}>
                                                        <span className={styles.resultTitle}>{bill.patientName}</span>
                                                        <span className={styles.resultMeta}>
                                                            Bill ID: <span className={styles.shortId}>#{bill.shortId}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchResults.reports.length > 0 && (
                                        <div className={styles.resultSection}>
                                            <div className={styles.sectionHeader}>Reports</div>
                                            {searchResults.reports.map((report) => (
                                                <div 
                                                    key={report.id} 
                                                    className={styles.resultItem}
                                                    onClick={() => handleResultClick(report.url)}
                                                >
                                                    <div className={`${styles.resultIcon} ${styles.reportIcon}`}>
                                                        <i className="fa fa-file-medical"></i>
                                                    </div>
                                                    <div className={styles.resultInfo}>
                                                        <span className={styles.resultTitle}>{report.patientName}</span>
                                                        <span className={styles.resultMeta}>
                                                            Report ID: <span className={styles.shortId}>#{report.shortId}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.iconBtn}>
                    <i className="fa fa-bell"></i>
                </div>

                <div className={styles.profileWrapper} ref={menuRef}>
                    <div 
                        className={`${styles.iconBtn} ${styles.userProfile}`} 
                        title={userName}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        {user?.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profileImage} alt="Profile" className={styles.profileImg} style={{width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover'}} />
                        ) : (
                            <div style={{
                                width:'32px', 
                                height:'32px', 
                                borderRadius:'50%', 
                                backgroundColor:'#4f46e5', 
                                color:'white', 
                                display:'flex', 
                                alignItems:'center', 
                                justifyContent:'center',
                                fontSize: '0.85rem',
                                fontWeight: 'bold'
                            }}>
                                {userInitials}
                            </div>
                        )}
                        <span style={{marginLeft: '8px', fontSize: '0.9rem', display: 'none', whiteSpace: 'nowrap'}}>
                            {user?.firstName}
                        </span>
                    </div>

                    {showProfileMenu && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.menuHeader}>
                                <p className={styles.menuName}>{userName}</p>
                                <p className={styles.menuEmail}>{user?.email}</p>
                                {mounted && (
                                    <div className={styles.roleBadgeContainer}>
                                        <span className={styles.roleBadge}>
                                            {(user?.role || (typeof window !== 'undefined' ? localStorage.getItem('role') : '')) === 'ADMIN' 
                                                ? 'Administrator' 
                                                : (user?.staffRoleName || 'Staff Member')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.menuDivider}></div>
                            <Link href="/profile" className={styles.menuItem} onClick={() => setShowProfileMenu(false)}>
                                <i className="fa fa-user" style={{marginRight:'8px'}}></i>
                                My Profile
                            </Link>
                            <button className={styles.menuItem} onClick={handleLogout}>
                                <i className="fa fa-sign-out-alt" style={{marginRight:'8px'}}></i>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
