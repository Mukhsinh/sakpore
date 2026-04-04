import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Truck, CheckCircle, Navigation, MapPin, Clock } from 'lucide-react';

const STEPS = [
    { key: 'requested', label: 'Diajukan', desc: 'Permohonan diterima, menunggu penugasan', icon: Clock },
    { key: 'assigned', label: 'Armada Ditugaskan', desc: 'Armada sudah ditugaskan untuk perjalanan', icon: Navigation },
    { key: 'in_progress', label: 'Dalam Perjalanan', desc: 'Armada sedang dalam perjalanan', icon: Truck },
    { key: 'completed', label: 'Selesai', desc: 'Pasien telah sampai tujuan', icon: CheckCircle },
];

export default function TrackRide() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setLoading(true);
        setSearched(true);

        try {
            const isTrackingCode = searchQuery.toUpperCase().startsWith('STN');

            let query = supabase.from('santun_requests').select('*');

            if (isTrackingCode) {
                query = query.eq('tracking_code', searchQuery.toUpperCase());
            } else {
                query = query.eq('phone_number', searchQuery);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
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
                    <h2>Lacak Transport</h2>
                    <p>Pantau status permohonan transport SANTUN secara real-time</p>
                </div>
                <div className="floating-3d-magnifier">
                    🔍
                </div>
            </div>

            {/* Search */}
            <div className="track-search-wrapper">
                <form onSubmit={handleSearch} className="track-search-card">
                    <input
                        placeholder="Kode: STN-... atau No. HP"
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

                {!loading && searched && requests.length === 0 && (
                    <div className="empty-state" style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <Truck size={48} color="#94a3b8" />
                        <p style={{ fontSize: '1rem', fontWeight: 700, margin: '8px 0 4px', color: '#1e293b' }}>Tidak Ditemukan</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Tidak ada permohonan transport yang cocok.</p>
                    </div>
                )}

                {!loading && requests.map(req => {
                    const currentStepIdx = getStepIndex(req.status);

                    return (
                        <div key={req.id} className="green-app-card">
                            <div className="ga-card-header">
                                <div>
                                    <p className="ga-code-label">Kode Tracking</p>
                                    <p className="ga-code-value">{req.tracking_code}</p>
                                </div>
                                <span className={`ga-status-badge ga-badge-${req.status}`}>{req.status.replace('_', ' ')}</span>
                            </div>

                            <div className="ga-user-info">
                                <div className="ga-user-avatar" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                                    <Truck size={24} />
                                </div>
                                <div className="ga-user-details">
                                    <h4>{req.patient_name}</h4>
                                    <p>NIK: {req.patient_nik}</p>
                                    {req.pickup_address && (
                                        <p style={{ marginTop: '4px', fontSize: '0.75rem', alignItems: 'flex-start' }}>
                                            <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px', marginRight: '4px' }} />
                                            <span style={{ flex: 1 }}>{req.pickup_address}</span>
                                        </p>
                                    )}
                                    <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                                        📅 {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    {req.consent_signed && (
                                        <p style={{ color: '#10b981', fontWeight: 600, marginTop: '6px' }}>
                                            <CheckCircle size={12} style={{ marginRight: '4px' }} /> E-Consent Disetujui
                                        </p>
                                    )}
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
