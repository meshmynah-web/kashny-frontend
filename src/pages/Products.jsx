import { useState, useEffect } from 'react';
import axios from '../config';
import { Package, Plus, Edit2, Trash2, Search, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    const initialForm = { product_name: '', barcode: '', category_id: '', price: '', cost_price: '', stock_quantity: 0, tax_rate: 0, status: 'active' };
    const [formData, setFormData] = useState(initialForm);
    const [imageFile, setImageFile] = useState(null);
    const [editId, setEditId] = useState(null);

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/categories')
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (err) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (imageFile) data.append('image', imageFile);

        try {
            if (editId) {
                await axios.put(`/api/products/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success("Product updated");
            } else {
                await axios.post('/api/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success("Product created");
            }
            setShowModal(false);
            setFormData(initialForm);
            setImageFile(null);
            setEditId(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving product");
        }
    };

    const handleEdit = (prod) => {
        setFormData({
            product_name: prod.product_name, barcode: prod.barcode || '', category_id: prod.category_id || '',
            price: prod.price, cost_price: prod.cost_price, stock_quantity: prod.stock_quantity,
            tax_rate: prod.tax_rate, status: prod.status || 'active'
        });
        setEditId(prod.product_id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await axios.delete(`/api/products/${id}`);
            toast.success("Product deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete product");
        }
    };

    const filtered = products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div className="flex-between mb-4">
                <h2>Products</h2>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => { setFormData(initialForm); setEditId(null); setShowModal(true); }}>
                    <Plus size={20} /> Add Product
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
                <Search className="text-muted" size={20} style={{ marginRight: '10px' }} />
                <input type="text" placeholder="Search by name or barcode..." 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '1rem' }}
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '1rem', width: '60px' }}>Image</th>
                            <th style={{ padding: '1rem' }}>Product Name</th>
                            <th style={{ padding: '1rem' }}>Category</th>
                            <th style={{ padding: '1rem' }}>Price</th>
                            <th style={{ padding: '1rem' }}>Stock</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', width: '120px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr> : 
                         filtered.length === 0 ? <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No products found</td></tr> :
                         filtered.map(p => (
                            <tr key={p.product_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>
                                    {p.product_image ? <img src={`${p.product_image}`} alt={p.product_name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '6px' }} /> : 
                                    <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="var(--text-muted)" /></div>}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>
                                    <div>{p.product_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.barcode || 'No barcode'}</div>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.category_name || 'Uncategorized'}</td>
                                <td style={{ padding: '1rem' }}>${p.price}</td>
                                <td style={{ padding: '1rem', color: p.stock_quantity <= 5 ? 'var(--danger)' : 'inherit' }}>{p.stock_quantity}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', background: p.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: p.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                                        {p.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleEdit(p)} style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px 10px', borderRadius: '6px', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(p.product_id)} style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '6px', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 className="mb-4">{editId ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Product Name *</label>
                                    <input type="text" className="form-input" style={{ paddingLeft: '1rem' }} required value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Barcode</label>
                                    <input type="text" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-input" style={{ paddingLeft: '1rem' }} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Selling Price *</label>
                                    <input type="number" step="0.01" className="form-input" style={{ paddingLeft: '1rem' }} required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cost Price *</label>
                                    <input type="number" step="0.01" className="form-input" style={{ paddingLeft: '1rem' }} required value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Initial Stock</label>
                                    <input type="number" className="form-input" style={{ paddingLeft: '1rem' }} disabled={!!editId} value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tax Rate (%)</label>
                                    <input type="number" step="0.01" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Product Image</label>
                                    <input type="file" accept="image/*" className="form-input" style={{ paddingLeft: '1rem' }} onChange={e => setImageFile(e.target.files[0])} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: 'auto' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>{editId ? 'Update Product' : 'Save Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
