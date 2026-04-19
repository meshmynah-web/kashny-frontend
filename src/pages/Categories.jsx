import { useState, useEffect } from 'react';
import axios from '../config';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editId, setEditId] = useState(null);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        try {
            if (editId) {
                await axios.put(`/api/categories/${editId}`, { name, description });
                toast.success("Category updated");
            } else {
                await axios.post('/api/categories', { name, description });
                toast.success("Category created");
            }
            setName('');
            setDescription('');
            setEditId(null);
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.error || "An error occurred");
        }
    };

    const handleEdit = (cat) => {
        setName(cat.name);
        setDescription(cat.description || '');
        setEditId(cat.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            toast.success("Category deleted");
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.error || "Cannot delete category");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">Categories Management</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 className="mb-4">{editId ? 'Edit Category' : 'Add New Category'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <label className="form-label">Category Name</label>
                            <div className="input-wrapper">
                                <Tag className="input-icon" size={20} />
                                <input type="text" className="form-input" required
                                    value={name} onChange={e => setName(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="form-group mb-4">
                            <label className="form-label">Description (Optional)</label>
                            <textarea className="form-input" rows="3"
                                value={description} onChange={e => setDescription(e.target.value)} 
                                placeholder="E.g., All dairy related products..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary">
                                {editId ? <Edit2 size={20} /> : <Plus size={20} />} 
                                {editId ? 'Update' : 'Add Category'}
                            </button>
                            {editId && (
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => { setEditId(null); setName(''); setDescription(''); }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4">Category List</h3>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '1rem', width: '60px' }}>ID</th>
                                        <th style={{ padding: '1rem' }}>Category Name</th>
                                        <th style={{ padding: '1rem' }}>Description</th>
                                        <th style={{ padding: '1rem', width: '150px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No categories found. Start creating one.</td></tr>
                                    ) : categories.map(cat => (
                                        <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{cat.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{cat.name}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{cat.description || '-'}</td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '10px' }}>
                                                <button onClick={() => handleEdit(cat)} style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px 10px', borderRadius: '6px', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }} title="Edit"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(cat.id)} style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '6px', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
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
