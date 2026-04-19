import { useState, useEffect } from 'react';
import axios from '../config';
import { DollarSign, TrendingUp, TrendingDown, Target, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import toast from 'react-hot-toast';

export default function FinancialOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('month'); // week, month, year, all

    useEffect(() => {
        axios.get('/api/finance/overview')
            .then(res => setData(res.data))
            .catch(err => toast.error("Failed to load financial overview"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Analyzing robust financial data...</div>;
    if (!data) return null;

    // Filter by Time
    const now = new Date();
    let startDate = new Date();
    if (timeFilter === 'week') startDate.setDate(now.getDate() - 7);
    else if (timeFilter === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (timeFilter === 'year') startDate.setFullYear(now.getFullYear() - 1);
    else startDate = new Date(0); // all time

    const unifiedMap = {};
    const filteredSales = data.sales.filter(s => new Date(s.date) >= startDate);
    const filteredExpenses = data.expenses.filter(e => new Date(e.date) >= startDate);

    let monthlyMap = {}; 
    let expenseCategories = {};

    filteredSales.forEach(s => {
        const d = s.date.split('T')[0];
        const monthKey = d.substring(0, 7); 
        
        if (!unifiedMap[d]) unifiedMap[d] = { date: d, income: 0, expense: 0, profit: 0, loss: 0 };
        const inc = parseFloat(s.revenue);
        const prof = parseFloat(s.profit);
        
        unifiedMap[d].income += inc;
        unifiedMap[d].profit += prof;
        if (prof < 0) unifiedMap[d].loss += Math.abs(prof);

        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, profit: 0, loss: 0 };
        if (prof >= 0) monthlyMap[monthKey].profit += prof;
        if (prof < 0) monthlyMap[monthKey].loss += Math.abs(prof);
    });

    filteredExpenses.forEach(e => {
        const d = e.date.split('T')[0];
        const monthKey = d.substring(0, 7);

        if (!unifiedMap[d]) unifiedMap[d] = { date: d, income: 0, expense: 0, profit: 0, loss: 0 };
        const exp = parseFloat(e.amount);
        unifiedMap[d].expense += exp;

        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, profit: 0, loss: 0 };
        monthlyMap[monthKey].loss += exp; 

        const cat = e.category || 'Uncategorized';
        if (!expenseCategories[cat]) expenseCategories[cat] = 0;
        expenseCategories[cat] += exp;
    });

    let mergedData = Object.values(unifiedMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    let monthlyData = Object.values(monthlyMap).sort((a,b) => a.month.localeCompare(b.month));

    const expensePieData = Object.keys(expenseCategories).map(k => ({ name: k, value: expenseCategories[k] }));
    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

    let cumulativeCashFlow = 0;
    mergedData = mergedData.map(d => {
        const net = d.income - d.expense; 
        cumulativeCashFlow += net;
        return { ...d, net, cumulativeCashFlow };
    });

    // Generating Forecast (7 day projection of cashflow)
    let forecastData = [...mergedData];
    if (mergedData.length > 0) {
        const avgIncome = mergedData.reduce((sum, d) => sum + d.income, 0) / mergedData.length;
        const avgExpense = mergedData.reduce((sum, d) => sum + d.expense, 0) / mergedData.length;
        
        let lastCash = cumulativeCashFlow;
        const lastDate = new Date(mergedData[mergedData.length-1].date);
        
        for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            const net = avgIncome - avgExpense;
            lastCash += net;
            forecastData.push({
                date: nextDate.toISOString().split('T')[0],
                income: avgIncome,
                expense: avgExpense,
                net: net,
                cumulativeCashFlow: lastCash,
                isForecast: true
            });
        }
    }

    const last7DaysData = mergedData.filter(d => !d.isForecast).slice(-7).reverse();

    const totalIncome = mergedData.reduce((acc, curr) => acc + (curr.isForecast ? 0 : curr.income), 0);
    const totalExpenses = mergedData.reduce((acc, curr) => acc + (curr.isForecast ? 0 : curr.expense), 0);
    const totalNetProfit = totalIncome - totalExpenses;
    const isProfit = totalNetProfit >= 0;
    const marginPercent = totalIncome > 0 ? (totalNetProfit / totalIncome) * 100 : 0;

    const totalOrders = filteredSales.reduce((acc, curr) => acc + curr.order_count, 0);
    const avgOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;
    const breakEvenSalesNeeded = avgOrderValue > 0 ? Math.ceil(totalExpenses / avgOrderValue) : 0;

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div className="flex-between mb-4">
                <h2>Financial Overview</h2>
                <div className="input-wrapper" style={{ minWidth: '200px' }}>
                    <Filter className="input-icon" size={20} />
                    <select className="form-input" style={{ paddingLeft: '2.5rem' }} value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                        <option value="week">Past Week</option>
                        <option value="month">Past Month</option>
                        <option value="year">Past Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* BIG POSTER */}
            <div className="glass-panel mb-4" style={{ padding: '2rem', background: isProfit ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)' : 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.02) 100%)', border: `1px solid ${isProfit ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Business Status</div>
                        <div style={{ fontSize: '3.5rem', fontWeight: '900', color: isProfit ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {isProfit ? <TrendingUp size={48} /> : <TrendingDown size={48} />}
                            {isProfit ? 'PROFIT' : 'LOSS'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Net Amount</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>KSh {Math.abs(totalNetProfit).toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Profit Margin</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{marginPercent.toFixed(2)}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Income</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>KSh {totalIncome.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Expenses</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>KSh {totalExpenses.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Income</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>KSh {totalIncome.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.5rem' }}>Gross Revenue</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Expenses</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>KSh {totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '0.5rem' }}>Operational Cost</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #8b5cf6' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Break-Even Target</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Target size={24} color="#8b5cf6"/> {breakEvenSalesNeeded} <span style={{fontSize:'1rem', fontWeight:'normal'}}>Sales needed</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Avg. Transaction: KSh {avgOrderValue.toFixed(2)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* 1. Income vs Expenses Chart */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4">1. Income vs Expenses</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={mergedData.filter(d => !d.isForecast)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={t => t.substr(5)} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                <Legend />
                                <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Profit vs Loss Per Month */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4">2. Profit vs Loss (Monthly)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                <Legend />
                                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="loss" name="Losses & Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Cashflow Forecast */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4">3. Cashflow Forecast (Trends)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={t => t.substr(5)} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="net" data={forecastData.filter(d => !d.isForecast)} name="Actual Net" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="net" data={forecastData.filter(d => d.isForecast)} name="Predicted Net" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Cumulative Cash Flow */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4">4. Cumulative Cash Flow</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mergedData.filter(d => !d.isForecast)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={t => t.substr(5)} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                <Legend />
                                <Area type="monotone" dataKey="cumulativeCashFlow" name="Running Cash Flow" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorFlow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Expense Breakdown & 7 Day Summary */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="mb-4">Expense Breakdown</h3>
                    {expensePieData.length > 0 ? (
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {expensePieData.map((entry, index) => (
                                            <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-muted text-center" style={{ padding: '2rem' }}>No expenses logged yet</div>
                    )}
                </div>

                <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="mb-4">5. Last 7 Days Daily Summary</h3>
                    <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '10px' }}>Date</th>
                                <th style={{ padding: '10px' }}>Income</th>
                                <th style={{ padding: '10px' }}>Expenses</th>
                                <th style={{ padding: '10px' }}>Net Cashflow</th>
                            </tr>
                        </thead>
                        <tbody>
                            {last7DaysData.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color:'var(--text-muted)' }}>No data</td></tr>
                            ) : last7DaysData.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 10px' }}>{new Date(d.date).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}</td>
                                    <td style={{ padding: '12px 10px', color: '#10b981', fontWeight: 500 }}>+KSh {d.income.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td style={{ padding: '12px 10px', color: '#ef4444', fontWeight: 500 }}>-KSh {d.expense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: d.net >= 0 ? '#10b981' : '#ef4444' }}>
                                        {d.net >= 0 ? '+' : '-'}KSh {Math.abs(d.net).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
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
