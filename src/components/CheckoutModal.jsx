import { useState, useContext, useEffect, useRef } from 'react';
import axios from '../config';
import { DollarSign, CreditCard, Building2, Smartphone, X, Printer, Share2, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { OfflineContext } from '../context/OfflineContext';
import html2pdf from 'html2pdf.js';
import { printThermalReceipt } from '../utils/receiptTemplate';
import ReceiptPreview from './ReceiptPreview';

export default function CheckoutModal({ cart, total, discount, customerId, onClose, onComplete }) {
    const { isOnline, saveOfflineSale } = useContext(OfflineContext);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountPaid, setAmountPaid] = useState(total.toFixed(2));
    const [loading, setLoading] = useState(false);

    // Payment specific
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
    const [bankDetails, setBankDetails] = useState({ bank: 'Equity Bank', account: '', ref: '', amount: total.toFixed(2) });

    // Receipt Phase
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [autoPrinted, setAutoPrinted] = useState(false);
    const receiptRef = useRef();

    useEffect(() => {
    if (paymentComplete && receiptData && !autoPrinted) {
        const timer = setTimeout(() => {
            if (window.electron) {
                window.electron.printReceipt();
            }
            setAutoPrinted(true);
        }, 500);

        return () => clearTimeout(timer);
    }
}, [paymentComplete, receiptData, autoPrinted]);

    const fetchReceiptData = async (saleId) => {
        try {
            const [saleRes, settingsRes] = await Promise.all([
                axios.get(`/api/sales/${saleId}`),
                axios.get('/api/settings')
            ]);
            setReceiptData({ ...saleRes.data, settings: settingsRes.data, items: cart });
            setPaymentComplete(true);
        } catch (err) {
            toast.error("Failed to load receipt");
            toast.error("Failed to load receipt");
            onComplete(saleId); // Fallback
        }
    };

    // Paystack integration temporarily removed as requested.

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            items: cart.map(item => ({ product_id: item.product_id, qty: item.qty, product_name: item.product_name })),
            payment_method: paymentMethod === 'Bank' ? 'Bank Transfer' : paymentMethod,
            amount_paid: paymentMethod === 'Cash' ? parseFloat(amountPaid) : total,
            customer_id: customerId || null,
            transaction_code: paymentMethod === 'Bank' ? bankDetails.ref : null,
            discount: discount || 0
        };

        if (paymentMethod === 'M-Pesa') {
            if (!phoneNumber) return toast.error("Phone number required");
            toast.success("Processing M-Pesa payment...");
            await new Promise(r => setTimeout(r, 1500));
            // Setting the transaction_code or phone so it's recorded
            payload.transaction_code = phoneNumber; 
        }
        if (paymentMethod === 'Card') {
            if (!cardDetails.name || !cardDetails.number) return toast.error("Card details required");
            toast.success("Processing Card payment...");
            await new Promise(r => setTimeout(r, 1500));
        }

        if (!isOnline && paymentMethod !== 'Cash') {
            toast.error(`${paymentMethod} requires an active internet connection`);
            setLoading(false);
            return;
        }
        if (paymentMethod === 'Bank') {
            if (!bankDetails.account || !bankDetails.ref) return toast.error("Bank details required");
            toast.success("Processing Bank payment...");
            await new Promise(r => setTimeout(r, 1500));
            payload.payment_method = 'Bank Transfer';
            payload.transaction_code = bankDetails.ref;
            payload.bank_name = bankDetails.bank;
        }

        try {
            const res = await axios.post('/api/sales', payload);
            toast.success("Sale completed successfully!");
            await fetchReceiptData(res.data.sale_id);
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    const printThermal = () => {
        printThermalReceipt({
            sale: receiptData.sale,
            items: receiptData.items,
            settings: receiptData.settings
        });
    };

    const downloadPDF = () => {
        const element = receiptRef.current;
        const opt = {
            margin: 10,
            filename: `Receipt_${receiptData?.sale?.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const shareWhatsApp = () => {
        const msg = `Thank you for shopping at ${receiptData?.settings?.store_name}! Your total was KSh ${total.toFixed(2)}. Receipt ID: RCPT-${receiptData?.sale?.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (paymentComplete && receiptData) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s' }}>
                <div style={{ display: 'flex', gap: '2rem', maxWidth: '800px', width: '100%', padding: '1rem' }}>

                    <div style={{ overflowY: 'auto', maxHeight: '80vh', flexShrink: 0 }} className="hide-scroll" ref={receiptRef}>
                        <ReceiptPreview sale={receiptData.sale} items={receiptData.items} settings={receiptData.settings} />
                    </div>

                    {/* Actions Panel */}
                    <div className="glass-panel" style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
                        <h2 style={{ textAlign: 'center', color: 'var(--success)' }}>Transaction Successful!</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Receipt has been generated and saved.</p>

                        <button className="btn btn-primary" style={{ padding: '1rem', justifyContent: 'center', fontSize: '1.1rem' }} onClick={printThermal}>
                            <Printer size={20} /> Print Thermal Receipt
                        </button>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" style={{ flex: 1, background: 'rgba(37, 211, 102, 0.2)', color: '#25D366', borderColor: '#25D366' }} onClick={shareWhatsApp}>
                                <Share2 size={18} /> WhatsApp
                            </button>
                            <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={downloadPDF}>
                                <Download size={18} /> PDF
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>

                        <button className="btn" style={{ padding: '1rem', justifyContent: 'center', background: 'var(--bg-card)' }} onClick={() => onComplete(receiptData.sale.id)}>
                            <FileText size={18} /> New Sale
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const changeDue = paymentMethod === 'Cash' ? Math.max(0, parseFloat(amountPaid || 0) - total).toFixed(2) : '0.00';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Complete Payment</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Amount Due</div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)' }}>KSh {total.toLocaleString()}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
                        <button onClick={() => setPaymentMethod('Cash')} style={{ padding: '15px 5px', borderRadius: '8px', border: paymentMethod === 'Cash' ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)', background: paymentMethod === 'Cash' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={20} color={paymentMethod === 'Cash' ? 'var(--primary-color)' : 'var(--text-muted)'} /> Cash
                        </button>
                        <button onClick={() => setPaymentMethod('M-Pesa')} style={{ padding: '15px 5px', borderRadius: '8px', border: paymentMethod === 'M-Pesa' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: paymentMethod === 'M-Pesa' ? 'rgba(16,185,129,0.1)' : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Smartphone size={20} color={paymentMethod === 'M-Pesa' ? '#10b981' : 'var(--text-muted)'} /> M-Pesa
                        </button>
                        <button onClick={() => setPaymentMethod('Card')} style={{ padding: '15px 5px', borderRadius: '8px', border: paymentMethod === 'Card' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', background: paymentMethod === 'Card' ? 'rgba(139,92,246,0.1)' : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>

                            <CreditCard size={20} color={paymentMethod === 'Card' ? '#8b5cf6' : 'var(--text-muted)'} /> Card
                        </button>
                        <button onClick={() => setPaymentMethod('Bank')} style={{ padding: '15px 5px', borderRadius: '8px', border: paymentMethod === 'Bank' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', background: paymentMethod === 'Bank' ? 'rgba(245,158,11,0.1)' : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={20} color={paymentMethod === 'Bank' ? '#f59e0b' : 'var(--text-muted)'} /> Bank
                        </button>
                    </div>

                    <form onSubmit={handleCheckout}>
                        {paymentMethod === 'Cash' && (
                            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="form-group mb-3">
                                    <label className="form-label">Amount Rendered</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" size={20} />
                                        <input type="number" step="0.01" className="form-input" required
                                            style={{ paddingLeft: '2.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                                            value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: parseFloat(amountPaid) >= total ? 'var(--success)' : 'var(--danger)' }}>
                                    <span>Change Due:</span>
                                    <span style={{ fontWeight: 'bold' }}>KSh {changeDue}</span>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'M-Pesa' && (
                            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="form-group mb-3">
                                    <label className="form-label">M-Pesa Phone Number</label>
                                    <div className="input-wrapper">
                                        <Smartphone className="input-icon" size={20} />
                                        <input type="text" className="form-input" required placeholder="e.g. 254712345678"
                                            style={{ paddingLeft: '2.5rem' }} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                    </div>
                                    <small className="text-muted" style={{ display: 'block', marginTop: '5px' }}>Sale will be completed instantly without STK push.</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount to Deduct</label>
                                    <div className="form-input text-muted" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        KSh {total.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'Card' && (
                            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="form-group mb-3">
                                    <label className="form-label">Cardholder Name</label>
                                    <input type="text" className="form-input" value={cardDetails.name} onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })} required />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Card Number</label>
                                    <input type="text" className="form-input" placeholder="**** **** **** ****" value={cardDetails.number} onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Expiry (MM/YY)</label>
                                        <input type="text" className="form-input" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">CVV</label>
                                        <input type="password" maxLength="4" className="form-input" placeholder="123" value={cardDetails.cvv} onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'Bank' && (
                            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="form-group mb-3">
                                    <label className="form-label">Select Bank</label>
                                    <select className="form-input" value={bankDetails.bank} onChange={e => setBankDetails({ ...bankDetails, bank: e.target.value })}>
                                        <option value="Equity Bank">Equity Bank</option>
                                        <option value="KCB Bank">KCB Bank</option>
                                        <option value="Cooperative Bank">Cooperative Bank</option>
                                        <option value="Absa Bank">Absa Bank</option>
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Account Number</label>
                                    <input type="text" className="form-input" value={bankDetails.account} onChange={e => setBankDetails({ ...bankDetails, account: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Transaction Reference</label>
                                    <input type="text" className="form-input" placeholder="e.g. TRC123456" value={bankDetails.ref} onChange={e => setBankDetails({ ...bankDetails, ref: e.target.value })} required />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading || (paymentMethod === 'Cash' && parseFloat(amountPaid) < total)}>
                            {loading ? 'Processing...' : paymentMethod === 'M-Pesa' ? 'Complete Sale' : 'Confirm Payment'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
