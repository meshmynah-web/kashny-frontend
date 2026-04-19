import { useState, useEffect } from 'react';
import axios from '../config';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, PauseCircle, PlayCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import CheckoutModal from '../components/CheckoutModal';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // UI state
    const [showCheckout, setShowCheckout] = useState(false);
    const [showSuspended, setShowSuspended] = useState(false);

    // Cart logic
    const [cart, setCart] = useState([]);
    const [taxRate, setTaxRate] = useState(16);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [shiftInfo, setShiftInfo] = useState(null);
    const [recentSales, setRecentSales] = useState([]);
    const [showRecent, setShowRecent] = useState(false);
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes, sRes, custRes, shiftRes, salesRes] = await Promise.all([
                    axios.get('/api/products'),
                    axios.get('/api/categories'),
                    axios.get('/api/settings'),
                    axios.get('/api/customers').catch(() => ({ data: [] })),
                    axios.get('/api/shifts/current').catch(() => ({ data: { active: false } })),
                    axios.get('/api/sales').catch(() => ({ data: [] }))
                ]);
                setProducts(pRes.data.filter(p => p.status === 'active'));
                setCategories(cRes.data);
                if (sRes.data.tax_rate) setTaxRate(sRes.data.tax_rate);
                setCustomers(custRes.data);
                if (shiftRes.data.active) {
                    setShiftInfo(shiftRes.data);
                }
                // Only take cashier's last 5 sales
                if (shiftRes.data.active) {
                    const mySales = salesRes.data.filter(s => s.cashier_id === shiftRes.data.shift.cashier_id).slice(0, 5);
                    setRecentSales(mySales);
                }
            } catch (err) {
                toast.error("Error loading POS data");
            }
        };
        fetchData();
    }, []);

    const addToCart = (product) => {
        if (product.stock_quantity <= 0) {
            toast.error("Out of stock!");
            return;
        }
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.product_id);
            if (existing) {
                if (existing.qty >= product.stock_quantity) {
                    toast.error("Not enough stock available");
                    return prev;
                }
                return prev.map(item => item.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.product_id === id) {
                const newQty = item.qty + delta;
                if (newQty > item.stock_quantity) {
                    toast.error("Max stock reached");
                    return item;
                }
                if (newQty < 1) return item;
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(item => item.product_id !== id));

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const calculatedTotal = subtotal + taxAmount - parseFloat(discount || 0);
    const total = calculatedTotal > 0 ? calculatedTotal : 0;

    const suspendSale = () => {
        if (cart.length === 0) return;
        const suspended = JSON.parse(localStorage.getItem('suspended_sales') || '[]');
        suspended.push({ id: Date.now(), cart, total, discount: parseFloat(discount || 0), customer: selectedCustomer, date: new Date().toLocaleString() });
        localStorage.setItem('suspended_sales', JSON.stringify(suspended));
        setCart([]);
        setSelectedCustomer('');
        toast.success("Sale suspended");
    };

    const handleCheckoutComplete = (saleId) => {
        setCart([]);
        setShowCheckout(false);
        setSelectedCustomer('');
        setDiscount(0);
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search));
        const matchCat = selectedCategory ? p.category_id === parseInt(selectedCategory) : true;
        return matchSearch && matchCat;
    });

    return (
        <div style={{ display: 'flex', height: '100%', animation: 'fadeIn 0.5s' }}>
            <div style={{ flex: 1, minWidth: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="glass-panel" style={{ flex: 2, display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                        <Search className="text-muted" size={20} />
                        <input type="text" placeholder="Search product by name or barcode..."
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', padding: '1rem', outline: 'none' }}
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                        <select className="form-input" style={{ border: 'none', background: 'transparent', padding: '1rem' }} value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                            <option value="">Walk-in Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }} className="hide-scroll">
                    <button onClick={() => setSelectedCategory('')} style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: selectedCategory === '' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                        All items
                    </button>
                    {categories.map(c => (
                        <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: selectedCategory === c.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                            {c.name}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {filteredProducts.map(p => (
                            <div key={p.product_id} onClick={() => addToCart(p)} className="glass-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <div style={{ height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {p.product_image ? <img src={`${p.product_image}`} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={32} color="var(--text-muted)" />}
                                </div>
                                <div style={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: '1.2', marginTop: '0.5rem', flex: 1 }}>{p.product_name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>${parseFloat(p.price).toFixed(2)}</span>
                                    <span style={{ fontSize: '0.75rem', color: p.stock_quantity <= 5 ? 'var(--danger)' : 'var(--text-muted)' }}>{p.stock_quantity} in stock</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ width: '380px', borderRadius: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                {shiftInfo ? (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#10b981', display: 'flex', gap: '6px', alignItems: 'center' }}><PlayCircle size={16} /> Active Shift</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowSuspended(true)}>
                                    Suspended
                                </button>
                                <button className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowRecent(true)}>
                                    Recent Sales
                                </button>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Cashier: <strong>{shiftInfo.shift.cashier_id}</strong> | Started: {new Date(shiftInfo.shift.shift_start_time).toLocaleTimeString()}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                            <span>Tx: <strong>{shiftInfo.sales.transaction_count}</strong></span>
                            <span>Sales: <strong>KSh {parseFloat(shiftInfo.sales.shift_sales).toLocaleString()}</strong></span>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontWeight: 'bold' }}>
                        NO ACTIVE SHIFT. Please start a shift first.
                    </div>
                )}
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShoppingCart size={20} color="var(--primary-color)" />
                    <h3 style={{ margin: 0 }}>Current Sale</h3>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.product_id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.product_name}</div>
                                        <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>${parseFloat(item.price).toFixed(2)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px' }}>
                                        <button onClick={() => updateQty(item.product_id, -1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><Minus size={14} /></button>
                                        <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                                        <button onClick={() => updateQty(item.product_id, 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><Plus size={14} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        <span>Tax ({taxRate}%)</span>
                        <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'var(--warning)' }}>
                        <span>Discount</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '2px 8px' }}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            <input 
                                type="number" 
                                min="0"
                                step="0.01"
                                disabled={cart.length === 0}
                                style={{ width: '60px', background: 'transparent', border: 'none', color: 'white', textAlign: 'right', outline: 'none' }} 
                                value={discount} 
                                onChange={e => setDiscount(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--success)' }}>${total.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button className="btn" style={{ flex: 1, background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.5)' }} onClick={suspendSale} disabled={cart.length === 0 || !shiftInfo}>
                            <PauseCircle size={18} /> Suspend
                        </button>
                        <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setCart([])} disabled={cart.length === 0}>
                            <Trash2 size={18} /> Clear
                        </button>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} disabled={cart.length === 0 || !shiftInfo} onClick={() => setShowCheckout(true)}>
                        <CreditCard size={20} /> Checkout
                    </button>
                </div>
            </div>

            {showRecent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '500px', maxWidth: '90%' }}>
                        <div className="flex-between mb-4">
                            <h3 style={{ margin: 0 }}>Recent Shift Sales</h3>
                            <button className="btn" style={{ padding: '4px 8px' }} onClick={() => setShowRecent(false)}>✕</button>
                        </div>
                        {recentSales.length === 0 ? <p className="text-muted">No sales in this shift yet.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                {recentSales.map(s => (
                                    <div key={s.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Sale #{s.id} - {s.payment_method}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                            KSh {parseFloat(s.total_amount).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showSuspended && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '500px', maxWidth: '90%' }}>
                        <div className="flex-between mb-4">
                            <h3 style={{ margin: 0 }}>Suspended Sales</h3>
                            <button className="btn" style={{ padding: '4px 8px' }} onClick={() => setShowSuspended(false)}>✕</button>
                        </div>
                        {(() => {
                            const suspended = JSON.parse(localStorage.getItem('suspended_sales') || '[]');
                            if (suspended.length === 0) return <p className="text-muted">No suspended sales found.</p>;
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {suspended.map((s, idx) => (
                                        <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{s.date}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Items: {s.cart.length} | Customer: {s.customer || 'Walk-in'}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                    ${parseFloat(s.total).toFixed(2)}
                                                </div>
                                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => {
                                                    setCart(s.cart);
                                                    setSelectedCustomer(s.customer);
                                                    const newSuspended = suspended.filter((_, i) => i !== idx);
                                                    localStorage.setItem('suspended_sales', JSON.stringify(newSuspended));
                                                    setShowSuspended(false);
                                                }}>Resume</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {showCheckout && (
                <CheckoutModal
                    cart={cart}
                    total={total}
                    discount={parseFloat(discount || 0)}
                    customerId={selectedCustomer}
                    onClose={() => setShowCheckout(false)}
                    onComplete={handleCheckoutComplete}
                />
            )}
        </div>
    );
}
