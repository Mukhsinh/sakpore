import { Link } from 'react-router-dom';
import { FileText, Truck, Search, Clock, Phone, Shield } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="animate-slide-up">
            <div className="page-content">
                {/* Welcome Banner */}
                <div className="welcome-banner">
                    <h2>Selamat Datang! 👋</h2>
                    <p>Layanan inovatif RSUD Bendan Kota Pekalongan untuk masyarakat.</p>
                </div>

                {/* Service Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <Link to="/ramah/submit" className="service-card">
                        <div className="service-card-icon ramah">
                            <FileText size={40} color="#16a34a" strokeWidth={1.8} />
                        </div>
                        <h3>RAMAH</h3>
                        <p className="service-subtitle">
                            Registrasi Akta Mudah Antar sampai Rumah
                        </p>
                        <div style={{
                            marginTop: '12px',
                            fontSize: '0.78rem',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            Ajukan Sekarang →
                        </div>
                    </Link>

                    <Link to="/santun/submit" className="service-card">
                        <div className="service-card-icon santun">
                            <Truck size={40} color="#0ea5e9" strokeWidth={1.8} />
                        </div>
                        <h3>SANTUN</h3>
                        <p className="service-subtitle">
                            Saya Antar sampai Tujuan — Layanan Transport Nifas JKN
                        </p>
                        <div style={{
                            marginTop: '12px',
                            fontSize: '0.78rem',
                            color: '#0ea5e9',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            Ajukan Sekarang →
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    Lacak Pengajuan
                </h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <Link to="/ramah/track" style={{
                        flex: 1,
                        padding: '14px 12px',
                        background: 'var(--primary-50)',
                        border: '1px solid var(--primary-200)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'var(--primary-800)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                    }}>
                        <Search size={20} />
                        Lacak RAMAH
                    </Link>
                    <Link to="/santun/track" style={{
                        flex: 1,
                        padding: '14px 12px',
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: '#0c4a6e',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                    }}>
                        <Search size={20} />
                        Lacak SANTUN
                    </Link>
                </div>

                {/* Info Section */}
                <div className="card" style={{ padding: '16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Shield size={18} color="var(--primary)" />
                        <h4 style={{ fontSize: '0.9rem' }}>Informasi Layanan</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <Clock size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Layanan tersedia 24 jam. Dokumen akan diproses pada jam kerja.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <Phone size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Hubungi Call Center: <strong>(0285) 123-456</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
