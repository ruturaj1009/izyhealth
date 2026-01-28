'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';

interface PatientData {
    _id?: string;
    title: string;
    firstName: string;
    lastName: string;
    gender: string;
    bloodGroup: string;
    age: number;
    email: string;
    mobile: string;
}

interface Doctor {
    _id: string;
    firstName: string;
    lastName: string;
    hospitalName?: string;
}

interface Test {
    _id: string;
    name: string;
    price: number;
    department?: { name: string };
}

export default function CreateBillPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- STEP 1: PATIENT ---
    const [patientMode, setPatientMode] = useState<'search' | 'create'>('search');
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<PatientData[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

    const [newPatient, setNewPatient] = useState<PatientData>({
        title: 'Mr.',
        firstName: '',
        lastName: '',
        gender: 'Male',
        bloodGroup: '',
        age: 0,
        email: '',
        mobile: ''
    });

    // --- STEP 2: DOCTOR ---
    const [doctorSearch, setDoctorSearch] = useState('');
    const [doctorResults, setDoctorResults] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | 'SELF' | null>(null);

    // --- STEP 3: TESTS ---
    const [testSearch, setTestSearch] = useState('');
    const [availableTests, setAvailableTests] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<Test[]>([]);

    // --- STEP 4: SUMMARY & PAYMENT ---
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT');
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentType, setPaymentType] = useState('CASH');


    // --- EFFECTS ---

    // Patient Search
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (patientSearch.length > 2) {
                try {
                    const res = await fetch(`/api/v1/users?role=PATIENT&search=${patientSearch}`);
                    const data = await res.json();
                    if (data.status === 200) setPatientResults(data.data);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setPatientResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [patientSearch]);

    // Doctor Search
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (doctorSearch.length > 2) {
                try {
                    const res = await fetch(`/api/v1/users?role=DOCTOR&search=${doctorSearch}`);
                    const data = await res.json();
                    if (data.status === 200) setDoctorResults(data.data);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setDoctorResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [doctorSearch]);

    // Test Search
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (testSearch.length > 0) {
                try {
                    const res = await fetch(`/api/v1/tests?search=${testSearch}`);
                    const data = await res.json();
                    if (data.success) setAvailableTests(data.data);
                } catch (e) {
                    console.error(e);
                }
            } else if (testSearch.length === 0) {
                 setAvailableTests([]); 
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [testSearch]);


    // --- HANDLERS ---

    const handlePatientSelect = (p: PatientData) => {
        setSelectedPatient(p);
        setPatientSearch('');
        setPatientResults([]);
    };

    const handleDoctorSelect = (d: Doctor | 'SELF') => {
        setSelectedDoctor(d);
        if (d !== 'SELF') {
            setDoctorSearch('');
            setDoctorResults([]);
        }
    };

    const handleTestToggle = (t: Test) => {
        if (selectedTests.find(st => st._id === t._id)) {
            setSelectedTests(selectedTests.filter(st => st._id !== t._id));
        } else {
            setSelectedTests([...selectedTests, t]);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (patientMode === 'search' && !selectedPatient) return toast.error('Please select a patient');
            if (patientMode === 'create') {
                if (!newPatient.firstName || !newPatient.age || !newPatient.gender) return toast.error('Please fill required fields');
            }
        }
        if (step === 2) {
            if (!selectedDoctor) return toast.error('Please select a doctor');
        }
        if (step === 3) {
            if (selectedTests.length === 0) return toast.error('Please select at least one test');
        }
        setStep(step + 1);
    };

    const calculateTotal = () => selectedTests.reduce((acc, t) => acc + t.price, 0);

    const calculateDiscountAmount = () => {
        const total = calculateTotal();
        if (discountType === 'PERCENTAGE') {
            return Math.round((total * discount) / 100);
        }
        return discount;
    };

    const calculateFinalAmount = () => {
        return Math.max(0, calculateTotal() - calculateDiscountAmount() - paidAmount);
    };

    const handleStepClick = (s: number) => {
        if (s < step) {
            setStep(s);
        } else {
             // Optional: Allow clicking next step if current step is valid? 
             // For now, simpler to enforce "Next" button usage for forward navigation to ensure validation runs.
             if (s === step + 1) handleNext();
        }
    };

    const handleSubmit = async () => {
        // Final Validation Check
        if (patientMode === 'search' && !selectedPatient) return toast.error('Patient is missing');
        // Mobile is optional in backend, so removed from strict check. Added Age check.
        if (patientMode === 'create' && (!newPatient.firstName || newPatient.age <= 0)) return toast.error('Patient Name and Age are required');
        if (!selectedDoctor) return toast.error('Doctor is missing');
        if (selectedTests.length === 0) return toast.error('No tests selected');

        setLoading(true);
        try {
            let patientId = selectedPatient?._id;

            // 1. Create Patient if needed
            // 1. Create Patient if needed
            if (patientMode === 'create' && !patientId) {
                // Sanitize input: remove empty strings
                const cleanPatient = Object.fromEntries(
                    Object.entries(newPatient).filter(([_, v]) => v !== '' && v !== null)
                );
                // Ensure age is passed as number
                if(cleanPatient.age) cleanPatient.age = Number(cleanPatient.age);

                console.log('Creating Patient:', cleanPatient); // Debug log

                const res = await fetch('/api/v1/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...cleanPatient, role: 'PATIENT' })
                });
                const data = await res.json();
                
                console.log('Create Patient Response:', data); // Debug log

                if (data.status === 201 && data.data?._id) {
                    patientId = data.data._id;
                } else {
                    console.error('Patient Creation Failed:', data);
                    throw new Error(data.error || 'Failed to create patient: Backend Error');
                }
            }

            // 2. Submit Bill
            const totalAmount = calculateTotal();
            const discountAmt = calculateDiscountAmount();
            
            const payload = {
                patientId,
                doctorId: selectedDoctor === 'SELF' ? 'SELF' : selectedDoctor?._id,
                tests: selectedTests.map(t => ({ test: t._id, price: t.price })),
                paymentType,
                totalAmount,
                discountAmount: discountAmt,
                paidAmount: paidAmount,
                dueAmount: calculateFinalAmount(),
                discountType,
                status: calculateFinalAmount() > 0 ? 'PARTIAL' : 'PAID',
                 patientMode // Pass for context
            };

            // Debug log
            console.log('Submitting Bill Payload:', payload);

            const billRes = await fetch('/api/v1/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const billData = await billRes.json();

            if (billData.status === 201) {
                toast.success('Bill generated successfully!');
                 // Clear New Patient Form
                 setNewPatient({
                    title: 'Mr.',
                    firstName: '',
                    lastName: '',
                    gender: 'Male',
                    bloodGroup: '',
                    age: 0,
                    email: '',
                    mobile: ''
                 });

                 router.refresh(); 
                 router.push('/bills'); // Redirect to Bills list
                 
                 // Reset State
                 setStep(1);
                 setSelectedPatient(null);
                 setSelectedDoctor(null);
                 setSelectedTests([]);
                 setDiscount(0);
                 setPaidAmount(0);
            } else {
                toast.error(billData.error || 'Failed to generate bill');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };


    const isFixedLayout = step === 3 || step === 4;

    return (
        <div style={{ 
            padding: '20px', 
            background: '#eef6ff', 
            height: isFixedLayout ? 'calc(100vh - 60px)' : 'auto', 
            minHeight: 'calc(100vh - 60px)', 
            overflow: isFixedLayout ? 'hidden' : 'visible', 
            boxSizing: 'border-box' 
        }}>
            <div className={styles.mainCard} style={{ 
                height: isFixedLayout ? '100%' : 'auto', 
                display: 'flex', 
                flexDirection: 'column' 
            }}>
                
                {/* Stepper UI */}
                <div className={styles.stepper} style={{ flexShrink: 0 }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{ display: 'contents' }}>
                            <div 
                                className={`${styles.step} ${step === s ? styles.stepActive : ''} ${step > s ? styles.stepDone : ''}`}
                                onClick={() => handleStepClick(s)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.circle}>
                                    {step > s ? <i className="fa fa-check"></i> : s}
                                </div>
                                {s === 1 && 'Patient'}
                                {s === 2 && 'Doctor'}
                                {s === 3 && 'Test'}
                                {s === 4 && 'Summary'}
                            </div>
                            {s < 4 && <div className={`${styles.stepLine} ${step > s ? styles.lineDone : ''}`}></div>}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.cardBody} style={isFixedLayout ? { flex: 1, overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column' } : { padding: '40px' }}>
                    
                    {/* STEP 1: PATIENT */}
                    {step === 1 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div className={styles.patientTitle} style={{ marginBottom: 0 }}>Patient Details</div>
                                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                    <button 
                                        onClick={() => setPatientMode('search')}
                                        style={{ 
                                            padding: '8px 20px', 
                                            borderRadius: '6px', 
                                            border: 'none', 
                                            background: patientMode === 'search' ? 'white' : 'transparent', 
                                            color: patientMode === 'search' ? '#3b82f6' : '#64748b', 
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            boxShadow: patientMode === 'search' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Search Existing
                                    </button>
                                    <button 
                                        onClick={() => { setPatientMode('create'); setSelectedPatient(null); }}
                                        style={{ 
                                            padding: '8px 20px', 
                                            borderRadius: '6px', 
                                            border: 'none', 
                                            background: patientMode === 'create' ? 'white' : 'transparent', 
                                            color: patientMode === 'create' ? '#3b82f6' : '#64748b', 
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            boxShadow: patientMode === 'create' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Create New
                                    </button>
                                </div>
                            </div>

                            {patientMode === 'search' && (
                                <div style={{ width: '100%' }}>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Search by Name or Phone (e.g. 9876543210)"
                                            value={patientSearch}
                                            onChange={(e) => setPatientSearch(e.target.value)}
                                            style={{ 
                                                width: '100%',
                                                height: '35px', 
                                                fontSize: '13px',
                                                padding: '0 35px 0 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                        <i className="fa fa-magnifying-glass" style={{position:'absolute', right:'12px', top: '50%', transform: 'translateY(-50%)', color:'#94a3b8', fontSize:'14px'}}></i>
                                    </div>
                                    
                                    {selectedPatient && (
                                        <div style={{ marginTop: '20px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                                <i className="fa fa-user-check"></i>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 600, color: '#166534' }}>{selectedPatient.title} {selectedPatient.firstName} {selectedPatient.lastName}</div>
                                                <div style={{ color: '#15803d', marginTop: '4px' }}>
                                                    <span style={{ marginRight: '15px' }}><i className="fa fa-phone" style={{marginRight:'5px'}}></i> {selectedPatient.mobile}</span>
                                                    <span><i className="fa fa-venus-mars" style={{marginRight:'5px'}}></i> {selectedPatient.gender} ({selectedPatient.age} Yrs)</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedPatient(null)} 
                                                style={{ marginLeft: 'auto', background: 'white', border: '1px solid #bbf7d0', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                                            >
                                                Change
                                            </button>
                                        </div>
                                    )}

                                    {patientResults.length > 0 && !selectedPatient && (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                            {patientResults.map(p => (
                                                <div 
                                                    key={p._id} 
                                                    onClick={() => handlePatientSelect(p)}
                                                    style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: 'white', transition: 'background 0.1s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{fontWeight:600, fontSize: '15px', color: '#1e293b'}}>{p.firstName} {p.lastName}</div>
                                                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'2px'}}>
                                                        Phone: {p.mobile} &bull; {p.gender} &bull; {p.age} Yrs
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {patientMode === 'create' && (
                                <div style={{ background: 'white', padding: '0', borderRadius: '8px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Title</label>
                                            <select 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.title}
                                                onChange={e => setNewPatient({...newPatient, title: e.target.value})}
                                            >
                                                <option>Mr.</option>
                                                <option>Mrs.</option>
                                                <option>Ms.</option>
                                                <option>Dr.</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>First Name <span style={{color:'red'}}>*</span></label>
                                            <input 
                                                type="text" 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.firstName}
                                                onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                                                placeholder="First Name"
                                            />
                                        </div>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Last Name</label>
                                            <input 
                                                type="text" 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.lastName}
                                                onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                                                placeholder="Last Name"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Gender <span style={{color:'red'}}>*</span></label>
                                            <select 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.gender}
                                                onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Age <span style={{color:'red'}}>*</span></label>
                                            <input 
                                                type="number" 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.age}
                                                onChange={e => setNewPatient({...newPatient, age: Number(e.target.value)})}
                                                placeholder="Age"
                                            />
                                        </div>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Blood Group</label>
                                            <select 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.bloodGroup}
                                                onChange={e => setNewPatient({...newPatient, bloodGroup: e.target.value})}
                                            >
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Email</label>
                                            <input 
                                                type="email" 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.email}
                                                onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                                                placeholder="patient@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label style={{display:'block', fontSize:'13px', fontWeight: 500, color:'#475569', marginBottom:'6px'}}>Phone</label>
                                            <input 
                                                type="tel" 
                                                style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1', background: '#f8fafc'}}
                                                value={newPatient.mobile}
                                                onChange={e => setNewPatient({...newPatient, mobile: e.target.value})}
                                                placeholder="+91 "
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: DOCTOR */}
                    {step === 2 && (
                        <div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div className={styles.patientTitle} style={{ marginBottom: 0 }}>Doctor Details</div>
                                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                    <button 
                                        onClick={() => {
                                            if (selectedDoctor === 'SELF') setSelectedDoctor(null);
                                        }}
                                        style={{ 
                                            padding: '8px 20px', 
                                            borderRadius: '6px', 
                                            border: 'none', 
                                            background: selectedDoctor !== 'SELF' ? 'white' : 'transparent', 
                                            color: selectedDoctor !== 'SELF' ? '#3b82f6' : '#64748b', 
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            boxShadow: selectedDoctor !== 'SELF' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Search Existing
                                    </button>
                                    <button 
                                        onClick={() => handleDoctorSelect('SELF')}
                                        style={{ 
                                            padding: '8px 20px', 
                                            borderRadius: '6px', 
                                            border: 'none', 
                                            background: selectedDoctor === 'SELF' ? 'white' : 'transparent', 
                                            color: selectedDoctor === 'SELF' ? '#3b82f6' : '#64748b', 
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            boxShadow: selectedDoctor === 'SELF' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Self
                                    </button>
                                </div>
                            </div>

                            {selectedDoctor !== 'SELF' && (
                                <div style={{ width: '100%' }}>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Search Doctor..."
                                            value={doctorSearch}
                                            onChange={(e) => setDoctorSearch(e.target.value)}
                                            style={{ 
                                                width: '100%',
                                                height: '35px', 
                                                fontSize: '13px',
                                                padding: '0 35px 0 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                        <i className="fa fa-magnifying-glass" style={{position:'absolute', right:'12px', top: '50%', transform: 'translateY(-50%)', color:'#94a3b8', fontSize:'14px'}}></i>
                                    </div>
                                </div>
                            )}

                            {selectedDoctor && selectedDoctor !== 'SELF' && (
                                <div style={{ marginTop: '20px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                        <i className="fa fa-user-doctor"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#166534' }}>Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</div>
                                        <div style={{ color: '#15803d', marginTop: '4px' }}>
                                            <span><i className="fa fa-hospital" style={{marginRight:'5px'}}></i> {selectedDoctor.hospitalName}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedDoctor(null)} 
                                        style={{ marginLeft: 'auto', background: 'white', border: '1px solid #bbf7d0', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Change
                                    </button>
                                </div>
                            )}

                             {/* SELF SELECTED DISPLAY */}
                            {selectedDoctor === 'SELF' && (
                                <div style={{ marginTop: '20px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                        <i className="fa fa-user-doctor"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#166534' }}>SELF</div>
                                        <div style={{ color: '#15803d', marginTop: '4px' }}>
                                            <span>Self Referred</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedDoctor(null)} 
                                        style={{ marginLeft: 'auto', background: 'white', border: '1px solid #bbf7d0', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Change
                                    </button>
                                </div>
                            )}

                             {doctorResults.length > 0 && !selectedDoctor && (
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                    {doctorResults.map(d => (
                                        <div 
                                            key={d._id} 
                                            onClick={() => handleDoctorSelect(d)}
                                            style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: 'white', transition: 'background 0.1s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <div style={{fontWeight:600, fontSize: '15px', color: '#1e293b'}}>Dr. {d.firstName} {d.lastName}</div>
                                            <div style={{fontSize:'13px', color:'#64748b', marginTop:'2px'}}>
                                                {d.hospitalName}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: TEST - FIXED HEIGHT, DUAL SCROLL */}
                    {step === 3 && (
                        <div style={{ display: 'flex', gap: '20px', height: '100%', overflow: 'hidden' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className={styles.patientTitle} style={{ marginBottom: '25px', flexShrink: 0 }}>Select Tests</div>
                                <div style={{ width: '100%', marginBottom: '20px', flexShrink: 0 }}>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Search Tests..."
                                            value={testSearch}
                                            onChange={(e) => setTestSearch(e.target.value)}
                                            style={{ 
                                                width: '100%',
                                                height: '35px', 
                                                fontSize: '13px',
                                                padding: '0 35px 0 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                        <i className="fa fa-magnifying-glass" style={{position:'absolute', right:'12px', top: '50%', transform: 'translateY(-50%)', color:'#94a3b8', fontSize:'14px'}}></i>
                                    </div>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                    {availableTests.map(t => (
                                        <div 
                                            key={t._id} 
                                            onClick={() => handleTestToggle(t)}
                                            style={{ 
                                                padding: '15px 20px', 
                                                borderBottom: '1px solid #f1f5f9', 
                                                cursor: 'pointer',
                                                background: selectedTests.find(st => st._id === t._id) ? '#eff6ff' : 'white',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                transition: 'background 0.1s'
                                            }}
                                            onMouseOver={(e) => { if(!selectedTests.find(st => st._id === t._id)) e.currentTarget.style.background = '#f8fafc' }}
                                            onMouseOut={(e) => { if(!selectedTests.find(st => st._id === t._id)) e.currentTarget.style.background = 'white' }}
                                        >
                                            <div>
                                                <div style={{fontWeight:600, fontSize: '15px', color: '#1e293b'}}>{t.name}</div>
                                                <div style={{fontSize:'13px', color:'#64748b', marginTop:'2px'}}>{t.department?.name}</div>
                                            </div>
                                            <div style={{fontWeight:600, color:'#3b82f6'}}>₹{t.price}</div>
                                        </div>
                                    ))}
                                    {availableTests.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>Start typing to search tests</div>}
                                </div>
                            </div>
                            <div style={{ width: '300px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontWeight: 600, marginBottom: '15px', fontSize: '16px', color: '#1e293b', flexShrink: 0 }}>Selected Tests ({selectedTests.length})</div>
                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
                                    {selectedTests.map(t => (
                                        <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #e2e8f0', alignItems: 'center' }}>
                                            <span style={{ color: '#334155' }}>{t.name}</span>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 500 }}>₹{t.price}</span>
                                                <button 
                                                    onClick={() => handleTestToggle(t)} 
                                                    style={{ 
                                                        color: '#ef4444', 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        background: '#fee2e2', 
                                                        width: '24px', 
                                                        height: '24px', 
                                                        borderRadius: '4px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center' 
                                                    }}
                                                >
                                                    <i className="fa fa-trash-can" style={{ fontSize: '12px' }}></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ paddingTop: '10px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 600, flexShrink: 0 }}>
                                    <span>Total</span>
                                    <span>₹{calculateTotal()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUMMARY - FIXED HEIGHT, SCROLL */}
                    {step === 4 && (
                        <div style={{ display: 'flex', gap: '30px', height: '100%', overflow: 'hidden' }}>
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>Patient Details</h3>
                                    {patientMode === 'create' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                                            <div><strong>Name:</strong> {newPatient.title} {newPatient.firstName} {newPatient.lastName}</div>
                                            <div><strong>Gender:</strong> {newPatient.gender}</div>
                                            <div><strong>Age:</strong> {newPatient.age}</div>
                                            <div><strong>Mobile:</strong> {newPatient.mobile}</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                                            <div><strong>Name:</strong> {selectedPatient?.title} {selectedPatient?.firstName} {selectedPatient?.lastName}</div>
                                            <div><strong>Gender:</strong> {selectedPatient?.gender}</div>
                                            <div><strong>Age:</strong> {selectedPatient?.age}</div>
                                            <div><strong>Mobile:</strong> {selectedPatient?.mobile}</div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>Doctor Details</h3>
                                    {selectedDoctor === 'SELF' ? (
                                        <div><strong>SELF</strong></div>
                                    ) : (
                                        <div><strong>Name:</strong> Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</div>
                                    )}
                                </div>
                            </div>

                             <div style={{ width: '350px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content', maxHeight: '100%', overflowY: 'auto' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Payment Summary</h3>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#64748b' }}>Total Amount</span>
                                    <span style={{ fontWeight: 600 }}>₹{calculateTotal()}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                        <span style={{ color: '#64748b' }}>Discount</span>
                                        <select 
                                            value={discountType} 
                                            onChange={(e) => setDiscountType(e.target.value as any)}
                                            style={{fontSize:'11px', padding:'2px', border:'1px solid #cbd5e1', borderRadius:'4px', color:'#475569'}}
                                        >
                                            <option value="AMOUNT">₹</option>
                                            <option value="PERCENTAGE">%</option>
                                        </select>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={discount} 
                                        onChange={e => setDiscount(Number(e.target.value))}
                                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                    />
                                </div>
                                {discountType === 'PERCENTAGE' && discount > 0 && (
                                     <div style={{textAlign:'right', fontSize:'12px', color:'#16a34a', marginBottom:'10px'}}>
                                        - ₹{calculateDiscountAmount()}
                                     </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ color: '#64748b' }}>Paid Amount</span>
                                     <input 
                                        type="number" 
                                        value={paidAmount} 
                                        onChange={e => setPaidAmount(Number(e.target.value))}
                                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
                                    <span>Due Amount</span>
                                    <span>₹{calculateFinalAmount()}</span>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>Payment Type</label>
                                    <select 
                                        value={paymentType} 
                                        onChange={e => setPaymentType(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="NET_BANKING">Net Banking</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={handleSubmit} 
                                    disabled={loading}
                                    style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Processing...' : 'Generate Bill'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                     {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Back</button>
                     ) : (
                         <div></div> 
                     )}
                     
                     {step < 4 && (
                        <button onClick={handleNext} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Next</button>
                     )}
                </div>

            </div>
        </div>
    );
}
