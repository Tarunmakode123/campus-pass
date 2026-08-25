import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { Toast } from '../components/Toast';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  Clock, 
  User, 
  KeyRound,
  FileWarning
} from 'lucide-react';

export const GuardDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { requests, guardAction } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [activePass, setActivePass] = useState<LeaveRequest | null>(null);
  const [lookupError, setLookupError] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  // Keep search box focused on load and after actions
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activePass, lookupError]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    
    // Look up in requests database: match either pass_id or roll_number (case insensitive)
    const match = requests.find(r => 
      (r.pass_id && r.pass_id.toLowerCase() === query) || 
      (r.student?.roll_number && r.student.roll_number.toLowerCase() === query)
    );

    if (match) {
      setActivePass(match);
      setLookupError(false);
      setOverrideNotes('');
    } else {
      setActivePass(null);
      setLookupError(true);
      setToast({ message: 'No matching gate pass found for this search.', type: 'error' });
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setActivePass(null);
    setLookupError(false);
    setOverrideNotes('');
  };

  // Validation Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours + currentMinutes / 60;

  // Check if date is today
  const isDateToday = activePass ? activePass.requested_date === todayStr : false;

  // Check if time is within window (15 mins early buffer, 30 mins late buffer)
  let isWithinTimeWindow = false;
  let timeOutVal = 0;
  let timeBackVal = 24.0;

  if (activePass) {
    const [outH, outM] = activePass.time_out.split(':').map(Number);
    timeOutVal = outH + outM / 60;

    if (activePass.time_expected_back) {
      const [backH, backM] = activePass.time_expected_back.split(':').map(Number);
      timeBackVal = backH + backM / 60;
    }
    
    // Within range including buffer
    isWithinTimeWindow = currentTimeVal >= (timeOutVal - 0.25) && currentTimeVal <= (timeBackVal + 0.5);
  }

  // Pass usage states
  const hasExited = activePass ? !!activePass.gate_exit_at : false;
  const hasReturned = activePass ? !!activePass.gate_reentry_at : false;
  const isNotReturningToday = activePass ? activePass.time_expected_back === null : false;

  // Final Validity
  const isValidNow = activePass 
    ? (isDateToday && isWithinTimeWindow && !hasReturned && !(hasExited && isNotReturningToday))
    : false;

  // Actions
  const handleLogAction = async (actionType: 'exit' | 'reentry') => {
    if (!activePass) return;

    let notes = overrideNotes.trim();
    if (!isValidNow && !notes) {
      setToast({ message: 'Validation override reason is required for expired or outside window passes.', type: 'error' });
      return;
    }

    if (!isValidNow) {
      notes = `[OVERRIDDEN] ${notes}`;
    }

    const result = await guardAction(activePass.id, actionType, notes || undefined);

    if (result.success) {
      setToast({ message: `Gate ${actionType === 'exit' ? 'EXIT' : 'RE-ENTRY'} logged successfully!`, type: 'success' });
      // Reset search
      handleClear();
    } else {
      setToast({ message: result.error || 'Failed to record entry', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Header Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4 text-center md:text-left flex items-center justify-center md:justify-start gap-2">
          <KeyRound className="w-4 h-4 text-sky-500" />
          Security Gate Registry
        </h2>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              ref={searchInputRef}
              required
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Scan Barcode or Enter Pass ID (GP-...) or Student Roll No..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-white tracking-wide placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center gap-2"
          >
            Lookup
          </button>
          {(activePass || lookupError) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold rounded-xl text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Main Results View */}
      {activePass ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Validity Banner */}
          {isValidNow ? (
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="font-extrabold text-base tracking-wide">VALID PASS</h3>
                  <p className="text-xs text-emerald-100 font-semibold mt-0.5">Permitted exit/entry. Pass is within approved date and time windows.</p>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Active</span>
            </div>
          ) : (
            <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 flex-shrink-0 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-base tracking-wide">WARNING: PASS EXPIRED OR OUTSIDE WINDOW</h3>
                  <p className="text-xs text-rose-100 font-semibold mt-0.5">
                    {!isDateToday 
                      ? `Pass is for another date: ${activePass.requested_date} (Today: ${todayStr}).`
                      : !isWithinTimeWindow
                      ? `Time is outside window: ${activePass.time_out} - ${activePass.time_expected_back || 'No return'}.`
                      : hasReturned
                      ? `Pass is already completed (Re-entry logged).`
                      : `Pass has already exited and is not expected to return today.`}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Invalid</span>
            </div>
          )}

          {/* Student Profile Card details */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Column 1: Big Photo */}
            <div className="flex flex-col items-center text-center">
              <div className="w-36 h-36 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center shadow-md mb-3">
                {activePass.student?.photo_url ? (
                  <img src={activePass.student.photo_url} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-300" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{activePass.student?.full_name}</h3>
              <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{activePass.student?.roll_number}</span>
            </div>

            {/* Column 2: Approved Pass Parameters */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Pass Parameters</h4>
              
              <div className="space-y-2 text-sm font-semibold text-slate-800">
                <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Department:</span> <span>{activePass.student?.department}</span></div>
                <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Date Approved:</span> <span>{activePass.requested_date}</span></div>
                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> Departure:</span>
                  <span className="font-bold text-sky-700">{activePass.time_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> Return Limit:</span>
                  <span className="font-bold text-sky-700">{activePass.time_expected_back || 'No return required'}</span>
                </div>
              </div>
            </div>

            {/* Column 3: Approver & Parent Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Authority Sign-offs</h4>
              
              <div className="space-y-2.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/60 leading-normal">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Faculty Confirmed call:</span>
                  <span className="font-semibold text-slate-800 mt-1 block">{activePass.faculty?.full_name || 'Advisor'}</span>
                  <span className="text-[10px] text-slate-400 italic font-medium">Notes: "{activePass.faculty_notes || 'Confirmed parent.'}"</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/60 leading-normal">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">HOD Approval:</span>
                  <span className="font-semibold text-slate-800 mt-1 block">{activePass.hod?.full_name || 'Department HOD'}</span>
                  <span className="text-[10px] text-slate-400 italic font-medium">Notes: "{activePass.hod_notes || 'Approved.'}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Logs / Exit Timestamps */}
          <div className="bg-slate-50 px-6 md:px-8 py-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
            <div>
              <span>Recorded Gate Exit Time:</span>
              <strong className="block text-slate-700 mt-1">
                {activePass.gate_exit_at ? new Date(activePass.gate_exit_at).toLocaleString() : 'Not Checked Out Yet'}
              </strong>
            </div>
            <div>
              <span>Recorded Gate Re-entry Time:</span>
              <strong className="block text-slate-700 mt-1">
                {activePass.gate_reentry_at ? new Date(activePass.gate_reentry_at).toLocaleString() : 'Not Checked In Yet'}
              </strong>
            </div>
          </div>

          {/* Action buttons & Override notes */}
          <div className="p-6 md:p-8 bg-slate-100 border-t border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Input field for override */}
            <div className="w-full md:flex-1 space-y-1.5 max-w-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {!isValidNow ? 'OVERRIDE NOTE REQUIRED' : 'Security Log Notes (Optional)'}
              </label>
              <input
                type="text"
                placeholder={!isValidNow ? 'Explain why you allow exit (e.g. medical pick-up parent present)' : 'Log observations (e.g. father picked up)'}
                required={!isValidNow}
                value={overrideNotes}
                onChange={e => setOverrideNotes(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500
                  ${!isValidNow && !overrideNotes.trim() ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white'}`}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              {/* Show Log Exit if not exited */}
              {!hasExited && (
                <button
                  onClick={() => handleLogAction('exit')}
                  className="flex-1 md:flex-none px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Log Exit
                </button>
              )}

              {/* Show Log Reentry if exited but not returned, and student has time back (same day return expected) */}
              {hasExited && !hasReturned && !isNotReturningToday && (
                <button
                  onClick={() => handleLogAction('reentry')}
                  className="flex-1 md:flex-none px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Log Re-entry
                </button>
              )}
              
              {hasReturned && (
                <div className="text-center w-full py-3 text-slate-500 font-bold bg-white border border-slate-200 rounded-xl px-6">
                  Pass Completed (Re-entered)
                </div>
              )}

              {hasExited && isNotReturningToday && (
                <div className="text-center w-full py-3 text-slate-500 font-bold bg-white border border-slate-200 rounded-xl px-6">
                  Left Campus (No Return Scheduled)
                </div>
              )}
            </div>
          </div>
        </div>
      ) : lookupError ? (
        /* Large Clear Red Error State */
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center shadow max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FileWarning className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-rose-800">NO MATCHING PASS FOUND</h3>
            <p className="text-sm font-semibold text-rose-600">The Pass ID or Roll Number you entered is not recognized in the system registry.</p>
          </div>
          <div className="bg-rose-100/40 p-4 rounded-xl border border-rose-100 text-xs font-bold text-rose-800 tracking-wide">
            DO NOT ALLOW EXIT. REQUEST PHYSICAL ID OR CONTACT HOD ADMIN.
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-16 text-center rounded-2xl border border-dashed border-slate-200 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Waiting for Pass ID Scan</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Use the search box above to lookup the student's approved pass by typing their Roll Number or printing Pass ID.</p>
        </div>
      )}

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
