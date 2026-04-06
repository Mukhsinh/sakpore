import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Phone, Shield, Star, MessageSquare, Send, ChevronDown, HelpCircle, FileText, Truck, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ════════════════ FAQ SECTION ════════════════ */
function FAQSection() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeQ, setActiveQ] = useState(null);

    const faqs = [
        {
            icon: '📋',
            q: 'Apa itu layanan SAKPORE?',
            a: 'SAKPORE (Sistem Akselerasi Kualitas Pelayanan Optimal RSUD Bendan) terdiri dari dua layanan unggulan: RAMAH (Registrasi Akta Mudah Antar sampai Rumah) dan SANTUN (Saya Antar sampai Tujuan). Khusus untuk pasien yang melahirkan di RSUD Bendan Kota Pekalongan.'
        },
        {
            icon: '🎁',
            q: 'Apa manfaat yang saya peroleh?',
            a: 'RAMAH — Pengurusan akta kelahiran bayi Anda tanpa perlu ke Disdukcapil, langsung diantar ke rumah. GRATIS!\nSANTUN — Layanan antar jemput pasien pasca melahirkan dari rumah sakit ke rumah. GRATIS!'
        },
        {
            icon: '📝',
            q: 'Bagaimana cara mengisi formulir?',
            a: '1. Pilih layanan RAMAH atau SANTUN\n2. Isi data diri lengkap (nama, NIK, HP)\n3. Upload dokumen pendukung (KTP, KK, Surat Keterangan Lahir)\n4. Kirim permohonan & simpan kode tracking'
        },
        {
            icon: '⏱️',
            q: 'Berapa lama proses penyelesaiannya?',
            a: 'RAMAH — SLA 7 hari kerja sejak dokumen dinyatakan lengkap & terverifikasi.\nSANTUN — Langsung diproses! Armada akan dikirim segera setelah permohonan diterima.'
        },
        {
            icon: '💬',
            q: 'Bagaimana jika saya bingung?',
            a: 'Cukup klik tombol "Hubungi via WhatsApp" yang tersedia di halaman ini. Tim admin kami siap membantu Anda kapan saja!'
        }
    ];

    return (
        <div style={{ marginTop: '32px' }}>
            {/* FAQ Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: isOpen
                        ? 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)'
                        : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: isOpen ? 'none' : '1px solid #bae6fd',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isOpen
                        ? '0 8px 25px rgba(2, 132, 199, 0.25)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(2, 132, 199, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <HelpCircle size={18} color={isOpen ? 'white' : '#0284c7'} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h4 style={{
                            fontSize: '0.95rem', fontWeight: 800, margin: 0,
                            color: isOpen ? 'white' : '#0c4a6e',
                            fontFamily: "'Outfit', sans-serif",
                        }}>FAQ Layanan</h4>
                        <p style={{
                            fontSize: '0.72rem', margin: 0, marginTop: '2px',
                            color: isOpen ? 'rgba(255,255,255,0.8)' : '#64748b',
                        }}>Pertanyaan yang sering diajukan</p>
                    </div>
                </div>
                <ChevronDown
                    size={20}
                    color={isOpen ? 'white' : '#0284c7'}
                    style={{
                        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* FAQ Content */}
            <div style={{
                maxHeight: isOpen ? '2000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                opacity: isOpen ? 1 : 0,
            }}>
                <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}>
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: 'white',
                                borderRadius: '14px',
                                border: activeQ === idx ? '1px solid #93c5fd' : '1px solid #f1f5f9',
                                overflow: 'hidden',
                                boxShadow: activeQ === idx
                                    ? '0 4px 16px rgba(2, 132, 199, 0.1)'
                                    : '0 1px 3px rgba(0,0,0,0.03)',
                                transition: 'all 0.25s ease',
                            }}
                        >
                            <button
                                onClick={() => setActiveQ(activeQ === idx ? null : idx)}
                                style={{
                                    width: '100%', border: 'none', background: 'transparent',
                                    padding: '14px 16px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{faq.icon}</span>
                                <span style={{
                                    flex: 1, fontSize: '0.85rem', fontWeight: 700,
                                    color: activeQ === idx ? '#0284c7' : '#1e293b',
                                    fontFamily: "'Outfit', sans-serif",
                                    transition: 'color 0.2s',
                                }}>{faq.q}</span>
                                <ChevronDown
                                    size={16}
                                    color={activeQ === idx ? '#0284c7' : '#94a3b8'}
                                    style={{
                                        transition: 'transform 0.25s ease',
                                        transform: activeQ === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                                        flexShrink: 0,
                                    }}
                                />
                            </button>
                            <div style={{
                                maxHeight: activeQ === idx ? '300px' : '0',
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease',
                            }}>
                                <div style={{
                                    padding: '0 16px 14px 46px',
                                    fontSize: '0.8rem',
                                    color: '#475569',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-line',
                                }}>
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Quick CTA */}
                    <div style={{
                        textAlign: 'center', padding: '12px 0 4px',
                        fontSize: '0.78rem', color: '#64748b',
                    }}>
                        Masih ada pertanyaan?{' '}
                        <span
                            onClick={() => window.open('https://wa.me/6282324408910', '_blank')}
                            style={{
                                color: '#128C7E', fontWeight: 700, cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >Hubungi via WhatsApp</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ════════════════ TESTIMONIAL SECTION ════════════════ */
function TestimonialSection() {
    const [testimonials, setTestimonials] = useState([]);
    const [name, setName] = useState('');
    const [review, setReview] = useState('');
    const [rating, setRating] = useState(5);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setTestimonials(data);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (name && review) {
            setLoading(true);
            const { error } = await supabase
                .from('testimonials')
                .insert([{ name, text: review, rating }]);

            if (!error) {
                setSubmitted(true);
                fetchTestimonials();
                setTimeout(() => {
                    setSubmitted(false);
                    setName('');
                    setReview('');
                    setRating(5);
                }, 3000);
            } else {
                alert('Gagal mengirim testimoni');
            }
            setLoading(false);
        }
    };

    const displayTestimonials = testimonials.length > 0 ? testimonials : [
        { id: 1, name: 'Budi Santoso', text: 'Layanan SANTUN sangat membantu istri saya setelah melahirkan. Sopir ramah dan tepat waktu.', rating: 5 },
        { id: 2, name: 'Siti Aminah', text: 'RAMAH membuat urusan akta anak saya jadi sangat mudah tanpa perlu antri panjang.', rating: 5 }
    ];

    return (
        <div className="testimonial-container" style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: '700' }}>
                Apa Kata Mereka?
            </h3>

            {/* Testimonials Marquee */}
            <div className="marquee-wrapper">
                <div className="marquee-content">
                    {[...displayTestimonials, ...displayTestimonials].map((t, idx) => (
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
                            disabled={loading}
                            style={{ background: 'rgba(255,255,255,0.8)' }}
                        />
                        <textarea
                            placeholder="Bagaimana pengalaman Anda?"
                            className="input"
                            rows="3"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            required
                            disabled={loading}
                            style={{ resize: 'none', background: 'rgba(255,255,255,0.8)' }}
                        />
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none' }}>
                            <Send size={16} /> {loading ? 'Mengirim...' : 'Kirim Testimoni'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

/* ════════════════ HOME PAGE ════════════════ */
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
                        <p style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '0.88rem',
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.95)',
                            margin: 0,
                            fontWeight: 500,
                            letterSpacing: '0.2px',
                        }}>
                            Layanan <span style={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.82rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px' }}>Sakpore</span> khusus pasien yang melahirkan di{' '}
                            <span style={{ fontWeight: 800 }}>RSUD Bendan Kota Pekalongan</span>
                        </p>
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
                            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 600, color: '#475569', letterSpacing: '0.2px' }}>
                                Registrasi Akta Mudah <span style={{ background: 'linear-gradient(90deg, #0284c7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Antar Sampai Rumah</span>.
                            </p>
                            <span className="action-link ramah-link">Ajukan Sekarang &rarr;</span>
                        </div>
                    </Link>

                    <Link to="/santun/submit" className="modern-service-card grid-card">
                        <div className="floating-icon-wrapper">
                            <img src="/santun-3d-transparent.png" alt="SANTUN 3D Icon" className="icon-image-3d-clean" />
                        </div>
                        <div className="card-body">
                            <h3>SANTUN</h3>
                            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 600, color: '#475569', letterSpacing: '0.2px' }}>
                                Saya <span style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Antar Sampai Tujuan</span>.
                            </p>
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
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                padding: '12px 16px', borderRadius: '16px',
                                border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer',
                                position: 'relative',
                            }}
                            onClick={() => window.open('https://wa.me/6282324408910', '_blank')}
                        >
                            <div style={{ width: '44px', height: '44px', flexShrink: 0 }}>
                                <img src="/whatsapp-3d-transparent.png" alt="WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: '#128C7E' }}>Hubungi via WhatsApp</h4>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, marginTop: '2px' }}>Klik untuk chat langsung</p>
                            </div>
                            <img
                                src="/admin-3d-transparent.png"
                                alt="Admin"
                                className="icon-image-3d-clean"
                                style={{
                                    width: '56px', height: '56px',
                                    position: 'absolute', right: '8px', top: '-12px',
                                    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <FAQSection />

                {/* Testimonials Section */}
                <TestimonialSection />

            </div>
        </div>
    );
}
