'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import styles from './signup.module.css';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Step 1: Initial (False), Step 2: Google Token Received (True)
    const [isGoogleSignup, setIsGoogleSignup] = useState(false);
    const [googleToken, setGoogleToken] = useState('');

    const [formData, setFormData] = useState({
        organizationName: '',
        email: '',
        address: '',
        phone: ''
    });

    const handleGoogleSuccess = (credentialResponse: any) => {
        try {
            const token = credentialResponse.credential;
            const decoded: any = jwtDecode(token);
            
            setGoogleToken(token);
            setIsGoogleSignup(true);
            
            // Pre-fill email and maybe suggest Org Name?
            setFormData(prev => ({
                ...prev,
                email: decoded.email,
                organizationName: decoded.name ? `${decoded.given_name}'s Clinic` : ''
            }));
            
            toast.success('Google verification successful. Please complete your profile.');

        } catch (error) {
// console.error('Google Decode Error', error);
            toast.error('Failed to verify Google Token');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = { ...formData, googleIdToken: googleToken || undefined };

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            let data: any = {};
            try {
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    data = JSON.parse(text);
                }
            } catch (e) {
// console.error('Failed to parse registration JSON:', e);
            }

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Success Toast
            toast.success('Signup successful! Please wait for 24hrs for account Activation.', {
                duration: 5000,
                icon: '⏳'
            });

            // Delay redirect to let user read the message
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 3000);

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.splitLayout}>
                {/* Left Side: Impact & Branding */}
                <div className={styles.visualSide}>
                    <div className={styles.visualContent}>
                        <div className={styles.brandBadge}>Join IzyHealth</div>
                        <h1 className={styles.heroTitle}>Empower Your <br/> Laboratory</h1>
                        <p className={styles.heroDescription}>
                            Join hundreds of clinics optimizing their diagnostics workflow with IzyHealth.
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>⚡</div>
                                <div>
                                    <h4 className={styles.featureName}>Instant Setup</h4>
                                    <p className={styles.featureText}>Get your lab digitized in under 5 minutes.</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>📊</div>
                                <div>
                                    <h4 className={styles.featureName}>Advanced Analytics</h4>
                                    <p className={styles.featureText}>Gain insights into your lab's performance.</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.visualGraphics}>
                            <div className={styles.orb1}></div>
                            <div className={styles.orb2}></div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className={styles.formSide}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.title}>
                                {isGoogleSignup ? 'Complete Profile' : 'Create Organization'}
                            </h2>
                            <p className={styles.subtitle}>
                                {isGoogleSignup 
                                    ? 'Just a few more details to set up your account.'
                                    : <>
                                        Already have an account?{' '}
                                        <Link href="/login" className={styles.link}>
                                            Sign in
                                        </Link>
                                      </>
                                }
                            </p>
                        </div>
                        
                        {!isGoogleSignup && (
                            <div style={{marginBottom: '2rem'}}>
                                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1.5rem'}}>
                                    <div className={styles.googleBtnWrapper}>
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => toast.error('Google Signup Failed')}
                                            text="signup_with"
                                            width="100%"
                                        />
                                    </div>
                                </div>
                                <div className={styles.divider}>
                                    <span>OR REGISTER MANUALLY</span>
                                </div>
                            </div>
                        )}
                        
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="org-name" className={styles.label}>Organization Name</label>
                                <input
                                    id="org-name"
                                    name="organizationName"
                                    type="text"
                                    required
                                    className={styles.input}
                                    placeholder="My Clinic"
                                    value={formData.organizationName}
                                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.label}>Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    disabled={isGoogleSignup} 
                                    className={styles.input}
                                    placeholder="admin@myclinic.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={isGoogleSignup ? {backgroundColor: '#f1f5f9', cursor: 'not-allowed'} : {}}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="phone" className={styles.label}>Phone Number</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    className={styles.input}
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="address" className={styles.label}>Organization Address</label>
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    required
                                    className={styles.input}
                                    placeholder="123 Health St, City"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.button}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className={styles.footerNote}>
                                <p>Your account will be pending admin approval.</p>
                                {!isGoogleSignup && <p>Default password will be sent to your email.</p>}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
