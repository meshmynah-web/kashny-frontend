import { useState, useEffect } from 'react';
import axios from '../config';
import { Activity, LogIn, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogs() {
    const [activityLogs, setActivityLogs] = useState([]);
    const [loginLogs, setLoginLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('activity'); 

    useEffect(() => {
        Promise.all([
            axios.get('/api/logs/activity').catch(() => ({ data: [] })),
            axios.get('/api/logs/logins').catch(() => ({ data: [] }))
        ]).then(([activityRes, loginRes]) => {
            setActivityLogs(activityRes.data);
            setLoginLogs(loginRes.data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-center text-muted" style={{ padding: '3rem' }}>Fetching System Logs...</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="mb-4">System Event Logs</h2>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                <button 
                    onClick={() => setActiveTab('activity')}
                    style={{ 
                        padding: '10px 20px', background: 'none', border: 'none', 
                        color: activeTab === 'activity' ? 'var(--primary-color)' : 'var(--text-muted)', 
                        borderBottom: activeTab === 'activity' ? '2px solid var(--primary-color)' : '2px solid transparent',
                        cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' 
                    }}>
                    <Activity size={18} /> System Activity
                </button>
                <button 
                    onClick={() => setActiveTab('logins')}
                    style={{ 
                        padding: '10px 20px', background: 'none', border: 'none', 
                        color: activeTab === 'logins' ? '#10b981' : 'var(--text-muted)', 
                        borderBottom: activeTab === 'logins' ? '2px solid #10b981' : '2px solid transparent',
                        cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' 
                    }}>
                    <LogIn size={18} /> Login History
                </button>
            </div>

            {activeTab === 'activity' && (
                <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Time</th>
                                <th style={{ padding: '1rem' }}>User</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Action Event</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityLogs.map((log, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{log.user_name}</td>
                                    <td style={{ padding: '1rem' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: log.role === 'Admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>{log.role}</span></td>
                                    <td style={{ padding: '1rem', color: '#e2e8f0' }}>{log.action}</td>
                                </tr>
                            ))}
                            {activityLogs.length === 0 && <tr><td colSpan="4" className="text-center text-muted" style={{ padding: '2rem' }}>No activity records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'logins' && (
                <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Time</th>
                                <th style={{ padding: '1rem' }}>User</th>
                                <th style={{ padding: '1rem' }}>IP Address</th>
                                <th style={{ padding: '1rem' }}>Device Info</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loginLogs.map((log, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(log.login_time).toLocaleString()}</td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{log.user_name}</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{log.ip_address || '::1'}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.device}>{log.device || 'Unknown App'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem',
                                            background: log.login_status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: log.login_status === 'success' ? '#10b981' : '#ef4444'
                                        }}>
                                            {log.login_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {loginLogs.length === 0 && <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No login records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
