import { useState, useEffect } from 'react';
import axios from '../config';
import { DollarSign, ShoppingBag, Users as UsersIcon, FileText, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#ffffffff'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [salesFilter, setSalesFilter] = useState('daily'); // Filter state

    useEffect(() => {
        axios.get('/api/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(err => toast.error("Failed to load dashboard data"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: '3rem' }} className="text-center">Loading advanced analytics...</div>;
    if (!stats) return null;

    const statCards = [
        { title: "Today's Sales", value: stats.today_sales, icon: DollarSign, color: '#10b981' },
        { title: "Yesterday's Sales", value: stats.yesterday_sales, icon: TrendingDown, color: '#f59e0b' },
        { title: "Weekly Sales", value: stats.weekly_sales, icon: TrendingUp, color: '#6366f1' },
        { title: "Monthly Sales", value: stats.monthly_sales, icon: FileText, color: '#8b5cf6' },
        { title: "Total Revenue", value: stats.total_revenue, icon: DollarSign, color: '#ec4899' },
        { title: "Total Profit", value: stats.total_profit, icon: TrendingUp, color: '#10b981' },
        { title: "Total Loss", value: stats.total_loss, icon: TrendingDown, color: '#ef4444' },
        { title: "Total Orders", value: stats.total_orders, icon: ShoppingBag, color: '#14b8a6' },
        { title: "Total Products", value: stats.total_products, icon: FileText, color: '#f43f5e' },
        { title: "Customers", value: stats.total_customers, icon: UsersIcon, color: '#3b82f6' },
        { title: "Active Cashiers", value: stats.total_cashiers, icon: UsersIcon, color: '#10b981' },
    ];

    // Format for Recharts Pie
    const pieData = stats.payment_methods.map(p => ({
        name: p.payment_method, value: parseFloat(p.amount)
    }));

    // Filter sales chart based on selected filter
    const now = new Date();
    let filteredSalesData = stats.sales_chart;

    if (salesFilter === 'daily') {
        filteredSalesData = stats.sales_chart.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.toDateString() === now.toDateString();
        });
    } else if (salesFilter === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filteredSalesData = stats.sales_chart.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= weekAgo && itemDate <= now;
        });
    } else if (salesFilter === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        filteredSalesData = stats.sales_chart.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= monthAgo && itemDate <= now;
        });
    }

    // Format X-axis labels dynamically
    const formatXAxis = (tick) => {
        const date = new Date(tick);
        if (salesFilter === 'daily') {
            return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        } else if (salesFilter === 'weekly') {
            return date.toLocaleDateString(undefined, { weekday: 'short' }); // Mon, Tue, etc.
        } else if (salesFilter === 'monthly') {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); // Mar 1
        }
        return tick;
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">Pos System Overview</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {statCards.map((c, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: `4px solid ${c.color}` }}>
                        <div style={{ padding: '12px', background: `${c.color}22`, borderRadius: '12px', color: c.color }}>
                            <c.icon size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{c.title}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                                {c.title.includes('Sales') || c.title.includes('Revenue') ? 'KSh ' : ''}
                                {parseFloat(c.value).toLocaleString(undefined, { minimumFractionDigits: Array.isArray(c.value) ? 0 : 2 })}
                            </div>
                        </div>
                    </div>
                ))}
            </div >

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4 text-center">Sales Trend</h3>

                    {/* Filter Dropdown */}
                    {/* Filter Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
                        {['daily', 'weekly', 'monthly'].map(option => (
                            <button
                                key={option}
                                onClick={() => setSalesFilter(option)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    backgroundColor: salesFilter === option ? 'var(--primary-color)' : 'transparent',
                                    color: salesFilter === option ? 'white' : 'var(--text-muted)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: '0.2s all'
                                }}
                            >
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredSalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={formatXAxis} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                                <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 className="mb-4">Payment Methods Revenue</h3>
                        <div style={{ flex: 1, minHeight: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#2b22d1ff" paddingAngle={5} dataKey="value" label>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 className="mb-4">Top 5 Selling Products</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <th style={{ padding: '10px' }}>Product</th>
                                        <th style={{ padding: '10px' }}>Units Sold</th>
                                        <th style={{ padding: '10px' }}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.top_products.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: 500 }}>{p.product_name}</td>
                                            <td style={{ padding: '12px 10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>{p.sold_qty}</td>
                                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{parseFloat(p.revenue).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {stats.top_products.length === 0 && (
                                        <tr><td colSpan="3" className="text-center text-muted" style={{ padding: '1rem' }}>No sales data yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}