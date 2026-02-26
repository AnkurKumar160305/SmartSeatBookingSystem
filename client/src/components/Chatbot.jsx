import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot, User, Zap } from 'lucide-react';
import api from '../utils/api';

const quickQuestions = [
    '📋 Booking rules',
    '📊 Availability',
    '🔁 Cross-batch',
    '🟡 Buffer status',
    '💳 Payment info',
    '🔓 Cancel booking',
    '📅 Holidays',
    '👤 My profile',
    '🏢 Workspace',
    '⏰ 3 PM rule',
];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: `> system_initialized\n> welcome_to_smartseat_ai\n\nI am your **Kernel Assistant**. I can help you with workspace protocols, availability, and cross-batch sequences.\n\nAsk me anything or select a command below.` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text) => {
        const msg = (text || input).trim();
        if (!msg) return;

        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/api/chatbot', { message: msg });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: '> error: communication_failure\n> retry_later' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                className="chatbot-trigger"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.12, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isOpen ? 'close' : 'open'}
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.2, type: 'spring' }}
                    >
                        {isOpen ? <X size={24} /> : <Zap size={24} />}
                    </motion.div>
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-window"
                        initial={{ opacity: 0, y: 40, scale: 0.85, rotateX: 15 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, y: 40, scale: 0.85, rotateX: 15 }}
                        transition={{ duration: 0.35, type: 'spring', stiffness: 200 }}
                    >
                        <div className="chatbot-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Bot size={20} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>SMARTSEAT://AI</div>
                                    <div style={{ fontSize: '0.66rem', opacity: 0.7, fontWeight: 400, textTransform: 'lowercase' }}>kernel v2.0.4 active</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'none', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="chatbot-messages">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    className={`chat-msg ${m.role}`}
                                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                >
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        {m.role === 'bot' ? <Bot size={14} style={{ color: 'var(--primary)', marginTop: 2 }} /> : <User size={14} style={{ marginTop: 2 }} />}
                                        <div style={{ flex: 1 }}>{m.text}</div>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div
                                    className="chat-msg bot"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ display: 'flex', gap: 6, padding: '12px 16px' }}
                                >
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions */}
                        <div className="quick-questions">
                            {quickQuestions.map((q, i) => (
                                <button key={i} className="quick-q" onClick={() => sendMessage(q.replace(/^.{2} /, ''))}>
                                    {q.split(' ')[0]} {q.split(' ').slice(1).join('_').toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="chatbot-input">
                            <input
                                placeholder="execute_query..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                            />
                            <motion.button
                                onClick={() => sendMessage()}
                                disabled={loading || !input.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Send size={14} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
