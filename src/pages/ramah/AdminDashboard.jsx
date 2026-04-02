import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, CheckCircle, Truck, PackageCheck, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('ramah_documents')
                .select('*, profiles(email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const confirm = window.confirm(`Update status ke ${newStatus}?`);
        if (!confirm) return;

        try {
            const { error } = await supabase
                .from('ramah_documents')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchDocuments();
        } catch (err) {
            alert('Gagal update: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        const maps = {
            pending: 'bg-yellow-100 text-yellow-800',
            verified: 'bg-blue-100 text-blue-800',
            delivering: 'bg-orange-100 text-orange-800',
            completed: 'bg-green-100 text-green-800',
        };
        return `px-3 py-1 rounded-full text-xs font-medium uppercase ${maps[status] || 'bg-gray-100 text-gray-800'}`;
    };

    if (loading) return <div className="text-center mt-10">Memuat data...</div>;

    return (
        <div className="animate-slide-up pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">RAMAH Admin Dashboard</h2>

            <div className="space-y-4">
                {documents.length === 0 ? (
                    <div className="card text-center text-gray-500 p-8">Belum ada dokumen.</div>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="card flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={getStatusBadge(doc.status)}>{doc.status}</span>
                                    <span className="text-xs text-gray-400">ID: {doc.id.substring(0, 8)}</span>
                                </div>
                                <h3 className="font-semibold text-gray-800">{doc.applicant_name} ({doc.applicant_nik})</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">Alamat: {doc.address}</p>
                                <p className="text-xs text-gray-400 mt-2">Dibuat: {new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 md:justify-end">
                                {doc.status === 'pending' && (
                                    <button onClick={() => updateStatus(doc.id, 'verified')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1 text-sm"><CheckCircle size={14} /> Verifikasi</button>
                                )}
                                {doc.status === 'verified' && (
                                    <button onClick={() => updateStatus(doc.id, 'delivering')} className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center gap-1 text-sm"><Truck size={14} /> Kirim</button>
                                )}
                                {doc.status === 'delivering' && (
                                    <button onClick={() => updateStatus(doc.id, 'completed')} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1 text-sm"><PackageCheck size={14} /> Selesai</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
