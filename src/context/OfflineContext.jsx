import { createContext, useState, useEffect } from 'react';
import axios from '../config';
import toast from 'react-hot-toast';

export const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingSync, setPendingSync] = useState(false);

    useEffect(() => {
        let currentStatus = navigator.onLine;

        const checkBackendStatus = async () => {
            try {
                if (!navigator.onLine) throw new Error("Offline");
                await axios.get('/api/settings', { timeout: 3000 });
                if (!currentStatus) {
                    currentStatus = true;
                    setIsOnline(true);
                    syncOfflineSales();
                }
            } catch (err) {
                if (currentStatus) {
                    currentStatus = false;
                    setIsOnline(false);
                    toast.error("Lost connection to server", { icon: '📡' });
                }
            }
        };

        const interval = setInterval(checkBackendStatus, 10000);
        checkBackendStatus();

        return () => clearInterval(interval);
    }, []);

    const saveOfflineSale = (payload) => {
        const sales = JSON.parse(localStorage.getItem('offline_sales') || '[]');
        sales.push({ id: Date.now(), ...payload, date: new Date().toISOString() });
        localStorage.setItem('offline_sales', JSON.stringify(sales));
        setPendingSync(true);
        toast.success("Sale saved offline. Will sync when reconnected.");
        return sales[sales.length - 1].id;
    };

    const syncOfflineSales = async () => {
        const sales = JSON.parse(localStorage.getItem('offline_sales') || '[]');
        if (sales.length === 0) return;

        toast.loading(`Syncing ${sales.length} offline sales...`, { id: 'sync' });
        
        let successCount = 0;
        const failedSales = [];

        for (const sale of sales) {
            try {
                // Ensure auth token is sent if needed, assuming axios interceptor handles it
                const token = localStorage.getItem('pos_token');
                await axios.post('/api/sales', sale, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                successCount++;
            } catch (err) {
                console.error("Failed to sync sale:", sale, err);
                failedSales.push(sale);
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully synced ${successCount} sales`, { id: 'sync' });
        }
        
        if (failedSales.length > 0) {
            localStorage.setItem('offline_sales', JSON.stringify(failedSales));
            toast.error(`${failedSales.length} sales failed to sync`, { id: 'sync' });
            setPendingSync(true);
        } else {
            localStorage.removeItem('offline_sales');
            setPendingSync(false);
        }
    };

    return (
        <OfflineContext.Provider value={{ isOnline, pendingSync, saveOfflineSale, syncOfflineSales }}>
            {children}
            {!isOnline && (
                <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'var(--danger)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', zIndex: 9999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span> OFFLINE MODE
                </div>
            )}
        </OfflineContext.Provider>
    );
};
