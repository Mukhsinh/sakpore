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
        <div className="track-page-container animate-slide-up">
            {/* Header */}
            <div className="track-modern-header">
                <div className="track-header-top">
                    <button type="button" className="back-btn-light" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                </div>
                <div className="track-header-title">
                    <h2>Lacak Dokumen</h2>
                    <p>Pantau status pengiriman dokumen RAMAH secara real-time</p>
                </div>
                <div className="floating-3d-magnifier">
                    🔍
                </div>
            </div>

            {/* Search */}
            <div className="track-search-wrapper">
                <form onSubmit={handleSearch} className="track-search-card">
                    <input
                        placeholder="Kode: RMH-... atau No. HP"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="track-search-btn" disabled={loading}>
                        <Search size={20} strokeWidth={2.5} />
                    </button>
                </form>
            </div>

            {/* Results */}
            <div className="green-app-results">
                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Mencari...</p>
                    </div>
                )}

                {!loading && searched && documents.length === 0 && (
                    <div className="empty-state" style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <FileText size={48} color="#94a3b8" />
                        <p style={{ fontSize: '1rem', fontWeight: 700, margin: '8px 0 4px', color: '#1e293b' }}>Tidak Ditemukan</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Tidak ada pengajuan yang cocok dengan pencarian Anda.</p>
                    </div>
                )}

                {!loading && documents.map(doc => {
                    const currentStepIdx = getStepIndex(doc.status);

                    return (
                        <div key={doc.id} className="green-app-card">
                            <div className="ga-card-header">
                                <div>
                                    <p className="ga-code-label">Kode Tracking</p>
                                    <p className="ga-code-value">{doc.tracking_code}</p>
                                </div>
                                <span className={`ga-status-badge ga-badge-${doc.status}`}>{doc.status}</span>
                            </div>

                            <div className="ga-user-info">
                                <div className="ga-user-avatar">
                                    <FileText size={24} />
                                </div>
                                <div className="ga-user-details">
                                    <h4>{doc.applicant_name}</h4>
                                    <p>NIK: {doc.applicant_nik}</p>
                                    <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                                        📅 {new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="ga-timeline">
                                {STEPS.map((step, idx) => {
                                    const StepIcon = step.icon;
                                    const isCompleted = idx < currentStepIdx;
                                    const isActive = idx === currentStepIdx;

                                    return (
                                        <div key={step.key} className={`ga-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                            <div className="ga-step-indicator"></div>
                                            <div className="ga-step-icon">
                                                {isCompleted ? <CheckCircle size={20} /> : <StepIcon size={20} />}
                                            </div>
                                            <div className="ga-step-content">
                                                <h5>{step.label}</h5>
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
        </div>
    );
}
