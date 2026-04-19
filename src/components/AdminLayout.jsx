import { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard, Package, Tag, Layers, ShoppingCart, FileText, Settings,
    LogOut, Menu, Store, ClipboardList, CreditCard, Users as UsersIcon,
    UserCog, Clock, BarChart2, ShieldAlert, Bell, DollarSign, TrendingUp, Truck
} from 'lucide-react';
import axios from '../config';
import toast from 'react-hot-toast';

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [settings, setSettings] = useState({ store_name: 'AutoPOS', store_logo: null });

    // 🌐 ONLINE STATUS
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // 🌙 THEME
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // 🔔 NOTIFICATIONS
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // 🔔 ALERT SOUND
    const alertSound = new Audio('/sounds/alert.mp3'); // place alert.mp3 in public folder

    useEffect(() => {
        axios.get('/api/settings')
            .then(res => setSettings(res.data))
            .catch(console.error);
    }, []);

    // 🌐 ONLINE/OFFLINE LISTENER
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

    // 🌙 APPLY THEME
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 🔔 FETCH LOW STOCK NOTIFICATIONS WITH SOUND
    useEffect(() => {
        let firstLoad = true;

        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/api/products/low-stock');
                const newNotifs = res.data || [];

                // Play sound only if new notifications arrive
                if (!firstLoad && newNotifs.length > notifications.length) {
                    alertSound.play();
                }
                firstLoad = false;

                setNotifications(newNotifs);
            } catch (err) {
                console.error("Failed to fetch low stock notifications", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // every 30s
        return () => clearInterval(interval);
    }, [notifications]);

    const getAdminLinks = () => [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
        { path: '/admin/categories', icon: <Tag size={20} />, label: 'Categories' },
        { path: '/admin/inventory', icon: <ClipboardList size={20} />, label: 'Inventory' },
        { path: '/admin/sales', icon: <FileText size={20} />, label: 'Sales History' },
        { path: '/admin/deliveries', icon: <Truck size={20} />, label: 'Deliveries' },
        { path: '/admin/payments', icon: <CreditCard size={20} />, label: 'Payments' },
        { path: '/admin/finance/expenses', icon: <DollarSign size={20} />, label: 'Expenses' },
        { path: '/admin/finance/overview', icon: <TrendingUp size={20} />, label: 'Financial Overview' },
        { path: '/admin/shifts', icon: <Clock size={20} />, label: 'Shifts' },
        { path: '/admin/reports', icon: <BarChart2 size={20} />, label: 'Reports' },
        { path: '/admin/receipts', icon: <FileText size={20} />, label: 'Receipts' },
        { path: '/admin/customers', icon: <UsersIcon size={20} />, label: 'Customers' },
        { path: '/admin/users', icon: <UserCog size={20} />, label: 'Staff & Users' },
        { path: '/admin/logs', icon: <ShieldAlert size={20} />, label: 'System Logs' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' }
    ];

    const navItems = getAdminLinks();

    const itemColors = {
        '/admin': '#6366f1', '/admin/products': '#10b981', '/admin/categories': '#f59e0b',
        '/admin/inventory': '#8b5cf6', '/admin/sales': '#ec4899', '/admin/payments': '#a855f7',
        '/admin/shifts': '#14b8a6', '/admin/reports': '#f43f5e', '/admin/receipts': '#0ea5e9',
        '/admin/customers': '#22c55e', '/admin/users': '#3b82f6', '/admin/logs': '#ef4444',
        '/admin/settings': '#64748b'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-main)' }}>
            {/* Sidebar */}
            <aside style={{
                width: collapsed ? '80px' : '260px',
                background: 'var(--card-bg)',
                borderRight: '1px solid var(--glass-border)',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(16px)',
                zIndex: 20
            }}>
                <Link to="/admin/settings" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid var(--glass-border)', textDecoration: 'none', color: 'inherit' }}>
                    {settings.store_logo ? (
                        <img src={settings.store_logo} alt="Logo" style={{ width: collapsed ? 32 : 24, height: collapsed ? 32 : 24, objectFit: 'contain', borderRadius: '4px', background: 'white', flexShrink: 0 }} />
                    ) : (
                        <Store color="var(--primary-color)" size={collapsed ? 24 : 20} style={{ flexShrink: 0 }} />
                    )}
                    {!collapsed && <span style={{ marginLeft: '10px', fontWeight: 'bold', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.store_name}</span>}
                </Link>

                <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
                    {navItems.map(item => {
                        const active = location.pathname.startsWith(item.path);
                        const color = itemColors[item.path] || 'var(--primary-color)';
                        return (
                            <Link key={item.path} to={item.path} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 24px', textDecoration: 'none',
                                color: active ? 'white' : 'var(--text-muted)',
                                background: active ? `linear-gradient(90deg, ${color}33, transparent)` : 'transparent',
                                borderLeft: active ? `4px solid ${color}` : '4px solid transparent',
                                transition: 'all 0.3s ease',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                cursor: 'pointer'
                            }}>
                                <div style={{ color: active ? color : 'inherit' }}>{item.icon}</div>
                                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--danger)' }} onClick={logout}>
                        <LogOut size={20} />
                        {!collapsed && <span>Log Out</span>}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{
                    height: '70px', background: 'var(--card-bg)', borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between',
                    backdropFilter: 'blur(16px)', zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                            <Menu size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
                        {/* 🌐 ONLINE STATUS */}
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
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
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer'
                            }}
                        >
                            {theme === 'dark' ? '🌙Dark Mode' : '☀️Light Mode'}
                        </button>

                        {/* 🔔 NOTIFICATION BELL */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowDropdown(!showDropdown)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                                <Bell size={24} />
                                {notifications.length > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -5, right: -5,
                                        background: 'var(--danger)', color: 'white',
                                        borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>{notifications.length}</span>
                                )}
                            </button>

                            {showDropdown && (
                                <div style={{
                                    position: 'absolute', top: '30px', right: 0,
                                    background: 'var(--card-bg)', border: '1px solid var(--glass-border)',
                                    borderRadius: '8px', width: '300px', maxHeight: '400px',
                                    overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50
                                }}>
                                    <div style={{ padding: '0.5rem', fontWeight: 600, borderBottom: '1px solid var(--glass-border)' }}>Low Stock Alerts</div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No low stock products</div>
                                    ) : (
                                        notifications.map(item => (
                                            <div key={item.product_id} style={{
                                                display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem',
                                                cursor: 'pointer', borderBottom: '1px solid var(--glass-border)'
                                            }}
                                                onClick={() => {
                                                    toast.info(`Product: ${item.product_name}`);
                                                    setShowDropdown(false);
                                                    // add scroll/modal logic here if needed
                                                }}>
                                                <span style={{ fontSize: '0.85rem' }}>{item.product_name}</span>
                                                <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{item.stock_quantity}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* USER PROFILE */}
                        <Link to="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-main)' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {user?.full_name?.charAt(0) || 'A'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.full_name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</span>
                            </div>
                        </Link>
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}