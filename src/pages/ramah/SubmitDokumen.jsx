import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, CheckCircle } from 'lucide-react';

export default function SubmitDokumen() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [trackingCode, setTrackingCode] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_nik: '',
        mother_name: '',
        father_name: '',
        phone_number: '',
        address: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
            const fileName = `ramah/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let documentFiles = [];
            if (files.length > 0) {
                documentFiles = await uploadFiles();
            }

            const { data, error } = await supabase.from('ramah_documents').insert([
                {
                    ...formData,
                    document_files: documentFiles
                }
            ]).select('tracking_code').single();

            if (error) throw error;

            setTrackingCode(data.tracking_code);
            setSubmitted(true);
        } catch (err) {
            alert(err.message || 'Gagal menyimpan pengajuan');
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
                    <h2>Pengajuan Berhasil! 🎉</h2>
                    <p>Dokumen Anda telah berhasil dikirim dan sedang diproses.</p>
                    <div className="tracking-code-display">
                        <div className="label">Kode Tracking</div>
                        <div className="code">{trackingCode}</div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                        Simpan kode tracking ini untuk melacak status pengajuan Anda.
                    </p>
                    <Link to="/ramah/track">
                        <button className="btn btn-primary" style={{ marginBottom: '8px' }}>Lacak Dokumen</button>
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
                <h2>📄 Pengajuan Akta — RAMAH</h2>
                <p>Isi formulir di bawah ini untuk mengajukan pembuatan akta kelahiran.</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Form Section */}
                <div className="card">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--primary-800)' }}>
                        Data Pemohon
                    </h4>

                    <div className="input-group">
                        <label>Nama Pemohon / Bayi</label>
                        <input required type="text" name="applicant_name" value={formData.applicant_name} onChange={handleChange} className="input" placeholder="Masukkan nama lengkap" />
                    </div>

                    <div className="input-group">
                        <label>NIK Pemohon</label>
                        <input required type="text" name="applicant_nik" value={formData.applicant_nik} onChange={handleChange} className="input" placeholder="16 digit NIK" maxLength={16} inputMode="numeric" />
                        <p className="input-hint">Masukkan 16 digit Nomor Induk Kependudukan</p>
                    </div>

                    <div className="input-group">
                        <label>Nama Ibu Kandung</label>
                        <input required type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className="input" placeholder="Nama lengkap ibu" />
                    </div>

                    <div className="input-group">
                        <label>Nama Ayah Kandung</label>
                        <input required type="text" name="father_name" value={formData.father_name} onChange={handleChange} className="input" placeholder="Nama lengkap ayah" />
                    </div>

                    <div className="input-group">
                        <label>Nomor HP / WhatsApp</label>
                        <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="input" placeholder="08xxxxxxxxxx" inputMode="tel" />
                        <p className="input-hint">Untuk komunikasi & melacak pengajuan</p>
                    </div>

                    <div className="input-group">
                        <label>Alamat Pengiriman Akta</label>
                        <textarea required name="address" value={formData.address} onChange={handleChange} className="textarea" placeholder="Alamat lengkap untuk pengiriman dokumen" rows="3"></textarea>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="card">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--primary-800)' }}>
                        Upload Dokumen Pendukung
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Foto KTP, KK, Surat Keterangan Lahir, dll. (opsional)
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

                    {/* Hidden file inputs */}
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: 'none' }} />

                    {/* File previews */}
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

                {/* Submit */}
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
                    {loading ? 'Mengirim Pengajuan...' : '✅ Kirim Pengajuan'}
                </button>
            </form>
        </div>
    );
}
