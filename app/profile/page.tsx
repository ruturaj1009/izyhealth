'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from './profile.module.css';
import Preloader from '@/app/components/Preloader';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        profileImage: '',
        email: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    profileImage: userData.profileImage || '',
                    email: userData.email || ''
                });
            } catch (e) {
// console.error('Failed to parse user data');
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error('File size should be less than 2MB');
            return;
        }

        setLoading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const orgid = localStorage.getItem('orgid');

            const response = await fetch('/api/v1/settings/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-org-id': orgid || ''
                },
                body: uploadFormData
            });

            const result = await response.json();
            if (response.ok) {
                setFormData(prev => ({ ...prev, profileImage: result.data.url }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error(result.error || 'Upload failed');
            }
        } catch (error) {
// console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const orgid = localStorage.getItem('orgid');

            const response = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-org-id': orgid || ''
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    profileImage: formData.profileImage
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Update local storage
                const updatedUser = { ...user, ...result.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                toast.success('Profile updated successfully');
                
                // Trigger a refresh for other tabs
                window.dispatchEvent(new Event('storage'));
                // Trigger a refresh for current tab
                window.dispatchEvent(new Event('user-updated'));
            } else {
                toast.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
// console.error('Update error:', error);
            toast.error('Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <Preloader fullPage text="Loading Profile..." />;


    const initials = `${formData.firstName?.charAt(0) || ''}${formData.lastName?.charAt(0) || ''}`.toUpperCase();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>My Profile</h1>
                    <p>Manage your account information and preferences</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.profileSection}>
                        <div className={styles.avatarWrapper}>
                            {formData.profileImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={formData.profileImage} alt="Profile" className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {initials || 'U'}
                                </div>
                            )}
                            <button 
                                type="button" 
                                className={styles.uploadBtn} 
                                onClick={handleUploadClick}
                                disabled={loading}
                                title="Change photo"
                            >
                                <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                        </div>
                        <p className={styles.label} style={{marginTop: '0.5rem'}}>Profile Picture</p>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>First Name</label>
                            <input 
                                type="text" 
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter first name"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input 
                                type="text" 
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter last name"
                            />
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Email Address</label>
                            <input 
                                type="email" 
                                value={formData.email}
                                className={styles.input}
                                disabled
                                title="Email cannot be changed"
                            />
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Account Role</label>
                            <div className={styles.roleDisplay}>
                                {user?.role === 'ADMIN' ? 'Administrator (Lab Owner)' : `Staff Member - ${user?.staffRoleName || 'General Staff'}`}
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button 
                            type="button" 
                            className={styles.cancelBtn}
                            onClick={() => router.back()}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className={styles.saveBtn}
                            disabled={saving}
                        >
                            {saving && <i className="fa fa-spinner fa-spin"></i>}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
