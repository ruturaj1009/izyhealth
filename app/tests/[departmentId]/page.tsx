'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';

interface Test {
    _id: string;
    name: string;
    type: string;
    price: number;
    department?: { name: string };
    shortCode?: string;
}

interface Department {
    _id: string;
    name: string;
}

export default function DepartmentTestsPage({ params }: { params: Promise<{ departmentId: string }> }) {
    // Unwrap params using React.use()
    const { departmentId } = use(params);
    
    const router = useRouter(); // Initialize router

    const [tests, setTests] = useState<Test[]>([]);
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (departmentId) {
            fetchData();
        }
    }, [departmentId]);

    const fetchData = async () => {
        try {
            const testsData = await api.get(`/api/v1/tests?department=${departmentId}`);
            
            if (testsData.success) {
                setTests(testsData.data);
            }

             const deptData = await api.get(`/api/v1/departments`);
             if(deptData.success) {
                 const found = deptData.data.find((d: any) => d._id === departmentId);
                 if(found) setDepartment(found);
             }

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, testId: string) => {
        e.stopPropagation(); // Prevent row click
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 600 }}>Are you sure you want to delete this test?</div>
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
                                const data = await api.delete(`/api/v1/tests/${testId}`);
                                if(data.success) {
                                    toast.success('Test deleted successfully');
                                    setTests(tests.filter(t => t._id !== testId));
                                } else {
                                    toast.error(data.error || 'Failed to delete');
                                }
                            } catch(error) {
                                console.error(error);
                                toast.error('Error deleting test');
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
        ), { duration: 5000 });
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>
            <div style={{ marginBottom: '20px', color: '#64748b', fontSize: '16px' }}>
                <Link href="/tests" style={{ textDecoration: 'none', color: 'inherit' }}>Departments</Link> 
                <span> &gt; </span>
                <span>{department?.name || 'Tests'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b' }}>
                    {department ? `${department.name} Tests` : 'Department Tests'}
                </h1>
                <Link href={`/tests/${departmentId}/create`}>
                    <button style={{ 
                        padding: '10px 20px', 
                        background: '#3f51b5', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: 600,
                        cursor: 'pointer' 
                    }}>
                        + Add New Test
                    </button>
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Name</th>
                                <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Type</th>
                                <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Short Code</th>
                                <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Price</th>
                                <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No tests found in this department. Create one!</td>
                                </tr>
                            ) : (
                                tests.map(test => (
                                    <tr 
                                        key={test._id} 
                                        onClick={() => router.push(`/tests/${departmentId}/${test._id}`)}
                                        className="test-row"
                                    >
                                        <td style={{ padding: '16px', fontWeight: 500, color: '#1e293b' }}>
                                            {test.name}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '20px', 
                                                fontSize: '12px', 
                                                fontWeight: 500,
                                                background: test.type === 'normal' ? '#e0f2fe' : test.type === 'descriptive' ? '#f3e8ff' : '#fef3c7',
                                                color: test.type === 'normal' ? '#0369a1' : test.type === 'descriptive' ? '#7e22ce' : '#b45309',
                                                textTransform: 'capitalize'
                                            }}>
                                                {test.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#475569' }}>{test.shortCode || '-'}</td>
                                        <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>₹{test.price}</td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/tests/${departmentId}/${test._id}/edit`);
                                                    }}
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
                                                    onClick={(e) => handleDelete(e, test._id)}
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
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
