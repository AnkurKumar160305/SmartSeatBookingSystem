import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Users, Calendar, RefreshCcw, LayoutGrid,
    ShieldCheck, AlertTriangle, Trash2, Plus, X,
    ExternalLink, Hash, Info, Zap, Trash
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [buffers, setBuffers] = useState([]);
    const [showAddHoliday, setShowAddHoliday] = useState(false);
    const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, bookingsRes, holidaysRes, buffersRes] = await Promise.all([
                api.get('/api/admin/stats'),
                api.get('/api/admin/bookings'),
                api.get('/api/holidays'),
                api.get('/api/seats/buffer')
            ]);
            setStats(statsRes.data);
            setBookings(bookingsRes.data.bookings);
            setHolidays(holidaysRes.data.holidays);
            setBuffers(buffersRes.data.buffers);
        } catch {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const forceRelease = async (id) => {
        if (!window.confirm('Force release this seat?')) return;
        try {
            await api.delete(`/api/admin/bookings/${id}`);
            toast.success('Seat released');
            fetchData();
        } catch { toast.error('Failed to release'); }
    };

    const addHoliday = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/holidays', newHoliday);
            toast.success('Holiday added');
            setShowAddHoliday(false);
            setNewHoliday({ date: '', reason: '' });
            fetchData();
        } catch { toast.error('Failed to add holiday'); }
    };

    const deleteHoliday = async (id) => {
        try {
            await api.delete(`/api/holidays/${id}`);
            toast.success('Holiday removed');
            fetchData();
        } catch { toast.error('Failed to remove holiday'); }
    };

    const updateBuffer = async (batch, count) => {
        try {
            await api.patch('/api/admin/buffer', { batch, count: parseInt(count) });
            toast.success('Buffer updated');
            fetchData();
        } catch { toast.error('Failed to update'); }
    };

    return (
        <div className="page">
            <div className="container" style={{ paddingBottom: 60 }}>
                <div style={{ marginBottom: 32 }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={24} /> admin_kernel_access
                    </h2>
                    <p className="section-subtitle">// system_controls & utilization_metrics</p>
                </div>

                <div className="admin-tabs">
                    {[
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'bookings', label: 'All Bookings', icon: LayoutGrid },
                        { id: 'holidays', label: 'Holidays', icon: Calendar },
                        { id: 'buffer', label: 'Buffer Settings', icon: RefreshCcw },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                        kernel_sync_in_progress...
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'analytics' && stats && (
                            <div style={{ display: 'grid', gap: 24 }}>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Users size={20} /></div>
                                        <div className="stat-value">{stats.overview.totalUsers}</div>
                                        <div className="stat-label">System Users</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}><Zap size={20} /></div>
                                        <div className="stat-value">{stats.overview.activeBookings}</div>
                                        <div className="stat-label">Live Reservations</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--buffer)' }}><RefreshCcw size={20} /></div>
                                        <div className="stat-value">{(stats.overview.utilizationRate * 100).toFixed(1)}%</div>
                                        <div className="stat-label">Utilization Rate</div>
                                    </div>
                                </div>

                                <div className="glass-card">
                                    <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: 20 }}>// utilization_heatmap</h3>
                                    <div className="heatmap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                                        {stats.heatmap.map((h, i) => (
                                            <div
                                                key={i}
                                                className="heatmap-cell"
                                                style={{
                                                    height: 40,
                                                    backgroundColor: h.bookings > 0 ? `rgba(220, 38, 38, ${Math.min(0.2 + h.bookings * 0.1, 0.9)})` : 'var(--bg-secondary)',
                                                    border: '1px solid var(--border)',
                                                    color: h.bookings > 3 ? 'white' : 'var(--text-secondary)'
                                                }}
                                            >
                                                {h.bookings}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        <span>SPOT_01</span>
                                        <span>SPOT_10</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr>
                                        <th>USER</th><th>DATE</th><th>COORDS</th><th>BATCH</th><th>PAYMENT</th><th>STATUS</th><th>ACTIONS</th>
                                    </tr></thead>
                                    <tbody>
                                        {bookings.map(b => (
                                            <tr key={b.id}>
                                                <td>
                                                    <div style={{ fontWeight: 800 }}>{b.user_name}</div>
                                                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                                                </td>
                                                <td>{b.booking_date}</td>
                                                <td style={{ fontWeight: 800 }}>S{b.spot_number} : H{b.seat_number}</td>
                                                <td><span className="badge badge-primary">{b.batch_assigned}</span></td>
                                                <td><span className={`badge ${b.payment_status === 'paid' ? 'badge-success' : 'badge-danger'}`}>{b.payment_status}</span></td>
                                                <td><span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{b.status}</span></td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => forceRelease(b.id)}>
                                                        <Trash2 size={12} /> RELEASE
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'holidays' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <h3 className="section-title" style={{ fontSize: '1rem' }}>// scheduled_downtime</h3>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddHoliday(true)}>
                                        <Plus size={14} /> ADD_HOLIDAY
                                    </button>
                                </div>

                                <div className="table-wrapper">
                                    <table>
                                        <thead><tr><th>DATE</th><th>DESCRIPTION</th><th>ACTION</th></tr></thead>
                                        <tbody>
                                            {holidays.map(h => (
                                                <tr key={h.id}>
                                                    <td style={{ fontWeight: 800 }}>{h.date}</td>
                                                    <td>{h.reason}</td>
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" onClick={() => deleteHoliday(h.id)}>
                                                            <Trash size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'buffer' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                {buffers.map(b => (
                                    <div key={b.batch} className="glass-card">
                                        <h3 className="section-title" style={{ fontSize: '1rem', color: 'var(--primary)' }}>// {b.batch}_buffer</h3>
                                        <div className="form-group" style={{ marginTop: 20 }}>
                                            <label>POOL_SIZE</label>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    defaultValue={b.total_buffer}
                                                    onBlur={(e) => updateBuffer(b.batch, e.target.value)}
                                                />
                                                <button className="btn btn-primary btn-sm">SYNC</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showAddHoliday && (
                    <div className="modal-overlay">
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                            <h3 className="modal-title">// declare_holiday</h3>
                            <form onSubmit={addHoliday} style={{ marginTop: 24 }}>
                                <div className="form-group">
                                    <label>TIMESTAMP</label>
                                    <input type="date" className="form-input" required
                                        value={newHoliday.date} onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>DESCRIPTION</label>
                                    <input type="text" className="form-input" required placeholder="Reason for holiday"
                                        value={newHoliday.reason} onChange={e => setNewHoliday({ ...newHoliday, reason: e.target.value })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-primary">INITIALIZE</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddHoliday(false)}>ABORT</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
