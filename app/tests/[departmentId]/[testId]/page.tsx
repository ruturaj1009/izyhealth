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
    // Descriptive
    template?: string;
    // Group
    subTests?: Test[];
}

export default function ViewTestPage({ params }: { params: Promise<{ departmentId: string, testId: string }> }) {
    const { departmentId, testId } = use(params);
    const router = useRouter();

    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Subtest Management State
    const [allTests, setAllTests] = useState<Test[]>([]); // For selection
    const [isEditingSubtests, setIsEditingSubtests] = useState(false);
    const [selectedSubtestIds, setSelectedSubtestIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTest();
    }, [testId]);

    const fetchTest = async () => {
        try {
            const res = await fetch(`/api/v1/tests/${testId}`);
            const data = await res.json();
            if (data.success) {
                setTest(data.data);
                if (data.data.type === 'group') {
                    setSelectedSubtestIds(data.data.subTests?.map((t: any) => t._id) || []);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load test');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTests = async () => {
        try {
            // Need all tests to pick from
            // We may want to filter out the current test to avoid circular dependency, 
            // and maybe filter out other group tests if we don't want nested groups (optional)
            const res = await fetch('/api/v1/tests'); 
            const data = await res.json();
            if(data.success) {
                // Filter out self
                setAllTests(data.data.filter((t: any) => t._id !== testId));
            }
        } catch(error) {
            console.error(error);
            toast.error('Failed to load available tests');
        }
    }

    const handleEditSubtests = () => {
        setIsEditingSubtests(true);
        fetchAllTests();
    };

    const toggleSubtestSelection = (id: string) => {
        if(selectedSubtestIds.includes(id)) {
            setSelectedSubtestIds(selectedSubtestIds.filter(sid => sid !== id));
        } else {
            setSelectedSubtestIds([...selectedSubtestIds, id]);
        }
    };

    const saveSubtests = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subTests: selectedSubtestIds
                })
            });
            const data = await res.json();
            if(data.success) {
                setTest(data.data);
                setIsEditingSubtests(false);
                toast.success('Sub-tests updated');
            } else {
                toast.error('Failed to update');
            }
        } catch(error) {
            console.error(error);
            toast.error('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '30px' }}>Loading...</div>;
    if (!test) return <div style={{ padding: '30px' }}>Test not found</div>;

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#64748b', fontSize: '16px' }}>
                <Link href={`/tests/${departmentId}`} style={{ color: 'inherit', textDecoration: 'none' }}>Tests</Link> <span>&gt;</span> <span>{test.name}</span>
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
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b' }}>₹{test.price}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Rev Share: {test.revenueShare}%</div>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

            {/* Sub-Tests Management for Group */}
            {test.type === 'group' && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Sub Tests ({test.subTests?.length || 0})</h2>
                        {!isEditingSubtests && (
                            <button 
                                onClick={handleEditSubtests}
                                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Manage Subtests
                            </button>
                        )}
                    </div>

                    {isEditingSubtests ? (
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Select Tests</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setIsEditingSubtests(false)} style={{ padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                    <button 
                                        onClick={saveSubtests} 
                                        disabled={saving}
                                        style={{ padding: '6px 16px', background: '#3f51b5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                {allTests.map(t => (
                                    <div 
                                        key={t._id} 
                                        onClick={() => toggleSubtestSelection(t._id)}
                                        style={{ 
                                            padding: '10px 15px', 
                                            borderBottom: '1px solid #f1f5f9', 
                                            cursor: 'pointer',
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            background: selectedSubtestIds.includes(t._id) ? '#eff6ff' : 'white'
                                        }}
                                    >
                                        <span>{t.name}</span>
                                        {selectedSubtestIds.includes(t._id) && <span style={{ color: '#3b82f6' }}>✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                           {test.subTests && test.subTests.length > 0 ? (
                               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                   <tbody>
                                       {test.subTests.map((sub, idx) => (
                                           <tr key={sub._id} style={{ borderBottom: idx < test.subTests!.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                               <td style={{ padding: '12px 20px' }}>{sub.name}</td>
                                               <td style={{ padding: '12px 20px', textAlign: 'right' }}>{sub.type}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           ) : (
                               <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No sub-tests linked yet.</div>
                           )}
                        </div>
                    )}
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

            {test.type === 'descriptive' && (
                <div>
                     <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '15px' }}>Report Template</h2>
                     <div 
                        style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '200px', background: '#fcfcfc' }}
                        dangerouslySetInnerHTML={{ __html: test.template || '<span style="color: #94a3b8">No template defined.</span>' }}
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
