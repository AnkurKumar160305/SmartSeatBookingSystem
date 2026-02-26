import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Calendar, MapPin, Armchair,
    Zap, Info, AlertTriangle, Hash, Clock
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import toast from 'react-hot-toast';

const SPOTS = [
    { id: 1, name: 'Spot 1', batch: 'Batch1' },
    { id: 2, name: 'Spot 2', batch: 'Batch1' },
    { id: 3, name: 'Spot 3', batch: 'Batch1' },
    { id: 4, name: 'Spot 4', batch: 'Batch1' },
    { id: 5, name: 'Spot 5', batch: 'Batch1' },
    { id: 6, name: 'Spot 6', batch: 'Batch2' },
    { id: 7, name: 'Spot 7', batch: 'Batch2' },
    { id: 8, name: 'Spot 8', batch: 'Batch2' },
    { id: 9, name: 'Spot 9', batch: 'Batch2' },
    { id: 10, name: 'Spot 10', batch: 'Batch2' },
];

export default function SeatMap() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        fetchSeats();
    }, [selectedDate]);

    const fetchSeats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/seats?date=${selectedDate}`);
            setSeats(res.data.seats);
        } catch (err) {
            toast.error('Failed to load seats');
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        const day = d.getDay();
        if (day === 0 || day === 6) {
            d.setDate(d.getDate() + (days > 0 ? (day === 6 ? 2 : 1) : (day === 0 ? -2 : -1)));
        }
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const currentDay = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const isBatch1Day = ['Monday', 'Tuesday', 'Wednesday'].includes(currentDay);
    const dayBatch = isBatch1Day ? 'Batch1' : 'Batch2';
    const isCrossBatch = user?.batch !== dayBatch;

    const handleSeatClick = (seat) => {
        if (seat.status !== 'available' && seat.status !== 'buffer') return;
        setSelectedSeat(seat);
        setShowPayment(true);
    };

    return (
        <div className="page">
            <div className="container" style={{ paddingBottom: 60 }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Armchair size={24} /> seat_map_initialization
                        </h2>
                        <p className="section-subtitle">
              // current_session: <span style={{ color: 'var(--primary)' }}>{user?.batch}</span> protocol
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => changeDate(-1)}>
                            <ChevronLeft size={16} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.04em' }}>
                            <Calendar size={16} style={{ color: 'var(--primary)' }} />
                            {selectedDate} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({currentDay})</span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => changeDate(1)}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Warning Banner if Cross Batch */}
                <AnimatePresence>
                    {isCrossBatch && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="glass-card"
                            style={{
                                background: 'var(--warning-bg)',
                                borderColor: 'var(--warning)',
                                marginBottom: 24,
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                color: 'var(--warning)'
                            }}
                        >
                            <AlertTriangle size={20} />
                            <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                CRITICAL: Cross-batch sequence detected. You are accessing <span style={{ textTransform: 'uppercase' }}>{dayBatch}</span> buffer.
                                (3:00 PM restriction active)
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Legend */}
                <div className="seat-legend">
                    <div className="legend-item"><div className="legend-dot available"></div> AVAILABLE</div>
                    <div className="legend-item"><div className="legend-dot booked"></div> RESERVED</div>
                    <div className="legend-item"><div className="legend-dot buffer"></div> BUFFER/CROSS</div>
                </div>

                {/* Loading / Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                        synchronizing_seat_data...
                    </div>
                ) : (
                    <div className="seat-map-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {SPOTS.map(spot => {
                            const spotSeats = seats.filter(s => s.spot_number === spot.id);
                            return (
                                <motion.div
                                    key={spot.id}
                                    className="glass-card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', damping: 20 }}
                                >
                                    <div className="spot-header" style={{ marginBottom: 16 }}>
                                        <div className="spot-label">
                                            {spot.name}
                                        </div>
                                        <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
                                            {spot.batch}
                                        </span>
                                    </div>

                                    <div className="seats-row">
                                        {spotSeats.map(seat => {
                                            const isAvailable = (seat.status === 'available' || seat.status === 'buffer');
                                            return (
                                                <div key={seat.id} style={{ position: 'relative' }}>
                                                    <motion.button
                                                        className={`seat seat-${seat.status}`}
                                                        onClick={() => handleSeatClick(seat)}
                                                        disabled={!isAvailable}
                                                        whileHover={isAvailable ? { scale: 1.15, rotateX: -5, rotateY: 5 } : {}}
                                                        whileTap={isAvailable ? { scale: 0.9 } : {}}
                                                    >
                                                        <Hash size={10} style={{ position: 'absolute', top: 4, left: 4, opacity: 0.3 }} />
                                                        {seat.seat_number}
                                                    </motion.button>

                                                    {/* Tooltip on Hover */}
                                                    {isAvailable && (
                                                        <div className="seat-tooltip-anchor">
                                                            {/* Simple CSS-based hover would be better here for performance, but we use index.css styles */}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showPayment && selectedSeat && (
                    <PaymentModal
                        seat={selectedSeat}
                        date={selectedDate}
                        onClose={() => setShowPayment(false)}
                        onSuccess={() => {
                            setShowPayment(false);
                            fetchSeats();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
