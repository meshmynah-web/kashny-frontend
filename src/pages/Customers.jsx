import { useState, useEffect } from 'react';
import axios from '../config';
import { Users, Search, Plus, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', loyalty_points: 0 });

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('/api/customers');
            setCustomers(res.data);
        } catch (err) {
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/customers', formData);
            toast.success("Customer added successfully");
            setShowForm(false);
            setFormData({ name: '', phone: '', email: '', loyalty_points: 0 });
            fetchCustomers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving customer");
        }
    };

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm)
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div className="flex-between mb-4">
                <h2>Customer CRM (Cashier Mode)</h2>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormData({name:'', phone:'', email:'', loyalty_points:0}); }}>
                    {showForm ? 'Cancel' : <><Plus size={20} /> Add Customer</>}
                </button>
            </div>

            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 className="mb-4">Add New Customer</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="text" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email (Optional)</label>
                            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary">Save Customer Data</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div className="input-wrapper" style={{ maxWidth: '400px' }}>
                    <Search className="input-icon" size={20} />
                    <input type="text" className="form-input" placeholder="Search customers by name or phone..." 
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                {loading ? (
                    <div className="text-center text-muted">Loading CRM data...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Contact</th>
                                <th style={{ padding: '1rem' }}>Total Spent</th>
                                <th style={{ padding: '1rem' }}>Visits</th>
                                <th style={{ padding: '1rem' }}>Loyalty Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No customers found</td></tr>
                            ) : filtered.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{c.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{c.phone}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                        KSh {parseFloat(c.total_spent || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{c.total_visits || 0}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '20px', color: '#10b981', fontWeight: 600 }}>
                                            <Award size={16} /> {c.loyalty_points || 0}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
