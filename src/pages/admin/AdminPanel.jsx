import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, FileText, Truck, CheckCircle, PackageCheck, Navigation,
    Eye, ClipboardList, Download, Square, Archive, Search, Bell, X, MessageCircle,
    Monitor, Smartphone
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/* ──────────────────── CONSTANTS ──────────────────── */
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const QUARTERS = ['Triwulan 1 (Jan-Mar)', 'Triwulan 2 (Apr-Jun)', 'Triwulan 3 (Jul-Sep)', 'Triwulan 4 (Okt-Des)'];
const SEMESTERS = ['Semester 1 (Jan-Jun)', 'Semester 2 (Jul-Des)'];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => 2026 - i);

/* ──────────────────── HELPERS ──────────────────── */
function filterData(data, year, period, subPeriod) {
    return data.filter(item => {
        const d = new Date(item.created_at);
        if (d.getFullYear() !== year) return false;
        if (period === 'bulan' && subPeriod !== null) return d.getMonth() === subPeriod;
        if (period === 'triwulan' && subPeriod !== null) {
            const q = Math.floor(d.getMonth() / 3);
            return q === subPeriod;
        }
        if (period === 'semester' && subPeriod !== null) {
            const s = d.getMonth() < 6 ? 0 : 1;
            return s === subPeriod;
        }
        return true; // 'tahun' => full year
    });
}

function openWhatsApp(phone, text) {
    if (!phone) {
        alert("Nomor telepon tidak tersedia.");
        return;
    }
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(text)}`, '_blank');
}

function getChartLabelsAndData(filtered, period, subPeriod, year) {
    if (period === 'bulan' && subPeriod !== null) {
        // Show daily breakdown for selected month
        const daysInMonth = new Date(year, subPeriod + 1, 0).getDate();
        const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
        const counts = new Array(daysInMonth).fill(0);
        filtered.forEach(item => { const d = new Date(item.created_at); counts[d.getDate() - 1]++; });
        return { labels, data: counts };
    }
    if (period === 'triwulan' && subPeriod !== null) {
        const startMonth = subPeriod * 3;
        const labels = [MONTHS[startMonth], MONTHS[startMonth + 1], MONTHS[startMonth + 2]];
        const counts = [0, 0, 0];
        filtered.forEach(item => { const m = new Date(item.created_at).getMonth() - startMonth; if (m >= 0 && m < 3) counts[m]++; });
        return { labels, data: counts };
    }
    if (period === 'semester' && subPeriod !== null) {
        const startMonth = subPeriod * 6;
        const labels = MONTHS.slice(startMonth, startMonth + 6);
        const counts = new Array(6).fill(0);
        filtered.forEach(item => { const m = new Date(item.created_at).getMonth() - startMonth; if (m >= 0 && m < 6) counts[m]++; });
        return { labels, data: counts };
    }
    // Tahun: monthly breakdown
    const labels = MONTHS.map(m => m.substring(0, 3));
    const counts = new Array(12).fill(0);
    filtered.forEach(item => { counts[new Date(item.created_at).getMonth()]++; });
    return { labels, data: counts };
}

function getPeriodText(year, period, subPeriod) {
    if (period === 'bulan' && subPeriod !== null) return `${MONTHS[subPeriod]} ${year}`;
    if (period === 'triwulan' && subPeriod !== null) return `${QUARTERS[subPeriod]} ${year}`;
    if (period === 'semester' && subPeriod !== null) return `${SEMESTERS[subPeriod]} ${year}`;
    return `Tahun ${year}`;
}

function generatePDF(data, title, periodLabel, columns, colKeys) {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text('RSUD BENDAN KOTA PEKALONGAN', doc.internal.pageSize.width / 2, 16, { align: 'center' });
    doc.setFontSize(11); doc.setFont(undefined, 'normal');
    doc.text('Jl. Sriwijaya No.2 Bendan, Kec. Pekalongan Barat, Kota Pekalongan, Jawa Tengah 51119', doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.setDrawColor(30, 64, 175); doc.setLineWidth(1);
    doc.line(14, 26, doc.internal.pageSize.width - 14, 26);

    doc.setFontSize(14); doc.setFont(undefined, 'bold');
    doc.text(title, doc.internal.pageSize.width / 2, 35, { align: 'center' });
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`Periode: ${periodLabel}  |  Dicetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, doc.internal.pageSize.width / 2, 42, { align: 'center' });

    const rows = data.map((row, i) => [i + 1, ...colKeys.map(k => {
        const val = row[k];
        if (val == null) return '-';
        if (k === 'consent_signed') return val ? 'Ya' : 'Tidak';
        if (k === 'created_at') return new Date(val).toLocaleDateString('id-ID');
        if (k === 'document_files') return val.length + ' Berkas';
        return String(val);
    })]);

    autoTable(doc, {
        head: [['No', ...columns]], body: rows, startY: 48,
        styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: [15, 60, 120], textColor: 255, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { valign: 'middle' },
        alternateRowStyles: { fillColor: [245, 248, 250] },
        margin: { bottom: 20 },
        theme: 'grid',
        didDrawPage: function (data) {
            doc.setFontSize(8); doc.setFont(undefined, 'italic'); doc.setTextColor(120, 120, 120);
            doc.text('Aplikasi Sakpore @2026 Mukhsin Hadi All rights reserved', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
    });

    doc.save(`${title.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`);
}

function generateExcel(data, title, sheetName, periodLabel, columns, colKeys) {
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['RSUD BENDAN KOTA PEKALONGAN'],
        ['Jl. Sriwijaya No.2 Bendan, Kec. Pekalongan Barat, Kota Pekalongan, Jawa Tengah 51119'],
        [''],
        [title],
        [`Periode: ${periodLabel}`],
        [`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`],
        [''],
        ['No', ...columns]
    ];

    data.forEach((row, i) => {
        const rowData = [i + 1];
        colKeys.forEach(k => {
            const val = row[k];
            if (val == null) rowData.push('-');
            else if (k === 'consent_signed') rowData.push(val ? 'Ya' : 'Tidak');
            else if (k === 'created_at') rowData.push(new Date(val).toLocaleDateString('id-ID'));
            else if (k === 'document_files') rowData.push(val.length + ' Berkas');
            else rowData.push(String(val));
        });
        wsData.push(rowData);
    });

    wsData.push(['']);
    wsData.push(['Aplikasi Sakpore @2026 Mukhsin Hadi All rights reserved']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: columns.length } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: columns.length } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: columns.length } },
        { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: columns.length } },
    ];
    ws['!cols'] = [{ wch: 5 }, ...columns.map(() => ({ wch: 20 }))];

    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
    XLSX.writeFile(wb, `${title.replace(/\s/g, '_')}_${new Date().getTime()}.xlsx`);
}

async function downloadAllFilesAsZip(files, zipName) {
    if (!files || files.length === 0) return alert('Tidak ada file');
    const zip = new JSZip();
    await Promise.all(files.map(async (file) => {
        try { const r = await fetch(file.url); zip.file(file.name || `file`, await r.blob()); } catch (e) { console.error(e); }
    }));
    saveAs(await zip.generateAsync({ type: 'blob' }), `${zipName}.zip`);
}

/* ──────────────────── STYLES ──────────────────── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

.admin-hero-header {
    background: linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 35%, #7f1d1d 70%, #be123c 100%);
    color: white; padding: 28px 20px 28px; position: relative; overflow: hidden; font-family: 'Outfit', sans-serif;
}
.admin-hero-header::before {
    content: ''; position: absolute; top: -60px; right: -40px; width: 260px; height: 260px; border-radius: 50%;
    background: rgba(225,29,72,0.25); border: 3px solid rgba(255,255,255,0.08);
}
.admin-hero-header::after {
    content: ''; position: absolute; bottom: -80px; left: -50px; width: 220px; height: 220px; border-radius: 50%;
    background: rgba(56,189,248,0.15); border: 2px solid rgba(255,255,255,0.06);
}
.admin-hero-curve { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; overflow: hidden; }
.admin-hero-curve svg { position: absolute; bottom: 0; left: 0; width: 100%; }
.sakpore-floating {
    font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; font-size: 2.6rem;
    letter-spacing: 3px; color: rgba(255,255,255,0.08); position: absolute; top: 8px; right: 16px; z-index: 1;
    text-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: sakporeFloat 4s ease-in-out infinite; user-select: none;
}
@keyframes sakporeFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-8px) rotate(0deg); } }

.admin-tabs-modern { display: flex; gap: 0; background: #f1f5f9; border-radius: 14px; padding: 4px; margin-bottom: 20px; }
.admin-tab-modern {
    flex: 1; padding: 10px 6px; border: none; background: transparent; border-radius: 10px;
    font-size: 0.82rem; font-weight: 600; color: #64748b; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    transition: all 0.25s ease; font-family: 'Outfit', sans-serif;
}
.admin-tab-modern.active { background: white; color: #0284c7; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

/* ─── FRESH SCORECARDS ─── */
.sc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.sc-card {
    position: relative; padding: 18px 16px; border-radius: 18px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.5); backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.sc-card .sc-emoji {
    position: absolute; top: -4px; right: -2px; font-size: 2.4rem; opacity: 0.18;
    animation: scFloat 3.5s ease-in-out infinite; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.15));
}
@keyframes scFloat { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-6px) rotate(5deg); } }
.sc-val { font-size: 2rem; font-weight: 800; font-family: 'Outfit',sans-serif; line-height: 1; margin-bottom: 2px; }
.sc-lbl { font-size: 0.7rem; font-weight: 500; opacity: 0.8; }
.sc-blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e3a8a; }
.sc-green { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #14532d; }
.sc-amber { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #78350f; }
.sc-rose { background: linear-gradient(135deg, #ffe4e6, #fecdd3); color: #881337; }

/* ─── FILTER ─── */
.filter-row { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
.filter-dd {
    padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;
    font-size: 0.78rem; font-weight: 600; color: #334155; font-family: 'Outfit',sans-serif;
    cursor: pointer; outline: none; appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;
}
.filter-dd:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.filter-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; font-family: 'Outfit',sans-serif; }

/* ─── BUTTONS ─── */
.btn-m { padding: 10px 22px; border-radius: 24px; border: none; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; transition: all 0.25s ease; font-family: 'Outfit',sans-serif; letter-spacing: 0.3px; }
.btn-m:hover { transform: translateY(-1px); }
.btn-m:active { transform: translateY(0); }
.btn-excel { background: linear-gradient(135deg, #0284c7, #1e40af); color: white; box-shadow: 0 4px 14px rgba(2,132,199,0.3); }
.btn-pdf { background: linear-gradient(135deg, #e11d48, #be123c); color: white; box-shadow: 0 4px 14px rgba(225,29,72,0.3); }
.btn-chart { background: linear-gradient(135deg, #f97316, #ea580c); color: white; box-shadow: 0 4px 14px rgba(249,115,22,0.3); }
.btn-success { background: linear-gradient(135deg, #16a34a, #15803d); color: white; box-shadow: 0 4px 14px rgba(22,163,74,0.3); }
.btn-outline { background: white; color: #0284c7; border: 2px solid #0284c7; }
.btn-sm { padding: 7px 16px; font-size: 0.75rem; }
.btn-full { width: 100%; display: flex; justify-content: center; }
.download-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

/* ─── SEARCH ─── */
.search-box {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;
    margin-bottom: 16px; transition: all 0.2s;
}
.search-box:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.search-box input {
    border: none; background: transparent; flex: 1; font-size: 0.85rem;
    font-family: 'Outfit',sans-serif; color: #1e293b; outline: none;
}
.search-box input::placeholder { color: #94a3b8; }

/* ─── MISC ─── */
.admin-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.admin-card-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 16px; font-family: 'Outfit',sans-serif; }
.chart-container { background: white; border-radius: 16px; padding: 20px 16px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
.doc-checklist { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.doc-check-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; transition: all 0.2s; }
.doc-check-item:hover { background: #f0f9ff; border-color: #bae6fd; }
.doc-check-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.doc-check-icon.checked { background: #22c55e; color: white; }
.doc-check-name { flex: 1; font-size: 0.82rem; font-weight: 500; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-check-actions { display: flex; gap: 6px; }
.doc-check-actions a { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: white; border: 1px solid #e2e8f0; color: #64748b; cursor: pointer; transition: all 0.2s; text-decoration: none; }
.doc-check-actions a:hover { background: #0284c7; color: white; border-color: #0284c7; }
.section-sep { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 24px 0; }
.spj-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; transition: all 0.2s; cursor: pointer; }
.spj-item:hover { border-color: #93c5fd; background: #f0f9ff; }
.spj-item.claimed { background: #f0fdf4; border-color: #86efac; }
.spj-checkbox { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.spj-checkbox.checked { background: #22c55e; color: white; }
.spj-checkbox.unchecked { background: #f1f5f9; border: 2px solid #cbd5e1; }
.spj-dl-frame { background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.spj-dl-header { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; font-family: 'Outfit'; }
.dl-wrap { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

/* ─── TOAST NOTIFICATIONS ─── */
.toast-container {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px; pointer-events: none;
}
.toast-item {
    background: white; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; width: 320px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1); pointer-events: auto; transform: translateY(50px); opacity: 0;
    animation: slideInUp 0.3s forwards; cursor: pointer; transition: all 0.2s; position: relative;
    font-family: 'Outfit', sans-serif;
}
.toast-item:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.15); }
.toast-item.ramah { border-left-color: #2563eb; }
.toast-item.santun { border-left-color: #16a34a; }
.toast-title { font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.toast-msg { font-size: 0.8rem; color: #64748b; }
.toast-close { position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; color: #cbd5e1; padding: 0; display: flex; }
.toast-close:hover { color: #64748b; }
@keyframes slideInUp { to { transform: translateY(0); opacity: 1; } }

/* ─── MODAL ─── */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
.modal-content { background: white; border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); position: relative; animation: slideInUp 0.3s forwards; }
.modal-close { position: absolute; top: 16px; right: 16px; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; z-index: 10; }
.modal-close:hover { background: #e2e8f0; color: #1e293b; }
.modal-header { font-size: 1.2rem; font-weight: 800; font-family: 'Outfit'; color: #1e293b; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; position: sticky; top: 0; background: white; z-index: 5; }
.modal-body { padding: 24px; }
.timeline-list { display: flex; flex-direction: column; gap: 16px; position: relative; padding-left: 20px; margin-top: 10px; margin-bottom: 24px; }
.timeline-list::before { content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px; width: 2px; background: #e2e8f0; }
.timeline-item { position: relative; }
.timeline-dot { position: absolute; left: -20px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #0284c7; border: 2px solid white; box-shadow: 0 0 0 1px #0284c7; z-index: 2; }
.timeline-title { font-size: 0.85rem; font-weight: 700; color: #1e293b; font-family: 'Outfit'; }
.timeline-date { font-size: 0.72rem; color: #64748b; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.wa-btn { background: #25D366; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-family: 'Outfit'; margin-left: 8px; transition: all 0.2s; }
.wa-btn:hover { background: #1ebc5a; transform: translateY(-1px); }
`;

/* ──────────────────── COMPONENT ──────────────────── */
export default function AdminPanel() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ramah');
    const [ramahDocs, setRamahDocs] = useState([]);
    const [santunReqs, setSantunReqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('admin_view_mode') || 'mobile';
    });

    // Dispatch event to App.jsx to toggle container width
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('admin-view-mode', { detail: viewMode }));
        localStorage.setItem('admin_view_mode', viewMode);
        return () => {
            // Reset to mobile when leaving admin dashboard
            window.dispatchEvent(new CustomEvent('admin-view-mode', { detail: 'mobile' }));
        };
    }, [viewMode]);

    // Filters per tab
    const [rYear, setRYear] = useState(2026); const [rPeriod, setRPeriod] = useState('tahun'); const [rSub, setRSub] = useState(null);
    const [sYear, setSYear] = useState(2026); const [sPeriod, setSPeriod] = useState('tahun'); const [sSub, setSSub] = useState(null);
    const [spjYear, setSpjYear] = useState(2026); const [spjPeriod, setSpjPeriod] = useState('tahun'); const [spjSub, setSpjSub] = useState(null);

    const [rSearch, setRSearch] = useState(''); const [sSearch, setSSearch] = useState('');
    const [aSearch, setASearch] = useState('');
    const [selectedArchive, setSelectedArchive] = useState(null);

    const ramahChartRef = useRef(null); const santunChartRef = useRef(null);

    useEffect(() => {
        fetchData();

        const ramahSub = supabase.channel('public:ramah_documents')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ramah_documents' }, payload => {
                setNotifications(prev => [...prev, {
                    id: 'r_' + payload.new.id,
                    type: 'ramah',
                    title: 'Pengajuan RAMAH Baru',
                    name: payload.new.applicant_name,
                    phone: payload.new.phone_number
                }]);
                fetchData();
            })
            .subscribe();

        const santunSub = supabase.channel('public:santun_requests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'santun_requests' }, payload => {
                setNotifications(prev => [...prev, {
                    id: 's_' + payload.new.id,
                    type: 'santun',
                    title: 'Permohonan SANTUN Baru',
                    name: payload.new.patient_name,
                    phone: payload.new.phone_number
                }]);
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ramahSub);
            supabase.removeChannel(santunSub);
        };
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
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const updateRamahStatus = async (id, s, doc) => {
        if (!window.confirm(`Update status ke "${s}"?`)) return;
        try {
            const { error } = await supabase.from('ramah_documents').update({ status: s }).eq('id', id);
            if (error) throw error;
            fetchData();
            if (s === 'completed' && doc?.phone_number) {
                const msg = `Halo ${doc.applicant_name}, layanan RAMAH (Registrasi Akta Mudah Antar sampai Rumah) Anda telah selesai diproses. Dokumen sudah bisa diambil atau sedang dalam pengiriman. Terima kasih telah menggunakan SAKPORE RSUD Bendan!`;
                openWhatsApp(doc.phone_number, msg);
            }
        } catch (e) { alert('Gagal: ' + e.message); }
    };
    const updateSantunStatus = async (id, s, req) => {
        if (!window.confirm(`Update status ke "${s}"?`)) return;
        try {
            const { error } = await supabase.from('santun_requests').update({ status: s }).eq('id', id);
            if (error) throw error;
            fetchData();
            if (s === 'completed' && req?.phone_number) {
                const msg = `Halo ${req.patient_name}, layanan SANTUN (Saya Antar sampai Tujuan) Anda telah selesai dan pesien sudah diantar sampai tujuan. Terima kasih telah menggunakan SAKPORE RSUD Bendan!`;
                openWhatsApp(req.phone_number, msg);
            } else if (s === 'in_progress' && req?.phone_number) {
                const msg = `Halo ${req.patient_name}, armada layanan SANTUN saat ini sedang menuju ke lokasi Anda. Mohon bersiap.`;
                openWhatsApp(req.phone_number, msg);
            }
        } catch (e) { alert('Gagal: ' + e.message); }
    };
    const handleSignOut = async () => { await signOut(); navigate('/'); };
    const toggleSpjClaimRamah = async (id, currentVal) => {
        try {
            const { error } = await supabase.from('ramah_documents').update({ is_spj_claimed: !currentVal }).eq('id', id);
            if (!error) fetchData();
        } catch (e) { }
    };
    const toggleSpjClaimSantun = async (id, currentVal) => {
        try {
            const { error } = await supabase.from('santun_requests').update({ is_spj_claimed: !currentVal }).eq('id', id);
            if (!error) fetchData();
        } catch (e) { }
    };

    // Filtered data
    const ramahFiltered = useMemo(() => filterData(ramahDocs, rYear, rPeriod, rSub), [ramahDocs, rYear, rPeriod, rSub]);
    const santunFiltered = useMemo(() => filterData(santunReqs, sYear, sPeriod, sSub), [santunReqs, sYear, sPeriod, sSub]);
    const completedRamah = ramahDocs.filter(d => d.status === 'completed');
    const completedSantun = santunReqs.filter(r => r.status === 'completed');

    // Search filtered
    const ramahSearched = useMemo(() => {
        if (!rSearch.trim()) return ramahFiltered;
        const q = rSearch.toLowerCase();
        return ramahFiltered.filter(d => d.applicant_name?.toLowerCase().includes(q) || d.applicant_nik?.includes(q) || d.tracking_code?.toLowerCase().includes(q));
    }, [ramahFiltered, rSearch]);
    const santunSearched = useMemo(() => {
        if (!sSearch.trim()) return santunFiltered;
        const q = sSearch.toLowerCase();
        return santunFiltered.filter(r => r.patient_name?.toLowerCase().includes(q) || r.patient_nik?.includes(q) || r.tracking_code?.toLowerCase().includes(q));
    }, [santunFiltered, sSearch]);

    // Active
    const ramahActive = ramahSearched.filter(d => d.status !== 'completed');
    const santunActive = santunSearched.filter(r => r.status !== 'completed');

    // Archive
    const arsipRamah = completedRamah.filter(d =>
        !aSearch.trim() || d.applicant_name?.toLowerCase().includes(aSearch.toLowerCase()) || d.applicant_nik?.includes(aSearch) || d.tracking_code?.toLowerCase().includes(aSearch.toLowerCase())
    );
    const arsipSantun = completedSantun.filter(r =>
        !aSearch.trim() || r.patient_name?.toLowerCase().includes(aSearch.toLowerCase()) || r.patient_nik?.includes(aSearch) || r.tracking_code?.toLowerCase().includes(aSearch.toLowerCase())
    );

    // Chart data
    const ramahChart = useMemo(() => getChartLabelsAndData(ramahFiltered, rPeriod, rSub, rYear), [ramahFiltered, rPeriod, rSub, rYear]);
    const santunChart = useMemo(() => getChartLabelsAndData(santunFiltered, sPeriod, sSub, sYear), [santunFiltered, sPeriod, sSub, sYear]);

    const downloadChart = (ref, name, title) => {
        if (!ref.current) return;
        const srcCanvas = ref.current.canvas;
        const destCanvas = document.createElement('canvas');
        destCanvas.width = srcCanvas.width + 40;
        destCanvas.height = srcCanvas.height + 130;
        const ctx = destCanvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, destCanvas.width, destCanvas.height);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px Outfit, sans-serif';
        ctx.fillText(title, 20, 40);
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('Laporan Grafik SAKPORE - RSUD Bendan', 20, 65);

        ctx.drawImage(srcCanvas, 20, 80);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Aplikasi Sakpore @2026 Mukhsin Hadi All rights reserved', destCanvas.width / 2, destCanvas.height - 15);

        const url = destCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${name}_${new Date().getTime()}.png`;
        link.href = url;
        link.click();
    };

    const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;

    const renderSpjList = (title, items, toggleFn) => {
        const unclaimed = items.filter(i => !i.is_spj_claimed);
        const claimed = items.filter(i => i.is_spj_claimed);

        return (
            <div className="admin-card" style={{ padding: '24px' }}>
                <div className="admin-card-title" style={{ fontSize: '1.1rem', marginBottom: '20px' }}>{title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Belum Diklaim */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Outfit'" }}>
                            <Square size={16} /> Belum Diklaim ({unclaimed.length})
                        </h4>
                        {unclaimed.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>Tidak ada data</p> :
                            unclaimed.map(item => (
                                <div key={item.id} className="spj-item" onClick={() => toggleFn(item.id, false)}>
                                    <div className="spj-checkbox unchecked"><Square size={14} /></div>
                                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', fontFamily: "'Outfit'" }}>{item.applicant_name || item.patient_name}</p><p style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.tracking_code} · {new Date(item.created_at).toLocaleDateString('id-ID')}</p></div>
                                </div>
                            ))
                        }
                    </div>
                    {/* Sukses Diklaim */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '16px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: '#16a34a', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Outfit'" }}>
                            <CheckCircle size={16} /> Sukses Diklaim ({claimed.length})
                        </h4>
                        {claimed.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>Tidak ada data</p> :
                            claimed.map(item => (
                                <div key={item.id} className="spj-item claimed" onClick={() => toggleFn(item.id, true)}>
                                    <div className="spj-checkbox checked"><CheckCircle size={14} /></div>
                                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', fontFamily: "'Outfit'" }}>{item.applicant_name || item.patient_name}</p><p style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.tracking_code} · {new Date(item.created_at).toLocaleDateString('id-ID')}</p></div>
                                    <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>Diklaim</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        );
    };

    const DocumentChecklist = ({ files, zipName }) => {
        if (!files || !files.length) return <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tidak ada dokumen</p>;
        return (<div>
            <div className="doc-checklist">{files.map((f, i) => (
                <div key={i} className="doc-check-item">
                    <div className="doc-check-icon checked"><CheckCircle size={14} /></div>
                    <span className="doc-check-name">{f.name || `File ${i + 1}`}</span>
                    <div className="doc-check-actions">
                        <a href={f.url} target="_blank" rel="noopener noreferrer"><Eye size={14} /></a>
                        <a href={f.url} download><Download size={14} /></a>
                    </div>
                </div>
            ))}</div>
            {files.length > 1 && <button onClick={() => downloadAllFilesAsZip(files, zipName)} className="btn-m btn-excel btn-full" style={{ marginTop: '10px' }}>Unduh Semua (.zip)</button>}
        </div>);
    };

    const SubPeriodDropdown = ({ period, sub, setSub }) => {
        if (period === 'bulan') return (
            <select className="filter-dd" value={sub ?? ''} onChange={e => setSub(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">Semua Bulan</option>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
        );
        if (period === 'triwulan') return (
            <select className="filter-dd" value={sub ?? ''} onChange={e => setSub(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">Semua Triwulan</option>
                {QUARTERS.map((q, i) => <option key={i} value={i}>{q}</option>)}
            </select>
        );
        if (period === 'semester') return (
            <select className="filter-dd" value={sub ?? ''} onChange={e => setSub(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">Semua Semester</option>
                {SEMESTERS.map((s, i) => <option key={i} value={i}>{s}</option>)}
            </select>
        );
        return null; // tahun has no sub
    };

    const FilterBar = ({ year, setYear, period, setPeriod, sub, setSub }) => (
        <>
            <div className="filter-row">
                <span className="filter-label">Tahun</span>
                <select className="filter-dd" value={year} onChange={e => { setYear(Number(e.target.value)); setSub(null); }}>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="filter-label">Periode</span>
                <select className="filter-dd" value={period} onChange={e => { setPeriod(e.target.value); setSub(null); }}>
                    <option value="tahun">Tahunan</option>
                    <option value="bulan">Bulanan</option>
                    <option value="triwulan">Triwulanan</option>
                    <option value="semester">Semesteran</option>
                </select>
            </div>
            {period !== 'tahun' && (
                <div className="filter-row">
                    <span className="filter-label">{period === 'bulan' ? 'Bulan' : period === 'triwulan' ? 'Triwulan' : 'Semester'}</span>
                    <SubPeriodDropdown period={period} sub={sub} setSub={setSub} />
                </div>
            )}
        </>
    );

    const ChartBlock = ({ chartData, color, label, chartRef }) => (
        <div className="chart-container">
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: '#1e293b', fontFamily: "'Outfit',sans-serif" }}>
                📈 Tren {label}
            </h4>
            <Line ref={chartRef}
                data={{
                    labels: chartData.labels,
                    datasets: [{
                        label, data: chartData.data, borderColor: color, backgroundColor: color + '18',
                        fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: color,
                        pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 3,
                    }]
                }}
                options={{
                    responsive: true, animation: { duration: 600, easing: 'easeOutQuart' },
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', cornerRadius: 8, titleFont: { family: "'Outfit'" }, bodyFont: { family: "'Outfit'" } } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }
                }}
            />
        </div>
    );

    const ramahCols = ['Nama', 'NIK', 'Nama Bayi', 'Ibu Kandung Bayi', 'Ayah Kandung Bayi', 'HP', 'Alamat', 'Status', 'Tracking', 'Tanggal'];
    const ramahKeys = ['applicant_name', 'applicant_nik', 'baby_name', 'mother_name', 'father_name', 'phone_number', 'address', 'status', 'tracking_code', 'created_at'];
    const santunCols = ['Nama', 'NIK', 'HP', 'Jemput', 'Tujuan', 'Consent', 'Status', 'Tracking', 'Tanggal'];
    const santunKeys = ['patient_name', 'patient_nik', 'phone_number', 'pickup_address', 'dropoff_address', 'consent_signed', 'status', 'tracking_code', 'created_at'];

    const tabs = [
        { key: 'ramah', label: 'RAMAH', icon: FileText },
        { key: 'santun', label: 'SANTUN', icon: Truck },
        { key: 'arsip', label: 'ARSIP', icon: Archive },
        { key: 'spj', label: 'SPJ', icon: ClipboardList },
    ];

    return (
        <div className="animate-slide-up">
            <style>{styles}</style>

            {/* ── HEADER ── */}
            <div className="admin-hero-header">
                <div className="admin-hero-curve">
                    <svg viewBox="0 0 500 60" fill="none"><path d="M0 60 C125 0,375 0,500 60" fill="rgba(255,255,255,0.04)" /><path d="M0 60 C150 20,350 20,500 60" fill="rgba(255,255,255,0.03)" /></svg>
                    <div style={{ position: 'absolute', top: '30%', left: '60%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}></div>
                </div>
                <div className="sakpore-floating">SAKPORE</div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2, color: 'white' }}>Dashboard Admin</h2>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {/* View Mode Toggle */}
                        <div style={{ display: 'inline-flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.25)' }}>
                            <button onClick={() => setViewMode('mobile')} style={{
                                background: viewMode === 'mobile' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                                border: 'none', color: 'white', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', fontSize: '0.75rem', fontFamily: "'Outfit',sans-serif",
                                fontWeight: viewMode === 'mobile' ? 700 : 500,
                                backdropFilter: 'blur(4px)', transition: 'all 0.2s'
                            }}>
                                <Smartphone size={13} /> Mobile
                            </button>
                            <button onClick={() => setViewMode('web')} style={{
                                background: viewMode === 'web' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                                border: 'none', color: 'white', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', fontSize: '0.75rem', fontFamily: "'Outfit',sans-serif",
                                fontWeight: viewMode === 'web' ? 700 : 500,
                                backdropFilter: 'blur(4px)', transition: 'all 0.2s'
                            }}>
                                <Monitor size={13} /> Web
                            </button>
                        </div>
                        <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '6px 14px', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: "'Outfit',sans-serif", fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                            <LogOut size={14} /> Keluar
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-content" style={{ padding: '16px 16px 32px' }}>
                <div className="admin-tabs-modern">
                    {tabs.map(t => {
                        const I = t.icon;
                        let badgeCount = 0;
                        if (t.key === 'ramah') badgeCount = ramahDocs.filter(d => d.status === 'pending').length;
                        if (t.key === 'santun') badgeCount = santunReqs.filter(r => r.status === 'requested').length;
                        return (
                            <button key={t.key} className={`admin-tab-modern ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)} style={{ position: 'relative' }}>
                                <I size={14} />{t.label}
                                {badgeCount > 0 && <span style={{ position: 'absolute', top: '2px', right: '4px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)' }}>{badgeCount}</span>}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div><p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Memuat data...</p></div>
                ) : (<>
                    {/* ═══════ RAMAH ═══════ */}
                    {activeTab === 'ramah' && (<div>
                        <div className="sc-grid">
                            <div className="sc-card sc-blue"><div className="sc-emoji">📋</div><div className="sc-val">{ramahFiltered.length}</div><div className="sc-lbl">Total Pengajuan</div></div>
                            <div className="sc-card sc-green"><div className="sc-emoji">✅</div><div className="sc-val">{ramahFiltered.filter(d => d.status === 'completed').length}</div><div className="sc-lbl">Selesai</div></div>
                            <div className="sc-card sc-amber"><div className="sc-emoji">⚡</div><div className="sc-val">{ramahFiltered.filter(d => d.status === 'verified' || d.status === 'delivering').length}</div><div className="sc-lbl">Diproses</div></div>
                            <div className="sc-card sc-rose"><div className="sc-emoji">⏳</div><div className="sc-val">{ramahFiltered.filter(d => d.status === 'pending').length}</div><div className="sc-lbl">Menunggu</div></div>
                        </div>
                        <FilterBar year={rYear} setYear={setRYear} period={rPeriod} setPeriod={setRPeriod} sub={rSub} setSub={setRSub} />
                        <ChartBlock chartData={ramahChart} color="#2563eb" label="RAMAH" chartRef={ramahChartRef} />
                        <div className="download-row">
                            <button className="btn-m btn-excel btn-sm" onClick={() => generateExcel(ramahFiltered, 'LAPORAN DOKUMEN RAMAH', 'RAMAH', getPeriodText(rYear, rPeriod, rSub), ramahCols, ramahKeys)}>Unduh Excel</button>
                            <button className="btn-m btn-pdf btn-sm" onClick={() => generatePDF(ramahFiltered, 'LAPORAN DOKUMEN RAMAH', getPeriodText(rYear, rPeriod, rSub), ramahCols, ramahKeys)}>Unduh PDF</button>
                            <button className="btn-m btn-chart btn-sm" onClick={() => downloadChart(ramahChartRef, 'Grafik_RAMAH', `Grafik Dokumen RAMAH (${getPeriodText(rYear, rPeriod, rSub)})`)}>Unduh Grafik</button>
                        </div>
                        <div className="section-sep"></div>
                        <h3 style={{ fontSize: '1rem', fontFamily: "'Outfit',sans-serif", fontWeight: 700, marginBottom: '12px' }}>Daftar Dokumen Aktif ({ramahActive.length})</h3>
                        <div className="search-box"><Search size={16} color="#94a3b8" /><input placeholder="Cari nama pemohon atau NIK..." value={rSearch} onChange={e => setRSearch(e.target.value)} /></div>
                        {ramahActive.length === 0 ? <div className="empty-state"><FileText size={40} /><p>Belum ada dokumen aktif</p></div> :
                            ramahActive.map(doc => (
                                <div key={doc.id} className="admin-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div><p style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Outfit'" }}>{doc.applicant_name}</p><p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>NIK: {doc.applicant_nik}</p>{doc.baby_name && <p style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>👶 Bayi: {doc.baby_name}</p>}</div>
                                        <StatusBadge status={doc.status} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📞 {doc.phone_number || '-'}
                                            {doc.phone_number && (
                                                <button className="wa-btn" onClick={() => openWhatsApp(doc.phone_number, `Halo ${doc.applicant_name}, kami dari Admin SAKPORE RSUD Bendan. Terkait pengajuan layanan RAMAH Anda...`)}>
                                                    <MessageCircle size={12} /> Hubungi
                                                </button>
                                            )}
                                        </p>
                                        {doc.mother_name && <p>👩 Ibu: {doc.mother_name}</p>}
                                        {doc.father_name && <p>👨 Ayah: {doc.father_name}</p>}
                                        <p>📍 {doc.address}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Tracking: <strong style={{ color: '#0284c7' }}>{doc.tracking_code}</strong>{' · '}{new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    {doc.document_files?.length > 0 && <div style={{ marginBottom: '12px' }}><p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>📎 Dokumen ({doc.document_files.length})</p><DocumentChecklist files={doc.document_files} zipName={`RAMAH_${doc.applicant_name}_${doc.tracking_code}`} /></div>}
                                    <div className="status-actions">
                                        {doc.status === 'pending' && <button className="btn-m btn-excel btn-sm" onClick={() => updateRamahStatus(doc.id, 'verified', doc)}>Verifikasi</button>}
                                        {doc.status === 'verified' && <button className="btn-m btn-sm" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }} onClick={() => updateRamahStatus(doc.id, 'delivering', doc)}>Kirim</button>}
                                        {doc.status === 'delivering' && <button className="btn-m btn-success btn-sm" onClick={() => updateRamahStatus(doc.id, 'completed', doc)}>Selesai</button>}
                                    </div>
                                </div>
                            ))
                        }
                    </div>)}

                    {/* ═══════ SANTUN ═══════ */}
                    {activeTab === 'santun' && (<div>
                        <div className="sc-grid">
                            <div className="sc-card sc-blue"><div className="sc-emoji">🚑</div><div className="sc-val">{santunFiltered.length}</div><div className="sc-lbl">Total Permohonan</div></div>
                            <div className="sc-card sc-green"><div className="sc-emoji">✅</div><div className="sc-val">{santunFiltered.filter(r => r.status === 'completed').length}</div><div className="sc-lbl">Selesai</div></div>
                            <div className="sc-card sc-amber"><div className="sc-emoji">🚗</div><div className="sc-val">{santunFiltered.filter(r => r.status === 'assigned' || r.status === 'in_progress').length}</div><div className="sc-lbl">Diproses</div></div>
                            <div className="sc-card sc-rose"><div className="sc-emoji">📨</div><div className="sc-val">{santunFiltered.filter(r => r.status === 'requested').length}</div><div className="sc-lbl">Menunggu</div></div>
                        </div>
                        <FilterBar year={sYear} setYear={setSYear} period={sPeriod} setPeriod={setSPeriod} sub={sSub} setSub={setSSub} />
                        <ChartBlock chartData={santunChart} color="#16a34a" label="SANTUN" chartRef={santunChartRef} />
                        <div className="download-row">
                            <button className="btn-m btn-excel btn-sm" onClick={() => generateExcel(santunFiltered, 'LAPORAN TRANSPORT SANTUN', 'SANTUN', getPeriodText(sYear, sPeriod, sSub), santunCols, santunKeys)}>Unduh Excel</button>
                            <button className="btn-m btn-pdf btn-sm" onClick={() => generatePDF(santunFiltered, 'LAPORAN TRANSPORT SANTUN', getPeriodText(sYear, sPeriod, sSub), santunCols, santunKeys)}>Unduh PDF</button>
                            <button className="btn-m btn-chart btn-sm" onClick={() => downloadChart(santunChartRef, 'Grafik_SANTUN', `Grafik Transport SANTUN (${getPeriodText(sYear, sPeriod, sSub)})`)}>Unduh Grafik</button>
                        </div>
                        <div className="section-sep"></div>
                        <h3 style={{ fontSize: '1rem', fontFamily: "'Outfit',sans-serif", fontWeight: 700, marginBottom: '12px' }}>Daftar Permohonan Aktif ({santunActive.length})</h3>
                        <div className="search-box"><Search size={16} color="#94a3b8" /><input placeholder="Cari nama pasien atau NIK..." value={sSearch} onChange={e => setSSearch(e.target.value)} /></div>
                        {santunActive.length === 0 ? <div className="empty-state"><Truck size={40} /><p>Belum ada permohonan aktif</p></div> :
                            santunActive.map(req => (
                                <div key={req.id} className="admin-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div><p style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Outfit'" }}>{req.patient_name}</p><p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>NIK: {req.patient_nik}</p></div>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📞 {req.phone_number || '-'}
                                            {req.phone_number && (
                                                <button className="wa-btn" onClick={() => openWhatsApp(req.phone_number, `Halo ${req.patient_name}, kami dari Admin SAKPORE RSUD Bendan. Terkait permohonan layanan SANTUN Anda...`)}>
                                                    <MessageCircle size={12} /> Hubungi
                                                </button>
                                            )}
                                        </p>
                                        {req.pickup_address && <p>📍 Jemput: {req.pickup_address}</p>}
                                        {req.dropoff_address && <p>🏠 Tujuan: {req.dropoff_address}</p>}
                                        {req.consent_signed && <p style={{ color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>✓ E-Consent</p>}
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Tracking: <strong style={{ color: '#0284c7' }}>{req.tracking_code}</strong>{' · '}{new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    {req.document_files?.length > 0 && <div style={{ marginBottom: '12px' }}><p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>📎 Dokumen ({req.document_files.length})</p><DocumentChecklist files={req.document_files} zipName={`SANTUN_${req.patient_name}_${req.tracking_code}`} /></div>}
                                    <div className="status-actions">
                                        {req.status === 'requested' && <button className="btn-m btn-excel btn-sm" onClick={() => updateSantunStatus(req.id, 'assigned', req)}>Tugaskan</button>}
                                        {req.status === 'assigned' && <button className="btn-m btn-sm" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }} onClick={() => updateSantunStatus(req.id, 'in_progress', req)}>Jalan</button>}
                                        {req.status === 'in_progress' && <button className="btn-m btn-success btn-sm" onClick={() => updateSantunStatus(req.id, 'completed', req)}>Selesai</button>}
                                    </div>
                                </div>
                            ))
                        }
                    </div>)}

                    {/* ═══════ ARSIP ═══════ */}
                    {activeTab === 'arsip' && (<div>
                        <div className="sc-grid">
                            <div className="sc-card sc-blue"><div className="sc-emoji">📚</div><div className="sc-val">{arsipRamah.length + arsipSantun.length}</div><div className="sc-lbl">Total Arsip Selesai</div></div>
                            <div className="sc-card sc-green"><div className="sc-emoji">📄</div><div className="sc-val">{arsipRamah.length}</div><div className="sc-lbl">Arsip RAMAH</div></div>
                            <div className="sc-card sc-amber"><div className="sc-emoji">🚑</div><div className="sc-val">{arsipSantun.length}</div><div className="sc-lbl">Arsip SANTUN</div></div>
                            <div className="sc-card sc-rose"><div className="sc-emoji">🔍</div><div className="sc-val">#</div><div className="sc-lbl">Gunakan Pencarian</div></div>
                        </div>
                        <div className="search-box" style={{ marginBottom: '20px' }}><Search size={16} color="#94a3b8" /><input placeholder="Cari arsip nama atau NIK..." value={aSearch} onChange={e => setASearch(e.target.value)} /></div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                            <div className="admin-card">
                                <div className="admin-card-title">Arsip RAMAH ({arsipRamah.length})</div>
                                {arsipRamah.length === 0 ? <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>Tidak ada arsip ditemukan</p> :
                                    arsipRamah.map(doc => (
                                        <div key={doc.id} className="spj-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedArchive({ type: 'ramah', data: doc })}>
                                            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', fontFamily: "'Outfit'" }}>{doc.applicant_name}</p><p style={{ fontSize: '0.72rem', color: '#64748b' }}>{doc.tracking_code} · {new Date(doc.created_at).toLocaleDateString('id-ID')}</p></div>
                                            <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>Selesai</span>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="admin-card">
                                <div className="admin-card-title">Arsip SANTUN ({arsipSantun.length})</div>
                                {arsipSantun.length === 0 ? <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>Tidak ada arsip ditemukan</p> :
                                    arsipSantun.map(req => (
                                        <div key={req.id} className="spj-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedArchive({ type: 'santun', data: req })}>
                                            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', fontFamily: "'Outfit'" }}>{req.patient_name}</p><p style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.tracking_code} · {new Date(req.created_at).toLocaleDateString('id-ID')}</p></div>
                                            <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>Selesai</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>)}

                    {/* ═══════ SPJ ═══════ */}
                    {activeTab === 'spj' && (<div>
                        <div className="sc-grid">
                            <div className="sc-card sc-blue"><div className="sc-emoji">📄</div><div className="sc-val">{completedRamah.length}</div><div className="sc-lbl">RAMAH Selesai</div></div>
                            <div className="sc-card sc-green"><div className="sc-emoji">🚑</div><div className="sc-val">{completedSantun.length}</div><div className="sc-lbl">SANTUN Selesai</div></div>
                            <div className="sc-card sc-amber"><div className="sc-emoji">✍️</div><div className="sc-val">{completedRamah.filter(d => d.is_spj_claimed).length + completedSantun.filter(r => r.is_spj_claimed).length}</div><div className="sc-lbl">Total Diklaim</div></div>
                            <div className="sc-card sc-rose"><div className="sc-emoji">📝</div><div className="sc-val">{completedRamah.filter(d => !d.is_spj_claimed).length + completedSantun.filter(r => !r.is_spj_claimed).length}</div><div className="sc-lbl">Sisa Belum Diklaim</div></div>
                        </div>
                        <FilterBar year={spjYear} setYear={setSpjYear} period={spjPeriod} setPeriod={setSpjPeriod} sub={spjSub} setSub={setSpjSub} />

                        {renderSpjList(`SPJ RAMAH (${completedRamah.length})`, completedRamah, toggleSpjClaimRamah)}
                        {renderSpjList(`SPJ SANTUN (${completedSantun.length})`, completedSantun, toggleSpjClaimSantun)}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginTop: '24px' }}>
                            <div className="spj-dl-frame">
                                <div className="spj-dl-header">
                                    <div style={{ background: '#e0f2fe', padding: '16px', borderRadius: '50%' }}><FileText size={36} color="#0284c7" /></div>
                                    SPJ RAMAH
                                </div>
                                <div className="dl-wrap">
                                    <button className="btn-m btn-excel btn-sm" onClick={() => generateExcel(completedRamah.map(d => ({ ...d, is_claimed: d.is_spj_claimed ? 'Ya' : 'Belum' })), 'REKAPITULASI SPJ RAMAH', 'SPJ RAMAH', getPeriodText(spjYear, spjPeriod, spjSub), ['Nama', 'NIK', 'HP', 'Alamat', 'Tracking', 'Tanggal', 'Diklaim'], ['applicant_name', 'applicant_nik', 'phone_number', 'address', 'tracking_code', 'created_at', 'is_claimed'])}>Unduh Excel</button>
                                    <button className="btn-m btn-pdf btn-sm" onClick={() => generatePDF(completedRamah.map(d => ({ ...d, is_claimed: d.is_spj_claimed ? 'Ya' : 'Belum' })), 'REKAPITULASI SPJ RAMAH', getPeriodText(spjYear, spjPeriod, spjSub), ['Nama', 'NIK', 'HP', 'Alamat', 'Tracking', 'Tanggal', 'Diklaim'], ['applicant_name', 'applicant_nik', 'phone_number', 'address', 'tracking_code', 'created_at', 'is_claimed'])}>Unduh PDF</button>
                                </div>
                            </div>
                            <div className="spj-dl-frame">
                                <div className="spj-dl-header">
                                    <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '50%' }}><Truck size={36} color="#16a34a" /></div>
                                    SPJ SANTUN
                                </div>
                                <div className="dl-wrap">
                                    <button className="btn-m btn-excel btn-sm" onClick={() => generateExcel(completedSantun.map(r => ({ ...r, is_claimed: r.is_spj_claimed ? 'Ya' : 'Belum' })), 'REKAPITULASI SPJ SANTUN', 'SPJ SANTUN', getPeriodText(spjYear, spjPeriod, spjSub), ['Nama', 'NIK', 'HP', 'Jemput', 'Tujuan', 'Tracking', 'Tanggal', 'Diklaim'], ['patient_name', 'patient_nik', 'phone_number', 'pickup_address', 'dropoff_address', 'tracking_code', 'created_at', 'is_claimed'])}>Unduh Excel</button>
                                    <button className="btn-m btn-pdf btn-sm" onClick={() => generatePDF(completedSantun.map(r => ({ ...r, is_claimed: r.is_spj_claimed ? 'Ya' : 'Belum' })), 'REKAPITULASI SPJ SANTUN', getPeriodText(spjYear, spjPeriod, spjSub), ['Nama', 'NIK', 'HP', 'Jemput', 'Tujuan', 'Tracking', 'Tanggal', 'Diklaim'], ['patient_name', 'patient_nik', 'phone_number', 'pickup_address', 'dropoff_address', 'tracking_code', 'created_at', 'is_claimed'])}>Unduh PDF</button>
                                </div>
                            </div>
                        </div>
                    </div>)}
                </>)}
            </div>

            {/* ── TOAST NOTIFICATIONS ── */}
            <div className="toast-container">
                {notifications.map(n => (
                    <div key={n.id} className={`toast-item ${n.type}`} onClick={() => {
                        const msg = `Halo ${n.name}, kami dari Admin SAKPORE RSUD Bendan mengonfirmasi bahwa pengajuan layanan ${n.type.toUpperCase()} Anda telah kami terima dan sedang ditindaklanjuti.`;
                        openWhatsApp(n.phone, msg);
                        setNotifications(prev => prev.filter(x => x.id !== n.id));
                    }}>
                        <button className="toast-close" onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(prev => prev.filter(x => x.id !== n.id));
                        }}><X size={16} /></button>
                        <div className="toast-title"><Bell size={14} color={n.type === 'ramah' ? "#2563eb" : "#16a34a"} /> {n.title}</div>
                        <div className="toast-msg"><b>{n.name}</b> mengirimkan permohonan baru. Klik untuk menindaklanjuti via WhatsApp.</div>
                    </div>
                ))}
            </div>

            {/* ── ARCHIVE MODAL ── */}
            {selectedArchive && (
                <div className="modal-overlay" onClick={() => setSelectedArchive(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedArchive(null)}><X size={18} /></button>
                        <div className="modal-header">
                            {selectedArchive.type === 'ramah' ? <FileText size={20} color="#2563eb" /> : <Truck size={20} color="#16a34a" />}
                            Detail Arsip {selectedArchive.type === 'ramah' ? 'RAMAH' : 'SANTUN'}
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit'", marginBottom: '8px' }}>
                                    {selectedArchive.type === 'ramah' ? selectedArchive.data.applicant_name : selectedArchive.data.patient_name}
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>NIK: {selectedArchive.type === 'ramah' ? selectedArchive.data.applicant_nik : selectedArchive.data.patient_nik}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No HP: {selectedArchive.data.phone_number || '-'}</p>
                                {selectedArchive.type === 'ramah' ? (
                                    <>
                                        {selectedArchive.data.baby_name && <p style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>👶 Nama Bayi: {selectedArchive.data.baby_name}</p>}
                                        {selectedArchive.data.mother_name && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>👩 Ibu Kandung Bayi: {selectedArchive.data.mother_name}</p>}
                                        {selectedArchive.data.father_name && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>👨 Ayah Kandung Bayi: {selectedArchive.data.father_name}</p>}
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>📍 Alamat: {selectedArchive.data.address}</p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>📍 Jemput: {selectedArchive.data.pickup_address}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>🏠 Tujuan: {selectedArchive.data.dropoff_address}</p>
                                    </>
                                )}
                            </div>

                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px', fontFamily: "'Outfit'" }}>Kronologi Status</p>
                            <div className="timeline-list">
                                <div className="timeline-item">
                                    <div className="timeline-dot" style={{ background: '#16a34a', boxShadow: '0 0 0 1px #16a34a' }}></div>
                                    <div className="timeline-title">Layanan Selesai</div>
                                    <div className="timeline-date">Status saat ini</div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-title">Pengajuan Diterima</div>
                                    <div className="timeline-date">{new Date(selectedArchive.data.created_at).toLocaleString('id-ID')}</div>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px', fontFamily: "'Outfit'" }}>Dokumen Upload</p>
                            {selectedArchive.data.document_files?.length > 0 ? (
                                <DocumentChecklist
                                    files={selectedArchive.data.document_files}
                                    zipName={`Arsip_${selectedArchive.type.toUpperCase()}_${selectedArchive.data.tracking_code}`}
                                />
                            ) : (
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tidak ada dokumen terlampir.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
