import React from 'react';
import Link from 'next/link';
import styles from '../static.module.css';

export default function AboutPage() {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.orb1}></div>
                <div className={styles.orb2}></div>
                <h1 className={styles.heroTitle}>About IzyHealth</h1>
                <p className={styles.heroSubtitle}>Empowering modern pathology laboratories worldwide.</p>
            </div>
            
            <div className={styles.contentWrapper}>
                <Link href="/login" className={styles.backLink}>
                    <i className="fa fa-arrow-left"></i> Back to Login
                </Link>
                
                <section className={styles.section}>
                    <p className={styles.text} style={{ fontSize: '1.15rem' }}>
                        IzyHealth is a comprehensive Laboratory Information Management System (LIMS) designed to streamline and automate pathology lab workflows. Our platform empowers clinics and diagnostic centers to manage their daily operations efficiently, from billing and patient registration to sample tracking and report generation.
                    </p>
                </section>
                
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Mission</h2>
                    <p className={styles.text}>
                        To revolutionize healthcare diagnostics by providing an intuitive, cloud-based platform that reduces administrative overhead, minimizes errors, and ensures seamless communication between laboratories, doctors, and patients.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Key Features</h2>
                    <ul className={styles.list}>
                        <li><span className={styles.strong}>Smart Billing</span> and customizable Invoice Printing.</li>
                        <li><span className={styles.strong}>Automated Reports</span> with instant PDF generation and digital delivery.</li>
                        <li><span className={styles.strong}>Role-Based Access</span> for Admins, Staff, and Pathologists.</li>
                        <li><span className={styles.strong}>Real-time Dashboard</span> with daily financial and diagnostic analytics.</li>
                        <li><span className={styles.strong}>Cloud Security</span> ensuring patient data is always encrypted and backed up.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
