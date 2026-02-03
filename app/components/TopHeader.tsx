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
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load data from localStorage on mount
        const storedLabName = localStorage.getItem('labName');
        const storedUser = localStorage.getItem('user');
        
        if (storedLabName) {
            setLabName(storedLabName);
        }
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }

        // Close menu when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
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
            console.error('Logout failed', error);
        }
    };

    const userInitials = user 
        ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() 
        : 'U';
    
    const userName = user 
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
        : 'User';

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <div 
                    onMouseEnter={onMenuHover} 
                    onClick={onMenuClick}
                    style={{display:'flex', alignItems:'center', cursor: 'pointer'}}
                >
                    <i className={`fa fa-bars ${styles.menuBtn}`}></i>
                </div>
                <Link href="/" className={styles.title} style={{marginLeft:'15px', textDecoration:'none', color:'inherit'}}>
                    X Pharma | {labName}
                </Link>
            </div>

            <div className={styles.right}>
                <div className={styles.searchBar}>
                    <i className="fa fa-magnifying-glass" style={{opacity:0.7}}></i>
                    <input type="text" placeholder="Search Bills | Reports" />
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
                            </div>
                            <div className={styles.menuDivider}></div>
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
