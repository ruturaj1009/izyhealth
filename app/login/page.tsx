'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import styles from './login.module.css';

type FpStep = 'email' | 'otp' | 'password';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    // Forgot Password State
    const [fpOpen, setFpOpen] = useState(false);
    const [fpStep, setFpStep] = useState<FpStep>('email');
    const [fpEmail, setFpEmail] = useState('');
    const [fpOtp, setFpOtp] = useState(['', '', '', '', '', '']);
    const [fpPassword, setFpPassword] = useState('');
    const [fpConfirm, setFpConfirm] = useState('');
    const [fpLoading, setFpLoading] = useState(false);
    const [fpMsg, setFpMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    const openFp = () => {
        setFpOpen(true); setFpStep('email'); setFpMsg(null);
        setFpEmail(''); setFpOtp(['','','','','','']); setFpPassword(''); setFpConfirm('');
    };
    const closeFp = () => setFpOpen(false);

    const handleOtpInput = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...fpOtp];
        next[idx] = val;
        setFpOtp(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };
    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !fpOtp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };

    const handleSendOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setFpLoading(true); setFpMsg(null);
        try {
            const res = await fetch('/api/auth/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fpEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFpStep('otp');
            setFpMsg({ type: 'success', text: 'OTP sent! Check your inbox.' });
        } catch (err: any) {
            setFpMsg({ type: 'error', text: err.message });
        } finally { setFpLoading(false); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = fpOtp.join('');
        if (otp.length < 6) { setFpMsg({ type: 'error', text: 'Please enter all 6 digits.' }); return; }
        setFpStep('password'); setFpMsg(null);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fpPassword !== fpConfirm) { setFpMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
        setFpLoading(true); setFpMsg(null);
        try {
            const res = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fpEmail, otp: fpOtp.join(''), newPassword: fpPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFpMsg({ type: 'success', text: data.message });
            setTimeout(() => closeFp(), 2500);
        } catch (err: any) {
            setFpMsg({ type: 'error', text: err.message });
            setFpStep('otp');
        } finally { setFpLoading(false); }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: credentialResponse.credential })
            });
            const text = await res.text();
            let data: any = {};
            try {
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    data = JSON.parse(text);
                }
            } catch (e) {}

            if (!res.ok) {
                if (res.status === 404) { setError(data.error); return; }
                throw new Error(data.error || 'Google Login failed');
            }

            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('orgid', data.orgid);
                localStorage.setItem('role', data.role);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('labName', data.labName);
            }
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const text = await res.text();
            let data: any = {};
            try {
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    data = JSON.parse(text);
                }
            } catch (e) {}

            if (!res.ok) { throw new Error(data.error || 'Login failed'); }

            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('orgid', data.orgid);
                localStorage.setItem('role', data.role);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('labName', data.labName);
            }
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const fpStepIndex = (s: FpStep) => (['email','otp','password'] as FpStep[]).indexOf(s);

    return (
        <div className={styles.container}>
            <div className={styles.splitLayout}>
                {/* Left Side */}
                <div className={styles.visualSide}>
                    <div className={styles.visualContent}>
                        <div className={styles.brandBadge}>IzyHealth</div>
                        <h1 className={styles.heroTitle}>Smart Pathology <br/>Management</h1>
                        <p className={styles.heroDescription}>
                            Experience the future of laboratory diagnostics with our precision-driven platform.
                        </p>
                        <div className={styles.visualGraphics}>
                            <div className={styles.orb1}></div>
                            <div className={styles.orb2}></div>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className={styles.formSide}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.title}>Welcome Back</h2>
                            <p className={styles.subtitle}>
                                New to IzyHealth?{' '}
                                <Link href="/signup" className={styles.link}>Create organization</Link>
                            </p>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            {error && <div className={styles.errorBox}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.label}>Email Address</label>
                                <input id="email" name="email" type="email" required className={styles.input}
                                    placeholder="name@company.com" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="password" className={styles.label}>Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                                        required className={styles.input} placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{ paddingRight: '44px' }} />
                                    <button type="button" className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? 'Hide password' : 'Show password'}>
                                        <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className={styles.button}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>

                            <div className={styles.divider}><span>OR CONTINUE WITH</span></div>

                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => { console.log('Login Failed'); setError('Google Login Failed'); }}
                                />
                            </div>

                            <div className={styles.footerLinks}>
                                <p>
                                    <button type="button" onClick={openFp} className={styles.forgotLink}>
                                        Forgot password?
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* ── Forgot Password Modal ───────────────────────────────── */}
            {fpOpen && (
                <div className={styles.fpOverlay} onClick={closeFp}>
                    <div className={styles.fpModal} onClick={e => e.stopPropagation()}>

                        {/* Header + step dots */}
                        <div className={styles.fpHeader}>
                            <div>
                                <h3 className={styles.fpTitle}>
                                    {fpStep === 'email' && 'Forgot Password'}
                                    {fpStep === 'otp' && 'Enter OTP'}
                                    {fpStep === 'password' && 'New Password'}
                                </h3>
                                <div className={styles.fpSteps}>
                                    {(['email','otp','password'] as FpStep[]).map((s, i) => (
                                        <div key={s} className={`${styles.fpDot}
                                            ${fpStep === s ? styles.fpDotActive : ''}
                                            ${fpStepIndex(fpStep) > i ? styles.fpDotDone : ''}`} />
                                    ))}
                                </div>
                            </div>
                            <button className={styles.fpClose} onClick={closeFp}>✕</button>
                        </div>

                        {/* Alert message */}
                        {fpMsg && (
                            <div className={fpMsg.type === 'error' ? styles.fpError : styles.fpSuccess}>
                                {fpMsg.type === 'error' ? '⚠ ' : '✓ '}{fpMsg.text}
                            </div>
                        )}

                        {/* Step 1 — Email */}
                        {fpStep === 'email' && (
                            <form onSubmit={handleSendOtp} className={styles.fpForm}>
                                <p className={styles.fpHint}>Enter your account email and we'll send a 6-digit OTP.</p>
                                <input type="email" required placeholder="name@company.com"
                                    className={styles.fpInput} value={fpEmail}
                                    onChange={e => setFpEmail(e.target.value)} />
                                <button type="submit" className={styles.fpBtn} disabled={fpLoading}>
                                    {fpLoading ? 'Sending...' : 'Send OTP →'}
                                </button>
                            </form>
                        )}

                        {/* Step 2 — OTP */}
                        {fpStep === 'otp' && (
                            <form onSubmit={handleVerifyOtp} className={styles.fpForm}>
                                <p className={styles.fpHint}>
                                    OTP sent to <strong>{fpEmail}</strong>. Valid for 10 minutes.
                                </p>
                                <div className={styles.otpRow}>
                                    {fpOtp.map((d, i) => (
                                        <input key={i}
                                            ref={el => { otpRefs.current[i] = el; }}
                                            type="text" inputMode="numeric" maxLength={1}
                                            className={styles.otpBox} value={d}
                                            onChange={e => handleOtpInput(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)} />
                                    ))}
                                </div>
                                <button type="submit" className={styles.fpBtn}>Verify OTP →</button>
                                <button type="button" className={styles.fpResend}
                                    onClick={() => handleSendOtp()} disabled={fpLoading}>
                                    {fpLoading ? 'Resending...' : 'Resend OTP'}
                                </button>
                            </form>
                        )}

                        {/* Step 3 — New Password */}
                        {fpStep === 'password' && (
                            <form onSubmit={handleResetPassword} className={styles.fpForm}>
                                <p className={styles.fpHint}>Choose a strong new password (min. 8 characters).</p>
                                <input type="password" required minLength={8} placeholder="New password"
                                    className={styles.fpInput} value={fpPassword}
                                    onChange={e => setFpPassword(e.target.value)} />
                                <input type="password" required minLength={8} placeholder="Confirm password"
                                    className={styles.fpInput} value={fpConfirm}
                                    onChange={e => setFpConfirm(e.target.value)} />
                                <button type="submit" className={styles.fpBtn} disabled={fpLoading}>
                                    {fpLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
