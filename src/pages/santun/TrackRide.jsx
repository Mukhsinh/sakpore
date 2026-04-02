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
        <div className="page-content animate-slide-up">
            {/* Header */}
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Kembali
                </button>
                <h2>🔍 Lacak Transport SANTUN</h2>
                <p>Masukkan kode tracking atau nomor HP untuk melacak permohonan transport.</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="search-box">
                <input
                    className="input"
                    placeholder="Kode tracking (STN-...) atau No. HP"
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

            {!loading && searched && requests.length === 0 && (
                <div className="empty-state">
                    <Truck size={48} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Tidak Ditemukan</p>
                    <p style={{ fontSize: '0.8rem' }}>Tidak ada permohonan transport yang cocok.</p>
                </div>
            )}

            {!loading && requests.map(req => {
                const currentStepIdx = getStepIndex(req.status);

                return (
                    <div key={req.id} className="card" style={{ padding: '20px' }}>
                        {/* Tracking Code */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kode Tracking</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, monospace' }}>{req.tracking_code}</p>
                            </div>
                            <span className={`badge badge-${req.status}`}>{req.status.replace('_', ' ')}</span>
                        </div>

                        {/* Patient info */}
                        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>🚗 {req.patient_name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NIK: {req.patient_nik}</p>
                            {req.pickup_address && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                    <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {req.pickup_address}
                                </p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                Diajukan: {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            {req.consent_signed && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={14} /> E-Consent Disetujui
                                </p>
                            )}
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
