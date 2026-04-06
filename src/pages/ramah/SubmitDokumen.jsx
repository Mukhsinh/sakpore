import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, CheckCircle, User, Contact, Phone, MapPin, UploadCloud } from 'lucide-react';

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
        baby_name: '',
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
            <div style={{
                background: `
                    radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.4) 0%, transparent 40%),
                    radial-gradient(circle at 90% 20%, rgba(244, 63, 94, 0.4) 0%, transparent 50%),
                    radial-gradient(circle at 80% 90%, rgba(14, 165, 233, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 20% 80%, rgba(225, 29, 72, 0.4) 0%, transparent 50%),
                    linear-gradient(135deg, #0284c7 0%, #be123c 100%)
                `,
                color: 'white',
                padding: '24px 20px 96px',
                borderRadius: '0 0 32px 32px',
                margin: '-20px -20px 20px',
                position: 'relative',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: '0 0 32px 32px', pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                </div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <button type="button" onClick={() => navigate(-1)} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', marginBottom: '16px', cursor: 'pointer', padding: 0, fontFamily: 'inherit'
                    }}>
                        <ArrowLeft size={18} /> Kembali
                    </button>

                    <div style={{
                        position: 'absolute',
                        right: '16px',
                        top: '-10px',
                        width: '64px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(15deg)',
                        border: '3px solid #fde047',
                        color: '#fde047',
                        borderRadius: '50%',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontFamily: "'Outfit', sans-serif",
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1), inset 0 0 8px rgba(0,0,0,0.1)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 5
                    }}>
                        GRATIS
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.6rem', lineHeight: '1.25', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>
                                Pengajuan <br />
                                <span style={{ color: '#bae6fd' }}>Layanan Akta</span>
                            </h2>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.2)', display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                                Khusus Warga Kota Pekalongan
                            </p>
                        </div>
                        <img className="floating-anim" src="/ramah-3d-transparent.png" alt="RAMAH Document" style={{ width: '130px', filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.4))', position: 'absolute', right: '-10px', top: '25px', zIndex: 20 }} />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes floatAnim {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0); }
                }
                .floating-anim {
                    animation: floatAnim 3s ease-in-out infinite;
                }
                .ramah-input-box {
                    background: #ffffff;
                    border: 1px solid #f3f4f6;
                    border-radius: 8px;
                    padding-left: 44px;
                    padding-top: 12px;
                    padding-bottom: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .ramah-input-box:focus {
                    border-color: #16a34a;
                    outline: none;
                }
                .ramah-textarea-box {
                    background: #ffffff;
                    border: 1px solid #f3f4f6;
                    border-radius: 8px;
                    padding-left: 44px;
                    padding-top: 12px;
                    padding-bottom: 12px;
                    min-height: 54px;
                    resize: none;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .ramah-textarea-box:focus {
                    border-color: #16a34a;
                    outline: none;
                }
            `}</style>

            <form onSubmit={handleSubmit} style={{ marginTop: '-76px', position: 'relative', zIndex: 3 }}>
                {/* Form Section */}
                <div className="card" style={{ borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '16px', color: '#1f2937', fontWeight: 700 }}>
                        Data Pemohon
                    </h4>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '12px' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input required type="text" name="applicant_name" value={formData.applicant_name} onChange={handleChange} className="input ramah-input-box" placeholder="Nama Pemohon" style={{ border: '1px solid #22c55e' }} />
                    </div>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '24px' }}>
                        <Contact size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input required type="text" name="applicant_nik" value={formData.applicant_nik} onChange={handleChange} className="input ramah-input-box" placeholder="NIK Pemohon" maxLength={16} inputMode="numeric" style={{ border: '1px solid #22c55e' }} />
                    </div>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '12px' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input required type="text" name="baby_name" value={formData.baby_name} onChange={handleChange} className="input ramah-input-box" placeholder="Nama Bayi" style={{ border: '1px solid #22c55e' }} />
                    </div>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '12px' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input required type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className="input ramah-input-box" placeholder="Nama Ibu Kandung Bayi" style={{ border: '1px solid #22c55e' }} />
                    </div>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '12px' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input required type="text" name="father_name" value={formData.father_name} onChange={handleChange} className="input ramah-input-box" placeholder="Nama Ayah Kandung Bayi" style={{ border: '1px solid #22c55e' }} />
                    </div>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '12px' }}>
                        <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="input ramah-input-box" placeholder="Nomor HP / WhatsApp" inputMode="tel" style={{ border: '1px solid #22c55e' }} />
                    </div>

                    <div className="input-group" style={{ position: 'relative', marginBottom: '0' }}>
                        <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '24px', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <textarea required name="address" value={formData.address} onChange={handleChange} className="textarea ramah-textarea-box" placeholder="Alamat Pengiriman Akta" rows="2" style={{ border: '1px solid #22c55e' }}></textarea>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="card" style={{ borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '4px', color: '#1f2937', fontWeight: 700 }}>
                        Upload Dokumen Pendukung
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Foto KTP, KK, Surat Keterangan Lahir)
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#ef4444', marginBottom: '16px', fontWeight: 500 }}>
                        *khusus untuk KK (kartu Keluarga ASLI wajib diserahkan ke admin)
                    </p>

                    <div className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{
                        border: '2px dashed #d1d5db',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        padding: '24px 16px',
                        cursor: 'pointer',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '8px', color: '#6b7280', display: 'flex', justifyContent: 'center' }}>
                            <UploadCloud size={32} />
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#374151', fontWeight: 700 }}>
                            Ketuk untuk memilih file
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
                            PDF, JPG, PNG — Maks. 10MB per file
                        </p>
                    </div>

                    <div className="upload-actions" style={{ marginTop: '12px' }}>
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

                <button type="submit" disabled={loading} className="btn" style={{
                    marginTop: '16px',
                    marginBottom: '32px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '32px',
                    width: '100%',
                    border: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.5px',
                    boxShadow: '0 8px 20px -6px rgba(2, 132, 199, 0.4)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                }}>
                    {loading ? 'MEMPROSES...' : 'KIRIM PERMOHONAN'}
                </button>
            </form>
        </div>
    );
}
