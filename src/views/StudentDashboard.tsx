import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { StatusBadge } from '../components/StatusBadge';
import { Stepper } from '../components/Stepper';
import { generateGatePassPDF } from '../components/PDFGenerator';
import { Toast } from '../components/Toast';
import { 
  FileText, 
  Plus, 
  Download, 
  Calendar, 
  Clock, 
  AlertCircle,
  Info
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { profile, isDemoMode } = useAuth();
  const { requests, createRequest, uploadPassPDF } = useDatabase();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<'medical' | 'family emergency' | 'personal' | 'other'>('medical');
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeOut, setTimeOut] = useState('10:00');
  const [notReturningToday, setNotReturningToday] = useState(false);
  const [timeExpectedBack, setTimeExpectedBack] = useState('17:00');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!profile) return null;

  // Date and Time validations
  const todayStr = new Date().toISOString().split('T')[0];

  const handleTimeOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeOut(e.target.value);
  };

  const isFormValid = () => {
    if (reason.trim().length < 3) return false;
    if (requestedDate < todayStr) return false;
    
    // Check if time is between 10:00 AM and 5:00 PM (10:00 - 17:00)
    const [hours, minutes] = timeOut.split(':').map(Number);
    const timeVal = hours + minutes / 60;
    if (timeVal < 10.0 || timeVal > 17.0) return false;

    if (!notReturningToday) {
      if (!timeExpectedBack) return false;
      const [backHours, backMinutes] = timeExpectedBack.split(':').map(Number);
      const backVal = backHours + backMinutes / 60;
      if (backVal <= timeVal) return false; // must return after exit
    }

    return true;
  };

  const handleOpenRequestModal = () => {
    const hasActive = requests.some(r => 
      ['pending_faculty', 'pending_hod'].includes(r.status)
    );
    if (hasActive) {
      setToast({ message: 'You cannot submit a request. You already have an active pass or request.', type: 'error' });
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);
    const result = await createRequest({
      student_id: profile.id,
      reason,
      reason_category: category,
      requested_date: requestedDate,
      time_out: timeOut,
      time_expected_back: notReturningToday ? null : timeExpectedBack
    });
    setIsSubmitting(false);

    if (result.success) {
      setToast({ message: 'Emergency leave request submitted successfully!', type: 'success' });
      setIsOpen(false);
      // Reset Form
      setReason('');
      setCategory('medical');
      setRequestedDate(todayStr);
      setTimeOut('10:00');
      setTimeExpectedBack('17:00');
      setNotReturningToday(false);
    } else {
      setToast({ message: result.error || 'Submission failed', type: 'error' });
    }
  };

  // View / Download PDF handler
  const handlePdfAction = async (req: LeaveRequest, download: boolean) => {
    if (isPdfGenerating) return;
    
    try {
      setIsPdfGenerating(req.id);
      let pdfUrl = req.pass_pdf_url;

      // In mock/demo mode, blob URLs expire upon reload. Force regeneration every time.
      const isBlobUrl = pdfUrl && pdfUrl.startsWith('blob:');
      if (!pdfUrl || isBlobUrl || isDemoMode) {
        // Generate PDF on the fly
        const pdfBlob = await generateGatePassPDF(req);
        if (isDemoMode) {
          const localUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = localUrl;
          link.download = `GatePass_${req.pass_id || req.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(localUrl), 1000); // delay revocation to prevent Chrome download failures
          setIsPdfGenerating(null);
          return;
        }

        const uploadResult = await uploadPassPDF(req.id, pdfBlob);
        if (uploadResult.success) {
          pdfUrl = uploadResult.publicUrl;
        } else {
          setToast({ message: 'Failed to upload generated PDF pass.', type: 'error' });
          setIsPdfGenerating(null);
          return;
        }
      }

      if (pdfUrl) {
        if (download) {
          // Trigger download
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `GatePass_${req.pass_id || req.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Open new tab
          window.open(pdfUrl, '_blank');
        }
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Failed to generate PDF pass.', type: 'error' });
    } finally {
      setIsPdfGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Profile Info Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 font-bold border border-sky-100 overflow-hidden">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile.full_name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">{profile.full_name}</h2>
            <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              Roll No: <span className="text-slate-600">{profile.roll_number || 'N/A'}</span> • Dept: <span className="text-slate-600">{profile.department}</span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleOpenRequestModal}
            className="w-full md:w-auto px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Request Emergency Leave
          </button>
        </div>
      </div>

      {/* Requests Timeline */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-700 tracking-wide">MY LEAVE REQUESTS</h3>

        {requests.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">No requests submitted yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">If you need to leave campus during emergency hours (10:00 AM - 5:00 PM), submit a new request above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              const isApproved = req.status === 'approved';
              const isCompleted = req.status === 'completed';
              const isRejected = ['rejected_by_faculty', 'rejected_by_hod'].includes(req.status);
              
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 md:p-6 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <StatusBadge status={req.status} />
                          <span className="text-xs font-semibold text-slate-400">Submitted {new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 capitalize mt-2">
                          Category: {req.reason_category}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">{req.reason}</p>
                      </div>

                      {/* PDF actions for approved and completed passes */}
                      {(isApproved || isCompleted) && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handlePdfAction(req, true)}
                            disabled={isPdfGenerating === req.id}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            {isPdfGenerating === req.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Download PDF
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Horizontal Progress Stepper */}
                    <div className="mt-6 border-t border-slate-50 pt-6">
                      <Stepper request={req} />
                    </div>
                  </div>

                  {/* Footer message if rejected */}
                  {isRejected && (
                    <div className="bg-rose-50 px-5 py-3.5 border-t border-rose-100 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-rose-800">
                          Leave request was rejected by {req.status === 'rejected_by_faculty' ? 'Faculty' : 'HOD'}.
                        </span>
                        <p className="text-xs text-rose-600 mt-0.5">
                          Reason: <span className="font-semibold">"{req.status === 'rejected_by_faculty' ? req.faculty_notes : req.hod_notes || 'No comments provided'}"</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Footer message if approved showing timings */}
                  {isApproved && (
                    <div className="bg-emerald-50/50 px-5 py-3 border-t border-emerald-100/50 flex flex-wrap justify-between items-center text-xs text-emerald-800 font-medium gap-2">
                      <span>Gate Pass ID: <strong className="font-bold">{req.pass_id}</strong></span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Window: {req.time_out} to {req.time_expected_back || 'No return required'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Emergency Leave Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-slide-in-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Request Emergency Leave</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Reason Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
                >
                  <option value="medical">Medical / Health Issue</option>
                  <option value="family emergency">Family Emergency</option>
                  <option value="personal">Personal Reason</option>
                  <option value="other">Other Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Emergency Details (Min 3 characters)</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why you need to leave the campus..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none"
                />
                <span className={`text-[10px] font-semibold ${reason.trim().length < 3 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {reason.trim().length}/3 chars minimum {reason.trim().length < 3 ? '(too short)' : '✓'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Departure Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={requestedDate}
                      onChange={e => setRequestedDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Time Out (10 AM - 5 PM)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      required
                      min="10:00"
                      max="17:00"
                      value={timeOut}
                      onChange={handleTimeOutChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="noReturn"
                    checked={notReturningToday}
                    onChange={e => setNotReturningToday(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                  />
                  <label htmlFor="noReturn" className="text-xs font-bold text-slate-600 select-none">Not returning today</label>
                </div>

                {!notReturningToday && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Expected Return Time (Must be after departure)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        required={!notReturningToday}
                        value={timeExpectedBack}
                        onChange={e => setTimeExpectedBack(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Registered Parent Contact details - Read-only */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] leading-normal text-slate-500 font-medium">
                  <strong>Registered Parent Contact:</strong> {profile.parent_name || 'N/A'} — <span className="font-semibold text-slate-700">{profile.parent_contact || 'N/A'}</span>
                  <p className="mt-1 text-[10px] text-slate-400">If this contact is incorrect or outdated, please contact the administrator before submitting.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
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
