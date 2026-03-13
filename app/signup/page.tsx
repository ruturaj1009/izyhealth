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
        password: '',
        address: '',
        phone: ''
    });

    const [showPassword, setShowPassword] = useState(false);

    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');

    const countries = [
        { code: '+91', flag: '🇮🇳', name: 'India', digits: 10 },
        { code: '+1', flag: '🇺🇸', name: 'USA', digits: 10 },
        { code: '+44', flag: '🇬🇧', name: 'UK', digits: 10 },
        { code: '+61', flag: '🇦🇺', name: 'Australia', digits: 9 },
        { code: '+971', flag: '🇦🇪', name: 'UAE', digits: 9 },
        { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', digits: 9 },
        { code: '+65', flag: '🇸🇬', name: 'Singapore', digits: 8 },
        { code: '+49', flag: '🇩🇪', name: 'Germany', digits: 11 },
        { code: '+33', flag: '🇫🇷', name: 'France', digits: 9 },
        { code: '+81', flag: '🇯🇵', name: 'Japan', digits: 10 },
        { code: '+86', flag: '🇨🇳', name: 'China', digits: 11 },
        { code: '+55', flag: '🇧🇷', name: 'Brazil', digits: 11 },
        { code: '+27', flag: '🇿🇦', name: 'South Africa', digits: 9 },
        { code: '+234', flag: '🇳🇬', name: 'Nigeria', digits: 10 },
        { code: '+254', flag: '🇰🇪', name: 'Kenya', digits: 9 },
        { code: '+60', flag: '🇲🇾', name: 'Malaysia', digits: 9 },
        { code: '+63', flag: '🇵🇭', name: 'Philippines', digits: 10 },
        { code: '+82', flag: '🇰🇷', name: 'South Korea', digits: 10 },
        { code: '+39', flag: '🇮🇹', name: 'Italy', digits: 10 },
        { code: '+34', flag: '🇪🇸', name: 'Spain', digits: 9 },
    ];

    const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

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
            const payload = { ...formData, phone: `${countryCode}${phoneNumber}`, googleIdToken: googleToken || undefined };

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
                            <div style={{marginBottom: '1rem'}}>
                                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
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
                            <div className={styles.formRow}>
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
                                    <label htmlFor="password" className={styles.label}>Password</label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className={styles.input}
                                            placeholder="Min 8 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            style={{ paddingRight: '44px' }}
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            className={styles.eyeBtn}
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formRow}>
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
                                    <label htmlFor="address" className={styles.label}>Organization Address</label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        required
                                        className={styles.input}
                                        placeholder="Bhubaneswar, Odisha"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="phone" className={styles.label}>Phone Number</label>
                                <div className={styles.phoneWrapper}>
                                    <select
                                        className={styles.countrySelect}
                                        value={countryCode}
                                        onChange={(e) => { setCountryCode(e.target.value); setPhoneNumber(''); }}
                                    >
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code} title={c.name}>{c.code} {c.flag}</option>
                                        ))}
                                    </select>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        className={styles.phoneInput}
                                        placeholder={`${'0'.repeat(selectedCountry.digits)}`}
                                        value={phoneNumber}
                                        maxLength={selectedCountry.digits}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= selectedCountry.digits) setPhoneNumber(val);
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: phoneNumber.length === selectedCountry.digits ? '#16a34a' : '#ef4444', textAlign: 'right', display: 'block' }}>
                                    {phoneNumber.length}/{selectedCountry.digits} digits
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.button}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className={styles.footerNote}>
                                <p><i className="fa fa-info-circle" style={{ marginRight: '6px', color: '#3b82f6' }}></i>Your account will be pending admin approval.</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
