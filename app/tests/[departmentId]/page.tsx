'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
            const testsRes = await fetch(`/api/v1/tests?department=${departmentId}`);
            const testsData = await testsRes.json();
            
            if (testsData.success) {
                setTests(testsData.data);
            }

             const deptRes2 = await fetch(`/api/v1/departments`);
             const deptData = await deptRes2.json();
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
                            </tr>
                        </thead>
                        <tbody>
                            {tests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No tests found in this department. Create one!</td>
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <style jsx>{`
                .test-row {
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .test-row:hover {
                    background-color: #f8fafc;
                }
            `}</style>
        </div>
    );
}
