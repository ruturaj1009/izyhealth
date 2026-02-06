'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import styles from './page.module.css';
import toast from 'react-hot-toast';

export default function CreateDoctorPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        title: 'Dr.',
        age: '',
        gender: 'Male',
        isOrganisation: false,
        email: '',
        mobile: '',
        address: '',
        hospitalName: '',
        revenueSharing: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'checkbox') {
             const checked = (e.target as HTMLInputElement).checked;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'age' || name === 'revenueSharing') {
             setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Prepare payload
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = { ...formData, role: 'DOCTOR' };

            // Handle numeric fields safely
            if (payload.age !== '') payload.age = Number(payload.age);
            
            // Handle optional organisation fields
            if (!payload.isOrganisation) {
                delete payload.hospitalName;
                delete payload.revenueSharing;
            } else {
                if (payload.revenueSharing !== '') payload.revenueSharing = Number(payload.revenueSharing);
            }

            // Remove empty strings for optional fields to match schema expectations if needed
            // But Zod optional() handles undefined, not empty string for numbers.

            const data = await api.post('/users', payload);
            if (data.status === 201 || data.data) {
                toast.success('Doctor Created Successfully');
                router.push('/doctors');
            } else {
                toast.error(data.error || 'Failed to create doctor');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to create doctor');
        }
    };

    return (
        <div style={{ padding: '20px', background: '#eaf6ff', minHeight: 'calc(100vh - 60px)' }}>
            <div className={styles.formBox}>
                <form onSubmit={handleSubmit}>
                    {/* BASIC DETAILS */}
                    <div className={styles.section}>
                        <h3>Basic Details</h3>

                        <div className={styles.row}>
                            <select name="title" value={formData.title} onChange={handleChange} style={{ width: '80px', marginRight: '10px' }}>
                                <option>Dr.</option>
                                <option>Mr.</option>
                                <option>Mrs.</option>
                                <option>Ms.</option>
                            </select>
                            <div className={styles.inputWrapper}>
                                <input 
                                    name="firstName" 
                                    type="text" 
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <span className={styles.requiredStar}>*</span>
                            </div>
                            <input 
                                name="lastName" 
                                type="text" 
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <input 
                                    name="age" 
                                    type="number" 
                                    placeholder="Age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    required
                                />
                                <span className={styles.requiredStar}>*</span>
                            </div>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div className={styles.checkbox}>
                            <input 
                                name="isOrganisation" 
                                type="checkbox" 
                                checked={formData.isOrganisation}
                                onChange={handleChange}
                            />
                            <label>This is a Organisation like Clinic, Hospital, etc.</label>
                        </div>
                    </div>

                    {/* CONTACT DETAILS */}
                    <div className={styles.section}>
                        <h3>Contact Details</h3>

                        <div className={styles.row}>
                            <input 
                                name="email" 
                                type="email" 
                                placeholder="E-mail"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <input 
                                name="mobile" 
                                type="text" 
                                placeholder="Phone"
                                value={formData.mobile}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.row}>
                            <textarea 
                                name="address" 
                                placeholder="Address"
                                value={formData.address}
                                onChange={handleChange}
                            ></textarea>
                        </div>


                        {formData.isOrganisation && (
                            <div className={styles.row}>
                                <div className={styles.inputWrapper}>
                                    <input 
                                        name="hospitalName" 
                                        type="text" 
                                        placeholder="Hospital Name"
                                        value={formData.hospitalName}
                                        onChange={handleChange}
                                        required={formData.isOrganisation}
                                    />
                                    <span className={styles.requiredStar}>*</span>
                                </div>
                                <div className={styles.inputWrapper}>
                                    <input 
                                        name="revenueSharing" 
                                        type="number" 
                                        placeholder="Revenue Sharing (%)"
                                        value={formData.revenueSharing}
                                        onChange={handleChange}
                                        required={formData.isOrganisation}
                                        min="0"
                                        max="100"
                                    />
                                    <span className={styles.requiredStar}>*</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BUTTON LINKS */}
                    <div className={styles.buttons}>
                        <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={() => router.back()}>CANCEL</button>
                        <button type="submit" className={`${styles.btn} ${styles.btnCreate}`}>CREATE</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
