import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Armchair, Sun, Moon, LogOut, Menu, X, LayoutDashboard,
    Map, ShieldCheck
} from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <motion.div className="logo-icon" whileHover={{ rotateY: 180 }} transition={{ duration: 0.4 }}>
                        <Armchair size={18} />
                    </motion.div>
                    SmartSeat
                </Link>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    {user ? (
                        <>
                            <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMenuOpen(false)}>
                                <LayoutDashboard size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                Dashboard
                            </Link>
                            <Link to="/seats" className={isActive('/seats')} onClick={() => setMenuOpen(false)}>
                                <Map size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                Seat Map
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin" className={isActive('/admin')} onClick={() => setMenuOpen(false)}>
                                    <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Admin
                                </Link>
                            )}
                            <div className="user-badge">
                                <span>{user.name}</span>
                                <span className="batch-tag">{user.batch}</span>
                            </div>
                            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <LogOut size={14} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>Login</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)}>
                                <button className="btn btn-primary btn-sm">Get Started</button>
                            </Link>
                        </>
                    )}
                    <motion.button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div key={theme}
                                initial={{ rotateY: -90, opacity: 0 }}
                                animate={{ rotateY: 0, opacity: 1 }}
                                exit={{ rotateY: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}>
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>
                </div>

                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>
        </nav>
    );
}
