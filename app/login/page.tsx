'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: credentialResponse.credential })
            });
            
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 404) {
                    // Account not found -> Redirect to Signup
                    // We can pass the token to signup to auto-fill?
                    // For now, just error or better, redirect
                    setError(data.error); 
                    // Optional: router.push(`/signup?googleToken=${credentialResponse.credential}`)
                    return; 
                }
                throw new Error(data.error || 'Google Login failed');
            }

            // Success
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
        } finally {
            setLoading(false);
        }
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

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store tokens in localStorage (access token)
            // Refresh token is handled via HttpOnly cookie by backend
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.title}>Welcome Back</h2>
                    <p className={styles.subtitle}>
                        Sign in to <strong>X-Pharma</strong> or{' '}
                        <Link href="/signup" className={styles.link}>
                            create an organization
                        </Link>
                    </p>
                </div>
                
                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && (
                        <div className={styles.errorBox}>
                           {error}
                        </div>
                    )}
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className={styles.input}
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={styles.input}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    
                    <div className={styles.divider}>
                        <span>OR</span>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                                setError('Google Login Failed');
                            }}
                        />
                    </div>

                    <div style={{textAlign: 'center', marginTop: '1rem'}}>
                         <p style={{fontSize: '0.85rem', color: '#666'}}>
                            Forgot password? <a href="#" className={styles.link}>Contact Admin</a>
                         </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
