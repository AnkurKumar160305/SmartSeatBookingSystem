import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SeatMap from './pages/SeatMap';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const { user } = useAuth();
    return user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
}

// Custom 3D Cursor
function CustomCursor() {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        const onMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.left = mouseX - 4 + 'px';
            dot.style.top = mouseY - 4 + 'px';
        };

        const onDown = () => ring.classList.add('clicking');
        const onUp = () => ring.classList.remove('clicking');

        const onOver = (e) => {
            const t = e.target;
            if (t.tagName === 'A' || t.tagName === 'BUTTON' || t.closest('a') || t.closest('button') || t.closest('.seat') || t.closest('.feature-card') || t.closest('.stat-card') || t.closest('.quick-q')) {
                ring.classList.add('hovering');
            }
        };
        const onOut = () => ring.classList.remove('hovering');

        function animate() {
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            ring.style.left = ringX + 'px';
            ring.style.top = ringY + 'px';
            requestAnimationFrame(animate);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('mouseover', onOver);
        document.addEventListener('mouseout', onOut);
        animate();

        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('mouseover', onOver);
            document.removeEventListener('mouseout', onOut);
        };
    }, []);

    return (
        <>
            <div ref={dotRef} className="cursor-dot" />
            <div ref={ringRef} className="cursor-ring" />
        </>
    );
}

export default function App() {
    const { user } = useAuth();

    return (
        <>
            <CustomCursor />
            <Navbar />
            <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/seats" element={<ProtectedRoute><SeatMap /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            </Routes>
            {user && <Chatbot />}
        </>
    );
}
