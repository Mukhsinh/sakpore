import { Link } from 'react-router-dom';
import { Navigation, MapPin, Truck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function SantunHome() {
    const { user } = useAuthStore();
    const isDriverOrAdmin = user?.email?.includes('admin') || user?.email?.includes('driver');

    return (
        <div className="animate-slide-up pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 border-gray-200">
                SANTUN
                <div className="text-sm font-normal text-gray-500 mt-1">Saya Antar sampai Tujuan - Layanan Nifas</div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Link to="/santun/request" className="card hover:shadow-lg transition flex flex-col items-center justify-center p-8 bg-blue-50 border-blue-100">
                    <Navigation size={48} className="text-blue-500 mb-4" />
                    <h3 className="font-semibold text-lg text-blue-900">Permohonan Transport</h3>
                    <p className="text-sm text-blue-600 text-center mt-2">Pesan armada untuk pasien pulang nifas BPJS</p>
                </Link>
                <Link to="/santun/track" className="card hover:shadow-lg transition flex flex-col items-center justify-center p-8 bg-green-50 border-green-100">
                    <MapPin size={48} className="text-green-500 mb-4" />
                    <h3 className="font-semibold text-lg text-green-900">Lacak Armada</h3>
                    <p className="text-sm text-green-600 text-center mt-2">Pantau lokasi kendaraan secara realtime</p>
                </Link>
                {isDriverOrAdmin && (
                    <Link to="/santun/admin" className="card hover:shadow-lg transition flex flex-col items-center justify-center p-8 bg-purple-50 border-purple-100 col-span-1 md:col-span-2">
                        <Truck size={48} className="text-purple-500 mb-4" />
                        <h3 className="font-semibold text-lg text-purple-900">Fleet Dashboard</h3>
                        <p className="text-sm text-purple-600 text-center mt-2">Kelola armada dan permohonan transport</p>
                    </Link>
                )}
            </div>
        </div>
    );
}
