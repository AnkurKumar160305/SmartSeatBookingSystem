import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CreditCard, Clock, ShieldCheck, Zap,
    AlertCircle, CheckCircle2, Loader2, Sparkles, Hash
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function PaymentModal({ seat, date, onClose, onSuccess }) {
    const [step, setStep] = useState('review');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 mins

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose();
                    toast.error('Payment timeout: Seat released');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onClose]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePay = async () => {
        setLoading(true);
        setStep('processing');

        // Simulate payment gateway delay
        await new Promise(r => setTimeout(r, 2000));

        try {
            await api.post('/api/bookings', {
                seat_id: seat.id,
                booking_date: date
            });
            setStep('success');
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Booking failed');
            setStep('review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal"
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
                <button className="btn btn-secondary btn-sm" onClick={onClose}
                    style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, padding: 0 }}>
                    <X size={16} />
                </button>

                {step === 'review' && (
                    <>
                        <div className="modal-title">
                            <CreditCard size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                            checkout_initialization
                        </div>
                        <p className="modal-subtitle">confirm seat reservation sequence</p>

                        <div className="payment-timer">
                            <div className="payment-timer-bar" style={{ width: `${(timeLeft / 300) * 100}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', fontWeight: 800, marginTop: -12, marginBottom: 20, color: 'var(--text-muted)' }}>
                            <span>LOCK_TIMEOUT</span>
                            <span style={{ color: timeLeft < 60 ? 'var(--primary)' : 'inherit' }}><Clock size={10} /> {formatTime(timeLeft)}</span>
                        </div>

                        <div className="glass-card" style={{ background: 'var(--bg-secondary)', marginBottom: 20 }}>
                            <div className="payment-row">
                                <span className="label">WORKSPACE_ID</span>
                                <span className="value" style={{ color: 'var(--primary)' }}>SmartSeat://101</span>
                            </div>
                            <div className="payment-row">
                                <span className="label">COORDINATES</span>
                                <span className="value">S{seat.spot_number} : <Hash size={12} style={{ verticalAlign: 'middle' }} />{seat.seat_number}</span>
                            </div>
                            <div className="payment-row">
                                <span className="label">TIMESTAMP</span>
                                <span className="value">{date}</span>
                            </div>
                            <div className="payment-row" style={{ borderBottom: 'none' }}>
                                <span className="label">TOTAL_FEE</span>
                                <span className="value" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>₹100</span>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 24, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            <p>Transactions are encrypted via Razorpay secure layer. Seat will be released if payment is not detected within the timeout.</p>
                        </div>

                        <motion.button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handlePay}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Initialize Payment <Zap size={14} />
                        </motion.button>
                    </>
                )}

                {step === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Loader2 size={48} style={{ color: 'var(--primary)', marginBottom: 20 }} />
                        </motion.div>
                        <h3 className="modal-title">verifying_transaction</h3>
                        <p className="modal-subtitle">communicating with payment gateway...</p>
                    </div>
                )}

                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                            <CheckCircle2 size={64} style={{ color: 'var(--success)', marginBottom: 20 }} />
                        </motion.div>
                        <h3 className="modal-title" style={{ color: 'var(--success)' }}>sequence_confirmed</h3>
                        <p className="modal-subtitle">Seat {seat.seat_number} has been allocated successfully.</p>
                        <div style={{ marginTop: 24 }}>
                            <div className="badge badge-success"><Sparkles size={12} /> booking_complete</div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
