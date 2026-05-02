import { useState, useContext, useEffect } from 'react';
import axios from '../config';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '', username: '', email: '', phone_number: '', password: '', confirm_password: '', code: ''
  });
  const [loading, setLoading] = useState(false);
  const { registerRequest, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [brand, setBrand] = useState({ store_name: 'MeshPOS', store_logo: null });

  useEffect(() => {
    axios.get('/api/settings').then(res => {
      if(res.data) setBrand(res.data);
    }).catch(console.error);
  }, []);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!formData.email) return toast.error("Please enter email first");
    
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/request-verification', { email: formData.email });
      toast.success("Verification code sent to email!");
      
      // DEMO MODE: Auto-fill/show the code since SMTP is not configured
      if (res.data.mock_code) {
          toast(`Demo Mode: Your code is ${res.data.mock_code}`, { icon: '🔑', duration: 10000 });
          setFormData(prev => ({ ...prev, code: res.data.mock_code }));
      }
      
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      return toast.error("Passwords do not match");
    }
    
    setLoading(true);
    try {
      await register({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        code: formData.code
      });
      toast.success("Account created successfully! Please login.");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ maxWidth: '1100px' }}>
        <div className="auth-info" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="auth-info-content">
            <div className="auth-info-logo" style={{ alignItems: 'center' }}>
              {brand.store_logo ? (
                 <img src={brand.store_logo} alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: '12px', background: 'white', padding: '5px' }} />
              ) : (
                 <Store size={60} />
              )}
              <span>{brand.store_name}</span>
            </div>
            <h2 className="mb-2">System Setup</h2>
            <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
              Register the required administrator account. Once created, only admins can register new cashiers.
            </p>
          </div>
        </div>
        
        <div className="auth-form-container">
          <div className="text-center mb-4">
            <h2>Create Account</h2>
            <p className="text-muted">Fill in details to register user</p>
          </div>
          
          {step === 1 ? (
            <form onSubmit={handleRequestCode}>
              <div className="form-group">
                <label className="form-label">Email Address (for verification)</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input type="email" className="form-input" required placeholder="admin@autopos.com"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }} disabled={loading}>
                {loading ? "Sending Code..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input type="text" className="form-input" required placeholder="John Doe"
                      value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input type="text" className="form-input" required placeholder="johndoe123"
                      value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Phone Number</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={20} />
                    <input type="text" className="form-input" required placeholder="+1 234 567 8900"
                      value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Verification Code (Sent to {formData.email})</label>
                  <div className="input-wrapper">
                    <ShieldCheck className="input-icon" size={20} color="#10b981" />
                    <input type="text" className="form-input" required placeholder="6-digit code"
                      value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={20} />
                    <input type="password" className="form-input" required placeholder="••••••••"
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={20} />
                    <input type="password" className="form-input" required placeholder="••••••••"
                      value={formData.confirm_password} onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mb-3" style={{ background: '#10b981', marginTop: '1rem', width: '100%' }} disabled={loading}>
                {loading ? "Registering..." : "Complete Registration"}
              </button>
            </form>
          )}
          
          <p className="auth-toggle">
            Already have an account? <Link to="/login" className="link" style={{ color: '#10b981' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
