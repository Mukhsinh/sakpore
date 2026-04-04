import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Phone, Shield, Star, MessageSquare, Send } from 'lucide-react';

const mockTestimonials = [
    { id: 1, name: 'Budi Santoso', text: 'Layanan SANTUN sangat membantu istri saya setelah melahirkan. Sopir ramah dan tepat waktu.', rating: 5 },
    { id: 2, name: 'Siti Aminah', text: 'RAMAH membuat urusan akta anak saya jadi sangat mudah tanpa perlu antri panjang.', rating: 5 },
    { id: 3, name: 'Andi Wijaya', text: 'Aplikasi yang sangat inovatif! Terima kasih RSUD Bendan.', rating: 5 },
    { id: 4, name: 'Dewi Lestari', text: 'Sangat responsif dan layanannya memuaskan.', rating: 5 },
];

function TestimonialSection() {
    const [name, setName] = useState('');
    const [review, setReview] = useState('');
    const [rating, setRating] = useState(5);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && review) {
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setName('');
                setReview('');
                setRating(5);
            }, 3000);
        }
    };

    return (
        <div className="testimonial-container" style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: '700' }}>
                Apa Kata Mereka?
            </h3>

            {/* Testimonials Marquee */}
            <div className="marquee-wrapper">
                <div className="marquee-content">
                    {[...mockTestimonials, ...mockTestimonials].map((t, idx) => (
                        <div key={idx} className="testimonial-card">
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} fill={i < t.rating ? "#F59E0B" : "none"} color={i < t.rating ? "#F59E0B" : "#D1D5DB"} />
                                ))}
                            </div>
                            <p className="testimonial-text">"{t.text}"</p>
                            <p className="testimonial-author">- {t.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Testimonial Form */}
            <div className="modern-info-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                        <MessageSquare size={18} color="#F59E0B" />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Berikan Testimoni</h4>
                </div>
                {submitted ? (
                    <div style={{ padding: '16px', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: '12px', textAlign: 'center', fontWeight: '600' }}>
                        Terima kasih atas testimoni Anda!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="star-rating-input" style={{ display: 'flex', gap: '4px', marginBottom: '4px', justifyContent: 'center' }}>
                            {[...Array(5)].map((_, idx) => (
                                <Star
                                    key={idx}
                                    size={32}
                                    fill={idx < rating ? "#F59E0B" : "none"}
                                    color={idx < rating ? "#F59E0B" : "#D1D5DB"}
                                    onClick={() => setRating(idx + 1)}
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Nama Anda"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ background: 'rgba(255,255,255,0.8)' }}
                        />
                        <textarea
                            placeholder="Bagaimana pengalaman Anda?"
                            className="input"
                            rows="3"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            required
                            style={{ resize: 'none', background: 'rgba(255,255,255,0.8)' }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none' }}>
                            <Send size={16} /> Kirim Testimoni
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function HomePage() {
    return (
        <div className="animate-slide-up">
            <div className="page-content" style={{ padding: '0px 20px 24px 20px' }}>
                {/* Welcome Banner Card */}
                <div className="welcome-hero-card">
                    <div className="hero-pattern-1"></div>
                    <div className="hero-pattern-2"></div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2>Selamat Datang!</h2>
                        <p>Layanan inovatif RSUD Bendan Kota Pekalongan untuk masyarakat.</p>
                    </div>
                </div>

                {/* Service Cards */}
                <div className="service-cards-grid">
                    <Link to="/ramah/submit" className="modern-service-card grid-card">
                        <div className="floating-icon-wrapper">
                            <img src="/ramah-3d-transparent.png" alt="RAMAH 3D Icon" className="icon-image-3d-clean" />
                        </div>
                        <div className="card-body">
                            <h3>RAMAH</h3>
                            <p>Registrasi Akta Mudah Antar sampai Rumah.</p>
                            <span className="action-link ramah-link">Ajukan Sekarang &rarr;</span>
                        </div>
                    </Link>

                    <Link to="/santun/submit" className="modern-service-card grid-card">
                        <div className="floating-icon-wrapper">
                            <img src="/santun-3d-transparent.png" alt="SANTUN 3D Icon" className="icon-image-3d-clean" />
                        </div>
                        <div className="card-body">
                            <h3>SANTUN</h3>
                            <p>Saya Antar sampai Tujuan — Layanan Transport Nifas JKN.</p>
                            <span className="action-link santun-link">Ajukan Sekarang &rarr;</span>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: '700' }}>
                    Lacak Pengajuan
                </h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    <Link to="/ramah/track" className="modern-track-card ramah-track">
                        <div className="track-icon-wrapper">
                            <Search size={18} strokeWidth={2.5} />
                        </div>
                        <span>Lacak RAMAH</span>
                    </Link>
                    <Link to="/santun/track" className="modern-track-card santun-track">
                        <div className="track-icon-wrapper">
                            <Search size={18} strokeWidth={2.5} />
                        </div>
                        <span>Lacak SANTUN</span>
                    </Link>
                </div>

                {/* Info Section */}
                <div className="modern-info-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ padding: '6px', background: 'rgba(22, 163, 74, 0.1)', borderRadius: '8px' }}>
                            <Shield size={18} color="var(--primary)" />
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Informasi Layanan</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ marginTop: '2px', color: 'var(--primary)', opacity: 0.8 }}>
                                <Clock size={16} />
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                Layanan tersedia 24 jam. Dokumen diproses pada jam kerja.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.5)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={() => window.open('https://wa.me/6285726112001', '_blank')}>
                            <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                                <img src="/whatsapp-3d-transparent.png" alt="WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: '#128C7E' }}>Hubungi via WhatsApp</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    <strong>+62 857-2611-2001</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonials Section inserted here */}
                <TestimonialSection />

            </div>
        </div>
    );
}
