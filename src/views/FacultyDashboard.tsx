import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { 
  Phone, 
  Check, 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  AlertTriangle
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { requests, facultyAction } = useDatabase();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [parentConfirmed, setParentConfirmed] = useState<Record<string, boolean>>({});
  const [callNotes, setCallNotes] = useState<Record<string, string>>({});
  
  // Rejection modal states
  const [rejectingReq, setRejectingReq] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Search & Filter for History
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!profile) return null;

  // Helper to determine if request is overdue (> 3 hours)
  const isRequestOverdue = (createdAt: string) => {
    const diffMs = new Date().getTime() - new Date(createdAt).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 3.0;
  };

  // 1. Pending Action List: status = pending_faculty, assigned to this faculty (or faculty_id matches)
  const pendingRequests = requests.filter(r => 
    r.status === 'pending_faculty' && 
    (r.faculty_id === profile.id || r.student?.assigned_faculty_id === profile.id)
  );

  // Sort: Overdue requests first (FIFO), then non-overdue requests (FIFO)
  const sortedPendingRequests = [...pendingRequests].sort((a, b) => {
    const aOverdue = isRequestOverdue(a.created_at);
    const bOverdue = isRequestOverdue(b.created_at);
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // oldest first
  });

  // 2. History List: requests acted on by this faculty (where faculty_id matches and status != pending_faculty)
  let historyRequests = requests.filter(r => 
    r.faculty_id === profile.id && 
    r.status !== 'pending_faculty'
  );

  // Apply filters to history
  if (historyStatusFilter !== 'all') {
    historyRequests = historyRequests.filter(r => r.status === historyStatusFilter);
  }
  if (historyStartDate) {
    historyRequests = historyRequests.filter(r => r.requested_date >= historyStartDate);
  }
  if (historyEndDate) {
    historyRequests = historyRequests.filter(r => r.requested_date <= historyEndDate);
  }

  // Handle Approve Action
  const handleApprove = async (reqId: string) => {
    if (!parentConfirmed[reqId]) return;
    
    const notes = callNotes[reqId] || 'Parent confirmed via phone call.';
    const result = await facultyAction(reqId, true, notes);

    if (result.success) {
      setToast({ message: 'Request approved and forwarded to HOD.', type: 'success' });
      // Clear states
      setParentConfirmed(prev => ({ ...prev, [reqId]: false }));
      setCallNotes(prev => ({ ...prev, [reqId]: '' }));
    } else {
      setToast({ message: result.error || 'Approval failed', type: 'error' });
    }
  };

  // Open Rejection Dialog
  const openRejectionDialog = (req: LeaveRequest) => {
    setRejectingReq(req);
    setRejectionReason('');
  };

  // Handle Reject Action
  const handleReject = async () => {
    if (!rejectingReq || !rejectionReason.trim()) return;

    const result = await facultyAction(rejectingReq.id, false, rejectionReason);
    if (result.success) {
      setToast({ message: 'Request rejected and student notified.', type: 'success' });
      setRejectingReq(null);
    } else {
      setToast({ message: result.error || 'Rejection failed', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">Welcome, {profile.full_name}</h2>
          <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Dept: <span className="text-slate-600">{profile.department}</span> • Role: <span className="text-slate-600">Faculty Advisor</span>
          </div>
        </div>

        {/* Pending Counter Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl font-semibold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          {pendingRequests.length} Pending Approval{pendingRequests.length !== 1 && 's'}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-bold transition-all relative
            ${activeTab === 'pending' 
              ? 'text-sky-600 font-bold' 
              : 'text-slate-400 hover:text-slate-600'}`}
        >
          Pending Action
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
          {activeTab === 'pending' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold transition-all relative
            ${activeTab === 'history' 
              ? 'text-sky-600 font-bold' 
              : 'text-slate-400 hover:text-slate-600'}`}
        >
          History
          {activeTab === 'history' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
        </button>
      </div>

      {/* View Switch */}
      {activeTab === 'pending' ? (
        <div className="space-y-4">
          {sortedPendingRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">Queue is clear!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">No leave requests currently pending your validation.</p>
            </div>
          ) : (
            sortedPendingRequests.map(req => {
              const overdue = isRequestOverdue(req.created_at);
              return (
                <div 
                  key={req.id} 
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
                    ${overdue ? 'border-red-200 ring-1 ring-red-100/50' : 'border-slate-100'}`}
                >
                  {/* Overdue Banner */}
                  {overdue && (
                    <div className="bg-red-500 text-white px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                      Overdue Request - Slipped past 3-hour limit
                    </div>
                  )}

                  <div className="p-5 md:p-6 space-y-4">
                    {/* Header: Student Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                        {req.student?.photo_url ? (
                          <img src={req.student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                            {req.student?.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{req.student?.full_name}</h4>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          Roll: {req.student?.roll_number} • Dept: {req.student?.department}
                        </p>
                      </div>
                    </div>

                    {/* Body: Leave Details */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Date: <strong className="text-slate-800 font-bold">{req.requested_date}</strong></span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Window: <strong className="text-slate-800 font-bold">{req.time_out} – {req.time_expected_back || 'No Return'}</strong></span>
                      </div>
                      <div className="border-t border-slate-200/60 pt-2 text-xs">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Emergency Category:</span>
                        <span className="ml-1.5 px-2 py-0.5 bg-sky-50 text-sky-700 font-bold rounded capitalize text-[10px]">{req.reason_category}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-normal pt-1">
                        <strong className="text-slate-700 font-bold">Reason details:</strong> "{req.reason}"
                      </p>
                    </div>

                    {/* Action Block: Call & Checkbox */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-4">
                      {/* Left: Parent Phone details */}
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`tel:${req.student?.parent_contact}`}
                          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call Parent ({req.student?.parent_name})
                        </a>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={parentConfirmed[req.id] || false}
                            onChange={e => setParentConfirmed(prev => ({ ...prev, [req.id]: e.target.checked }))}
                            className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                          />
                          Confirmed with parent via phone call
                        </label>
                      </div>

                      {/* Right: Notes text area */}
                      <input
                        type="text"
                        placeholder="Call notes (e.g. Mother confirmed)"
                        value={callNotes[req.id] || ''}
                        onChange={e => setCallNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="flex-1 max-w-xs px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Actions: Approve / Reject */}
                    <div className="flex gap-2 justify-end border-t border-slate-50 pt-4">
                      <button
                        onClick={() => openRejectionDialog(req)}
                        className="px-4 py-2 border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject Request
                      </button>
                      <button
                        disabled={!parentConfirmed[req.id]}
                        onClick={() => handleApprove(req.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Forward to HOD
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* History View */
        <div className="space-y-4">
          {/* History Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end text-xs font-semibold">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400">Status</span>
              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending_hod">Pending HOD</option>
                <option value="approved">Approved</option>
                <option value="rejected_by_faculty">Rejected by Faculty</option>
                <option value="rejected_by_hod">Rejected by HOD</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-slate-400">From Date</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={e => setHistoryStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400">To Date</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={e => setHistoryEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => {
                setHistoryStatusFilter('all');
                setHistoryStartDate('');
                setHistoryEndDate('');
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>

          {/* History Queue Cards */}
          {historyRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">No action records found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">No requests match your current search criteria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Window</th>
                      <th className="px-6 py-3.5">Reason Category</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Your Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {historyRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <span className="font-bold text-slate-800 block">{req.student?.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{req.student?.roll_number}</span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">{req.requested_date}</td>
                        <td className="px-6 py-3.5 text-slate-600">{req.time_out} - {req.time_expected_back || 'No Return'}</td>
                        <td className="px-6 py-3.5 capitalize text-slate-600">{req.reason_category}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={req.status} /></td>
                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={req.faculty_notes || ''}>
                          {req.faculty_notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection Comment Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-slide-in-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Reject Leave Request</h3>
              <button 
                onClick={() => setRejectingReq(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-normal">
                Please provide a rejection reason for <strong className="text-slate-800 font-bold">{rejectingReq.student?.full_name}</strong>'s emergency request. The student will see this note immediately on their dashboard.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Parent did not pick up, or requested window is outside rules."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim()}
                  onClick={handleReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-colors"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
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
