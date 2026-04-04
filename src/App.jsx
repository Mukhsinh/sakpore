import { useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, FileText, Truck, LogIn, Hospital } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';

import HomePage from './pages/HomePage';
import Login from './pages/Login';

import SubmitDokumen from './pages/ramah/SubmitDokumen';
import TrackDokumen from './pages/ramah/TrackDokumen';

import RequestTransport from './pages/santun/RequestTransport';
import TrackRide from './pages/santun/TrackRide';

import AdminPanel from './pages/admin/AdminPanel';

// Protected route wrapper for admin pages
function AdminRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check if we're on an admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {/* App Bar Removed as requested */}

      {/* Main Content Area */}
      <main className="app-content">
        <Routes>
          {/* Public Patient Routes */}
          <Route path="/" element={<HomePage />} />

          <Route path="/ramah/submit" element={<SubmitDokumen />} />
          <Route path="/ramah/track" element={<TrackDokumen />} />

          <Route path="/santun/submit" element={<RequestTransport />} />
          <Route path="/santun/track" element={<TrackRide />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '24px 20px',
          marginTop: '20px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          paddingBottom: isAdminPage ? '24px' : '30px'
        }}>
          Aplikasi Sakpore @2026 Mukhsin Hadi. All Right Reserved
        </footer>
      </main>

      {/* Bottom Navigation - Only for patient pages */}
      {!isAdminPage && (
        <nav className="bottom-nav">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={22} />
            <span>Beranda</span>
          </Link>
          <Link to="/ramah/submit" className={`nav-item ${location.pathname.startsWith('/ramah') ? 'active' : ''}`}>
            <FileText size={22} />
            <span>RAMAH</span>
          </Link>
          <Link to="/santun/submit" className={`nav-item ${location.pathname.startsWith('/santun') ? 'active' : ''}`}>
            <Truck size={22} />
            <span>SANTUN</span>
          </Link>
          {/* Admin Login at Right side of Bottom Nav */}
          <Link to="/admin/login" className={`nav-item ${location.pathname === '/admin/login' ? 'active' : ''}`}>
            <LogIn size={22} />
            <span>Admin</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

export default App;
