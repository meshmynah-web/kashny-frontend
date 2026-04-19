import { useState, useEffect } from 'react';
import axios from '../config';
import { FileText, Printer, MessageCircle, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { printThermalReceipt } from '../utils/receiptTemplate';
import ReceiptPreview from '../components/ReceiptPreview';
import html2pdf from 'html2pdf.js';

export default function Receipts() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [settings, setSettings] = useState({});
    const [selectedSales, setSelectedSales] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [salesRes, settingsRes] = await Promise.all([
                    axios.get('/api/sales'),
                    axios.get('/api/settings')
                ]);
                setSales(salesRes.data);
                setSettings(settingsRes.data);
            } catch (err) {
                toast.error("Failed to load receipts");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchSaleDetails = async (id) => {
        try {
            const res = await axios.get(`/api/sales/${id}`);
            setSelectedSale(res.data.sale);
            setSaleItems(res.data.items);
        } catch (err) {
            toast.error("Failed to load receipt details");
        }
    };

    const handlePrint = () => {
        printThermalReceipt({
            sale: selectedSale,
            items: saleItems,
            settings: settings
        });
    };

    const handleWhatsApp = () => {
        const total = parseFloat(selectedSale.total_amount) + parseFloat(selectedSale.tax)
        const text = `Receipt from ${settings.store_name || 'Our Store'}Receipt #: ${selectedSale.id}Amount: ${selectedSale.total.toFixed(2)}Thank you for your business!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleBulkDelete = async (permanent) => {
        if (!selectedSales.length) return;
        const msg = permanent ? "Are you sure you want to permanently delete these receipts from the database? This cannot be undone." : "Are you sure you want to temporarily delete these receipts?";
        if (!window.confirm(msg)) return;
        
        setIsDeleting(true);
        try {
            await axios.post('/api/sales/bulk-delete', { ids: selectedSales, permanent });
            toast.success("Receipts deleted successfully");
            setSelectedSales([]);
            const res = await axios.get('/api/sales');
            setSales(res.data);
            if (selectedSale && selectedSales.includes(selectedSale.id)) {
                setSelectedSale(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to delete receipts");
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

    const handleSelect = (id, e) => {
        e.stopPropagation();
        if (selectedSales.includes(id)) {
            setSelectedSales(selectedSales.filter(sid => sid !== id));
        } else {
            setSelectedSales([...selectedSales, id]);
        }
    };

    const filtered = sales.filter(s => s.id.toString().includes(search) || (s.cashier_name && s.cashier_name.toLowerCase().includes(search.toLowerCase())));

    return (
        <div style={{ display: 'flex', height: '100%', animation: 'fadeIn 0.5s' }}>
            <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Sales Receipts</h2>
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
                    </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <Search className="text-muted" size={20} style={{ marginRight: '10px' }} />
                    <input type="text" placeholder="Search by Receipt ID or Cashier..." 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem', width: '40px' }}><input type="checkbox" onChange={handleSelectAll} checked={filtered.length > 0 && selectedSales.length === filtered.length} /></th>
                                <th style={{ padding: '1rem' }}>Receipt #</th>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Cashier</th>
                                <th style={{ padding: '1rem' }}>Amount</th>
                                <th style={{ padding: '1rem' }}>Payment</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr> : 
                             filtered.length === 0 ? <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No sales found</td></tr> :
                             filtered.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selectedSale?.id === s.id ? 'rgba(255,255,255,0.05)' : 'transparent' }} onClick={() => fetchSaleDetails(s.id)}>
                                    <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedSales.includes(s.id)} onChange={(e) => handleSelect(s.id, e)} />
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{s.id.toString().padStart(6, '0')}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>{s.cashier_name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>${parseFloat(s.total_amount).toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }}>{s.payment_method}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button className="btn" style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}>View <ExternalLink size={14} style={{ marginLeft: '4px' }}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSale && (
                <div className="glass-panel" style={{ width: '450px', margin: '1.5rem', padding: '2rem', display: 'flex', flexDirection: 'column', height: 'calc(100% - 3rem)', overflow: 'hidden' }}>
                    <div className="flex-between mb-4">
                        <h3 style={{ margin: 0 }}>Receipt #{selectedSale.id} Details</h3>
                        <button className="btn" style={{ padding: '4px 8px' }} onClick={() => setSelectedSale(null)}>✕</button>
                    </div>

                    <div id={`receipt-preview-${selectedSale.id}`} style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }} className="hide-scroll">
                        <ReceiptPreview sale={selectedSale} items={saleItems} settings={settings} />
                    </div>

                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handlePrint} style={{ justifyContent: 'center' }}>
                                <Printer size={18} /> Print
                            </button>
                            <button className="btn" onClick={() => {
                                const element = document.getElementById(`receipt-preview-${selectedSale.id}`);
                                if(element) {
                                    html2pdf().from(element).set({
                                        margin: 10,
                                        filename: `Receipt-${selectedSale.id}.pdf`,
                                        jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
                                    }).save();
                                }
                            }} style={{ justifyContent: 'center', background: '#3b82f6', color: 'white' }}>
                                <FileText size={18} /> Download PDF
                            </button>
                        </div>
                        <button className="btn" onClick={handleWhatsApp} style={{ width: '100%', justifyContent: 'center', background: '#10b981', color: 'white' }}>
                            <MessageCircle size={18} /> Share on WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}