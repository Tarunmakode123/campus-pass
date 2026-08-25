import React from 'react';
import type { LeaveRequest } from '../context/DatabaseContext';

interface StatusBadgeProps {
  status: LeaveRequest['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let text = '';
  let colorClass = '';

  switch (status) {
    case 'pending_faculty':
      text = 'Pending Faculty';
      colorClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      break;
    case 'pending_hod':
      text = 'Pending HOD';
      colorClass = 'bg-orange-100 text-orange-800 border border-orange-200';
      break;
    case 'approved':
      text = 'Approved';
      colorClass = 'bg-green-100 text-green-800 border border-green-200';
      break;
    case 'rejected_by_faculty':
      text = 'Rejected by Faculty';
      colorClass = 'bg-red-100 text-red-800 border border-red-200';
      break;
    case 'rejected_by_hod':
      text = 'Rejected by HOD';
      colorClass = 'bg-red-100 text-red-800 border border-red-200';
      break;
    case 'expired':
      text = 'Expired';
      colorClass = 'bg-gray-100 text-gray-800 border border-gray-200';
      break;
    case 'completed':
      text = 'Completed';
      colorClass = 'bg-blue-100 text-blue-800 border border-blue-200';
      break;
    default:
      text = status;
      colorClass = 'bg-slate-100 text-slate-800 border border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${colorClass}`}>
      {text}
    </span>
  );
};
