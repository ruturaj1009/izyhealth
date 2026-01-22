'use client';
import Link from 'next/link';
import styles from './TopHeader.module.css';

interface Props {
    onMenuClick: () => void;
    onMenuHover: () => void;
}

export default function TopHeader({ onMenuClick, onMenuHover }: Props) {
    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <div 
                    onMouseEnter={onMenuHover} 
                    onClick={onMenuClick}
                    style={{display:'flex', alignItems:'center'}}
                >
                    <i className={`fa fa-bars ${styles.menuBtn}`}></i>
                </div>
                <Link href="/" className={styles.title} style={{marginLeft:'15px', textDecoration:'none', color:'inherit'}}>
                    X Pharma | Rutu Dev Lab
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

                <div className={`${styles.iconBtn} ${styles.userProfile}`}>
                    <i className="fa fa-user"></i>
                </div>
            </div>
        </header>
    );
}
