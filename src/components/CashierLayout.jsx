import { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, FileText, Users, Clock, LogOut, Menu, Store } from 'lucide-react';
import axios from '../config';

export default function CashierLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [settings, setSettings] = useState({ store_name: 'AutoPOS', store_logo: null });

    // 🌐 ONLINE STATUS (ADDED)
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // 🌙 THEME (ADDED)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        axios.get('/api/settings')
            .then(res => { if (res.data) setSettings(res.data); })
            .catch(console.error);
    }, []);

    // 🌐 ONLINE/OFFLINE LISTENER (ADDED)
    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // 🌙 APPLY THEME (ADDED)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const navItems = [
        { path: '/pos/sales', icon: <ShoppingCart size={20} />, label: 'POS Sales', color: '#10b981' },
        { path: '/pos/receipts', icon: <FileText size={20} />, label: 'Receipts', color: '#6366f1' },
        { path: '/pos/customers', icon: <Users size={20} />, label: 'Customers', color: '#f59e0b' },
        { path: '/pos/shift', icon: <Clock size={20} />, label: 'My Shift', color: '#8b5cf6' }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-main)' }}>
            <aside style={{
                width: collapsed ? '80px' : '200px',
                background: 'var(--card-bg)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {settings.store_logo ? (
                        <img src={settings.store_logo} alt="Logo" style={{ width: collapsed ? 32 : 24, height: collapsed ? 32 : 24, objectFit: 'contain', borderRadius: '4px', background: 'white', flexShrink: 0 }} />
                    ) : (
                        <Store color="#10b981" size={collapsed ? 24 : 20} style={{ flexShrink: 0 }} />
                    )}
                    {!collapsed && <span style={{ marginLeft: '10px', fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.store_name}</span>}
                </div>

                <nav style={{ flex: 1, padding: '1rem 0' }}>
                    {navItems.map(item => {
                        const active = location.pathname.startsWith(item.path);
                        return (
                            <Link key={item.path} to={item.path} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '15px 20px', textDecoration: 'none',
                                color: active ? 'white' : 'var(--text-muted)',
                                background: active ? `linear-gradient(90deg, ${item.color}33, transparent)` : 'transparent',
                                borderLeft: active ? `4px solid ${item.color}` : '4px solid transparent',
                                transition: 'all 0.3s ease',
                                justifyContent: collapsed ? 'center' : 'flex-start'
                            }}>
                                <div style={{ color: active ? item.color : 'inherit' }}>{item.icon}</div>
                                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--danger)' }} onClick={logout}>
                        <LogOut size={20} />
                        {!collapsed && <span>Log Out</span>}
                    </div>
                </div>
            </aside>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{
                    height: '60px', background: 'var(--card-bg)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between'
                }}>
                    <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <Menu size={24} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                        {/* 🌐 ONLINE STATUS */}
                        <span style={{ fontSize: '0.8rem' }}>
                            {isOnline ? (
                                <span style={{ color: '#22c55e' }}>🟢 Online</span>
                            ) : (
                                <span style={{ color: '#ef4444' }}>🔴 Offline</span>
                            )}
                        </span>

                        {/* 🌙 THEME TOGGLE */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            {theme === 'dark' ? '🌙Dark Mode' : '☀️Light Mode'}
                        </button>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cashier Mode</div>
                        </div>

                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.full_name?.charAt(0) || 'C'}
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}