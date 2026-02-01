'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Test {
    _id: string;
    name: string;
    price: number;
    department?: { name: string };
}

interface BillData {
    _id: string;
    patientId: string;
    doctorId: string;
    tests: {
        test: { _id: string, name: string, price: number };
        price: number;
    }[];
    totalAmount: number;
    discountAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentType: string;
    discountType: 'AMOUNT' | 'PERCENTAGE';
    status: string;
}

export default function AddTestPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Existing Bill Data
    const [bill, setBill] = useState<BillData | null>(null);

    // Test Selection State
    const [testSearch, setTestSearch] = useState('');
    const [availableTests, setAvailableTests] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<Test[]>([]);
    const [initialTestIds, setInitialTestIds] = useState<Set<string>>(new Set());

    // Financials State
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT');
    const [existingPaidAmount, setExistingPaidAmount] = useState(0); 
    const [additionalPayment, setAdditionalPayment] = useState(0);
    const [paymentType, setPaymentType] = useState('CASH');
    // For simplicity, we will load existing paidAmount. User can increase it if they pay more now.

    useEffect(() => {
        if (id) fetchBill(id);
    }, [id]);

    // Fetch Bill and Pre-fill State
    async function fetchBill(billId: string) {
        try {
            const res = await fetch(`/api/v1/bills/${billId}`);
            const data = await res.json();
            if (data.status === 200) {
                const b = data.data;
                setBill(b);
                
                // Map existing tests to selectedTests format
                // SAFELY map: ensure t.test exists (population might fail if test deleted)
                if (Array.isArray(b.tests)) {
                    const existing = b.tests
                        .filter((t: any) => t.test && t.test._id)
                        .map((t: any) => ({
                            _id: t.test._id,
                            name: t.test.name,
                            price: t.price
                        }));
                    setSelectedTests(existing);
                }
                
                // Set financials
                setDiscount(b.discountAmount); 
                setDiscountType(b.discountType || 'AMOUNT');
                setExistingPaidAmount(b.paidAmount);
                
                // Track initial tests
                if (Array.isArray(b.tests)) {
                    const ids = new Set<string>(b.tests.filter((t: any) => t.test).map((t: any) => t.test._id));
                    setInitialTestIds(ids);
                }

            } else {
                toast.error('Failed to load bill');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error loading bill. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Test Search Effect
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
            } else {
                setAvailableTests([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [testSearch]);


    const handleTestToggle = (t: Test) => {
        if (selectedTests.find(st => st._id === t._id)) {
            // Check if it's an initial test
            if (initialTestIds.has(t._id)) {
                toast.error('Cannot remove existing tests from this screen.');
                return;
            }
            setSelectedTests(selectedTests.filter(st => st._id !== t._id));
        } else {
            setSelectedTests([...selectedTests, t]);
        }
    };

    // Calculations
    const calculateTotal = () => selectedTests.reduce((acc, t) => acc + t.price, 0);

    const calculateDiscountAmount = () => {
        const total = calculateTotal();
        if (discountType === 'PERCENTAGE') {
            return Math.round((total * discount) / 100);
        }
        return discount; // Assuming discount input is amount if type is AMOUNT
    };

    const calculateFinalAmount = () => {
        const totalPaid = existingPaidAmount + additionalPayment;
        // Ensure due amount doesn't go negative visually, though logically it might mean refund
        return Math.max(0, calculateTotal() - calculateDiscountAmount() - totalPaid);
    };

    const handleSubmit = async () => {
        if (!bill) return;
        setSubmitting(true);
        try {
            const totalAmount = calculateTotal();
            const discountAmt = calculateDiscountAmount(); // This is the calculated value in currency
            const totalPaid = existingPaidAmount + additionalPayment;
            
            // Validation: Prevent overpayment
            if (totalPaid > (totalAmount - discountAmt)) {
                toast.error('Total paid amount cannot exceed the bill amount');
                setSubmitting(false);
                return;
            }

            const dueAmt = Math.max(0, totalAmount - discountAmt - totalPaid);

            const payload = {
                tests: selectedTests.map(t => ({ test: t._id, price: t.price })),
                totalAmount,
                discountAmount: discountAmt,
                paidAmount: totalPaid,
                dueAmount: dueAmt,
                discountType,
                // If paid changed, we update status check
                status: dueAmt > 0 ? 'PARTIAL' : 'PAID', // Simple logic. If 0 due, match PAID.
                paymentType: bill.paymentType, // Keep initial payment type
                duePaymentType: paymentType // Capture new payment type for the additional amount
            };

            const res = await fetch(`/api/v1/bills/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.status === 200) {
                toast.success('Bill updated successfully');
                router.push(`/bills/${id}`); // Redirect to View Bill
            } else {
                toast.error(data.error || 'Failed to update bill');
            }

        } catch (err) {
            console.error(err);
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading...</div>;
    if (!bill) return <div style={{padding:'40px', textAlign:'center'}}>Bill not found</div>;

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <Toaster position="top-right" />
            
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <Link href={`/bills/${id}`} style={{ marginRight: '15px', color: '#64748b', textDecoration: 'none' }}>
                        <i className="fa fa-arrow-left"></i> Back
                    </Link>

                </div>

                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* LEFT: Test Search */}
                    <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                         <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#334155' }}>Search & Add Tests</h3>
                         
                         <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                            <input 
                                type="text" 
                                placeholder="Search Tests..."
                                value={testSearch}
                                onChange={(e) => setTestSearch(e.target.value)}
                                style={{ 
                                    width: '100%',
                                    padding: '12px 35px 12px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                            <i className="fa fa-magnifying-glass" style={{position:'absolute', right:'12px', top: '50%', transform: 'translateY(-50%)', color:'#94a3b8', fontSize:'14px'}}></i>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {availableTests.map(t => (
                                <div 
                                    key={t._id} 
                                    onClick={() => handleTestToggle(t)}
                                    style={{ 
                                        padding: '12px', 
                                        borderBottom: '1px solid #f1f5f9', 
                                        cursor: 'pointer', 
                                        background: selectedTests.find(st => st._id === t._id) ? '#eff6ff' : 'white',
                                        opacity: initialTestIds.has(t._id) ? 0.6 : 1,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderRadius: '6px',
                                        marginBottom: '5px'
                                    }}
                                >
                                    <div>
                                        <div style={{fontWeight:600, color: '#1e293b'}}>{t.name}</div>
                                        {t.department && <div style={{fontSize:'12px', color:'#64748b'}}>{t.department.name}</div>}
                                    </div>
                                    <div style={{fontWeight:600, color:'#3b82f6'}}>₹{t.price}</div>
                                </div>
                            ))}
                            {availableTests.length === 0 && testSearch.length > 0 && (
                                <div style={{textAlign:'center', color:'#94a3b8', padding:'20px'}}>No tests found</div>
                            )}
                             {availableTests.length === 0 && testSearch.length === 0 && (
                                <div style={{textAlign:'center', color:'#94a3b8', padding:'20px'}}>Type to search...</div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Summary */}
                    <div style={{ width: '350px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#334155' }}>Bill Summary</h3>
                        
                        <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                            {selectedTests.map(t => (
                                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                                    <span style={{flex: 1}}>{t.name}</span>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <span style={{fontWeight: 600}}>₹{t.price}</span>
                                        {initialTestIds.has(t._id) ? (
                                            <i className="fa fa-lock" style={{color:'#94a3b8', marginLeft: '5px'}} title="Existing Test"></i>
                                        ) : (
                                            <i onClick={() => handleTestToggle(t)} className="fa fa-times" style={{color:'#ef4444', cursor:'pointer'}}></i>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {selectedTests.length === 0 && <div style={{color:'#94a3b8', fontStyle:'italic'}}>No tests selected</div>}
                        </div>

                        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                            <div className="summary-row" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                <span>Subtotal</span>
                                <span>₹{calculateTotal()}</span>
                            </div>

                            <div className="summary-row" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', alignItems:'center'}}>
                                <span>Discount</span>
                                <div style={{display:'flex', gap:'5px'}}>
                                    <input 
                                        type="number" 
                                        value={discount} 
                                        onChange={(e) => setDiscount(Number(e.target.value))}
                                        style={{width:'60px', padding:'4px', border:'1px solid #cbd5e1', borderRadius:'4px'}}
                                    />
                                    <select 
                                        value={discountType} 
                                        onChange={(e) => setDiscountType(e.target.value as any)}
                                        style={{padding:'4px', border:'1px solid #cbd5e1', borderRadius:'4px'}}
                                    >
                                        <option value="AMOUNT">₹</option>
                                        <option value="PERCENTAGE">%</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="summary-row" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', alignItems:'center'}}>
                                <span>Existing Paid</span>
                                <span>₹{existingPaidAmount}</span>
                            </div>

                            <div className="summary-row" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', alignItems:'center'}}>
                                <span style={{color: '#3b82f6', fontWeight: 600}}>+ Payment</span>
                                <div style={{display:'flex', gap:'5px'}}>
                                    <input 
                                        type="number" 
                                        value={additionalPayment} 
                                        onChange={(e) => setAdditionalPayment(Number(e.target.value))}
                                        min="0"
                                        style={{width:'80px', padding:'4px', border:'1px solid #3b82f6', borderRadius:'4px', textAlign:'right'}}
                                    />
                                    <select
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                        style={{padding:'4px', border:'1px solid #cbd5e1', borderRadius:'4px', fontSize:'12px'}}
                                    >
                                        <option value="CASH">CASH</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">CARD</option>
                                    </select>
                                </div>
                            </div>


                             <div className="summary-row" style={{display:'flex', justifyContent:'space-between', marginTop:'15px', fontWeight: 700, fontSize:'16px', color:'#1e293b'}}>
                                <span>Due Amount</span>
                                <span style={{color: calculateFinalAmount() > 0 ? '#ef4444' : '#22c55e'}}>₹{calculateFinalAmount()}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '12px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? 'Updating...' : 'Update Bill'}
                        </button>

                    </div>

                </div>
            </div>
        </div>
    );
}
