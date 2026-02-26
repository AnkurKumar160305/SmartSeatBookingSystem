import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleMode, setGoogleMode] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');
    const [googleName, setGoogleName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSubmit = async (e) => {
        e.preventDefault();
        if (!googleEmail.trim()) {
            toast.error('Please enter your Google email');
            return;
        }
        setLoading(true);
        try {
            await googleLogin({
                email: googleEmail,
                name: googleName || googleEmail.split('@')[0],
                batch: 'Batch1' // Default for new Google users
            });
            toast.success('Signed in with Google!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="auth-page">
                <motion.div
                    className="auth-card glass-card"
                    initial={{ opacity: 0, y: 20, rotateX: -5 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                >
                    <h1>
                        <LogIn size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        Login
                    </h1>
                    <p className="auth-subtitle">access your workspace</p>

                    {/* Google Login Section */}
                    {!googleMode ? (
                        <motion.button
                            className="btn btn-google"
                            style={{ width: '100%', marginBottom: 0 }}
                            onClick={() => setGoogleMode(true)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                            <Chrome size={18} /> Sign in with Google
                        </motion.button>
                    ) : (
                        <motion.form
                            onSubmit={handleGoogleSubmit}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            style={{
                                background: 'var(--bg-secondary)',
                                padding: 16,
                                borderRadius: 12,
                                border: '1px solid var(--border)',
                                marginBottom: 0
                            }}
                        >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Chrome size={14} /> Google Sign In
                            </div>
                            <div className="form-group" style={{ marginBottom: 10 }}>
                                <label>Google Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="your.email@gmail.com"
                                    value={googleEmail}
                                    onChange={e => setGoogleEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <label>Display Name (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Your Name"
                                    value={googleName}
                                    onChange={e => setGoogleName(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <motion.button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                                    disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    {loading ? 'Signing in...' : 'Continue'}
                                </motion.button>
                                <button type="button" className="btn btn-secondary" onClick={() => setGoogleMode(false)}>
                                    Cancel
                                </button>
                            </div>
                        </motion.form>
                    )}

                    <div className="auth-divider">or</div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label><Mail size={12} style={{ verticalAlign: 'middle' }} /> Email</label>
                            <input type="email" className="form-input" placeholder="you@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label><Lock size={12} style={{ verticalAlign: 'middle' }} /> Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPw ? 'text' : 'password'} className="form-input" placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)} required
                                    style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4
                                    }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button type="submit" className="btn btn-primary" style={{ width: '100%' }}
                            disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            {loading ? 'authenticating...' : 'Sign In'}
                        </motion.button>
                    </form>

                    {/* Demo Credentials */}
                    <div style={{
                        marginTop: 20, padding: 14, borderRadius: 10,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 2
                    }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.66rem' }}>
              // demo_credentials
                        </div>
                        <div><span style={{ color: 'var(--primary)' }}>admin</span>: admin@smartseat.com / admin123</div>
                        <div><span style={{ color: 'var(--success)' }}>batch1</span>: demo1@smartseat.com / demo123</div>
                        <div><span style={{ color: 'var(--warning)' }}>batch2</span>: demo2@smartseat.com / demo123</div>
                    </div>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Register</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
