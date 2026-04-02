import { Link } from 'react-router-dom';
import { FilePlus, Search, ListTodo } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function RamahHome() {
    const { user } = useAuthStore();
    const isAdmin = user?.email?.includes('admin'); // Mock admin check

    return (
        <div className="animate-slide-up pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 border-gray-200">
                RAMAH
                <div className="text-sm font-normal text-gray-500 mt-1">Registrasi Akta Mudah Antar sampai Rumah</div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Link to="/ramah/submit" className="card hover:shadow-lg transition flex flex-col items-center justify-center p-8 bg-blue-50 border-blue-100">
                    <FilePlus size={48} className="text-blue-500 mb-4" />
                    <h3 className="font-semibold text-lg text-blue-900">Buat Pengajuan</h3>
                    <p className="text-sm text-blue-600 text-center mt-2">Daftarkan pembuatan Akta Kelahiran atau Dokumen lain</p>
                </Link>
                <Link to="/ramah/track" className="card hover:shadow-lg transition flex flex-col items-center justify-center p-8 bg-green-50 border-green-100">
                    <Search size={48} className="text-green-500 mb-4" />
                    <h3 className="font-semibold text-lg text-green-900">Lacak Dokumen</h3>
                    <p className="text-sm text-green-600 text-center mt-2">Lihat status dokumen yang sedang diproses atau dikirim</p>
                </Link>
                {isAdmin && (
                    <Link to="/ramah/admin" className="card hover:shadow-lg transition flex flex-col items-center justify-center p-8 bg-purple-50 border-purple-100 col-span-1 md:col-span-2">
                        <ListTodo size={48} className="text-purple-500 mb-4" />
                        <h3 className="font-semibold text-lg text-purple-900">Admin Dashboard</h3>
                        <p className="text-sm text-purple-600 text-center mt-2">Verifikasi dokumen masuk dan tugaskan kurir</p>
                    </Link>
                )}
            </div>
        </div>
    );
}
