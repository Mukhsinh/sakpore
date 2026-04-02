import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, FileText, Truck, Download, CheckCircle, PackageCheck, Navigation,
    ExternalLink, Eye, ClipboardList, BarChart3
} from 'lucide-react';

export default function AdminPanel() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ramah');
    const [ramahDocs, setRamahDocs] = useState([]);
    const [santunReqs, setSantunReqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ramahRes, santunRes] = await Promise.all([
                supabase.from('ramah_documents').select('*').order('created_at', { ascending: false }),
                supabase.from('santun_requests').select('*').order('created_at', { ascending: false })
            ]);
            setRamahDocs(ramahRes.data || []);
            setSantunReqs(santunRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateRamahStatus = async (id, newStatus) => {
        if (!window.confirm(`Update status ke "${newStatus}"?`)) return;
        try {
            const { error } = await supabase.from('ramah_documents').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Gagal update: ' + err.message);
        }
    };

    const updateSantunStatus = async (id, newStatus) => {
        if (!window.confirm(`Update status ke "${newStatus}"?`)) return;
        try {
            const { error } = await supabase.from('santun_requests').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Gagal update: ' + err.message);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const downloadCSV = (data, filename) => {
        if (!data.length) return alert('Tidak ada data untuk diunduh');
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h];
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                return `"${String(val || '').replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const StatusBadge = ({ status }) => (
        <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
    );

    const tabs = [
        { key: 'ramah', label: 'RAMAH', icon: FileText },
        { key: 'santun', label: 'SANTUN', icon: Truck },
        { key: 'laporan', label: 'Laporan', icon: BarChart3 },
        { key: 'spj', label: 'SPJ', icon: ClipboardList },
    ];

    return (
        <div className="animate-slide-up">
            {/* Admin Header */}
            <div className="admin-header" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '2px' }}>Admin Dashboard</h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{user?.email}</p>
                    </div>
                    <button onClick={handleSignOut} style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontFamily: 'inherit'
                    }}>
                        <LogOut size={16} /> Keluar
                    </button>
                </div>
            </div>

            <div className="page-content">
                {/* Tabs */}
                <div className="admin-tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <Icon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat data...</p>
                    </div>
                ) : (
                    <>
                        {/* RAMAH Tab */}
                        {activeTab === 'ramah' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '1rem' }}>Dokumen RAMAH ({ramahDocs.length})</h3>
                                    <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => downloadCSV(ramahDocs, 'laporan_ramah')}>
                                        <Download size={14} /> CSV
                                    </button>
                                </div>

                                {ramahDocs.length === 0 ? (
                                    <div className="empty-state"><FileText size={40} /><p>Belum ada dokumen</p></div>
                                ) : (
                                    ramahDocs.map(doc => (
                                        <div key={doc.id} className="card" style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{doc.applicant_name}</p>
                                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NIK: {doc.applicant_nik}</p>
                                                </div>
                                                <StatusBadge status={doc.status} />
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                <p>📞 {doc.phone_number || '-'}</p>
                                                <p>📍 {doc.address}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                                    Tracking: <strong style={{ color: 'var(--primary)' }}>{doc.tracking_code}</strong>
                                                    {' · '}
                                                    {new Date(doc.created_at).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>

                                            {/* Document files */}
                                            {doc.document_files && doc.document_files.length > 0 && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Dokumen:</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {doc.document_files.map((file, idx) => (
                                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '4px 8px',
                                                                background: 'var(--primary-50)',
                                                                border: '1px solid var(--primary-200)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.75rem',
                                                                color: 'var(--primary-800)',
                                                                textDecoration: 'none'
                                                            }}>
                                                                {file.type?.includes('pdf') ? <FileText size={12} /> : <Eye size={12} />}
                                                                {file.name?.substring(0, 20)}{file.name?.length > 20 ? '...' : ''}
                                                                <ExternalLink size={10} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Actions */}
                                            <div className="status-actions">
                                                {doc.status === 'pending' && (
                                                    <button onClick={() => updateRamahStatus(doc.id, 'verified')} style={{ background: 'var(--info-light)', color: '#1e40af' }}>
                                                        <CheckCircle size={12} /> Verifikasi
                                                    </button>
                                                )}
                                                {doc.status === 'verified' && (
                                                    <button onClick={() => updateRamahStatus(doc.id, 'delivering')} style={{ background: '#fff7ed', color: '#c2410c' }}>
                                                        <Truck size={12} /> Kirim
                                                    </button>
                                                )}
                                                {doc.status === 'delivering' && (
                                                    <button onClick={() => updateRamahStatus(doc.id, 'completed')} style={{ background: 'var(--success-light)', color: '#065f46' }}>
                                                        <PackageCheck size={12} /> Selesai
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* SANTUN Tab */}
                        {activeTab === 'santun' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '1rem' }}>Transport SANTUN ({santunReqs.length})</h3>
                                    <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => downloadCSV(santunReqs, 'laporan_santun')}>
                                        <Download size={14} /> CSV
                                    </button>
                                </div>

                                {santunReqs.length === 0 ? (
                                    <div className="empty-state"><Truck size={40} /><p>Belum ada permohonan</p></div>
                                ) : (
                                    santunReqs.map(req => (
                                        <div key={req.id} className="card" style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{req.patient_name}</p>
                                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NIK: {req.patient_nik}</p>
                                                </div>
                                                <StatusBadge status={req.status} />
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                <p>📞 {req.phone_number || '-'}</p>
                                                {req.pickup_address && <p>📍 Jemput: {req.pickup_address}</p>}
                                                {req.dropoff_address && <p>🏠 Tujuan: {req.dropoff_address}</p>}
                                                {req.consent_signed && (
                                                    <p style={{ color: 'var(--success)', fontWeight: 600, marginTop: '4px' }}>✓ E-Consent</p>
                                                )}
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                                    Tracking: <strong style={{ color: 'var(--primary)' }}>{req.tracking_code}</strong>
                                                    {' · '}
                                                    {new Date(req.created_at).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>

                                            {/* Document files */}
                                            {req.document_files && req.document_files.length > 0 && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Dokumen:</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {req.document_files.map((file, idx) => (
                                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '4px 8px',
                                                                background: 'var(--primary-50)',
                                                                border: '1px solid var(--primary-200)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.75rem',
                                                                color: 'var(--primary-800)',
                                                                textDecoration: 'none'
                                                            }}>
                                                                {file.type?.includes('pdf') ? <FileText size={12} /> : <Eye size={12} />}
                                                                {file.name?.substring(0, 20)}{file.name?.length > 20 ? '...' : ''}
                                                                <ExternalLink size={10} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Actions */}
                                            <div className="status-actions">
                                                {req.status === 'requested' && (
                                                    <button onClick={() => updateSantunStatus(req.id, 'assigned')} style={{ background: 'var(--info-light)', color: '#1e40af' }}>
                                                        <Navigation size={12} /> Tugaskan
                                                    </button>
                                                )}
                                                {req.status === 'assigned' && (
                                                    <button onClick={() => updateSantunStatus(req.id, 'in_progress')} style={{ background: '#fff7ed', color: '#c2410c' }}>
                                                        <Truck size={12} /> Jalan
                                                    </button>
                                                )}
                                                {req.status === 'in_progress' && (
                                                    <button onClick={() => updateSantunStatus(req.id, 'completed')} style={{ background: 'var(--success-light)', color: '#065f46' }}>
                                                        <CheckCircle size={12} /> Selesai
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Laporan Layanan Tab */}
                        {activeTab === 'laporan' && (
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📊 Laporan Layanan</h3>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Ringkasan</h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ padding: '16px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{ramahDocs.length}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total RAMAH</p>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--secondary-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)' }}>{santunReqs.length}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total SANTUN</p>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--success-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                                                {ramahDocs.filter(d => d.status === 'completed').length + santunReqs.filter(r => r.status === 'completed').length}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selesai</p>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)' }}>
                                                {ramahDocs.filter(d => d.status === 'pending').length + santunReqs.filter(r => r.status === 'requested').length}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Menunggu</p>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary" onClick={() => downloadCSV(ramahDocs, 'laporan_layanan_ramah')} style={{ marginBottom: '8px' }}>
                                        <Download size={16} /> Unduh Laporan RAMAH (CSV)
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => downloadCSV(santunReqs, 'laporan_layanan_santun')}>
                                        <Download size={16} /> Unduh Laporan SANTUN (CSV)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SPJ Tab */}
                        {activeTab === 'spj' && (
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 Laporan SPJ</h3>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Surat Pertanggungjawaban</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                        Unduh data layanan yang sudah selesai untuk pembuatan dokumen SPJ.
                                    </p>

                                    {/* SPJ Stats */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                        <div className="info-strip success">
                                            <CheckCircle size={16} style={{ flexShrink: 0 }} />
                                            <span><strong>{ramahDocs.filter(d => d.status === 'completed').length}</strong> pengajuan RAMAH selesai</span>
                                        </div>
                                        <div className="info-strip success">
                                            <CheckCircle size={16} style={{ flexShrink: 0 }} />
                                            <span><strong>{santunReqs.filter(r => r.status === 'completed').length}</strong> permohonan SANTUN selesai</span>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary" onClick={() => {
                                        const completedRamah = ramahDocs.filter(d => d.status === 'completed');
                                        downloadCSV(completedRamah.length ? completedRamah : [{ info: 'Tidak ada data' }], 'spj_ramah');
                                    }} style={{ marginBottom: '8px' }}>
                                        <Download size={16} /> Unduh SPJ RAMAH (CSV)
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => {
                                        const completedSantun = santunReqs.filter(r => r.status === 'completed');
                                        downloadCSV(completedSantun.length ? completedSantun : [{ info: 'Tidak ada data' }], 'spj_santun');
                                    }}>
                                        <Download size={16} /> Unduh SPJ SANTUN (CSV)
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
