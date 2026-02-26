'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import SettingsModal from './components/SettingsModal';
import styles from "./dashboard.module.css";
import { api } from '@/lib/api-client';

export default function Home() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [statsData, setStatsData] = useState({
    totalBills: 0,
    totalPaymentReceived: 0,
    totalPatients: 0,
    totalReportsDelivered: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const json = await api.get('/stats/today');
        if (json.status === 200) {
          setStatsData(json.data);
        }
      } catch (err) {
// console.error('Failed to fetch stats:', err);
      }
    }
    fetchStats();
    setMounted(true);
  }, []);

  const stats = [
    { label: "Today's Bills", value: statsData.totalBills, icon: "fa-file-invoice", color: "iconBlue" },
    { label: "Today's Revenue", value: `₹${statsData.totalPaymentReceived.toLocaleString()}`, icon: "fa-indian-rupee-sign", color: "iconOrange" },
    { label: "New Patients", value: statsData.totalPatients, icon: "fa-users", color: "iconPurple" },
    { label: "Delivered Reports", value: statsData.totalReportsDelivered, icon: "fa-truck-fast", color: "iconGreen" },
  ];

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Izy Health Dashboard</h1>
          <p>Seamlessly managing your laboratory operations with precision.</p>
        </div>
      </section>

      <div className={styles.statsContainer}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[stat.color]}`}>
              <i className={`fa ${stat.icon}`}></i>
            </div>
            <div className={styles.statInfo}>
              <h3>{stat.label}</h3>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.centerAction}>
        <Link href="/bills/create">
            <button className={styles.actionBtn}>
              <i className="fa fa-plus-circle"></i> CREATE NEW LAB BILL
            </button>
        </Link>
      </div>

      <section className={styles.grid}>
        <Link href="/bills" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-receipt"></i>
            </div>
            <span className={styles.label}>All Bills</span>
        </Link>
        
        <Link href="/reports" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                <i className="fa fa-file-waveform"></i>
            </div>
            <span className={styles.label}>Lab Reports</span>
        </Link>

        <Link href="/patients" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <i className="fa fa-hospital-user"></i>
            </div>
            <span className={styles.label}>Patient Records</span>
        </Link>

        <Link href="/doctors" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-user-md"></i>
            </div>
            <span className={styles.label}>Doctor List</span>
        </Link>

        <Link href="/tests" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                <i className="fa fa-microscope"></i>
            </div>
            <span className={styles.label}>Test Catalog</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <i className="fa fa-cubes"></i>
            </div>
            <span className={styles.label}>Test Packages</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                <i className="fa fa-list-check"></i>
            </div>
            <span className={styles.label}>Rate List</span>
        </Link>

        <Link href="/analytics" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <i className="fa fa-chart-pie"></i>
            </div>
            <span className={styles.label}>Analytics</span>
        </Link>

        <button onClick={() => setShowSettingsModal(true)} className={styles.card} style={{border:'1px solid #f1f5f9', background:'#fff', cursor:'pointer'}}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-sliders"></i>
            </div>
            <span className={styles.label}>Lab Settings</span>
        </button>

        {mounted && localStorage.getItem('role') === 'ADMIN' && (
            <Link href="/administration" className={styles.card}>
                <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
                    <i className="fa fa-user-shield"></i>
                </div>
                <span className={styles.label}>Administration</span>
            </Link>
        )}

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <i className="fa fa-bolt-lightning"></i>
            </div>
            <span className={styles.label}>Quick Recharge</span>
        </Link>

         {/* <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
                <i className="fa fa-play-circle"></i>
            </div>
            <span className={styles.label}>Tutorials</span>
        </Link> */}

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <i className="fa fa-gift"></i>
            </div>
            <span className={styles.label}>Referrals</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <i className="fa fa-compass"></i>
            </div>
            <span className={styles.label}>Take a Tour</span>
        </Link>

        <Link href="#" className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <i className="fa fa-comment-dots"></i>
            </div>
            <span className={styles.label}>Send Feedback</span>
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
