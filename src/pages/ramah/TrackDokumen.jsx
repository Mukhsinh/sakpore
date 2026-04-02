import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FileText, CheckCircle, Truck, PackageCheck, Clock } from 'lucide-react';

const STEPS = [
    { key: 'pending', label: 'Diajukan', desc: 'Pengajuan diterima, menunggu verifikasi', icon: Clock },
    { key: 'verified', label: 'Diverifikasi', desc: 'Dokumen sudah diverifikasi oleh admin', icon: CheckCircle },
    { key: 'delivering', label: 'Dikirim', desc: 'Dokumen sedang diantar ke alamat Anda', icon: Truck },
    { key: 'completed', label: 'Selesai', desc: 'Dokumen telah sampai', icon: PackageCheck },
];

export default function TrackDokumen() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setLoading(true);
        setSearched(true);

        try {
            // Search by tracking code or phone number
            const isTrackingCode = searchQuery.toUpperCase().startsWith('RMH');

            let query = supabase.from('ramah_documents').select('*');

            if (isTrackingCode) {
                query = query.eq('tracking_code', searchQuery.toUpperCase());
            } else {
                query = query.eq('phone_number', searchQuery);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStepIndex = (status) => {
        return STEPS.findIndex(s => s.key === status);
    };

    return (
        <div className="page-content animate-slide-up">
            {/* Header */}
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Kembali
                </button>
                <h2>🔍 Lacak Dokumen RAMAH</h2>
                <p>Masukkan kode tracking atau nomor HP untuk melacak status pengajuan.</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="search-box">
                <input
                    className="input"
                    placeholder="Kode tracking (RMH-...) atau No. HP"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Search size={18} />
                </button>
            </form>

            {/* Results */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mencari...</p>
                </div>
            )}

            {!loading && searched && documents.length === 0 && (
                <div className="empty-state">
                    <FileText size={48} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Tidak Ditemukan</p>
                    <p style={{ fontSize: '0.8rem' }}>Tidak ada pengajuan yang cocok dengan pencarian Anda.</p>
                </div>
            )}

            {!loading && documents.map(doc => {
                const currentStepIdx = getStepIndex(doc.status);

                return (
                    <div key={doc.id} className="card" style={{ padding: '20px' }}>
                        {/* Tracking Code */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kode Tracking</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, monospace' }}>{doc.tracking_code}</p>
                            </div>
                            <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                        </div>

                        {/* Applicant info */}
                        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.applicant_name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NIK: {doc.applicant_nik}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                Diajukan: {new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="tracking-timeline">
                            {STEPS.map((step, idx) => {
                                const StepIcon = step.icon;
                                const isCompleted = idx < currentStepIdx;
                                const isActive = idx === currentStepIdx;

                                return (
                                    <div key={step.key} className={`tracking-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                        <div className="tracking-dot">
                                            {isCompleted ? <CheckCircle size={16} /> : <StepIcon size={16} />}
                                        </div>
                                        <div className="tracking-info">
                                            <h4>{step.label}</h4>
                                            <p>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
