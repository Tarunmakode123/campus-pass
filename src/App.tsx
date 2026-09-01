import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { StudentDashboard } from './views/StudentDashboard';
import { FacultyDashboard } from './views/FacultyDashboard';
import { HODDashboard } from './views/HODDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { GuardVerification } from './views/GuardVerification';

// Secure Routes by Role
interface ProtectedRouteProps {
  allowedRoles: ('student' | 'faculty' | 'hod' | 'admin' | 'guard')[];
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <span className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Verifying Credentials...</span>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    const validRoles = ['student', 'faculty', 'hod', 'admin', 'guard'];
    const userRole = profile.role as string;
    if (!validRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
    const correctPath = `/${userRole}`;
    return <Navigate to={correctPath} replace />;
  }

  return <Layout>{children}</Layout>;
};

// Root Redirect component to route logged-in users directly to their dashboards
const RootRedirect: React.FC = () => {
  const { profile, loading, logout } = useAuth();

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;

  const validRoles = ['student', 'faculty', 'hod', 'admin', 'guard'];
  const userRole = profile.role as string;
  if (!validRoles.includes(userRole)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'guard') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to={`/${userRole}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/verify/:qrToken" element={<GuardVerification />} />

            {/* Protected Role-Based Routes */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty" 
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hod" 
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <HODDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'guard']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Root / Catch-All Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DatabaseProvider>
    </AuthProvider>
  );
}

export default App;
// Vercel webhook trigger comment
