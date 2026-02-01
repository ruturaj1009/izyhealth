'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ReferenceRange {
    name: string;
    min: number;
    max: number;
}

interface Test {
    _id: string;
    name: string;
    type: string;
    shortCode?: string;
    price: number;
    revenueShare: number;
    department?: {
        _id: string;
        name: string;
    };
    // Normal
    unit?: string;
    method?: string;
    formula?: string;
    referenceRanges?: ReferenceRange[];
    interpretation?: string;
    // Descriptive - usage merged into interpretation
    // Group
    subTests?: Test[];
}

export default function ViewTestPage({ params }: { params: Promise<{ departmentId: string, testId: string }> }) {
    const { departmentId, testId } = use(params);
    const router = useRouter();

    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTest();
    }, [testId]);

    const fetchTest = async () => {
        try {
            const res = await fetch(`/api/v1/tests/${testId}`);
            const data = await res.json();
            if (data.success) {
                setTest(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load test');
        } finally {
            setLoading(false);
        }
    };

    

    const handleReorder = async (index: number, direction: 'up' | 'down') => {
        if (!test?.subTests) return;
        const newSubTests = [...test.subTests];
        
        if (direction === 'up') {
            if (index === 0) return;
            [newSubTests[index - 1], newSubTests[index]] = [newSubTests[index], newSubTests[index - 1]];
        } else {
            if (index === newSubTests.length - 1) return;
            [newSubTests[index + 1], newSubTests[index]] = [newSubTests[index], newSubTests[index + 1]];
        }

        // Optimistic update
        setTest({ ...test, subTests: newSubTests });

        try {
            await fetch(`/api/v1/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subTests: newSubTests.map(t => t._id) })
            });
            // Ideally we re-fetch or confirm success, but optimistic is fine for now
        } catch (error) {
            console.error(error);
            toast.error('Failed to save order');
            // Revert on error
            fetchTest(); 
        }
    };

    const handleRemoveSubtest = async (subtestId: string) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 600 }}>Are you sure you want to remove this test from the group?</div>
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
                                // Filter out the ID
                                const newSubtestIds = (test?.subTests?.map(t => t._id) || []).filter(id => id !== subtestId);
                                
                                const res = await fetch(`/api/v1/tests/${testId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ subTests: newSubtestIds })
                                });
                    
                                const data = await res.json();
                                if(data.success) {
                                    setTest(data.data);
                                    toast.success('Test removed from group');
                                } else {
                                    toast.error('Failed to remove test');
                                }
                            } catch(error) {
                                console.error(error);
                                toast.error('Error removing test');
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
                        Remove
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleDelete = async () => {
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
                                const res = await fetch(`/api/v1/tests/${testId}`, { method: 'DELETE' });
                                const data = await res.json();
                                if(data.success) {
                                    toast.success('Test deleted');
                                    router.push(`/tests/${departmentId}`);
                                } else {
                                    toast.error(data.error || 'Failed to delete');
                                }
                            } catch(e) {
                                console.error(e);
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

    if (loading) return <div style={{ padding: '30px' }}>Loading...</div>;
    if (!test) return <div style={{ padding: '30px' }}>Test not found</div>;


    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#64748b', fontSize: '16px' }}>
                <Link href="/tests" style={{ color: 'inherit', textDecoration: 'none' }}>Departments</Link> 
                <span>&gt;</span>
                <Link href={`/tests/${departmentId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{test.department?.name || 'Department'}</Link> 
                <span>&gt;</span> 
                <span>{test.name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{test.name}</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                        {test.shortCode && <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#64748b' }}>{test.shortCode}</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                     {test.type === 'group' && (
                        <button
                            onClick={() => router.push(`/tests/${departmentId}/create?groupId=${testId}`)}
                            style={{
                                padding: '8px 16px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            + Add New Subtest
                        </button>
                     )}
                     
                     <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => router.push(`/tests/${departmentId}/${testId}/edit`)}
                            style={{ 
                                background: '#eff6ff', 
                                color: '#3b82f6', 
                                border: '1px solid #dbeafe', 
                                borderRadius: '6px', 
                                width: '35px', 
                                height: '35px', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '16px' 
                            }}
                            title="Edit"
                        >
                            ✏️
                        </button>
                        <button 
                            onClick={handleDelete}
                            style={{ 
                                background: '#fff1f2', 
                                color: '#f43f5e', 
                                border: '1px solid #ffe4e6', 
                                borderRadius: '6px', 
                                width: '35px', 
                                height: '35px', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '18px' 
                            }}
                            title="Delete"
                        >
                            ×
                        </button>
                     </div>

                    <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b' }}>₹{test.price}</div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>Rev Share: {test.revenueShare}%</div>
                    </div>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

            {/* Sub-Tests Management for Group */}
            {test.type === 'group' && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Sub Tests ({test.subTests?.length || 0})</h2>

                    </div>

                    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                       {test.subTests && test.subTests.length > 0 ? (
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
                                   {test.subTests.map((sub, idx) => (
                                       <tr 
                                            key={sub._id} 
                                            onClick={() => router.push(`/tests/${departmentId}/${sub._id}`)}
                                            className="test-row"
                                            style={{ borderBottom: idx < test.subTests!.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                                       >
                                           <td style={{ padding: '16px', fontWeight: 500, color: '#1e293b' }}>{sub.name}</td>
                                           <td style={{ padding: '16px' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 500,
                                                    background: sub.type === 'normal' ? '#e0f2fe' : sub.type === 'descriptive' ? '#f3e8ff' : '#fef3c7',
                                                    color: sub.type === 'normal' ? '#0369a1' : sub.type === 'descriptive' ? '#7e22ce' : '#b45309',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {sub.type}
                                                </span>
                                           </td>
                                           <td style={{ padding: '16px', color: '#475569' }}>{sub.shortCode || '-'}</td>
                                           <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>₹{sub.price}</td>
                                           <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '8px' }}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleReorder(idx, 'up'); }}
                                                                disabled={idx === 0}
                                                                style={{
                                                                    border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                                                                    padding: 0, fontSize: '10px', color: idx === 0 ? '#cbd5e1' : '#64748b', lineHeight: 1
                                                                }}
                                                                title="Move Up"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleReorder(idx, 'down'); }}
                                                                disabled={idx === (test.subTests?.length || 0) - 1}
                                                                style={{
                                                                    border: 'none', background: 'none', cursor: idx === (test.subTests?.length || 0) - 1 ? 'default' : 'pointer',
                                                                    padding: 0, fontSize: '10px', color: idx === (test.subTests?.length || 0) - 1 ? '#cbd5e1' : '#64748b', lineHeight: 1
                                                                }}
                                                                title="Move Down"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>

                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/tests/${departmentId}/${sub._id}/edit`);
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
                                                            title="Edit Subtest"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveSubtest(sub._id);
                                                            }}
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
                                                            title="Remove from Group"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       ) : (
                           <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                               <p style={{ marginBottom: '10px', fontSize: '16px' }}>No sub-tests in this group yet.</p>
                               <button 
                                    onClick={() => router.push(`/tests/${departmentId}/create?groupId=${testId}`)}
                                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                               >
                                   + Create New Subtest
                               </button>
                           </div>
                       )}
                    </div>
                </div>
            )}

            {/* Normal Test Details */}
            {test.type === 'normal' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Unit</div>
                        <div style={{ fontWeight: 500 }}>{test.unit || '-'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Method</div>
                        <div style={{ fontWeight: 500 }}>{test.method || '-'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Formula</div>
                        <div style={{ fontWeight: 500 }}>{test.formula || '-'}</div>
                    </div>
                </div>
            )}

            {test.type === 'normal' && test.referenceRanges && test.referenceRanges.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '15px' }}>Reference Ranges</h2>
                    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Name</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Min</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Max</th>
                                </tr>
                            </thead>
                            <tbody>
                                {test.referenceRanges.map((range, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 20px' }}>{range.name}</td>
                                        <td style={{ padding: '12px 20px' }}>{range.min}</td>
                                        <td style={{ padding: '12px 20px' }}>{range.max}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

    {test.type === 'normal' && test.interpretation && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '15px' }}>Interpretation</h2>
                    <div 
                        style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '200px', background: '#fcfcfc' }}
                        dangerouslySetInnerHTML={{ __html: test.interpretation }}
                     />
                     <style jsx global>{`
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid #cbd5e1; padding: 5px; }
                        th { background: #f1f5f9; }
                     `}</style>
                </div>
            )}

            {test.type === 'descriptive' && (
                <div>
                     <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '15px' }}>Default Content / Template</h2>
                     <div 
                        style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '200px', background: '#fcfcfc' }}
                        dangerouslySetInnerHTML={{ __html: test.interpretation || (test as any).template || '<span style="color: #94a3b8">No content defined.</span>' }}
                     />
                     <style jsx global>{`
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid #cbd5e1; padding: 5px; }
                        th { background: #f1f5f9; }
                     `}</style>
                </div>
            )}
        </div>
    );
}
