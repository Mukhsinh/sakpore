import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Hospital, Lock, Mail, Home } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { signIn, loading, user } = useAuthStore();
    const navigate = useNavigate();

    // If already signed in, redirect to admin dashboard
    if (user) {
        navigate('/admin/dashboard', { replace: true });
        return null;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const { error } = await signIn(email, password);
        if (error) {
            setErrorMsg(error.message);
        } else {
            navigate('/admin/dashboard');
        }
    };

    return (
        <div className="page-content animate-slide-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 140px)' }}>
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                {/* Logo */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: 'var(--shadow-green)'
                }}>
                    <Hospital size={32} color="white" />
                </div>

                <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Admin Login</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    RSUD Bendan — Panel Administrasi
                </p>

                {errorMsg && (
                    <div style={{
                        background: 'var(--error-light)',
                        color: 'var(--error)',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        border: '1px solid #fecaca'
                    }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} /> Email
                        </label>
                        <input
                            type="email"
                            required
                            className="input"
                            placeholder="admin@rsudbendan.id"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Lock size={14} /> Kata Sandi
                        </label>
                        <input
                            type="password"
                            required
                            className="input"
                            placeholder="Masukkan kata sandi..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? 'Memproses...' : '🔐 Masuk'}
                    </button>
                </form>
            </div>

            <button
                onClick={() => navigate('/')}
                className="back-btn"
                style={{
                    margin: '24px auto 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    color: 'var(--primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    padding: 0
                }}
                title="Beranda"
            >
                <Home size={22} />
            </button>
        </div>
    );
}
