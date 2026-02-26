import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight, Calendar, Shield, CreditCard, RefreshCcw,
    BarChart3, Zap, MapPin, Clock, Users, ChevronRight,
    Armchair, LayoutGrid, Lock
} from 'lucide-react';

const features = [
    { icon: Calendar, title: 'Smart Scheduling', desc: 'Batch-based allocation with Mon-Wed for Batch1, Thu-Fri for Batch2. 14-day advance window.' },
    { icon: Zap, title: 'Cross-Batch Access', desc: 'Book outside your batch 1 day before after 3 PM. Dynamic buffer seats provide flexibility.' },
    { icon: Shield, title: 'Secure Auth', desc: 'Google OAuth and JWT-protected sessions. Encrypted passwords, admin role guards.' },
    { icon: CreditCard, title: 'Instant Payment', desc: 'Razorpay-powered checkout. 5-minute timeout auto-releases unpaid seats.' },
    { icon: RefreshCcw, title: 'Dynamic Buffer', desc: '10 buffer seats per batch that grow on cancellations. Maximum workspace flexibility.' },
    { icon: BarChart3, title: 'Live Analytics', desc: 'Utilization heatmaps, booking trends, batch stats — all in real-time for admins.' },
];

const seatColors = ['#dc2626', '#991b1b', '#22c55e', '#7f1d1d', '#dc2626', '#22c55e', '#991b1b', '#dc2626'];

function useScrollReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );
        ref.current?.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
    return ref;
}

function handleTilt(e, el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -6;
    const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 6;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px) scale(1.01)`;
}
function resetTilt(el) { if (el) el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)'; }

export default function Landing() {
    const scrollRef = useScrollReveal();
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, -60]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);

    return (
        <div className="page" ref={scrollRef}>
            {/* ── Hero: Asymmetric Split Layout ── */}
            <section className="landing-hero">
                <div className="hero-orb hero-orb-1" />
                <div className="hero-orb hero-orb-2" />
                <div className="hero-orb hero-orb-3" />

                {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`, top: `${50 + Math.random() * 50}%`,
                        animationDelay: `${Math.random() * 8}s`, animationDuration: `${5 + Math.random() * 5}s`,
                        width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
                        background: 'var(--primary)',
                    }} />
                ))}

                <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', minHeight: 'calc(100vh - 72px)' }}>
                    {/* Left: Text */}
                    <motion.div className="hero-content" style={{ y: heroY, opacity: heroOpacity }}>
                        <motion.div className="hero-badge"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}>
                            <Zap size={14} /> workspace_intelligence
                        </motion.div>

                        <motion.h1 className="hero-title"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}>
                            Book Your{' '}
                            <span className="gradient-text">Perfect Seat</span>
                            <br />in Seconds
                        </motion.h1>

                        <motion.p className="hero-description"
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}>
                            {`> intelligent batch allocation\n> dynamic buffer management\n> cross-batch optimization\n> zero seat collisions`}
                        </motion.p>

                        <motion.div className="hero-cta"
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}>
                            <Link to="/register">
                                <motion.button className="btn btn-primary btn-lg" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                    Initialize <ArrowRight size={16} />
                                </motion.button>
                            </Link>
                            <Link to="/login">
                                <motion.button className="btn btn-secondary btn-lg" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                    Login
                                </motion.button>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right: Visual Terminal / Seat Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 40, rotateY: -10 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ delay: 0.6, duration: 0.8, type: 'spring' }}
                        style={{ perspective: '1000px' }}
                    >
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Terminal Header */}
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: '0.72rem', color: 'var(--text-muted)'
                            }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                                </div>
                                <span style={{ marginLeft: 8, letterSpacing: '0.06em' }}>smartseat://workspace</span>
                            </div>
                            {/* Terminal Content */}
                            <div style={{ padding: 24 }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 14, lineHeight: 2 }}>
                                    <span style={{ color: 'var(--primary)' }}>$</span> smartseat status<br />
                                    <span style={{ color: 'var(--success)' }}>✓</span> 80 seats online<br />
                                    <span style={{ color: 'var(--success)' }}>✓</span> 10 spots active<br />
                                    <span style={{ color: 'var(--success)' }}>✓</span> 2 batches configured<br />
                                    <span style={{ color: 'var(--success)' }}>✓</span> buffer_ready: true<br />
                                    <span style={{ color: 'var(--primary)' }}>$</span> seat_grid --preview
                                </div>
                                {/* Animated seat grid */}
                                <div className="seat-preview">
                                    {Array.from({ length: 32 }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            className="preview-seat"
                                            style={{ background: seatColors[i % seatColors.length], animationDelay: `${i * 0.15}s` }}
                                            initial={{ scale: 0, rotateY: -90 }}
                                            animate={{ scale: 1, rotateY: 0 }}
                                            transition={{ delay: 0.8 + i * 0.03, type: 'spring', stiffness: 280, damping: 18 }}
                                            whileHover={{ scale: 1.4, rotateY: 20, rotateX: -10 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Metrics Strip ── */}
            <section className="container" style={{ paddingTop: 10, paddingBottom: 50 }}>
                <div className="reveal" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12
                }}>
                    {[
                        { val: '80', label: 'SEATS', icon: Armchair },
                        { val: '10', label: 'SPOTS', icon: MapPin },
                        { val: '2', label: 'BATCHES', icon: Users },
                        { val: '24/7', label: 'AI SUPPORT', icon: Zap },
                    ].map((s, i) => (
                        <div key={i} className="glass-card" style={{ textAlign: 'center', padding: 20 }}
                            onMouseMove={e => handleTilt(e, e.currentTarget)} onMouseLeave={e => resetTilt(e.currentTarget)}>
                            <s.icon size={22} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{s.val}</div>
                            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section className="container" style={{ paddingBottom: 60 }}>
                <div className="reveal" style={{ marginBottom: 40 }}>
                    <h2 className="section-title" style={{ fontSize: '1.6rem' }}>// feature_set</h2>
                    <p className="section-subtitle">modules.loaded( 6 )</p>
                </div>

                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}
                            onMouseMove={e => handleTilt(e, e.currentTarget)} onMouseLeave={e => resetTilt(e.currentTarget)}>
                            <div className="feature-icon-wrap">
                                <f.icon size={22} />
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="container" style={{ paddingBottom: 80 }}>
                <div className="reveal" style={{ marginBottom: 40 }}>
                    <h2 className="section-title" style={{ fontSize: '1.6rem' }}>// init_sequence</h2>
                    <p className="section-subtitle">3 steps to workspace access</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[
                        { step: '01', icon: Lock, title: 'Authenticate', desc: 'Login via Google or credentials. Batch auto-assigned.' },
                        { step: '02', icon: LayoutGrid, title: 'Select Seat', desc: 'Browse the interactive seat map. Real-time availability.' },
                        { step: '03', icon: CreditCard, title: 'Confirm & Pay', desc: 'Complete checkout in seconds. Seat locked instantly.' },
                    ].map((s, i) => (
                        <div key={i} className="glass-card reveal" style={{ transitionDelay: `${i * 0.12}s` }}
                            onMouseMove={e => handleTilt(e, e.currentTarget)} onMouseLeave={e => resetTilt(e.currentTarget)}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: 'var(--gradient)', color: 'white',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.72rem', marginBottom: 16,
                                boxShadow: '0 3px 12px var(--primary-glow)'
                            }}>{s.step}</div>
                            <s.icon size={28} style={{ color: 'var(--primary)', marginBottom: 12, display: 'block' }} />
                            <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.7 }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                textAlign: 'center', padding: '40px 20px 30px',
                color: 'var(--text-muted)', fontSize: '0.72rem',
                borderTop: '1px solid var(--border)',
                letterSpacing: '0.06em', textTransform: 'uppercase'
            }}>
                <p>© 2026 SmartSeat // Workspace Intelligence System</p>
            </footer>
        </div>
    );
}
