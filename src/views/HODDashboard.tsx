import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { 
  Check, 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  Download,
  AlertTriangle,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export const HODDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { requests, hodAction } = useDatabase();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [hodNotes, setHodNotes] = useState<Record<string, string>>({});
  
  // Rejection Dialog states
  const [rejectingReq, setRejectingReq] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // History filters
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!profile) return null;

  // Helper to check if request is overdue (> 3 hours)
  const isRequestOverdue = (createdAt: string) => {
    const diffMs = new Date().getTime() - new Date(createdAt).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 3.0;
  };

  // 1. Pending Queue: status = pending_hod AND student's department matches HOD's department
  const pendingRequests = requests.filter(r => 
    r.status === 'pending_hod' && 
    r.student?.department === profile.department
  );

  // Sort FIFO (overdue first)
  const sortedPendingRequests = [...pendingRequests].sort((a, b) => {
    const aOverdue = isRequestOverdue(a.created_at);
    const bOverdue = isRequestOverdue(b.created_at);
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // oldest first
  });

  // 2. Today's Approved Passes: status = approved/completed, date = today, department matches
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApprovedRequests = requests.filter(r => 
    ['approved', 'completed'].includes(r.status) && 
    r.requested_date === todayStr &&
    r.student?.department === profile.department
  );

  // 3. History: acted on by HOD or matching department in past statuses (excluding pending_faculty, pending_hod)
  let historyRequests = requests.filter(r => 
    r.student?.department === profile.department && 
    !['pending_faculty', 'pending_hod'].includes(r.status)
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

  // Handle Approve
  const handleApprove = async (reqId: string) => {
    const notes = hodNotes[reqId] || 'Approved by HOD.';
    const result = await hodAction(reqId, true, notes);

    if (result.success) {
      setToast({ message: 'Request approved. Gate pass generated successfully!', type: 'success' });
      setHodNotes(prev => ({ ...prev, [reqId]: '' }));
    } else {
      setToast({ message: result.error || 'Approval failed', type: 'error' });
    }
  };

  // Open Rejection Dialog
  const openRejectionDialog = (req: LeaveRequest) => {
    setRejectingReq(req);
    setRejectionReason('');
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectingReq || !rejectionReason.trim()) return;

    const result = await hodAction(rejectingReq.id, false, rejectionReason);
    if (result.success) {
      setToast({ message: 'Request rejected and student notified.', type: 'success' });
      setRejectingReq(null);
    } else {
      setToast({ message: result.error || 'Rejection failed', type: 'error' });
    }
  };

  // CSV Export implementation
  const handleExportCSV = () => {
    if (historyRequests.length === 0) {
      setToast({ message: 'No records available to export.', type: 'error' });
      return;
    }

    const headers = [
      'Pass ID', 
      'Student Name', 
      'Roll Number', 
      'Reason Category', 
      'Reason Details',
      'Leave Date', 
      'Time Out', 
      'Expected Back', 
      'Status', 
      'Faculty Confirmed', 
      'Faculty Notes', 
      'HOD Notes'
    ];

    const rows = historyRequests.map(r => [
      r.pass_id || 'N/A',
      r.student?.full_name || 'N/A',
      r.student?.roll_number || 'N/A',
      r.reason_category,
      r.reason,
      r.requested_date,
      r.time_out,
      r.time_expected_back || 'Not Returning',
      r.status,
      r.faculty_confirmed_parent ? 'YES' : 'NO',
      r.faculty_notes || '',
      r.hod_notes || ''
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `HOD_History_${profile.department.replace(/\s+/g, '_')}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'CSV exported successfully!', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">Department of {profile.department}</h2>
          <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Head of Department: <span className="text-slate-600">{profile.full_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl font-semibold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          {pendingRequests.length} Pending Approval{pendingRequests.length !== 1 && 's'}
        </div>
      </div>

      {/* Primary Grid Layout (Dashboard Queue / sidebar info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Main Queue or History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-slate-200 flex space-x-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-bold transition-all relative
                ${activeTab === 'pending' ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending Approvals ({pendingRequests.length})
              {activeTab === 'pending' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold transition-all relative
                ${activeTab === 'history' ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              History Archive
              {activeTab === 'history' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
            </button>
          </div>

          {activeTab === 'pending' ? (
            /* Queue Section */
            <div className="space-y-4">
              {sortedPendingRequests.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Approvals Queue is empty!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">All emergency requests for your department have been resolved.</p>
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
                      {overdue && (
                        <div className="bg-red-500 text-white px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                          Overdue request - Slipped past 3-hour limit
                        </div>
                      )}

                      <div className="p-5 md:p-6 space-y-4">
                        {/* Student Details Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                            {req.student?.photo_url ? (
                              <img src={req.student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                                {req.student?.full_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-tight">{req.student?.full_name}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Roll: {req.student?.roll_number}</p>
                          </div>
                        </div>

                        {/* Leave details & Reason */}
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                          <div className="grid grid-cols-2 gap-2 font-semibold text-slate-600">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Date: <strong className="text-slate-800 font-bold">{req.requested_date}</strong></span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Window: <strong className="text-slate-800 font-bold">{req.time_out} – {req.time_expected_back || 'No Return'}</strong></span>
                          </div>
                          <div className="border-t border-slate-200/60 pt-2">
                            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Reason:</span>
                            <span className="ml-1.5 px-2 py-0.5 bg-sky-50 text-sky-700 font-bold rounded capitalize text-[10px]">{req.reason_category}</span>
                            <p className="text-slate-600 leading-normal mt-1 italic">"{req.reason}"</p>
                          </div>
                        </div>

                        {/* Faculty confirmation stats */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-2.5">
                          <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="text-[11px] leading-normal text-emerald-800 font-semibold">
                            <span>Faculty Advisor Approval: Verified</span>
                            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              Advisor <strong className="font-bold">{req.faculty?.full_name}</strong> confirmed parent call. Notes: "{req.faculty_notes || 'Confirmed with parent.'}"
                            </p>
                          </div>
                        </div>

                        {/* HOD Actions / notes */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-4">
                          <input
                            type="text"
                            placeholder="Add HOD notes (optional)"
                            value={hodNotes[req.id] || ''}
                            onChange={e => setHodNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={() => openRejectionDialog(req)}
                              className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve & Sign Pass
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* History Section */
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

                <div className="flex gap-2">
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
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* History Table */}
              {historyRequests.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">No action records found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">No leave requests match your search filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                          <th className="px-4 py-3.5">Student</th>
                          <th className="px-4 py-3.5">Date</th>
                          <th className="px-4 py-3.5">Window</th>
                          <th className="px-4 py-3.5">Pass ID</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5">Action Log Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {historyRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-slate-800 block">{req.student?.full_name}</span>
                              <span className="text-[9px] text-slate-400 font-semibold">{req.student?.roll_number}</span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">{req.requested_date}</td>
                            <td className="px-4 py-3.5 text-slate-600">{req.time_out} - {req.time_expected_back || 'No Return'}</td>
                            <td className="px-4 py-3.5 text-indigo-600 font-bold font-mono">{req.pass_id || '—'}</td>
                            <td className="px-4 py-3.5"><StatusBadge status={req.status} /></td>
                            <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate" title={req.hod_notes || ''}>
                              {req.hod_notes || '—'}
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
        </div>

        {/* Right 1 Column: Today's Approved Passes Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">TODAY'S APPROVED PASSES</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Date: {todayStr}</p>
          </div>

          <div className="space-y-3 h-96 overflow-y-auto pr-1">
            {todayApprovedRequests.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12 leading-relaxed">
                No active passes approved for today yet.
              </div>
            ) : (
              todayApprovedRequests.map(req => (
                <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors space-y-1 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 block truncate max-w-[120px]">{req.student?.full_name}</span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">{req.pass_id}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">Roll: {req.student?.roll_number}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span className="flex items-center gap-0.5 font-semibold"><Clock className="w-3 h-3" /> {req.time_out} - {req.time_expected_back || 'No Return'}</span>
                    <span className={`font-bold uppercase text-[9px] ${req.status === 'completed' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                      {req.status === 'completed' ? 'Completed' : 'Approved'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HOD Rejection Reason Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-slide-in-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Reject Leave Request</h3>
              <button 
                onClick={() => setRejectingReq(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold overflow-y-auto flex-1">
              <p className="text-slate-500 font-medium leading-normal">
                Explain HOD rejection reasons for student <strong className="text-slate-800 font-bold">{rejectingReq.student?.full_name}</strong>. Student will be notified.
              </p>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Rejection Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Provide comments for rejection..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim()}
                  onClick={handleReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg shadow transition-colors"
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
