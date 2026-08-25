import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  ShieldAlert, 
  Menu, 
  X, 
  ClipboardList, 
  UserCheck, 
  Building2, 
  Key, 
  Users,
  Compass
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile, logout, isDemoMode, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!profile) return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Nav items based on role
  const getNavItems = () => {
    switch (profile.role) {
      case 'student':
        return [
          { label: 'My Requests', path: '/student', icon: ClipboardList }
        ];
      case 'faculty':
        return [
          { label: 'Faculty Dashboard', path: '/faculty', icon: UserCheck }
        ];
      case 'hod':
        return [
          { label: 'HOD Dashboard', path: '/hod', icon: Building2 }
        ];
      case 'guard':
        return [
          { label: 'Gate Registry', path: '/guard', icon: Key }
        ];
      case 'admin':
        return [
          { label: 'Admin Dashboard', path: '/admin', icon: Users }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Helper to switch roles easily in Demo Mode for testing
  const switchDemoRole = async (email: string) => {
    await logout();
    await login(email, 'password123');
    const rolePath = email.split('@')[0];
    navigate(`/${rolePath}`);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span><strong>DEMO MODE:</strong> LocalStorage is active. Switching roles won't require DB setup.</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] text-amber-200">Switch to:</span>
            <button onClick={() => switchDemoRole('student@college.edu')} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold uppercase tracking-wider text-[9px]">Student</button>
            <button onClick={() => switchDemoRole('faculty@college.edu')} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold uppercase tracking-wider text-[9px]">Faculty</button>
            <button onClick={() => switchDemoRole('hod@college.edu')} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold uppercase tracking-wider text-[9px]">HOD</button>
            <button onClick={() => switchDemoRole('guard@college.edu')} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold uppercase tracking-wider text-[9px]">Guard</button>
            <button onClick={() => switchDemoRole('admin@college.edu')} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold uppercase tracking-wider text-[9px]">Admin</button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center shadow-md">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight leading-tight">Campus Gate Pass</h1>
                <p className="text-[10px] text-slate-400 font-medium">Emergency Leave Portal</p>
              </div>
            </div>

            {/* Desktop Navigation & Profile */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-sky-600/20 text-sky-400 font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="h-6 w-px bg-slate-800" />

              {/* User Profile Info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-200">{profile.full_name}</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-400 font-semibold capitalize tracking-wider">{profile.role}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 text-sky-400 font-bold overflow-hidden shadow-inner">
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white rounded-md focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-3">
            <nav className="flex flex-col space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-left transition-all
                      ${isActive 
                        ? 'bg-sky-600/20 text-sky-400 font-semibold' 
                        : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            
            <div className="h-px bg-slate-800 my-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sky-400 font-bold overflow-hidden">
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200 leading-tight">{profile.full_name}</div>
                  <div className="text-[10px] text-slate-400 font-semibold capitalize tracking-wider">{profile.role} • {profile.department}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 text-rose-400 hover:bg-rose-900 rounded-md text-xs font-bold transition-colors border border-rose-900"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-4 text-center text-slate-400 text-xs font-medium">
        &copy; {new Date().getFullYear()} Campus Gate Pass System. All rights reserved.
      </footer>
    </div>
  );
};
