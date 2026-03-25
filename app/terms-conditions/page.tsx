import React from 'react';
import Link from 'next/link';
import styles from '../static.module.css';

export default function TermsConditionsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.orb1}></div>
                <div className={styles.orb2}></div>
                <h1 className={styles.heroTitle}>Terms and Conditions</h1>
                <p className={styles.heroSubtitle}>Last updated: March 2026</p>
            </div>
            
            <div className={styles.contentWrapper}>
                <Link href="/login" className={styles.backLink}>
                    <i className="fa fa-arrow-left"></i> Back to Login
                </Link>
                
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Agreement to Terms</h2>
                    <p className={styles.text}>These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and IzyHealth concerning your access to and use of the platform. You agree that by accessing the site, you have read, understood, and agree to be bound by all of these Terms and Conditions.</p>
                </section>
                
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Intellectual Property Rights</h2>
                    <p className={styles.text}>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site and the trademarks, service marks, and logos contained therein are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. User Representations</h2>
                    <p className={styles.text}>By using the Site, you represent and warrant that: all registration information you submit will be true, accurate, current, and complete; you will maintain the accuracy of such information and promptly update such registration information as necessary.</p>
                </section>
            </div>
        </div>
    );
}
