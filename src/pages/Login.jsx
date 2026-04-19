import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Store, LogIn, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../config';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const [brand, setBrand] = useState({ store_name: 'AutoPOS', store_logo: null });

  // Reset password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetData, setResetData] = useState({ username: '', phone_number: '', new_password: '' });
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/settings').then(res => {
      if (res.data) setBrand(res.data);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      return toast.error("Please enter credentials");
    }
    setLoading(true);
    try {
      await login(identifier, password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', resetData);
      toast.success(res.data.message);
      setShowForgotModal(false);
      setResetData({ username: '', phone_number: '', new_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Password reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-info">
          <div className="auth-info-content">
            <div className="auth-info-logo" style={{ alignItems: 'center' }}>
              {brand.store_logo ? (
                <img src={brand.store_logo} alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: '12px', background: 'white', padding: '5px' }} />
              ) : (
                <Store size={60} />
              )}
              <span>{brand.store_name}</span>
            </div>
            <h2 className="mb-2">Welcome Back!</h2>
            <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
              Streamline your sales, manage inventory effortlessly, and scale your business with our professional Point of Sale Systems.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>&copy; 2026 MeshPOS Systems. All rights reserved.</p>
            </div>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="text-center mb-4">
            <h2>Sign In</h2>
            <p className="text-muted">Enter your details to access your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <div className="input-wrapper">
                <LogIn className="input-icon" size={20} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <KeyRound className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex-between mb-4">
              <label className="checkbox-group">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <a href="#" className="link" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}>Forgot Password?</a>
            </div>

            <button type="submit" className="btn btn-primary mb-3" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-toggle">
            First time setup? <Link to="/register" className="link">Register Admin</Link>
          </p>
        </div>
      </div>

      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '12px' }}>
            <h3 className="mb-2">Reset Password</h3>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Verify your identity using your username and registered phone number.</p>
            <form onSubmit={handleReset}>
              <div className="form-group mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-input" required value={resetData.username} onChange={e => setResetData({...resetData, username: e.target.value})} placeholder="e.g. admin" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" required value={resetData.phone_number} onChange={e => setResetData({...resetData, phone_number: e.target.value})} placeholder="e.g. 254700000000" />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" required value={resetData.new_password} onChange={e => setResetData({...resetData, new_password: e.target.value})} placeholder="••••••••" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowForgotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={resetLoading}>
                  {resetLoading ? "Resetting..." : "Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
