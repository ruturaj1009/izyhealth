'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../../components/RichTextEditor';

interface Department {
    _id: string;
    name: string;
}

const TEST_TAGS = ['Blood Test', 'Urine Test', 'Radiology', 'Pathology', 'Microbiology', 'Biochemistry'];

export default function EditTestPage({ params }: { params: Promise<{ departmentId: string, testId: string }> }) {
    const { departmentId, testId } = use(params);
    const router = useRouter();
    
    // We might want to fetch department name for breadcrumbs?
    const [departmentName, setDepartmentName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [testType, setTestType] = useState('normal');
    const [name, setName] = useState('');
    const [shortCode, setShortCode] = useState('');
    const [tag, setTag] = useState(TEST_TAGS[0]);
    const [price, setPrice] = useState<number>(0);
    const [revenueShare, setRevenueShare] = useState<number>(0);

    // Normal Test Specifics
    const [unit, setUnit] = useState('');
    const [method, setMethod] = useState('');
    const [formula, setFormula] = useState('');
    const [referenceRanges, setReferenceRanges] = useState<{name: string, min: number, max: number}[]>([]);
    
    // Toggles for Normal Test Extras
    const [showMethod, setShowMethod] = useState(false);
    const [showFormula, setShowFormula] = useState(false);
    const [showInterpretation, setShowInterpretation] = useState(false);
    
    // Interpretation Content
    const [interpretation, setInterpretation] = useState('');

    // Descriptive Test Specifics - merged into interpretation

    useEffect(() => {
        // Optional: Fetch department name for display
        fetchInitialData();
    }, [departmentId, testId]);

    const fetchInitialData = async () => {
        try {
            const [deptRes, testRes] = await Promise.all([
                fetch('/api/v1/departments'),
                fetch(`/api/v1/tests/${testId}`)
            ]);

            const deptData = await deptRes.json();
            if(deptData.success) {
                const d = deptData.data.find((dept: any) => dept._id === departmentId);
                if(d) setDepartmentName(d.name);
            }

            const testData = await testRes.json();
            if (testData.success) {
                const t = testData.data;
                setName(t.name);
                setTestType(t.type); // Warning: Changing type might be tricky if data structure differs, but let's allow it or disable it. Usually editing type is allowed but resets fields.
                setShortCode(t.shortCode || '');
                if(t.tags && t.tags.length > 0) setTag(t.tags[0]);
                setPrice(t.price);
                setRevenueShare(t.revenueShare);
                
                if (t.type === 'normal') {
                    setUnit(t.unit || '');
                    setMethod(t.method || '');
                    if(t.method) setShowMethod(true);

                    setFormula(t.formula || '');
                    if(t.formula) setShowFormula(true);

                    setInterpretation(t.interpretation || '');
                    if(t.interpretation) setShowInterpretation(true);

                    setReferenceRanges(t.referenceRanges || []);
                    setInterpretation(t.interpretation || t.template || '');
                }
            } else {
                toast.error('Failed to load test data');
                router.push(`/tests/${departmentId}`);
            }

        } catch(e) {
            console.error(e);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    }

    const handleAddReferenceRange = () => {
        setReferenceRanges([...referenceRanges, { name: '', min: 0, max: 0 }]);
    };

    const handleRemoveReferenceRange = (index: number) => {
        setReferenceRanges(referenceRanges.filter((_, i) => i !== index));
    };

    const handleRangeChange = (index: number, field: string, value: any) => {
        const newRanges = [...referenceRanges];
        (newRanges[index] as any)[field] = value;
        setReferenceRanges(newRanges);
    };

    const handleSubmit = async () => {
        if (!name.trim()) return toast.error('Test Name is required');
        if (price < 0) return toast.error('Price must be positive');

        setSubmitting(true);
        try {
            const payload: any = {
                name,
                type: testType,
                shortCode,
                tags: [tag],
                price: Number(price),
                revenueShare: Number(revenueShare),
                department: departmentId, // Use the param
            };

            if (testType === 'normal') {
                payload.unit = unit;
                payload.method = showMethod ? method : '';
                payload.formula = showFormula ? formula : '';
                payload.interpretation = showInterpretation ? interpretation : '';
                payload.referenceRanges = referenceRanges;
            } else if (testType === 'descriptive') {
                payload.interpretation = interpretation;
            } 
            
            const res = await fetch(`/api/v1/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Test updated successfully!');
                router.push(`/tests/${departmentId}`);
            } else {
                toast.error(data.error || 'Failed to update test');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '30px' }}>Loading...</div>;

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#64748b', fontSize: '16px' }}>
                <Link href="/tests" style={{ color: 'inherit', textDecoration: 'none' }}>Tests</Link>
                <span>&gt;</span>
                <Link href={`/tests/${departmentId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{departmentName || 'Department'}</Link>
                <span>&gt;</span>
                <span>Edit</span>
            </div>
            
            {/* Header removed as requested */}

            {/* Top Section: Common Fields */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {/* Type Selection */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Test Type</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={testType}
                            onChange={(e) => setTestType(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', appearance: 'none' }}
                        >
                            <option value="normal">Normal Test</option>
                            <option value="descriptive">Descriptive Test</option>
                            <option value="group">Test Group</option>
                        </select>
                        <span style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none', color: '#64748b' }}>▼</span>
                    </div>
                </div>

                {/* Name */}
                <div style={{ flex: 2, minWidth: '300px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Test Name <span style={{color:'red'}}>*</span></label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        placeholder="Test Name"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                    />
                </div>

                {/* Short Code */}
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Short Code</label>
                    <input 
                        type="text" 
                        value={shortCode} 
                        onChange={e => setShortCode(e.target.value)}
                        placeholder="Short Code"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
                {/* Tag */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Tag</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', appearance: 'none' }}
                        >
                            {TEST_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none', color: '#64748b' }}>▼</span>
                    </div>
                </div>
                
                {/* Price */}
                <div style={{ flex: 1, minWidth: '150px' }}>
                     <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Price (₹)</label>
                    <input 
                        type="number" 
                        value={price} 
                        onChange={e => setPrice(Number(e.target.value))}
                        min="0"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                    />
                </div>

                {/* Revenue Share */}
                <div style={{ flex: 1, minWidth: '150px' }}>
                     <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Revenue Share (%)</label>
                     <input 
                        type="number" 
                        value={revenueShare} 
                        onChange={e => setRevenueShare(Number(e.target.value))}
                        min="0" max="100"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                    />
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

            {/* Conditional Rendering based on Type */}

            {testType === 'normal' && (
                <div>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Unit</label>
                            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '15px' }}>Reference Range</h3>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                        {referenceRanges.map((range, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '12px', color: '#64748b' }}>Name (e.g. Male)</label>
                                    <input type="text" value={range.name} onChange={e => handleRangeChange(idx, 'name', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', color: '#64748b' }}>Min</label>
                                    <input type="number" value={range.min} onChange={e => handleRangeChange(idx, 'min', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', color: '#64748b' }}>Max</label>
                                    <input type="number" value={range.max} onChange={e => handleRangeChange(idx, 'max', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <button onClick={() => handleRemoveReferenceRange(idx)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', height: '35px' }}>×</button>
                            </div>
                        ))}
                        <button 
                            onClick={handleAddReferenceRange}
                            style={{ marginTop: '10px', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                        >
                            + Add Reference Range
                        </button>
                    </div>

                    {/* Dynamic Sections: Method, Formula, Interpretation */}
                    <div style={{ marginBottom: '30px' }}>
                        
                        {/* Buttons to toggle sections */}
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <button 
                                onClick={() => {
                                    if(showMethod) setMethod(''); 
                                    setShowMethod(!showMethod);
                                }}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: '#1d4ed8', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '20px', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <span>{showMethod ? '-' : '+'}</span> METHOD
                            </button>
                            <button 
                                onClick={() => {
                                    if(showFormula) setFormula('');
                                    setShowFormula(!showFormula);
                                }}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: '#1d4ed8', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '20px', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <span>{showFormula ? '-' : '+'}</span> FORMULA
                            </button>
                            <button 
                                onClick={() => {
                                    if(showInterpretation) setInterpretation('');
                                    setShowInterpretation(!showInterpretation);
                                }}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: '#1d4ed8', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '20px', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <span>{showInterpretation ? '-' : '+'}</span> INTERPRETATION
                            </button>
                        </div>

                        {/* Method Input */}
                        {showMethod && (
                            <div style={{ marginBottom: '20px', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Method</label>
                                <input 
                                    type="text" 
                                    value={method} 
                                    onChange={e => setMethod(e.target.value)} 
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                                />
                            </div>
                        )}

                        {/* Formula Input */}
                        {showFormula && (
                            <div style={{ marginBottom: '20px', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>Formula</label>
                                <input 
                                    type="text" 
                                    value={formula} 
                                    onChange={e => setFormula(e.target.value)} 
                                    placeholder="Use Short Code..." 
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                                />
                            </div>
                        )}

                        {/* Interpretation Editor */}
                        {showInterpretation && (
                            <div style={{ marginBottom: '20px', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Interpretation</label>
                                <RichTextEditor 
                                    content={interpretation} 
                                    onChange={(html) => setInterpretation(html)} 
                                />
                            </div>
                        )}

                    </div>
                </div>
            )}



                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                        {testType === 'descriptive' ? 'Default Content / Template' : 'Interpretation'}
                    </label>
                    <RichTextEditor 
                        content={interpretation} 
                        onChange={(html) => setInterpretation(html)} 
                    />
                 </div>
            
            {testType === 'group' && (
                 <div style={{ padding: '20px', background: '#e0f2fe', borderRadius: '8px', color: '#0369a1' }}>
                     <p>You can manage sub-tests in the "View Test" page.</p>
                 </div>
            )}

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={() => router.push(`/tests/${departmentId}`)}
                    type="button"
                    style={{
                        padding: '12px 24px',
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ 
                        padding: '12px 24px', 
                        background: '#3f51b5', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '16px', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: submitting ? 0.7 : 1,
                        boxShadow: '0 4px 6px -1px rgba(63, 81, 181, 0.2)'
                    }}
                >
                    {submitting ? 'Updating...' : 'Update Test'}
                </button>
            </div>
            

        </div>
    );
}
