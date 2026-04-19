import { useState, useEffect } from 'react';
import axios from '../config';
import { Save, Store, MapPin, Phone, DollarSign, Percent, Moon, Sun, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState({
        store_name: '', store_logo: '', store_address: '', store_phone: '', currency: 'USD', tax_rate: 0, theme: 'light'
    });
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get('/api/settings')
            .then(res => {
                setSettings(res.data);
                setLoading(false);
            })
            .catch(err => {
                toast.error("Failed to load settings");
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            Object.keys(settings).forEach(key => {
                const val = settings[key];
                formData.append(key, val === null || val === undefined ? '' : val);
            });
            if (logoFile) formData.append('logo_file', logoFile);

            await axios.put('/api/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Settings saved successfully");
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            const msg = err.response?.data?.error;
            toast.error(typeof msg === 'string' ? msg : "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{padding:'3rem'}} className="text-center">Loading settings...</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s', maxWidth: '800px' }}>
            <h2 className="mb-4">System Settings</h2>
            
            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Store Name</label>
                        <div className="input-wrapper">
                            <Store className="input-icon" size={20} />
                            <input type="text" className="form-input" required
                                value={settings.store_name || ''} 
                                onChange={e => setSettings({...settings, store_name: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Store Logo (URL or Upload File)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-wrapper">
                                <Monitor className="input-icon" size={20} />
                                <input type="text" className="form-input" placeholder="Valid Image URL..."
                                    value={settings.store_logo || ''} 
                                    onChange={e => setSettings({...settings, store_logo: e.target.value})} 
                                    disabled={!!logoFile}
                                />
                            </div>
                            <div>
                                <input type="file" accept="image/*" className="form-input" 
                                    onChange={e => setLogoFile(e.target.files[0])} 
                                    style={{ padding: '0.6rem' }}
                                />
                                {logoFile && <small style={{ color: 'var(--primary-color)' }}>Will upload local file instead of URL</small>}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div className="input-wrapper">
                            <Phone className="input-icon" size={20} />
                            <input type="text" className="form-input"
                                value={settings.store_phone || ''} 
                                onChange={e => setSettings({...settings, store_phone: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Currency Symbol</label>
                        <div className="input-wrapper">
                            <DollarSign className="input-icon" size={20} />
                            <select className="form-input" style={{ appearance: 'none' }}
                                value={settings.currency || 'USD'} 
                                onChange={e => setSettings({...settings, currency: e.target.value})}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="KES">KES (KSh)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tax Rate (%)</label>
                        <div className="input-wrapper">
                            <Percent className="input-icon" size={20} />
                            <input type="number" step="0.01" className="form-input"
                                value={settings.tax_rate || 0} 
                                onChange={e => setSettings({...settings, tax_rate: parseFloat(e.target.value)})} 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">System Theme</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="radio" name="theme" value="light" 
                                    checked={settings.theme === 'light'} 
                                    onChange={() => setSettings({...settings, theme: 'light'})} />
                                <Sun size={18} /> Light
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="radio" name="theme" value="dark" 
                                    checked={settings.theme === 'dark'} 
                                    onChange={() => setSettings({...settings, theme: 'dark'})} />
                                <Moon size={18} /> Dark
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Store Address</label>
                        <div className="input-wrapper">
                            <MapPin className="input-icon" size={20} style={{ top: '1rem' }} />
                            <textarea className="form-input" rows="3" style={{ paddingLeft: '2.75rem', paddingTop: '1rem' }}
                                value={settings.store_address || ''} 
                                onChange={e => setSettings({...settings, store_address: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
                        <Save size={20} /> {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}
