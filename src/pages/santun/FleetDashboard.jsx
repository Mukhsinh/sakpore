import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Truck, CheckCircle, Navigation } from 'lucide-react';

export default function FleetDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('santun_requests')
                .select('*, profiles(email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const confirm = window.confirm(`Update jadwal transport ke ${newStatus}?`);
        if (!confirm) return;

        try {
            const { error } = await supabase
                .from('santun_requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchRequests();
        } catch (err) {
            alert('Gagal update: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        const maps = {
            requested: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-orange-100 text-orange-800',
            completed: 'bg-green-100 text-green-800',
        };
        return `px-3 py-1 rounded-full text-xs font-medium uppercase ${maps[status] || 'bg-gray-100 text-gray-800'}`;
    };

    if (loading) return <div className="text-center mt-10">Memuat data...</div>;

    return (
        <div className="animate-slide-up pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">SANTUN Fleet Dashboard</h2>

            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="card text-center text-gray-500 p-8">Belum ada permohonan transport.</div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="card flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={getStatusBadge(req.status)}>{req.status}</span>
                                    <span className="text-xs text-gray-400">ID: {req.id.substring(0, 8)}</span>
                                </div>
                                <h3 className="font-semibold text-gray-800">{req.patient_name} ({req.patient_nik})</h3>
                                {req.consent_signed && <p className="text-sm font-medium text-green-600 mt-1">✓ E-Consent Disetujui</p>}
                                <p className="text-xs text-gray-400 mt-2">Dibuat: {new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 md:justify-end">
                                {req.status === 'requested' && (
                                    <button onClick={() => updateStatus(req.id, 'assigned')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1 text-sm"><Navigation size={14} /> Tugaskan Armada</button>
                                )}
                                {req.status === 'assigned' && (
                                    <button onClick={() => updateStatus(req.id, 'in_progress')} className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center gap-1 text-sm"><Truck size={14} /> Mulai Jalan</button>
                                )}
                                {req.status === 'in_progress' && (
                                    <button onClick={() => updateStatus(req.id, 'completed')} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1 text-sm"><CheckCircle size={14} /> Selesai (SPJ)</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
