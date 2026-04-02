import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("❌ Kunci tidak ditemukan di .env!");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    console.log('⏳ Sedang menguji koneksi ke Supabase...');

    try {
        const { data, error } = await supabase.from('_non_existent_table_').select('*').limit(1);
        if (error) {
            if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation "_non_existent_table_" does not exist')) {
                console.log('✅ KONEKSI BERHASIL! Supabase dan Anon Key Anda tervalidasi aktif.');
                return;
            }
            console.error('❌ MASALAH KONEKSI ATAU PERMISSION:', error.message || error);
        } else {
            console.log('✅ KONEKSI BERHASIL!');
        }
    } catch (e) {
        console.error('❌ GAGAL MENGHUBUNGI SERVER SUPABASE:', e.message);
    }
}

testConnection();
