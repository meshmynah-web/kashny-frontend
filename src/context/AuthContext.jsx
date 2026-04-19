import { createContext, useState, useEffect } from 'react';
import axios from '../config';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('pos_user');
        const token = localStorage.getItem('pos_token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        const res = await axios.post('/api/auth/login', { identifier, password });
        setUser(res.data.user);
        localStorage.setItem('pos_token', res.data.token);
        localStorage.setItem('pos_user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        
        if (res.data.user.role === 'Admin') {
            navigate('/admin/dashboard');
        } else {
            navigate('/pos/sales');
        }
    };

    const registerRequest = async (email) => {
        await axios.post('/api/auth/request-verification', { email });
    };

    const register = async (userData) => {
        const res = await axios.post('/api/auth/register', userData);
        return res.data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, registerRequest, register }}>
            {children}
        </AuthContext.Provider>
    );
};
