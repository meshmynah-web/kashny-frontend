import { useState, useEffect } from 'react';
import axios from '../config';
import { FileText, Search, RefreshCw, Eye, RefreshCcw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { printThermalReceipt } from '../utils/receiptTemplate';
import ReceiptPreview from '../components/ReceiptPreview';

export default function AdminSales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleDetails, setSaleDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedSales, setSelectedSales] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const [settings, setSettings] = useState({});

    const fetchSales = async () => {
        try {
            setLoading(true);
            let url = '/api/sales';
            if (timeFilter !== 'all') {
                const now = new Date();
                let start = new Date();
                if (timeFilter === 'today') start.setHours(0,0,0,0);
                else if (timeFilter === 'week') start.setDate(now.getDate() - 7);
                else if (timeFilter === 'month') start.setMonth(now.getMonth() - 1);
                else if (timeFilter === 'year') start.setFullYear(now.getFullYear() - 1);
                
                url += `?startDate=${start.toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`;
            }

            const [res, settingsRes] = await Promise.all([
                axios.get(url),
                axios.get('/api/settings').catch(() => ({ data: {} }))
            ]);
            setSales(res.data);
            setSettings(settingsRes.data);
        } catch (err) {
            toast.error("Failed to load sales history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSales(); }, [timeFilter]);

    const handleViewDetails = async (sale) => {
        setSelectedSale(sale);
        setDetailsLoading(true);
        try {
            const res = await axios.get(`/api/sales/${sale.id}`);
            setSaleDetails(res.data.items);
        } catch (err) {
            toast.error("Failed to load details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleRefund = async (id) => {
        if (!window.confirm("Are you sure you want to refund this sale? This action cannot be undone and will restore inventory stock.")) return;
        try {
            await axios.post(`/api/sales/${id}/refund`);
            toast.success("Sale refunded successfully");
            setSelectedSale({ ...selectedSale, status: 'refunded' });
            fetchSales();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to process refund");
        }
    };

    const filtered = sales.filter(s => {
        const matchesSearch = s.id.toString().includes(searchTerm) || (s.cashier_name && s.cashier_name.toLowerCase().includes(searchTerm.toLowerCase())) || (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMethod = filterMethod ? s.payment_method === filterMethod : true;
        return matchesSearch && matchesMethod;
    });

    const handleBulkDelete = async (permanent) => {
        if (!selectedSales.length) return;
        const msg = permanent ? "Are you sure you want to permanently delete these sales from the database? This cannot be undone." : "Are you sure you want to temporarily delete these sales?";
        if (!window.confirm(msg)) return;
        
        setIsDeleting(true);
        try {
            await axios.post('/api/sales/bulk-delete', { ids: selectedSales, permanent });
            toast.success("Sales deleted successfully");
            setSelectedSales([]);
            fetchSales();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to delete sales");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSales(filtered.map(s => s.id));
        } else {
            setSelectedSales([]);
        }
    };

    const handleSelect = (id) => {
        if (selectedSales.includes(id)) {
            setSelectedSales(selectedSales.filter(sid => sid !== id));
        } else {
            setSelectedSales([...selectedSales, id]);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div className="flex-between mb-4">
                <h2>Sales History</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedSales.length > 0 && (
                        <>
                            <button className="btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => handleBulkDelete(false)} disabled={isDeleting}>
                                Delete Temporarily ({selectedSales.length})
                            </button>
                            <button className="btn btn-danger" onClick={() => handleBulkDelete(true)} disabled={isDeleting}>
                                Delete Permanently ({selectedSales.length})
                            </button>
                        </>
                    )}
                    <button className="btn btn-primary" onClick={fetchSales}><RefreshCw size={18} /> Refresh</button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
                    <Search className="input-icon" size={20} />
                    <input type="text" className="form-input" placeholder="Search by Sale ID or Cashier..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="input-wrapper" style={{ minWidth: '200px' }}>
                    <Filter className="input-icon" size={20} />
                    <select className="form-input" style={{ paddingLeft: '2.5rem' }} value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
                        <option value="">All Payment Methods</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                </div>
                <div className="input-wrapper" style={{ minWidth: '150px' }}>
                    <select className="form-input" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Past Week</option>
                        <option value="month">Past Month</option>
                        <option value="year">Past Year</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedSale ? '2fr 1fr' : '1fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    {loading ? (
                        <div className="text-center text-muted">Loading sales...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem', width: '40px' }}><input type="checkbox" onChange={handleSelectAll} checked={filtered.length > 0 && selectedSales.length === filtered.length} /></th>
                                    <th style={{ padding: '1rem' }}>Sale ID</th>
                                    <th style={{ padding: '1rem' }}>Date & Time</th>
                                    <th style={{ padding: '1rem' }}>Receipt #</th>
                                    <th style={{ padding: '1rem' }}>Items</th>
                                    <th style={{ padding: '1rem' }}>Method</th>
                                    <th style={{ padding: '1rem' }}>Total Amount</th>
                                    <th style={{ padding: '1rem' }}>Profit</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="11" className="text-center text-muted" style={{ padding: '2rem' }}>No sales found</td></tr>
                                ) : filtered.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedSale?.id === s.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <input type="checkbox" checked={selectedSales.includes(s.id)} onChange={() => handleSelect(s.id)} />
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>#{s.id}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>RCPT-{String(s.id).padStart(6, '0')}</td>
                                        <td style={{ padding: '1rem' }}>{s.total_items || 0}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>{s.payment_method}</span>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{parseFloat(s.total_amount).toFixed(2)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: parseFloat(s.profit) >= 0 ? '#10b981' : '#ef4444' }}>
                                            {parseFloat(s.profit || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: s.status === 'completed' ? '#10b981' : s.status === 'refunded' ? '#f59e0b' : '#ef4444',
                                                textTransform: 'capitalize', fontWeight: 600, fontSize: '0.85rem'
                                            }}>{s.status}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleViewDetails(s)}>
                                                <Eye size={16} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {selectedSale && (
                    <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                        <div className="flex-between mb-4">
                            <h3>Sale #{selectedSale.id} Details</h3>
                            <button className="btn" style={{ padding: '4px 8px' }} onClick={() => setSelectedSale(null)}>✕</button>
                        </div>

                        <div id={`receipt-preview-${selectedSale.id}`} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <ReceiptPreview sale={selectedSale} items={saleDetails} settings={settings} />
                        </div>

                        {selectedSale.status === 'completed' && (
                            <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => {
                                    printThermalReceipt({
                                        sale: selectedSale,
                                        items: saleDetails,
                                        settings: settings
                                    });
                                }}>
                                    <FileText size={18} /> Print Receipt
                                </button>
                                <button className="btn" style={{ justifyContent: 'center', background: '#3b82f6', color: 'white' }} onClick={() => {
                                    const element = document.getElementById(`receipt-preview-${selectedSale.id}`);
                                    if(element) {
                                        html2pdf().from(element).set({
                                            margin: 10,
                                            filename: `Receipt-${selectedSale.id}.pdf`,
                                            jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
                                        }).save();
                                    }
                                }}>
                                    Download PDF
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button className="btn" style={{ justifyContent: 'center', background: '#10b981', color: 'white' }} onClick={() => {
                                    const url = `https://wa.me/?text=Here is your receipt for KSh ${parseFloat(selectedSale.total_amount).toLocaleString()}`;
                                    window.open(url, '_blank');
                                }}>
                                    WhatsApp
                                </button>
                                <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={() => handleRefund(selectedSale.id)}>
                                    <RefreshCcw size={18} /> Refund
                                </button>
                            </div>
                            </>
                        )}
                        {selectedSale.status === 'refunded' && (
                            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                This sale has been completely refunded. Stock was restored.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
