import React from 'react';
import Link from 'next/link';
import styles from '../static.module.css';

export default function PrivacyPolicyPage() {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.orb1}></div>
                <div className={styles.orb2}></div>
                <h1 className={styles.heroTitle}>Privacy Policy</h1>
                <p className={styles.heroSubtitle}>Last updated: March 2026</p>
            </div>
            
            <div className={styles.contentWrapper}>
                <Link href="/login" className={styles.backLink}>
                    <i className="fa fa-arrow-left"></i> Back to Login
                </Link>
                
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Introduction</h2>
                    <p className={styles.text}>Welcome to IzyHealth. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
                </section>
                
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Data We Collect</h2>
                    <p className={styles.text}>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                    <ul className={styles.list}>
                        <li><span className={styles.strong}>Identity Data</span> includes first name, last name, username or similar identifier.</li>
                        <li><span className={styles.strong}>Contact Data</span> includes billing address, email address and telephone numbers.</li>
                        <li><span className={styles.strong}>Technical Data</span> includes internet protocol (IP) address, your login data, browser type and version.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. How We Use Your Data</h2>
                    <p className={styles.text}>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances: Where we need to perform the contract we are about to enter into or have entered into with you; Where it is necessary for our legitimate interests; Where we need to comply with a legal obligation.</p>
                </section>
            </div>
        </div>
    );
}
