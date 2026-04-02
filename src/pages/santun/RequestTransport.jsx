import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, CheckCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RequestTransport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [trackingCode, setTrackingCode] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [formData, setFormData] = useState({
        patient_name: '',
        patient_nik: '',
        phone_number: '',
        pickup_address: '',
        dropoff_address: '',
        consent_signed: false
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        const uploadedFiles = [];
        for (const file of files) {
            const ext = file.name.split('.').pop();
            const fileName = `santun/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

            const { data, error } = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            uploadedFiles.push({
                name: file.name,
                path: fileName,
                url: urlData.publicUrl,
                type: file.type,
                size: file.size
            });
        }
        return uploadedFiles;
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                setFormData(prev => ({
                    ...prev,
                    pickup_address: prev.pickup_address || `Koordinat: ${lat}, ${lng}`,
                    pickup_lat: pos.coords.latitude,
                    pickup_lng: pos.coords.longitude
                }));
            }, () => {
                alert('Tidak dapat mengakses lokasi. Pastikan GPS aktif.');
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.consent_signed) {
            alert('Harap setujui e-consent terlebih dahulu.');
            return;
        }

        setLoading(true);
        try {
            let documentFiles = [];
            if (files.length > 0) {
                documentFiles = await uploadFiles();
            }

            const { data, error } = await supabase.from('santun_requests').insert([
                {
                    patient_name: formData.patient_name,
                    patient_nik: formData.patient_nik,
                    phone_number: formData.phone_number,
                    pickup_address: formData.pickup_address,
                    dropoff_address: formData.dropoff_address,
                    pickup_lat: formData.pickup_lat || null,
                    pickup_lng: formData.pickup_lng || null,
                    consent_signed: formData.consent_signed,
                    document_files: documentFiles
                }
            ]).select('tracking_code').single();

            if (error) throw error;

            setTrackingCode(data.tracking_code);
            setSubmitted(true);
        } catch (err) {
            alert(err.message || 'Gagal menyimpan permohonan');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="page-content animate-slide-up">
                <div className="success-screen">
                    <div className="success-icon">
                        <CheckCircle size={40} color="var(--success)" />
                    </div>
                    <h2>Permohonan Dikirim! 🎉</h2>
                    <p>Permohonan transport Anda sedang diproses. Tim kami akan segera menghubungi Anda.</p>
                    <div className="tracking-code-display">
                        <div className="label">Kode Tracking</div>
                        <div className="code">{trackingCode}</div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                        Simpan kode tracking ini untuk melacak status permohonan.
                    </p>
                    <Link to="/santun/track">
                        <button className="btn btn-primary" style={{ marginBottom: '8px' }}>Lacak Permohonan</button>
                    </Link>
                    <Link to="/">
                        <button className="btn btn-secondary">Kembali ke Beranda</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content animate-slide-up">
            {/* Header */}
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Kembali
                </button>
                <h2>🚗 Permohonan Transport — SANTUN</h2>
                <p>Layanan antar pasien nifas JKN (BPJS) sampai ke rumah secara gratis.</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Patient Data */}
                <div className="card">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--primary-800)' }}>
                        Data Pasien
                    </h4>

                    <div className="input-group">
                        <label>Nama Pasien</label>
                        <input required type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} className="input" placeholder="Nama lengkap pasien" />
                    </div>

                    <div className="input-group">
                        <label>NIK Pasien</label>
                        <input required type="text" name="patient_nik" value={formData.patient_nik} onChange={handleChange} className="input" placeholder="16 digit NIK" maxLength={16} inputMode="numeric" />
                    </div>

                    <div className="input-group">
                        <label>Nomor HP / WhatsApp</label>
                        <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="input" placeholder="08xxxxxxxxxx" inputMode="tel" />
                    </div>
                </div>

                {/* Location */}
                <div className="card">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--primary-800)' }}>
                        Alamat
                    </h4>

                    <div className="input-group">
                        <label>Alamat Penjemputan</label>
                        <textarea name="pickup_address" value={formData.pickup_address} onChange={handleChange} className="textarea" placeholder="Alamat lengkap penjemputan (RSUD / alamat lain)" rows={2}></textarea>
                        <button type="button" onClick={getLocation} style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            padding: 0
                        }}>
                            <MapPin size={14} /> Gunakan Lokasi Saat Ini
                        </button>
                    </div>

                    <div className="input-group">
                        <label>Alamat Tujuan (Rumah)</label>
                        <textarea required name="dropoff_address" value={formData.dropoff_address} onChange={handleChange} className="textarea" placeholder="Alamat lengkap tujuan pengantaran" rows={2}></textarea>
                    </div>
                </div>

                {/* Document Upload */}
                <div className="card">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--primary-800)' }}>
                        Upload Dokumen Pendukung
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Foto KTP, Kartu BPJS, Surat Keterangan Lahir, dll. (opsional)
                    </p>

                    <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                        <div className="upload-zone-icon">
                            <Upload size={24} />
                        </div>
                        <p className="upload-zone-text">
                            Ketuk untuk <strong>memilih file</strong>
                        </p>
                        <p className="upload-zone-hint">PDF, JPG, PNG — Maks. 10MB per file</p>
                    </div>

                    <div className="upload-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                            <FileText size={16} /> Pilih File
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => cameraInputRef.current?.click()}>
                            <Camera size={16} /> Kamera
                        </button>
                    </div>

                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: 'none' }} />

                    {files.length > 0 && (
                        <div className="upload-preview">
                            {files.map((file, idx) => (
                                <div key={idx} className="upload-file-item">
                                    <FileText size={14} />
                                    <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file.name}
                                    </span>
                                    <button type="button" onClick={() => removeFile(idx)}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* E-Consent */}
                <div className="card">
                    <label className="consent-box">
                        <input type="checkbox" required name="consent_signed" checked={formData.consent_signed} onChange={handleChange} />
                        <span>
                            <strong>E-Consent:</strong> Saya menyetujui layanan transportasi pemulangan Nifas dari RSUD Bendan dan bersedia dilacak lokasinya selama perjalanan. Data ini akan digunakan untuk dokumen pelaporan (SPJ).
                        </span>
                    </label>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
                    {loading ? 'Memproses...' : '✅ Kirim Permohonan'}
                </button>
            </form>
        </div>
    );
}
