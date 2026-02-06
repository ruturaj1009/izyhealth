'use client';
import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import SettingsModal from './components/SettingsModal';
import styles from "./dashboard.module.css";

export default function Home() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <h1>Good Morning</h1>
      </section>

      <div className={styles.centerAction}>
        <Link href="/bills/create">
            <button className={styles.actionBtn}>
            <i className="fa fa-bolt" style={{color:'#ffeb3b'}}></i> CREATE LAB BILL
            </button>
        </Link>
      </div>

      <section className={styles.grid}>
        
        <Link href="/bills" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-file-invoice"></i>
            </div>
            <span className={styles.label}>Bills</span>
        </Link>
        
        <Link href="/reports" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                <i className="fa fa-file-lines"></i>
            </div>
            <span className={styles.label}>Reports</span>
        </Link>

        <Link href="/patients" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <i className="fa fa-users"></i>
            </div>
            <span className={styles.label}>Patients</span>
        </Link>

        <Link href="/doctors" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-user-doctor"></i>
            </div>
            <span className={styles.label}>Doctors</span>
        </Link>

        <Link href="/tests" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                <i className="fa fa-flask"></i>
            </div>
            <span className={styles.label}>Tests</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <i className="fa fa-cart-shopping"></i>
            </div>
            <span className={styles.label}>Test Package</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                <i className="fa fa-list"></i>
            </div>
            <span className={styles.label}>Test Rate List</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <i className="fa fa-chart-line"></i>
            </div>
            <span className={styles.label}>Business Analysis</span>
        </Link>

        <button onClick={() => setShowSettingsModal(true)} className={styles.card} style={{border:'none', background:'transparent', cursor:'pointer'}}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-gear"></i>
            </div>
            <span className={styles.label}>Settings</span>
        </button>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
                <i className="fa fa-shield-halved"></i>
            </div>
            <span className={styles.label}>Admin</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <i className="fa fa-indian-rupee-sign"></i>
            </div>
            <span className={styles.label}>Recharges</span>
        </Link>

         <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
                <i className="fa fa-circle-question"></i>
            </div>
            <span className={styles.label}>Help Videos</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <i className="fa fa-wallet"></i>
            </div>
            <span className={styles.label}>Refer & Earn</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-arrow-pointer"></i>
            </div>
            <span className={styles.label}>Product Tour</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <i className="fa fa-thumbs-up"></i>
            </div>
            <span className={styles.label}>Feedback</span>
        </Link>

      </section>

      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      <Script 
        src="https://www.noupe.com/embed/019c24e615be76c4aaa9459c86b9b02887b3.js" 
        strategy="lazyOnload" 
      />
    </>
  );
}
