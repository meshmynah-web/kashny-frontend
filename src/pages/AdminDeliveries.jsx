import React, { useState, useEffect } from 'react';
import axios from '../config';
import { Plus, Search, MapPin, Truck, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDeliveries() {
    const [deliveries, setDeliveries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '', customer_phone: '', customer_id_no: '', delivery_address: '', pick_up_location: '',
        delivery_person_name: '', delivery_person_phone: '', delivery_person_id_no: '', number_plate: '', sacco: '',
        delivery_fee: '', notes: '', status: 'pending'
    });

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const res = await axios.get('/api/deliveries');
            setDeliveries(res.data);
        } catch (err) {
            toast.error("Failed to fetch deliveries");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/deliveries', formData);
            toast.success("Delivery created successfully");
            setShowModal(false);
            setFormData({
                customer_name: '', customer_phone: '', customer_id_no: '', delivery_address: '', pick_up_location: '',
                delivery_person_name: '', delivery_person_phone: '', delivery_person_id_no: '', number_plate: '', sacco: '',
                delivery_fee: '', notes: '', status: 'pending'
            });
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to create delivery");
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.put(`/api/deliveries/${id}`, { status: newStatus });
            toast.success("Status updated");
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const deleteDelivery = async (id) => {
        if (!window.confirm("Are you sure you want to delete this delivery?")) return;
        try {
            await axios.delete(`/api/deliveries/${id}`);
            toast.success("Delivery deleted");
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const filteredDeliveries = deliveries.filter(d => 
        d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.delivery_person_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s', paddingBottom: '2rem' }}>
            <div className="flex-between mb-4">
                <div>
                    <h2>Deliveries Management</h2>
                    <p className="text-muted">Track and manage outgoing deliveries</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> New Delivery
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="input-wrapper" style={{ flex: 1 }}>
                        <Search className="input-icon" size={18} />
                        <input type="text" className="form-input" placeholder="Search by customer or driver name..." 
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {filteredDeliveries.map(d => (
                    <div key={d.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Delivery #{d.id}</div>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                                background: d.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : d.status === 'in transit' ? 'rgba(59, 130, 246, 0.2)' : d.status === 'delivered' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: d.status === 'pending' ? '#f59e0b' : d.status === 'in transit' ? '#3b82f6' : d.status === 'delivered' ? '#10b981' : '#ef4444'
                            }}>
                                {d.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Customer Details</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} color="var(--primary-color)" />
                                <div>
                                    <div style={{ fontWeight: 500 }}>{d.customer_name} ({d.customer_phone})</div>
                                    <div style={{ fontSize: '0.85rem' }}>ID: {d.customer_id_no || 'N/A'} • Addr: {d.delivery_address}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Driver Details</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Truck size={16} color="var(--primary-color)" />
                                <div>
                                    <div style={{ fontWeight: 500 }}>{d.delivery_person_name} ({d.delivery_person_phone})</div>
                                    <div style={{ fontSize: '0.85rem' }}>Plate: {d.number_plate || 'N/A'} • Sacco: {d.sacco || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <select className="form-input" style={{ width: '130px', padding: '6px' }} value={d.status} onChange={(e) => updateStatus(d.id, e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="in transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <button className="btn" style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => deleteDelivery(d.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '800px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <div className="flex-between mb-4">
                            <h2>Create New Delivery</h2>
                            <button className="btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary-color)' }}>Customer Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group"><label>Customer Name *</label><input type="text" className="form-input" required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} /></div>
                                <div className="form-group"><label>Phone Number *</label><input type="text" className="form-input" required value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} /></div>
                                <div className="form-group"><label>ID Number</label><input type="text" className="form-input" value={formData.customer_id_no} onChange={e => setFormData({...formData, customer_id_no: e.target.value})} /></div>
                                <div className="form-group"><label>Pick Up Location *</label><input type="text" className="form-input" required value={formData.pick_up_location} onChange={e => setFormData({...formData, pick_up_location: e.target.value})} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Delivery Address *</label><input type="text" className="form-input" required value={formData.delivery_address} onChange={e => setFormData({...formData, delivery_address: e.target.value})} /></div>
                            </div>

                            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '15px', marginTop: '20px', color: 'var(--primary-color)' }}>Driver Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group"><label>Driver Name *</label><input type="text" className="form-input" required value={formData.delivery_person_name} onChange={e => setFormData({...formData, delivery_person_name: e.target.value})} /></div>
                                <div className="form-group"><label>Driver Phone *</label><input type="text" className="form-input" required value={formData.delivery_person_phone} onChange={e => setFormData({...formData, delivery_person_phone: e.target.value})} /></div>
                                <div className="form-group"><label>ID Number</label><input type="text" className="form-input" value={formData.delivery_person_id_no} onChange={e => setFormData({...formData, delivery_person_id_no: e.target.value})} /></div>
                                <div className="form-group"><label>Number Plate</label><input type="text" className="form-input" value={formData.number_plate} onChange={e => setFormData({...formData, number_plate: e.target.value})} /></div>
                                <div className="form-group"><label>Sacco</label><input type="text" className="form-input" value={formData.sacco} onChange={e => setFormData({...formData, sacco: e.target.value})} /></div>
                                <div className="form-group"><label>Delivery Fee (KSh)</label><input type="number" className="form-input" value={formData.delivery_fee} onChange={e => setFormData({...formData, delivery_fee: e.target.value})} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Additional Notes</label><textarea className="form-input" rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Delivery</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
