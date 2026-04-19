import { useState, useEffect } from 'react';
import axios from '../config';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, Circle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '', username: '', email: '', phone_number: '', password: '', role: 'Cashier', status: 'active'
    });

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Don't update pass if empty
                await axios.put(`/api/users/${editId}`, payload);
                toast.success("User updated");
            } else {
                if (!formData.password) return toast.error("Password is required for new users");
                await axios.post('/api/users', formData);
                toast.success("User added successfully");
            }
            handleCancel();
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error occurred");
        }
    };

    const handleEdit = (u) => {
        setFormData({
            full_name: u.full_name, username: u.username, email: u.email, 
            phone_number: u.phone_number, password: '', role: u.role, status: u.status
        });
        setEditId(u.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to completely remove this user? Consider disabling them instead.")) return;
        try {
            await axios.delete(`/api/users/${id}`);
            toast.success("User removed");
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Cannot delete user");
        }
    };

    const handleCancel = () => {
        setEditId(null);
        setFormData({ full_name: '', username: '', email: '', phone_number: '', password: '', role: 'Cashier', status: 'active' });
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">Staff & User Management</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 className="mb-4">{editId ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                    <form onSubmit={handleSubmit}>
                        {[ 
                            { label: 'Full Name', key: 'full_name', type: 'text', req: true },
                            { label: 'Username', key: 'username', type: 'text', req: true },
                            { label: 'Email', key: 'email', type: 'email', req: true },
                            { label: 'Phone Number', key: 'phone_number', type: 'text', req: true }
                        ].map(f => (
                            <div className="form-group mb-3" key={f.key}>
                                <label className="form-label">{f.label}</label>
                                <input type={f.type} className="form-input" required={f.req}
                                    value={formData[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} 
                                />
                            </div>
                        ))}
                        
                        <div className="form-group mb-3">
                            <label className="form-label">{editId ? 'New Password (Leave blank to keep)' : 'Password'}</label>
                            <div className="input-wrapper">
                                <KeyRound className="input-icon" size={20} />
                                <input type="text" className="form-input" required={!editId}
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">Role</label>
                            <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="Cashier">Cashier</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editId ? <Edit2 size={20} /> : <Plus size={20} />} 
                                {editId ? 'Save Changes' : 'Create User'}
                            </button>
                            {editId && (
                                <button type="button" className="btn btn-danger" onClick={handleCancel}>Cancel</button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="flex-between mb-4">
                        <h3>Team Members ({users.length})</h3>
                        <UsersIcon size={24} color="var(--primary-color)" />
                    </div>
                    {loading ? (
                        <div className="text-center text-muted">Loading network...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Role</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Last Login</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    background: u.role === 'Admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                                                    color: u.role === 'Admin' ? '#8b5cf6' : '#10b981',
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    {u.role === 'Admin' && <Shield size={12} />} {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Circle size={10} fill={u.status === 'active' ? '#10b981' : '#ef4444'} color={u.status === 'active' ? '#10b981' : '#ef4444'} />
                                                    <span style={{ textTransform: 'capitalize', color: u.status === 'active' ? 'inherit' : 'var(--danger)' }}>{u.status}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '10px' }}>
                                                <button onClick={() => handleEdit(u)} style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px 10px', borderRadius: '6px', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(u.id)} style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '6px', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
