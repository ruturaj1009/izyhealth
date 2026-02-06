'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import styles from './page.module.css';
import toast from 'react-hot-toast';

export default function CreatePatientPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: 'Mr.',
        firstName: '',
        lastName: '',
        gender: 'Male',
        bloodGroup: '',
        age: 0,
        email: '',
        mobile: '',
        address: '',
    });

    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? Number(value) : value 
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const newErrors: Record<string, boolean> = {};
        if (!formData.firstName.trim()) newErrors.firstName = true;
        // Optional validations: only validate format if value is present
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = true;
        if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) newErrors.mobile = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            const data = await api.post('/users', { ...formData, role: 'PATIENT' });
            if (data.status === 201) {
                toast.success('Patient Created Successfully');
                router.push('/patients');
            } else {
                toast.error(data.error || 'Failed to create patient');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create patient');
        }
    };

    return (
        <div style={{ padding: '20px', background: '#f5f7fb', height: '100%' }}>
            <div className={styles.container}>
                <form onSubmit={handleSubmit}>
                    <h3 className={styles.h3}>Basic Details</h3>
                    <div className={styles.basicGrid}>
                        <div className={styles.field}>
                            <label>Title</label>
                            <select name="title" value={formData.title} onChange={handleChange}>
                                <option>Mr.</option>
                                <option>Mrs.</option>
                                <option>Ms.</option>
                                <option>Dr.</option>
                                <option>Prof.</option>
                                <option>Master</option>
                                <option>Miss</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>First Name *</label>
                            <input 
                                name="firstName" 
                                type="text" 
                                required 
                                value={formData.firstName}
                                onChange={handleChange}
                                className={errors.firstName ? styles.invalid : ''}
                            />
                            {errors.firstName && <span className={styles.error} style={{display:'block'}}>First name is required</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Last Name</label>
                            <input name="lastName" type="text" value={formData.lastName} onChange={handleChange} />
                        </div>

                        <div className={styles.field}>
                            <label>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option>Male</option><option>Female</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>Blood Group</label>
                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                                <option value="">Select</option>
                                <option>A+</option><option>A-</option>
                                <option>B+</option><option>B-</option>
                                <option>O+</option><option>O-</option>
                                <option>AB+</option><option>AB-</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>Age</label>
                            <input name="age" type="number" value={formData.age} onChange={handleChange} />
                        </div>
                    </div>

                    <h3 className={styles.h3}>Contact Details</h3>
                    <div className={styles.contactGrid}>
                        <div className={styles.field}>
                            <label>Email</label>
                            <input 
                                name="email" 
                                type="text" 
                                placeholder="E-mail"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? styles.invalid : ''}
                            />
                            {errors.email && <span className={styles.error} style={{display:'block'}}>Enter a valid email address</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Phone</label>
                            <input 
                                name="mobile" 
                                type="text" 
                                placeholder="Phone"
                                value={formData.mobile}
                                onChange={handleChange}
                                className={errors.mobile ? styles.invalid : ''}
                            />
                            {errors.mobile && <span className={styles.error} style={{display:'block'}}>Enter a valid 10-digit phone number</span>}
                        </div>

                        <div className={`${styles.field} ${styles.fullWidth}`}>
                            <label>Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange}></textarea>
                        </div>

                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={`${styles.btn} ${styles.cancel}`} onClick={() => router.back()}>CANCEL</button>
                        <button type="submit" className={`${styles.btn} ${styles.create}`}>CREATE</button>
                    </div>

                </form>
            </div>
        </div>
    );
}
