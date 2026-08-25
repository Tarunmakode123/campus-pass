import React from 'react';
import { Check, X } from 'lucide-react';
import type { LeaveRequest } from '../context/DatabaseContext';

interface StepperProps {
  request: LeaveRequest;
}

export const Stepper: React.FC<StepperProps> = ({ request }) => {
  const { status, pass_id, gate_exit_at, gate_reentry_at } = request;

  // Define steps
  const steps = [
    { label: 'Submitted', key: 'submitted' },
    { label: 'Faculty Confirmed', key: 'faculty' },
    { label: 'HOD Approved', key: 'hod' },
    { label: 'Pass Generated', key: 'pass' },
    { label: 'Gate Verified', key: 'gate' }
  ];

  // Helper to determine step status
  const getStepStatus = (stepKey: string) => {
    const isRejectedByFaculty = status === 'rejected_by_faculty';
    const isRejectedByHOD = status === 'rejected_by_hod';

    if (stepKey === 'submitted') {
      if (isRejectedByFaculty) return 'rejected';
      return 'completed';
    }

    if (stepKey === 'faculty') {
      if (isRejectedByFaculty) return 'inactive';
      if (isRejectedByHOD) return 'rejected';
      const completedStates = ['pending_hod', 'approved', 'completed'];
      if (completedStates.includes(status)) return 'completed';
      return 'active';
    }

    if (stepKey === 'hod') {
      if (isRejectedByFaculty || isRejectedByHOD) return 'inactive';
      const completedStates = ['approved', 'completed'];
      if (completedStates.includes(status)) return 'completed';
      if (status === 'pending_hod') return 'active';
      return 'inactive';
    }

    if (stepKey === 'pass') {
      if (isRejectedByFaculty || isRejectedByHOD) return 'inactive';
      if (pass_id && ['approved', 'completed'].includes(status)) return 'completed';
      if (status === 'approved' && !pass_id) return 'active';
      return 'inactive';
    }

    if (stepKey === 'gate') {
      if (isRejectedByFaculty || isRejectedByHOD) return 'inactive';
      if (status === 'completed' || gate_reentry_at || gate_exit_at) return 'completed';
      if (status === 'approved' && pass_id && !gate_exit_at) return 'active';
      return 'inactive';
    }

    return 'inactive';
  };

  return (
    <div className="w-full py-4">
      {/* Small screens: Vertical stepper */}
      <div className="md:hidden space-y-4">
        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold
                ${stepStatus === 'completed' ? 'bg-green-600 border-green-600 text-white' : ''}
                ${stepStatus === 'active' ? 'bg-sky-100 border-sky-600 text-sky-700 animate-pulse' : ''}
                ${stepStatus === 'rejected' ? 'bg-red-600 border-red-600 text-white' : ''}
                ${stepStatus === 'inactive' ? 'bg-white border-slate-200 text-slate-400' : ''}
              `}>
                {stepStatus === 'completed' && <Check className="w-4 h-4" />}
                {stepStatus === 'rejected' && <X className="w-4 h-4" />}
                {stepStatus !== 'completed' && stepStatus !== 'rejected' && idx + 1}
              </div>
              <span className={`text-sm font-medium
                ${stepStatus === 'completed' ? 'text-slate-800' : ''}
                ${stepStatus === 'active' ? 'text-sky-700 font-bold' : ''}
                ${stepStatus === 'rejected' ? 'text-red-600 font-bold' : ''}
                ${stepStatus === 'inactive' ? 'text-slate-400' : ''}
              `}>
                {step.label}
                {stepStatus === 'rejected' && ' (Rejected)'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Larger screens: Horizontal stepper */}
      <div className="hidden md:flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(step.key);
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 relative">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold z-10
                  ${stepStatus === 'completed' ? 'bg-green-600 border-green-600 text-white' : ''}
                  ${stepStatus === 'active' ? 'bg-sky-100 border-sky-600 text-sky-700 animate-pulse' : ''}
                  ${stepStatus === 'rejected' ? 'bg-red-600 border-red-600 text-white' : ''}
                  ${stepStatus === 'inactive' ? 'bg-white border-slate-200 text-slate-400' : ''}
                `}>
                  {stepStatus === 'completed' && <Check className="w-5 h-5" />}
                  {stepStatus === 'rejected' && <X className="w-5 h-5" />}
                  {stepStatus !== 'completed' && stepStatus !== 'rejected' && idx + 1}
                </div>
                <span className={`text-xs font-semibold mt-2 text-center absolute -bottom-6 w-32
                  ${stepStatus === 'completed' ? 'text-slate-700' : ''}
                  ${stepStatus === 'active' ? 'text-sky-700 font-bold' : ''}
                  ${stepStatus === 'rejected' ? 'text-red-600 font-bold' : ''}
                  ${stepStatus === 'inactive' ? 'text-slate-400' : ''}
                `}>
                  {step.label}
                  {stepStatus === 'rejected' && ' (Rejected)'}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 -mx-4
                  ${getStepStatus(steps[idx + 1].key) === 'completed' || getStepStatus(steps[idx + 1].key) === 'rejected'
                    ? 'bg-green-600' 
                    : getStepStatus(step.key) === 'completed' && getStepStatus(steps[idx + 1].key) === 'active'
                    ? 'bg-sky-400'
                    : 'bg-slate-200'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="h-6 md:h-8" /> {/* Spacer for absolute horizontal labels */}
    </div>
  );
};
