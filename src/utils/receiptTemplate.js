export const generateReceiptHTML = ({ sale, items, settings }) => {
    const storeName = settings?.store_name || 'AutoPOS Store';
    const storeAddress = settings?.store_address || '';
    const storePhone = settings?.store_phone ? `Tel: ${settings.store_phone}` : '';
    const dateStr = new Date(sale.created_at).toLocaleString();
    const receiptNo = `RCPT-${String(sale.id).padStart(6, '0')}`;
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || item.unit_price) * (item.qty || item.quantity)), 0);
    const tax = parseFloat(sale.tax_amount || sale.tax || 0);
    const total = parseFloat(sale.total_amount);
    
    // Default logo styling inside the template string if it exists
    const logoImg = settings?.store_logo 
        ? `<img src="${settings.store_logo}" alt="Logo" style="max-width: 60px; margin-bottom: 10px; filter: grayscale(100%); margin:0 auto; display:block;" />` 
        : '';

    const itemsHtml = items.map(item => {
        const qty = item.qty || item.quantity;
        const price = parseFloat(item.price || item.unit_price);
        return `<tr>
            <td style="padding: 4px 0;">${item.product_name}</td>
            <td style="padding: 4px 0; text-align: right;">${qty}</td>
            <td style="padding: 4px 0; text-align: right;">${(price * qty).toFixed(2)}</td>
        </tr>`;
    }).join('');

    return `
        <html>
            <head>
                <title>Receipt #${sale.id}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; width: 300px; color: black; background: white; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .fw-bold { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { padding: 4px 0; }
                    .border-top { border-top: 1px dashed black; }
                    .border-bottom { border-bottom: 1px dashed black; }
                    h2 { font-size: 18px; margin: 5px 0; }
                </style>
            </head>
            <body>
                <div class="text-center">
                    ${logoImg}
                    <h2>${storeName}</h2>
                    <div>${storeAddress}</div>
                    <div>${storePhone}</div>
                    <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
                    <div style="font-size: 14px; font-weight: bold;">TAX INVOICE</div>
                    <div>${receiptNo}</div>
                    <div>Date: ${dateStr}</div>
                    <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
                </div>

                <table>
                    <thead>
                        <tr style="border-bottom: 1px solid #000;">
                            <th style="text-align: left;">Item</th>
                            <th style="text-align: right;">Qty</th>
                            <th style="text-align: right;">Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="border-top: 1px solid #000; padding-top: 10px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Subtotal:</span>
                        <span>KSh ${subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>VAT:</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    ${sale.discount > 0 ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>Discount:</span>
                        <span>- ${parseFloat(sale.discount).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;">
                        <span>TOTAL:</span>
                        <span>KSh ${total.toLocaleString()}</span>
                    </div>
                </div>

                <div style="border-bottom: 1px dashed #000; margin: 15px 0;"></div>

                <div style="font-size: 12px;">
                    <div>Payment Method: <strong>${sale.payment_method}</strong></div>
                    ${sale.transaction_code ? `<div>Trans Ref: ${sale.transaction_code}</div>` : ''}
                    <div>Served By: Cashier ${sale.cashier_name ? sale.cashier_name : `#${sale.cashier_id || 'System'}`}</div>
                </div>

                <div class="text-center" style="margin-top: 20px; font-size: 11px;">
                    <div style="margin-bottom: 10px;">PRICES INCLUSIVE OF VAT WHERE APPLICABLE</div>
                    <strong>* Goods once sold cannot be returned *</strong>
                    <div style="margin-top: 10px; font-family: sans-serif;">Thank you for shopping with us!</div>
                    <div style="margin-top: 15px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=RCPT-${sale.id}" alt="QR Code" style="width: 80px; height: 80px; filter: grayscale(100%);" />
                    </div>
                </div>
            </body>
        </html>
    `;
};

export const printThermalReceipt = (receiptData) => {
    const htmlContent = generateReceiptHTML(receiptData);
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
        console.error("Popup blocked");
        return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { 
        printWindow.print(); 
        printWindow.close(); 
    }, 500);
};
