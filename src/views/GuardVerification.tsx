import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, LogOut, Clock, AlertTriangle, UserCheck, Calendar } from 'lucide-react';

export const GuardVerification: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const { fetchRequestByQrToken, logQrScan, confirmGuardExit } = useDatabase();

  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justConfirmedExit, setJustConfirmedExit] = useState(false);

  useEffect(() => {
    if (!qrToken) return;

    let isMounted = true;
    const loadPass = async () => {
      setLoading(true);
      setError(null);

      const res = await fetchRequestByQrToken(qrToken);
      if (!isMounted) return;

      if (res.success && res.data) {
        setRequest(res.data);
        // Log scan immediately on page load
        logQrScan(res.data.id);
      } else {
        setError(res.error || 'Invalid or expired QR code token.');
      }
      setLoading(false);
    };

    loadPass();
    return () => { isMounted = false; };
  }, [qrToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Verifying Gate Pass QR Code...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Gate Pass</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'This QR Code does not match any valid student leave pass.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
          >
            Go to Portal Home
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = request.status === 'completed';

  // 1. Success confirmation screen (right after guard taps ALLOW EXIT for the 1st time)
  if (justConfirmedExit) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4">
        {/* Header Branding */}
        <div className="max-w-md w-full flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-t-2xl shadow-md">
          <div className="flex items-center space-x-2">
            <img src="/iist-logo.png" alt="IIST Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xs font-bold tracking-wide uppercase">IIST Security Gate</h1>
              <p className="text-[10px] text-slate-400">Official Gate Exit Confirmation</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-emerald-900/80 px-2.5 py-1 rounded-full border border-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-200">Confirmed</span>
          </div>
        </div>

        {/* Full-Screen Green Success Screen (NO student details below) */}
        <div className="max-w-md w-full bg-white rounded-b-2xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-emerald-800 uppercase tracking-wider">STUDENT DEPARTURE CONFIRMED!</h2>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              The exit timestamp has been permanently recorded in the database. The gate pass is now closed and invalidated for future scans.
            </p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">DEPARTURE TIMESTAMP</span>
            <span className="text-base font-mono font-bold text-emerald-950">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date().toLocaleDateString()})
            </span>
          </div>

          <button
            onClick={() => setJustConfirmedExit(false)}
            className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition shadow-md"
          >
            Close Confirmation View
          </button>
        </div>
      </div>
    );
  }

  // 2. Error Screen on 2nd Scan (or any scan after pass is completed - NO student details below)
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4">
        {/* Header Branding */}
        <div className="max-w-md w-full flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-t-2xl shadow-md">
          <div className="flex items-center space-x-2">
            <img src="/iist-logo.png" alt="IIST Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xs font-bold tracking-wide uppercase">IIST Security Gate</h1>
              <p className="text-[10px] text-slate-400">Pass Verification System</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-rose-900/80 px-2.5 py-1 rounded-full border border-rose-700">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-semibold text-rose-200">Pass Expired</span>
          </div>
        </div>

        {/* Full-Screen Red Error Screen (NO student details below) */}
        <div className="max-w-md w-full bg-white rounded-b-2xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-rose-700 uppercase tracking-wider">PASS ALREADY COMPLETED / EXITED</h2>
            <p className="text-xs text-rose-600 font-medium mt-2 leading-relaxed">
              This gate pass has already been processed at the gate and is permanently expired. It cannot be reused.
            </p>
          </div>

          {request.gate_exit_at && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">PROCESSED EXIT TIMESTAMP</span>
              <span className="text-base font-mono font-bold text-rose-950">
                Exited: {new Date(request.gate_exit_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(request.gate_exit_at).toLocaleDateString()})
              </span>
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition shadow-md"
          >
            Go to Portal Home
          </button>
        </div>
      </div>
    );
  }

  // 3. First Scan (Valid Approved Pass View with Student Details & Allow Exit Button)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [outH, outM] = request.time_out.split(':').map(Number);
  const timeOutMin = outH * 60 + outM;

  let timeBackMin = 17 * 60; // default 5 PM
  if (request.time_expected_back) {
    const [backH, backM] = request.time_expected_back.split(':').map(Number);
    timeBackMin = backH * 60 + backM;
  }

  const isDifferentDate = request.requested_date !== todayStr;
  const isTooEarly = currentMinutes < timeOutMin - 15; // 15 min buffer
  const isTooLate = currentMinutes > timeBackMin + 30; // 30 min buffer
  const isOutOfWindow = isDifferentDate || isTooEarly || isTooLate;

  const handleExitAction = async () => {
    if (submitting) return;
    setSubmitting(true);
    const res = await confirmGuardExit(request.id, isOutOfWindow);
    setSubmitting(false);

    if (res.success) {
      setJustConfirmedExit(true);
      // Refresh request state
      const updated = await fetchRequestByQrToken(qrToken!);
      if (updated.data) setRequest(updated.data);
    } else {
      alert('Error confirming exit: ' + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-4">
      {/* Header Branding */}
      <div className="max-w-md w-full flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-t-2xl shadow-md">
        <div className="flex items-center space-x-2">
          <img src="/iist-logo.png" alt="IIST Logo" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-xs font-bold tracking-wide uppercase">IIST Security Gate</h1>
            <p className="text-[10px] text-slate-400">Official Pass Verification</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-slate-300">Public Scanner</span>
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="max-w-md w-full bg-white rounded-b-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Banner Alert Header */}
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 text-center">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-1.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-emerald-900 uppercase tracking-wider">VALID APPROVED GATE PASS</h2>
          <p className="text-xs text-emerald-700 mt-1">Student is pre-approved for campus departure.</p>
        </div>

        {/* Time Window Warning Banner */}
        {isOutOfWindow && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <span className="font-bold">OUTSIDE TIME WINDOW: </span>
              Approved for {request.requested_date} between {request.time_out} - {request.time_expected_back || 'No Return'}.
            </div>
          </div>
        )}

        {/* Student Details Section */}
        <div className="p-5 space-y-4">
          <div className="flex items-center space-x-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {request.student?.photo_url ? (
              <img src={request.student.photo_url} alt="Student" className="w-16 h-16 rounded-full object-cover border-2 border-sky-600" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl border-2 border-sky-600">
                {request.student?.full_name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900">{request.student?.full_name || 'Student Name'}</h3>
              <p className="text-xs font-semibold text-sky-700">Roll: {request.student?.roll_number || 'N/A'}</p>
              <p className="text-xs text-slate-500">{request.student?.department || 'Department'}</p>
            </div>
          </div>

          {/* Pass Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PASS ID</span>
              <span className="font-mono font-bold text-slate-800">{request.pass_id || 'GP-APPROVED'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CATEGORY</span>
              <span className="font-semibold text-slate-800 capitalize">{request.reason_category}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DATE</span>
              <span className="font-medium text-slate-800 flex items-center space-x-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{request.requested_date}</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIME WINDOW</span>
              <span className="font-medium text-slate-800 flex items-center space-x-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{request.time_out} - {request.time_expected_back || 'N/A'}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">EMERGENCY REASON</span>
            <p className="text-slate-700 italic">"{request.reason}"</p>
          </div>

          {/* Parent Contact Verification */}
          {request.student?.parent_contact && (
            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">PARENT CONTACT</span>
                <span className="font-semibold text-emerald-950">{request.student.parent_name} ({request.student.parent_contact})</span>
              </div>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
          )}

          {/* Direct Gate Action Buttons */}
          <div className="pt-2">
            <button
              onClick={handleExitAction}
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg transition disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{submitting ? 'Processing Exit...' : 'ALLOW EXIT & CONFIRM DEPARTURE'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
