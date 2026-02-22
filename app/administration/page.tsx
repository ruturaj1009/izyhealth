'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import styles from './page.module.css';
import { toast } from 'react-hot-toast';

interface Permission {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

interface StaffRole {
    _id: string;
    name: string;
    permissions: Record<string, Permission>;
}

interface Staff {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    staffRole?: StaffRole;
    isActive: boolean;
}

export default function AdministrationPage() {
    const [stats, setStats] = useState({ totalStaff: 0, totalRoles: 0, activeUsers: 0 });
    const [roles, setRoles] = useState<StaffRole[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    const initialRole = {
        name: '',
        permissions: {
            bill: { create: false, read: true, update: false, delete: false },
            report: { create: false, read: true, update: false, delete: false },
            patient: { create: false, read: true, update: false, delete: false },
            test: { create: false, read: true, update: false, delete: false },
            doctor: { create: false, read: true, update: false, delete: false },
            department: { create: false, read: true, update: false, delete: false },
        }
    };

    const [newRole, setNewRole] = useState(initialRole);

    const initialStaff = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        staffRoleId: ''
    };

    const [newStaff, setNewStaff] = useState(initialStaff);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, rolesRes, staffRes] = await Promise.all([
                api.get('/api/v1/admin/stats'),
                api.get('/api/v1/admin/roles'),
                api.get('/api/v1/admin/staff')
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (rolesRes.success) setRoles(rolesRes.data);
            if (staffRes.success) setStaff(staffRes.data);
        } catch (error) {
            toast.error('Failed to load administration data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRole = async () => {
        if (!newRole.name) return toast.error('Role name is required');
        try {
            let res;
            if (editingRole) {
                res = await api.put(`/api/v1/admin/roles/${editingRole._id}`, newRole);
            } else {
                res = await api.post('/api/v1/admin/roles', newRole);
            }

            if (res.success) {
                toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
                setShowRoleModal(false);
                setEditingRole(null);
                setNewRole(initialRole);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to save role');
        }
    };

    const handleDeleteRole = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the role "${name}"?`)) return;
        try {
            const res = await api.delete(`/api/v1/admin/roles/${id}`);
            if (res.success) {
                toast.success('Role deleted');
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete role');
        }
    };

    const handleSaveStaff = async () => {
        if (!newStaff.email || (!editingStaff && !newStaff.password) || !newStaff.firstName || !newStaff.staffRoleId) {
            return toast.error('Please fill all required fields');
        }
        try {
            let res;
            if (editingStaff) {
                // For editing, we don't send the password unless we want to support password reset here
                const { password, ...updateData } = newStaff;
                res = await api.put(`/api/v1/admin/staff/${editingStaff._id}`, { ...updateData, isActive: editingStaff.isActive });
            } else {
                res = await api.post('/api/v1/admin/staff', newStaff);
            }

            if (res.success) {
                toast.success(editingStaff ? 'Staff updated successfully' : 'Staff added successfully');
                setShowStaffModal(false);
                setEditingStaff(null);
                setNewStaff(initialStaff);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to save staff');
        }
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete staff member "${name}"?`)) return;
        try {
            const res = await api.delete(`/api/v1/admin/staff/${id}`);
            if (res.success) {
                toast.success('Staff member removed');
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete staff');
        }
    };

    const toggleStaffStatus = async (s: Staff) => {
        try {
            const res = await api.put(`/api/v1/admin/staff/${s._id}`, { isActive: !s.isActive });
            if (res.success) {
                toast.success(`Staff ${!s.isActive ? 'activated' : 'deactivated'}`);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    const openEditRole = (role: StaffRole) => {
        setEditingRole(role);
        setNewRole({
            name: role.name,
            permissions: JSON.parse(JSON.stringify(role.permissions))
        });
        setShowRoleModal(true);
    };

    const openEditStaff = (s: Staff) => {
        setEditingStaff(s);
        setNewStaff({
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            password: '', // Don't pre-fill password
            staffRoleId: s.staffRole?._id || ''
        });
        setShowStaffModal(true);
    };

    if (loading && stats.totalStaff === 0) return <div className={styles.container}>Loading Admin Dashboard...</div>;

    const entities = ['bill', 'report', 'patient', 'test', 'doctor', 'department'];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Administration</h1>
                    <p>Manage your organization staff and access levels</p>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#eef2ff', color: '#6366f1' }}>👥</div>
                    <span className={styles.statLabel}>Total Staff</span>
                    <h2 className={styles.statValue}>{stats.totalStaff}</h2>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>🛡️</div>
                    <span className={styles.statLabel}>Custom Roles</span>
                    <h2 className={styles.statValue}>{stats.totalRoles}</h2>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#f97316' }}>⚡</div>
                    <span className={styles.statLabel}>Active Logins</span>
                    <h2 className={styles.statValue}>{stats.activeUsers}</h2>
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* Role Management */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Structure & Roles</h3>
                        <button className={styles.btnPrimary} onClick={() => { setEditingRole(null); setNewRole(initialRole); setShowRoleModal(true); }}>
                            <i className="fa fa-plus"></i> New Role
                        </button>
                    </div>
                    <div className={styles.roleList}>
                        {roles.map(role => (
                            <div key={role._id} className={styles.roleItem}>
                                <div className={styles.roleInfo}>
                                    <span className={styles.roleName}>{role.name}</span>
                                    <span className={styles.roleCount}>
                                        {Object.values(role.permissions).filter(p => p.create || p.update || p.delete).length} write permissions
                                    </span>
                                </div>
                                <div className={styles.roleActions}>
                                    <button className={styles.iconBtn} onClick={() => openEditRole(role)} title="Edit Role">
                                        <i className="fa fa-edit" style={{ color: '#3b82f6' }}></i>
                                    </button>
                                    <button className={styles.iconBtn} onClick={() => handleDeleteRole(role._id, role.name)} title="Delete Role">
                                        <i className="fa fa-trash" style={{ color: '#ef4444' }}></i>
                                    </button>
                                    <i className="fa fa-chevron-right" style={{ color: '#cbd5e1' }}></i>
                                </div>
                            </div>
                        ))}
                        {roles.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8' }}>No custom roles created yet.</p>}
                    </div>
                </div>

                {/* Staff List */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Staff Members</h3>
                        <button className={styles.btnPrimary} onClick={() => { setEditingStaff(null); setNewStaff(initialStaff); setShowStaffModal(true); }}>
                            <i className="fa fa-user-plus"></i> Add Staff
                        </button>
                    </div>
                    <table className={styles.staffTable}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(s => (
                                <tr key={s._id}>
                                    <td>
                                        <div className={styles.staffName}>{s.firstName} {s.lastName}</div>
                                        <div className={styles.staffEmail}>{s.email}</div>
                                    </td>
                                    <td>
                                        <span className={styles.roleBadge}>
                                            {s.role === 'ADMIN' ? 'Owner / Admin' : (s.staffRole?.name || 'Staff')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }} onClick={() => toggleStaffStatus(s)}>
                                            <span style={{ color: s.isActive ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                                                ● {s.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {s.role !== 'ADMIN' && (
                                                <>
                                                    <button className={styles.iconBtn} onClick={() => openEditStaff(s)} title="Edit Staff">
                                                        <i className="fa fa-edit" style={{ color: '#3b82f6' }}></i>
                                                    </button>
                                                    <button className={styles.iconBtn} onClick={() => handleDeleteStaff(s._id, `${s.firstName} ${s.lastName}`)} title="Delete Staff">
                                                        <i className="fa fa-trash" style={{ color: '#ef4444' }}></i>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Modal */}
            {showRoleModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                        <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                            <label>Role Name</label>
                            <input 
                                className={styles.input} 
                                placeholder="e.g. Receptionist, Lab Tech" 
                                value={newRole.name}
                                onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                            />
                        </div>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>PERMISSIONS</label>
                        <table className={styles.permTable}>
                            <thead>
                                <tr>
                                    <th>Entity</th>
                                    <th>C</th>
                                    <th>R</th>
                                    <th>U</th>
                                    <th>D</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entities.map(ent => (
                                    <tr key={ent}>
                                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{ent}</td>
                                        {['create', 'read', 'update', 'delete'].map(act => (
                                            <td key={act}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={(newRole.permissions as any)[ent][act]}
                                                    onChange={e => {
                                                        const perms = { ...newRole.permissions };
                                                        (perms as any)[ent][act] = e.target.checked;
                                                        setNewRole({ ...newRole, permissions: perms });
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className={styles.modalActions}>
                            <button className={styles.btnSecondary} onClick={() => { setShowRoleModal(false); setEditingRole(null); }}>Cancel</button>
                            <button className={styles.btnPrimary} onClick={handleSaveRole}>{editingRole ? 'Update Role' : 'Save Role'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Modal */}
            {showStaffModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>First Name*</label>
                                <input className={styles.input} value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name</label>
                                <input className={styles.input} value={newStaff.lastName} onChange={e => setNewStaff({...newStaff, lastName: e.target.value})} />
                            </div>
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                            <label>Email Address*</label>
                            <input className={styles.input} type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                            <label>{editingStaff ? 'New Password (leave blank to keep current)' : 'Default Password*'}</label>
                            <input className={styles.input} type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                            <label>Assign Role*</label>
                            <select 
                                className={styles.input} 
                                value={newStaff.staffRoleId} 
                                onChange={e => setNewStaff({...newStaff, staffRoleId: e.target.value})}
                            >
                                <option value="">Select a role</option>
                                {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.btnSecondary} onClick={() => { setShowStaffModal(false); setEditingStaff(null); }}>Cancel</button>
                            <button className={styles.btnPrimary} onClick={handleSaveStaff}>{editingStaff ? 'Update Member' : 'Add Member'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
