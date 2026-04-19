import { useState, useEffect } from 'react';
import axios from '../config';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ NEW: Filter state
    const [filter, setFilter] = useState('all');

    // adjust stock modal
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustMode, setAdjustMode] = useState('add');
    const [adjustAmount, setAdjustAmount] = useState(1);
    const [adjustReason, setAdjustReason] = useState('');

    const fetchData = async () => {
        try {
            const [prodRes, logRes] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/products/inventory/logs')
            ]);
            setProducts(prodRes.data);
            setLogs(logRes.data);
        } catch (err) {
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const amount = adjustMode === 'subtract' ? -Math.abs(adjustAmount) : Math.abs(adjustAmount);

        try {
            await axios.post(`/api/products/${selectedProduct.product_id}/adjust-stock`, {
                change_amount: amount,
                reason: adjustReason || (adjustMode === 'add' ? 'Stock In' : 'Stock Out')
            });
            toast.success("Stock updated");
            setShowModal(false);
            setAdjustAmount(1);
            setAdjustReason('');
            fetchData();
        } catch (err) {
            toast.error("Failed to update stock");
        }
    };

    const lowStockProducts = products.filter(p => p.stock_quantity <= 10);

    // ✅ NEW: Stats
    const totalProducts = products.length;
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10);

    // ✅ NEW: Filtering logic
    let filteredProducts = products;
    if (filter === 'low') filteredProducts = lowStock;
    if (filter === 'out') filteredProducts = outOfStockProducts;

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">Inventory Management</h2>

            {/* ✅ SUMMARY CARDS */}
            {/* ✅ ENHANCED SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

                <div className="glass-panel" style={{ padding: '1rem', borderTop: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#3b82f622', padding: '10px', borderRadius: '10px', color: '#3b82f6' }}>
                        📦
                    </div>
                    <div>
                        <div className="text-muted">Total Products</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalProducts}</div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', borderTop: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#f59e0b22', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
                        ⚠️
                    </div>
                    <div>
                        <div className="text-muted">Low Stock</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            {lowStock.length}
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', borderTop: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#ef444422', padding: '10px', borderRadius: '10px', color: '#ef4444' }}>
                        ❌
                    </div>
                    <div>
                        <div className="text-muted">Out of Stock</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>
                            {outOfStockProducts.length}
                        </div>
                    </div>
                </div>

            </div>

            {/* ✅ FILTER BUTTONS */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['all', 'low', 'out'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: filter === f ? 'var(--primary-color)' : 'transparent',
                            color: filter === f ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 className="mb-3" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={20} /> Low Stock Alerts
                        </h3>
                        {lowStockProducts.length === 0 ? (
                            <p className="text-muted">All stock levels are optimal.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {lowStockProducts.map(p => (
                                    <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{p.product_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.barcode || 'No barcode'}</div>
                                        </div>
                                        <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                                            {p.stock_quantity} left
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                        <h3 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={20} /> Recent Stock Activity
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {logs.length === 0 ? <p className="text-muted">No recent activity</p> :
                                logs.slice(0, 15).map(log => (
                                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ padding: '8px', borderRadius: '50%', background: log.change_amount > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: log.change_amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            {log.change_amount > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{log.product_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.reason || 'Manual Update'} by {log.user_name}</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: log.change_amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="mb-4">Current Stock Levels</h3>

                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Product Name</th>
                                    <th style={{ padding: '1rem' }}>Category</th>
                                    <th style={{ padding: '1rem' }}>Current Stock</th>
                                    <th style={{ padding: '1rem', width: '150px' }}>Adjust</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.product_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            <div>{p.product_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.barcode || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.category_name || 'Uncategorized'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: p.stock_quantity <= 10 ? 'var(--danger)' : 'var(--text-main)' }}>
                                            {p.stock_quantity}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => { setSelectedProduct(p); setAdjustAmount(1); setShowModal(true); }} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}>
                                                Adjust
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && selectedProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <h3 className="mb-2">Adjust Stock</h3>
                        <p className="text-muted mb-4">{selectedProduct.product_name} (Current: {selectedProduct.stock_quantity})</p>

                        <form onSubmit={handleAdjustSubmit}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <label style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${adjustMode === 'add' ? 'var(--success)' : 'var(--glass-border)'}`, background: adjustMode === 'add' ? 'rgba(16,185,129,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                                    <input type="radio" name="mode" style={{ display: 'none' }} checked={adjustMode === 'add'} onChange={() => setAdjustMode('add')} />
                                    <ArrowUpRight size={18} color="var(--success)" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Add
                                </label>
                                <label style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${adjustMode === 'subtract' ? 'var(--danger)' : 'var(--glass-border)'}`, background: adjustMode === 'subtract' ? 'rgba(239,68,68,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                                    <input type="radio" name="mode" style={{ display: 'none' }} checked={adjustMode === 'subtract'} onChange={() => setAdjustMode('subtract')} />
                                    <ArrowDownRight size={18} color="var(--danger)" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Subtract
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantity to {adjustMode}</label>
                                <input type="number" min="1" className="form-input" style={{ paddingLeft: '1rem' }} required value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Reason / Reference</label>
                                <input type="text" className="form-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. Supplier delivery, Damaged goods" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: 'auto' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto', background: adjustMode === 'add' ? 'var(--success)' : 'var(--danger)' }}>Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}