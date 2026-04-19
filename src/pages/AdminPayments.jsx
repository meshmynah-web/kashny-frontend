import { useState, useEffect } from 'react';
import axios from '../config';
import { DollarSign, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = {
    'Cash': '#10b981',
    'M-Pesa': '#3b82f6',
    'Card': '#8b5cf6',
    'Bank': '#f59e0b'
};

const ICONS = {
    'Cash': DollarSign,
    'M-Pesa': Smartphone,
    'Card': CreditCard,
    'Bank': Building2
};

export default function AdminPayments() {
    const [sales, setSales] = useState([]);
    const [categoryRevenue, setCategoryRevenue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get('/api/sales'),
            axios.get('/api/dashboard/stats')
        ])
        .then(([salesRes, statsRes]) => {
            setSales(salesRes.data.filter(s => s.status !== 'refunded' && s.status !== 'deleted'));
            
            const formattedCatRev = (statsRes.data.revenue_by_category || []).map(item => ({
                category: item.category,
                value: parseFloat(item.value) || 0
            }));
            setCategoryRevenue(formattedCatRev);
        })
        .catch(() => toast.error("Failed to load payment data"))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center" style={{ padding: '3rem' }}>Loading payment analytics...</div>;

    const methodStats = sales.reduce((acc, sale) => {
        const method = sale.payment_method || 'Cash';
        if (!acc[method]) acc[method] = { transactions: 0, revenue: 0 };
        acc[method].transactions += 1;
        acc[method].revenue += parseFloat(sale.total_amount);
        return acc;
    }, {});

    const pieData = Object.keys(methodStats).map(key => ({
        name: key,
        value: methodStats[key].revenue
    }));

    const barData = Object.keys(methodStats).map(key => ({
        name: key,
        transactions: methodStats[key].transactions
    }));

    const totalRev = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const totalTx = sales.length;

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">Payment Methods Analytics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {['Cash', 'M-Pesa', 'Card', 'Bank Transfer'].map(method => {
                    const stats = methodStats[method] || { transactions: 0, revenue: 0 };
                    const Icon = ICONS[method] || DollarSign;
                    const color = COLORS[method] || '#cbd5e1';

                    return (
                        <div key={method} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: `4px solid ${color}` }}>
                            <div style={{ padding: '12px', background: `${color}22`, borderRadius: '12px', color: color }}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{method}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                    KSh {stats.revenue.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {stats.transactions} Transaction{stats.transactions !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="mb-4 text-center">Revenue by Method</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#e7f703ff'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="mb-4 text-center">Revenue by Category</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryRevenue} cx="50%" cy="50%" innerRadius={0} outerRadius={100} dataKey="value" label nameKey="category">
                                    {categoryRevenue.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="mb-4 text-center">Transactions Volume</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="transactions" radius={[6, 6, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 className="mb-4">Summary Table</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Payment Method</th>
                                <th style={{ padding: '1rem' }}>Transactions Count</th>
                                <th style={{ padding: '1rem' }}>% of Total Tx</th>
                                <th style={{ padding: '1rem' }}>Total Revenue</th>
                                <th style={{ padding: '1rem' }}>% of Total Rev</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(methodStats).map((method, idx) => {
                                const st = methodStats[method];
                                const txPct = totalTx > 0 ? ((st.transactions / totalTx) * 100).toFixed(1) : 0;
                                const revPct = totalRev > 0 ? ((st.revenue / totalRev) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: COLORS[method] || 'inherit' }}>{method}</td>
                                        <td style={{ padding: '1rem' }}>{st.transactions}</td>
                                        <td style={{ padding: '1rem' }}>{txPct}%</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>KSh {st.revenue.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span>{revPct}%</span>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${revPct}%`, background: COLORS[method] || '#fff' }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
