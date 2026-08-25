import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { Toast } from '../components/Toast';
import { 
  LogOut, 
  LogIn, 
  Clock, 
  User, 
  Search, 
  KeyRound,
  Inbox
} from 'lucide-react';

export const GuardDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { requests, guardAction } = useDatabase();

  const [activeTab, setActiveTab] = useState<'approved' | 'out'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!profile) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Approved Today: Status = approved, date = today, and has NOT exited yet
  const approvedToday = requests.filter(r => 
    r.status === 'approved' && 
    r.requested_date === todayStr && 
    !r.gate_exit_at
  );

  // 2. Currently Out: Has exited, but has NOT re-entered, and is expected back (time_expected_back is not null)
  const currentlyOut = requests.filter(r => 
    r.gate_exit_at && 
    !r.gate_reentry_at && 
    r.status === 'approved' && 
    r.time_expected_back !== null
  );

  // Fallback Search Filtering (numeric roll numbers only)
  const handleNumericSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Retain only digits in query
    const val = e.target.value.replace(/\D/g, '');
    setSearchQuery(val);
  };

  const getFilteredList = (list: LeaveRequest[]) => {
    if (!searchQuery) return list;
    return list.filter(r => {
      const rollDigits = (r.student?.roll_number || '').replace(/\D/g, '');
      return rollDigits.includes(searchQuery);
    });
  };

  const visibleApproved = getFilteredList(approvedToday);
  const visibleOut = getFilteredList(currentlyOut);

  // Handle Card Tap logging
  const handleCardTap = async (req: LeaveRequest, actionType: 'exit' | 'reentry') => {
    if (actionType === 'exit') {
      const isNotReturningToday = req.time_expected_back === null;
      
      // If student is not returning today, we log exit and complete the request immediately
      const result = await guardAction(req.id, 'exit');
      if (result.success) {
        if (isNotReturningToday) {
          // Trigger completed action
          await guardAction(req.id, 'reentry', 'Auto-completed on exit (Not returning today)');
          setToast({ message: `${req.student?.full_name}: EXIT logged (No-Return Pass Completed)`, type: 'success' });
        } else {
          setToast({ message: `${req.student?.full_name}: EXIT logged. Moved to Currently Out.`, type: 'success' });
        }
      } else {
        setToast({ message: result.error || 'Failed to record exit', type: 'error' });
      }
    } else {
      // Re-entry
      const result = await guardAction(req.id, 'reentry');
      if (result.success) {
        setToast({ message: `${req.student?.full_name}: RE-ENTRY logged. Pass Completed.`, type: 'success' });
      } else {
        setToast({ message: result.error || 'Failed to record re-entry', type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-md">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Security Gate Logs</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Gate: {profile.department}</p>
          </div>
        </div>

        {/* Counts indicators */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-sky-950 text-sky-400 border border-sky-900 rounded-lg">
            Approved: {approvedToday.length}
          </span>
          <span className="px-3 py-1.5 bg-indigo-950 text-indigo-400 border border-indigo-900 rounded-lg">
            Out: {currentlyOut.length}
          </span>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setActiveTab('approved');
            setSearchQuery('');
          }}
          className={`py-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all shadow-sm border flex flex-col items-center justify-center gap-1
            ${activeTab === 'approved'
              ? 'bg-sky-600 border-sky-600 text-white shadow-sky-100 ring-2 ring-sky-500/20'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <span className="text-lg">{approvedToday.length}</span>
          <span className="text-[11px] font-bold tracking-wider">Approved Today</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('out');
            setSearchQuery('');
          }}
          className={`py-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all shadow-sm border flex flex-col items-center justify-center gap-1
            ${activeTab === 'out'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <span className="text-lg">{currentlyOut.length}</span>
          <span className="text-[11px] font-bold tracking-wider">Currently Out</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'approved' ? (
          /* Tab 1: Approved Today */
          visibleApproved.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <Inbox className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No students waiting for exit</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">All approved passes for today have already checked out or no passes exist.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {visibleApproved.map(req => (
                <button
                  key={req.id}
                  onClick={() => handleCardTap(req, 'exit')}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md hover:border-sky-300 active:scale-[0.98] transition-all flex items-center gap-4 group"
                >
                  {/* Big Image Thumbnail */}
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner group-hover:border-sky-200">
                    {req.student?.photo_url ? (
                      <img src={req.student.photo_url} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  
                  {/* Student description */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">{req.student?.full_name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">{req.student?.roll_number}</p>
                    
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-rose-600 font-extrabold">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>{req.time_out} - {req.time_expected_back || 'No Return'}</span>
                    </div>
                  </div>

                  <div className="w-9 h-9 bg-slate-50 group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          /* Tab 2: Currently Out */
          visibleOut.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <Inbox className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No students currently off campus</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">All exited students have logged their re-entry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {visibleOut.map(req => (
                <button
                  key={req.id}
                  onClick={() => handleCardTap(req, 'reentry')}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md hover:border-indigo-300 active:scale-[0.98] transition-all flex items-center gap-4 group"
                >
                  {/* Big Image Thumbnail */}
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner group-hover:border-indigo-200">
                    {req.student?.photo_url ? (
                      <img src={req.student.photo_url} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  
                  {/* Student details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">{req.student?.full_name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">{req.student?.roll_number}</p>
                    
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-indigo-600 font-extrabold">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Limit: {req.time_expected_back}</span>
                    </div>
                  </div>

                  <div className="w-9 h-9 bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                    <LogIn className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {/* Fallback Numeric Search (Roll number only) */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs max-w-xl mx-auto">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Search className="w-4 h-4" />
          <span>Fallback Lookup (Numeric Roll No. digits only):</span>
        </div>
        <input
          type="text"
          pattern="[0-8]*"
          value={searchQuery}
          onChange={handleNumericSearchChange}
          placeholder="Type numbers e.g. 2023 or 042"
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold w-full md:w-48 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
        />
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
