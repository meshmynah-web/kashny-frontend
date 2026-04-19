import { useState, useEffect } from 'react';
import axios from '../config';
import { Clock, DollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Shift() {
    const [shiftInfo, setShiftInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');

    const fetchShift = async () => {
        try {
            const res = await axios.get('/api/shifts/current');
            setShiftInfo(res.data);
            if (res.data.active && res.data.shift.closing_cash) {
                setClosingCash(res.data.shift.closing_cash);
            } else if (res.data.active) {
                setClosingCash((parseFloat(res.data.shift.opening_cash) + parseFloat(res.data.sales.shift_sales)).toFixed(2));
            }
        } catch (err) {
            toast.error("Failed to load shift info");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShift(); }, []);

    const startShift = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/shifts/start', { opening_cash: openingCash });
            toast.success("Shift started successfully!");
            setOpeningCash('');
            fetchShift();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to start shift");
        }
    };

    const endShift = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/shifts/end', { closing_cash: closingCash });
            toast.success("Shift ended successfully!");
            fetchShift();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to end shift");
        }
    };

    if (loading) return <div style={{padding:'3rem', textAlign: 'center'}}>Loading shift status...</div>;

    return (
        <div style={{ padding: '2rem', animation: 'fadeIn 0.5s', maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="mb-4">My Shift Management</h2>

            {shiftInfo.active ? (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '20px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '50%', border: '2px solid rgba(16,185,129,0.3)' }}>
                            <Clock size={36} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Shift Active</h3>
                            <p className="text-muted" style={{ margin: '5px 0 0 0' }}>Started at {new Date(shiftInfo.shift.shift_start_time).toLocaleString()}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                            <div className="text-muted mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={18}/> Opening Cash</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${parseFloat(shiftInfo.shift.opening_cash).toFixed(2)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                            <div className="text-muted mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18}/> Transactions</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{shiftInfo.sales.transaction_count}</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <div className="text-success mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={18}/> Total Sales</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)' }}>${parseFloat(shiftInfo.sales.shift_sales).toFixed(2)}</div>
                        </div>
                    </div>

                    <form onSubmit={endShift} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                        <h4 className="mb-4">End Shift & Drawer Checkout</h4>
                        <div className="form-group">
                            <label className="form-label mb-2">Actual Drawer Cash Count ($)</label>
                            <div className="input-wrapper">
                                <DollarSign className="input-icon" size={24} style={{ top: '12px' }} />
                                <input type="number" step="0.01" className="form-input" style={{ padding: '1rem 1rem 1rem 3rem', fontSize: '1.2rem', fontWeight: 'bold' }} required
                                    value={closingCash} onChange={e => setClosingCash(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)', width: 'auto', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                                End My Shift
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '2rem' }}>
                        <Clock size={64} color="var(--text-muted)" />
                    </div>
                    <h3 className="mb-2" style={{ fontSize: '2rem' }}>No Active Shift</h3>
                    <p className="text-muted mb-4">You need to start a shift to access the POS sales register.</p>
                    
                    <form onSubmit={startShift} style={{ maxWidth: '350px', margin: '0 auto', textAlign: 'left' }}>
                        <div className="form-group mb-4">
                            <label className="form-label" style={{ fontSize: '1.1rem' }}>Opening Drawer Cash</label>
                            <div className="input-wrapper">
                                <DollarSign className="input-icon" size={24} style={{ top: '12px' }} />
                                <input type="number" step="0.01" className="form-input" style={{ padding: '1rem 1rem 1rem 3rem', fontSize: '1.2rem', fontWeight: 'bold' }} required
                                    value={openingCash} onChange={e => setOpeningCash(e.target.value)} 
                                    placeholder="0.00" />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                            Start Shift
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
