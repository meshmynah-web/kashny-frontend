import { useState, useEffect } from 'react';
import axios from '../config';
import { BarChart as BarChartIcon, TrendingUp, Users, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminReports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/reports/advanced')
            .then(res => setData(res.data))
            .catch(() => toast.error("Failed to load comprehensive analytics"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center text-muted" style={{ padding: '3rem' }}>Processing Data Warehouse Analytics...</div>;
    if (!data) return null;

    return (
        <div style={{ animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="flex-between">
                <h2>Advanced Reports & Analytics</h2>
            </div>

            {/* Top Row: Sales Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-between mb-4">
                        <h3><TrendingUp size={20} className="mr-2 inline" color="#6366f1" /> Daily Sales Trend (30 Days)</h3>
                    </div>
                    <div style={{ flex: 1, minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorDaily)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-between mb-4">
                        <h3><BarChartIcon size={20} className="mr-2 inline" color="#f59e0b" /> Monthly Sales Trend (1 Year)</h3>
                    </div>
                    <div style={{ flex: 1, minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Cashiers & Products */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-between mb-4">
                        <h3><Users size={20} className="mr-2 inline" color="#10b981" /> Cashier Performance (All Time)</h3>
                    </div>
                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0.8rem' }}>Cashier Name</th>
                                    <th style={{ padding: '0.8rem' }}>Transactions</th>
                                    <th style={{ padding: '0.8rem' }}>Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.cashiers.map((c, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.8rem', fontWeight: 500 }}>{c.full_name}</td>
                                        <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{c.transactions}</td>
                                        <td style={{ padding: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>KSh {parseFloat(c.total_sold).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-between mb-4">
                        <h3><Package size={20} className="mr-2 inline" color="#ec4899" /> Product Sales Leaderboard</h3>
                    </div>
                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0.8rem' }}>Product</th>
                                    <th style={{ padding: '0.8rem' }}>Units Sold</th>
                                    <th style={{ padding: '0.8rem' }}>Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.products.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.8rem', fontWeight: 500 }}>{p.product_name}</td>
                                        <td style={{ padding: '0.8rem' }}>{p.sold_qty}</td>
                                        <td style={{ padding: '0.8rem', color: '#ec4899', fontWeight: 'bold' }}>KSh {parseFloat(p.revenue).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
