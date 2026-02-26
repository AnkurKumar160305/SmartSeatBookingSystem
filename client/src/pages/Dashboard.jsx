import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Calendar, CheckCircle, RefreshCcw, BarChart3,
    MapPin, ArrowRight, XCircle, Clock, Zap, Hash
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

function handleTilt(e, el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -5;
    const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 5;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px) scale(1.01)`;
}
function resetTilt(el) { if (el) el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)'; }

export default function Dashboard() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [buffers, setBuffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [bRes, bufRes] = await Promise.all([api.get('/api/bookings/my'), api.get('/api/seats/buffer')]);
            setBookings(bRes.data.bookings);
            setBuffers(bufRes.data.buffers);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    const cancelBooking = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            await api.post(`/api/bookings/${id}/cancel`);
            toast.success('Booking cancelled');
            fetchData();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const active = bookings.filter(b => b.status === 'active' && b.payment_status === 'paid');
    const upcoming = active.find(b => b.booking_date >= new Date().toISOString().split('T')[0]);
    const batchDays = user?.batch === 'Batch1' ? 'Mon, Tue, Wed' : 'Thu, Fri';
    const myBuffer = buffers.find(b => b.batch === user?.batch);

    const stats = [
        { icon: Calendar, label: 'Total Bookings', value: bookings.length, color: '#dc2626' },
        { icon: CheckCircle, label: 'Active', value: active.length, color: '#22c55e' },
        { icon: RefreshCcw, label: 'Buffer', value: myBuffer?.total_buffer || 0, color: '#eab308' },
        { icon: BarChart3, label: 'Batch Days', value: batchDays, color: '#dc2626' },
    ];

    if (loading) {
        return <div className="page"><div className="container dashboard" style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 14px' }} />
            loading_dashboard...
        </div></div>;
    }

    return (
        <div className="page">
            <div className="container dashboard">
                {/* Welcome */}
                <motion.div className="welcome-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={20} /> Welcome, {user?.name}
                    </h1>
                    <p>{user?.batch} // {user?.email} // {user?.employee_id}</p>
                </motion.div>

                {/* Stats - 2x2 Grid */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {stats.map((s, i) => (
                        <motion.div key={i} className="stat-card"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, type: 'spring' }}
                            onMouseMove={e => handleTilt(e, e.currentTarget)}
                            onMouseLeave={e => resetTilt(e.currentTarget)}>
                            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                                <s.icon size={20} />
                            </div>
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Upcoming + Actions - Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: upcoming ? '2fr 1fr' : '1fr', gap: 16, marginBottom: 28 }}>
                    {upcoming && (
                        <motion.div className="glass-card" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                            onMouseMove={e => handleTilt(e, e.currentTarget)} onMouseLeave={e => resetTilt(e.currentTarget)}>
                            <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                <Clock size={16} style={{ color: 'var(--primary)' }} /> next_booking
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Date</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{upcoming.booking_date}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Location</div>
                                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                                        Spot {upcoming.spot_number} / Seat {upcoming.seat_number}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Type</div>
                                    <div>{upcoming.is_cross_batch ? <span className="badge badge-warning"><Zap size={10} /> Cross</span> : <span className="badge badge-success">Regular</span>}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Link to="/seats" style={{ flex: 1 }}>
                            <motion.button className="btn btn-primary" style={{ width: '100%', height: '100%' }}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <MapPin size={16} /> Book a Seat <ArrowRight size={14} />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>

                {/* Booking History */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h2 className="section-title">
                        <Hash size={18} style={{ verticalAlign: 'middle' }} /> booking_history
                    </h2>
                    <p className="section-subtitle">records.count( {bookings.length} )</p>

                    {bookings.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>No bookings yet</p>
                            <Link to="/seats"><button className="btn btn-primary btn-sm">Book a Seat</button></Link>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr>
                                    <th>Date</th><th>Spot</th><th>Seat</th><th>Batch</th>
                                    <th>Type</th><th>Payment</th><th>Status</th><th>Action</th>
                                </tr></thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.id}>
                                            <td style={{ fontWeight: 800 }}>{b.booking_date}</td>
                                            <td><MapPin size={12} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> {b.spot_number}</td>
                                            <td><Hash size={12} style={{ color: 'var(--text-muted)', verticalAlign: 'middle' }} /> {b.seat_number}</td>
                                            <td><span className="badge badge-primary">{b.batch_assigned}</span></td>
                                            <td>{b.is_cross_batch ? <span className="badge badge-warning"><Zap size={9} /> Cross</span> : <span className="badge badge-success">Reg</span>}</td>
                                            <td><span className={`badge ${b.payment_status === 'paid' ? 'badge-success' : 'badge-danger'}`}>{b.payment_status}</span></td>
                                            <td><span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{b.status}</span></td>
                                            <td>{b.status === 'active' && b.booking_date >= new Date().toISOString().split('T')[0] && (
                                                <motion.button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.id)}
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <XCircle size={12} /> Cancel
                                                </motion.button>
                                            )}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
