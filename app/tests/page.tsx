'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import styles from './page.module.css';

interface Department {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
}

const ICONS = ['🏥', '🧬', '❤️', '🩸', '🔬', '🦴', '🧠', '🦷', '👶', '🦠'];

export default function TestsPage() {
    const [searchVal, setSearchVal] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formIcon, setFormIcon] = useState(ICONS[0]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const data = await api.get('/api/v1/departments');
            if (data.success) {
                setDepartments(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormName('');
        setFormIcon(ICONS[0]);
        setShowModal(true);
    };

    const openEditModal = (dept: Department, e: React.MouseEvent) => {
        e.preventDefault();
        setIsEditing(true);
        setCurrentId(dept._id);
        setFormName(dept.name);
        setFormIcon(dept.icon || ICONS[0]);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formName.trim()) {
            toast.error('Department name is required');
            return;
        }
        setSubmitting(true);
        
        try {
            const url = isEditing 
                ? `/api/v1/departments/${currentId}` 
                : '/api/v1/departments';
            
            let data;
            if (isEditing) {
                data = await api.put(url, { name: formName, icon: formIcon });
            } else {
                data = await api.post(url, { name: formName, icon: formIcon });
            }
            
            if (data.success) {
                if (isEditing) {
                    setDepartments(departments.map(d => d._id === currentId ? data.data : d));
                    toast.success('Department updated successfully');
                } else {
                    setDepartments([data.data, ...departments]);
                    toast.success('Department created successfully');
                }
                setShowModal(false);
            } else {
                toast.error(data.error || 'Failed to save department');
            }
        } catch (error: any) {
            console.error('Failed to save department', error);
            const msg = error.message || 'An error occurred while saving';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 600 }}>Are you sure you want to delete this department?</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            padding: '6px 12px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const data = await api.delete(`/api/v1/departments/${id}`);
                                if (data.success) {
                                    setDepartments(prev => prev.filter(d => d._id !== id));
                                    toast.success('Department deleted successfully');
                                } else {
                                    toast.error(data.error || 'Failed to delete');
                                }
                            } catch (error: any) {
                                console.error('Failed to delete department', error);
                                toast.error(error.message || 'An error occurred while deleting');
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                border: '1px solid #e2e8f0',
                padding: '16px',
                color: '#1e293b',
            },
        });
    };

    const filteredDepts = departments.filter(d => 
        d.name.toLowerCase().includes(searchVal.toLowerCase())
    );

    return (
        <div style={{ padding: '20px', background: 'linear-gradient(135deg,#eaf6ff,#f7fbff)', minHeight: 'calc(100vh - 60px)' }}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>All Departments</div>
                    
                    <div className={styles.actions}>
                        <div className={styles.searchBox}>
                            <input 
                                type="text" 
                                placeholder="Search departments..." 
                                value={searchVal}
                                onChange={(e) => setSearchVal(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={openCreateModal}
                            style={{
                                padding: '10px 16px',
                                background: '#3f51b5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                boxShadow: '0 4px 6px rgba(63, 81, 181, 0.2)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            + Add Department
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className={styles.list}>
                        {filteredDepts.map((d) => (
                            <Link href={`/tests/${d._id}`} key={d._id}>
                                <div className={styles.listItem} style={{ alignItems: 'center', gap: '15px' }}>
                                    <div style={{ 
                                        fontSize: '24px', 
                                        background: '#f0f4ff', 
                                        width: '45px', 
                                        height: '45px', 
                                        borderRadius: '10px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        {d.icon || '🏥'}
                                    </div>
                                    <span style={{ 
                                        flex: 1, 
                                        fontWeight: 600, 
                                        color: '#1e293b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginRight: '10px'
                                    }}>
                                        {d.name}
                                    </span>
                                    
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button 
                                            onClick={(e) => openEditModal(d, e)}
                                            style={{
                                                background: '#eff6ff',
                                                color: '#3b82f6',
                                                border: '1px solid #dbeafe',
                                                borderRadius: '6px',
                                                width: '30px',
                                                height: '30px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px'
                                            }}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(d._id, e)}
                                            style={{
                                                background: '#fff1f2',
                                                color: '#f43f5e',
                                                border: '1px solid #ffe4e6',
                                                borderRadius: '6px',
                                                width: '30px',
                                                height: '30px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px'
                                            }}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '16px',
                        width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a' }}>
                            {isEditing ? 'Edit Department' : 'Add New Department'}
                        </h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Icon</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormIcon(icon)}
                                        style={{
                                            fontSize: '20px',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            border: formIcon === icon ? '2px solid #3f51b5' : '1px solid #e2e8f0',
                                            background: formIcon === icon ? '#eef2ff' : 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Name</label>
                            <input
                                type="text"
                                placeholder="Department Name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '16px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{
                                    padding: '8px 16px',
                                    background: '#3f51b5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
