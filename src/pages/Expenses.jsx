import { useState, useEffect } from 'react';
import axios from '../config';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', amount: '', category: 'General', description: '', date: '' });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get('/api/finance/expenses');
            setExpenses(res.data);
        } catch (err) {
            toast.error("Failed to fetch expenses");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/finance/expenses', formData);
            toast.success("Expense added");
            setShowModal(false);
            setFormData({ title: '', amount: '', category: 'General', description: '', date: '' });
            fetchExpenses();
        } catch (err) {
            toast.error("Failed to add expense");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await axios.delete(`/api/finance/expenses/${id}`);
            toast.success("Expense deleted");
            fetchExpenses();
        } catch (err) {
            toast.error("Failed to delete expense");
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading expenses...</div>;

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Business Expenses</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Add Expense
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #ef4444' }}>
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444' }}>
                    <DollarSign size={24} />
                </div>
                <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Recorded Expenses</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>KSh {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '10px' }}>Date</th>
                            <th style={{ padding: '10px' }}>Title</th>
                            <th style={{ padding: '10px' }}>Category</th>
                            <th style={{ padding: '10px' }}>Description</th>
                            <th style={{ padding: '10px' }}>Amount (KSh)</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No expenses recorded yet.</td></tr>
                        ) : expenses.map(exp => (
                            <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px 10px' }}>{new Date(exp.date).toLocaleDateString()}</td>
                                <td style={{ padding: '12px 10px', fontWeight: 500 }}>{exp.title}</td>
                                <td style={{ padding: '12px 10px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }}>
                                        {exp.category}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{exp.description || '-'}</td>
                                <td style={{ padding: '12px 10px', color: '#ef4444', fontWeight: 'bold' }}>{parseFloat(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '12px' }}>
                        <h3 className="mb-4">Add New Expense</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label className="form-label">Expense Title</label>
                                <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Electricity Bill" />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Amount (KSh)</label>
                                <input type="number" step="0.01" className="form-input" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Utilities</option>
                                    <option>Payroll</option>
                                    <option>Maintenance</option>
                                    <option>Marketing</option>
                                    <option>General</option>
                                </select>
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Date</label>
                                <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">Description (Optional)</label>
                                <textarea className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
