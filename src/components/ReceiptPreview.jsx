import React from 'react';

export default function ReceiptPreview({ sale, items, settings }) {
    if (!sale) return null;

    const storeName = settings?.store_name || 'AutoPOS Store';
    const storeAddress = settings?.store_address || '';
    const storePhone = settings?.store_phone ? `Tel: ${settings.store_phone}` : '';
    const dateStr = new Date(sale.created_at).toLocaleString();
    const receiptNo = `RCPT-${String(sale.id).padStart(6, '0')}`;
    const validItems = items || [];
    const subtotal = validItems.reduce((sum, item) => sum + (parseFloat(item.price || item.unit_price) * (item.qty || item.quantity)), 0);
    const tax = parseFloat(sale.tax_amount || sale.tax || 0);
    const total = parseFloat(sale.total_amount);

    return (
        <div style={{ background: 'white', color: 'black', padding: '20px', width: '300px', margin: '0 auto', fontFamily: 'monospace', fontSize: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <div className="text-center" style={{ textAlign: 'center' }}>
                {settings?.store_logo && <img src={settings.store_logo} alt="Logo" style={{ maxWidth: '60px', marginBottom: '10px', filter: 'grayscale(100%)' }} />}
                <h2 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>{storeName}</h2>
                <div style={{ fontSize: '12px' }}>{storeAddress}</div>
                <div style={{ fontSize: '12px' }}>{storePhone}</div>
                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>TAX INVOICE</div>
                <div style={{ fontSize: '12px' }}>{receiptNo}</div>
                <div style={{ fontSize: '12px' }}>Date: {dateStr}</div>
                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
            </div>

            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '10px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ paddingBottom: '4px' }}>Item</th>
                        <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Qty</th>
                        <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {validItems.map((item, i) => {
                        const qty = item.qty || item.quantity;
                        const price = parseFloat(item.price || item.unit_price);
                        return (
                            <tr key={i}>
                                <td style={{ padding: '4px 0' }}>{item.product_name}</td>
                                <td style={{ padding: '4px 0', textAlign: 'right' }}>{qty}</td>
                                <td style={{ padding: '4px 0', textAlign: 'right' }}>{(price * qty).toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>KSh {subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>VAT:</span>
                    <span>{tax.toFixed(2)}</span>
                </div>
                {sale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff3b3b' }}>
                    <span>Discount:</span>
                    <span>- {parseFloat(sale.discount).toFixed(2)}</span>
                </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
                    <span>TOTAL:</span>
                    <span>KSh {total.toLocaleString()}</span>
                </div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>

            <div style={{ fontSize: '12px' }}>
                <div>Payment Method: <strong>{sale.payment_method}</strong></div>
                {sale.transaction_code && <div>Trans Ref: {sale.transaction_code}</div>}
                <div>Served By: Cashier {sale.cashier_name ? sale.cashier_name : `#${sale.cashier_id || 'System'}`}</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px' }}>
                <div style={{ marginBottom: '10px' }}>PRICES INCLUSIVE OF VAT WHERE APPLICABLE</div>
                <strong>* Goods once sold cannot be returned *</strong>
                <div style={{ marginTop: '10px', fontFamily: 'sans-serif' }}>Thank you for shopping with us!</div>
                <div style={{ marginTop: '15px' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=RCPT-${sale.id}`} alt="QR Code" style={{ width: '80px', height: '80px', filter: 'grayscale(100%)' }} />
                </div>
            </div>
        </div>
    );
}
