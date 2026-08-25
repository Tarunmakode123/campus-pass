import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, ShieldAlert, Key } from 'lucide-react';
import { Toast } from '../components/Toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      // Find matching role and route
      const cleanEmail = email.toLowerCase().trim();
      let rolePath = 'student';
      
      if (cleanEmail.includes('admin')) rolePath = 'admin';
      else if (cleanEmail.includes('faculty')) rolePath = 'faculty';
      else if (cleanEmail.includes('hod')) rolePath = 'hod';

      navigate(`/${rolePath}`);
    } else {
      setToast({ message: result.error || 'Login failed', type: 'error' });
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-900 relative">
      {/* College Logo Placeholder */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg border border-sky-400 mb-3">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">CITY COLLEGE OF ENGINEERING</h2>
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">Campus Gate Pass Registry</p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 text-center mb-6">Access Portal</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@college.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Presets Indicator */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-1.5 justify-center mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-slate-500 tracking-wide">DEMO PRESET ACCOUNTS</span>
          </div>
          <p className="text-[10px] text-slate-400 text-center mb-4 leading-normal">
            Select a role below to autofill its demo credentials. The password for all accounts is <code className="bg-slate-50 px-1 py-0.5 rounded font-mono font-bold text-slate-600">password123</code>.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              onClick={() => fillCredentials('student@college.edu')} 
              className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold border border-slate-200 rounded text-center"
            >
              Student
            </button>
            <button 
              onClick={() => fillCredentials('faculty@college.edu')} 
              className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold border border-slate-200 rounded text-center"
            >
              Faculty
            </button>
            <button 
              onClick={() => fillCredentials('hod@college.edu')} 
              className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold border border-slate-200 rounded text-center"
            >
              HOD (CS)
            </button>
            <button 
              onClick={() => fillCredentials('admin@college.edu')} 
              className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold border border-slate-200 rounded text-center"
            >
              Administrator
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};
