import { useState, useEffect } from 'react';
import axios from '../config';
import { Clock, DollarSign, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminShifts() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/shifts')
            .then(res => setShifts(res.data))
            .catch(() => toast.error("Failed to load shift records"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading shift data...</div>;

    const totalOpen = shifts.filter(s => s.status === 'open').length;
    const totalClosed = shifts.filter(s => s.status === 'closed').length;
    const allTimeRev = shifts.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0);

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">Shift Management</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Open Shifts</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalOpen} Active</div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#f59e0b' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Shifts Closed</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalClosed}</div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #6366f1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>All-time Revenue</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>KSh {allTimeRev.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Cashier</th>
                            <th style={{ padding: '1rem' }}>Start Time</th>
                            <th style={{ padding: '1rem' }}>End Time</th>
                            <th style={{ padding: '1rem' }}>Opening Cash</th>
                            <th style={{ padding: '1rem' }}>Closing Cash</th>
                            <th style={{ padding: '1rem' }}>Total Sales</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map(s => (
                            <tr key={s.shift_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>#{s.shift_id}</td>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} className="text-muted"/> {s.cashier_name}</td>
                                <td style={{ padding: '1rem' }}>{new Date(s.shift_start_time).toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>{s.shift_end_time ? new Date(s.shift_end_time).toLocaleString() : '-'}</td>
                                <td style={{ padding: '1rem' }}>{parseFloat(s.opening_cash).toLocaleString()}</td>
                                <td style={{ padding: '1rem', color: s.status === 'open' ? 'var(--text-muted)' : 'inherit' }}>{s.status === 'open' ? 'Not closed' : parseFloat(s.closing_cash).toLocaleString()}</td>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{parseFloat(s.total_sales || 0).toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem',
                                        background: s.status === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                        color: s.status === 'open' ? '#10b981' : 'var(--text-muted)'
                                    }}>
                                        {s.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {shifts.length === 0 && (
                            <tr><td colSpan="8" className="text-center text-muted" style={{ padding: '2rem' }}>No shift records found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
