import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    UserPlus, Mail, Lock, User, Hash, Eye, EyeOff,
    Zap, Chrome, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        batch: 'Batch1',
        employee_id: ''
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            const msg = typeof err.response?.data?.error === 'string'
                ? err.response.data.error
                : 'Registration failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="auth-page">
                <motion.div
                    className="auth-card glass-card"
                    initial={{ opacity: 0, y: 20, rotateX: 5 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                >
                    <h1>
                        <UserPlus size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        Register
                    </h1>
                    <p className="auth-subtitle">initialize_new_user_profile</p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label><User size={12} style={{ verticalAlign: 'middle' }} /> Full Name</label>
                            <input type="text" className="form-input" placeholder="John Doe"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>

                        <div className="form-group">
                            <label><Mail size={12} style={{ verticalAlign: 'middle' }} /> Email</label>
                            <input type="email" className="form-input" placeholder="you@example.com"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </div>

                        <div className="form-group">
                            <label><Hash size={12} style={{ verticalAlign: 'middle' }} /> Employee ID</label>
                            <input type="text" className="form-input" placeholder="EMP001"
                                value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} required />
                        </div>

                        <div className="form-group">
                            <label><ShieldAlert size={12} style={{ verticalAlign: 'middle' }} /> Assigned Batch</label>
                            <select className="form-input" value={formData.batch}
                                onChange={e => setFormData({ ...formData, batch: e.target.value })}>
                                <option value="Batch1">Batch 1 (Mon-Wed)</option>
                                <option value="Batch2">Batch 2 (Thu-Fri)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label><Lock size={12} style={{ verticalAlign: 'middle' }} /> Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPw ? 'text' : 'password'} className="form-input" placeholder="••••••••"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required
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
                            {loading ? 'creating_profile...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Login</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
