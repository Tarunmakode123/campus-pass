import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Profile, UserRole } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import type { LeaveRequest } from '../context/DatabaseContext';
import { StatusBadge } from '../components/StatusBadge';
import { SVGCharts } from '../components/SVGCharts';
import { Toast } from '../components/Toast';
import { 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Wrench, 
  Download,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { 
    requests, 
    profiles, 
    upsertProfileAdmin, 
    deleteProfileAdmin, 
    adminOverride 
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'analytics'>('users');
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // User Management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userRollNo, setUserRollNo] = useState('');
  const [userDept, setUserDept] = useState('Computer Science');
  const [userParentName, setUserParentName] = useState('');
  const [userParentContact, setUserParentContact] = useState('');
  const [userFacultyId, setUserFacultyId] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState('');

  // Request logs filters
  const [reqSearch, setReqSearch] = useState('');
  const [reqDeptFilter, setReqDeptFilter] = useState('all');
  const [reqStatusFilter, setReqStatusFilter] = useState('all');

  // Override State
  const [overrideReq, setOverrideReq] = useState<LeaveRequest | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<LeaveRequest['status']>('completed');
  const [overrideNotesText, setOverrideNotesText] = useState('');

  if (!profile) return null;

  // Filtered requests for the admin table
  let filteredRequests = [...requests];
  if (reqSearch) {
    const q = reqSearch.toLowerCase();
    filteredRequests = filteredRequests.filter(r => 
      r.student?.full_name.toLowerCase().includes(q) ||
      (r.student?.roll_number && r.student.roll_number.toLowerCase().includes(q)) ||
      (r.pass_id && r.pass_id.toLowerCase().includes(q))
    );
  }
  if (reqDeptFilter !== 'all') {
    filteredRequests = filteredRequests.filter(r => r.student?.department === reqDeptFilter);
  }
  if (reqStatusFilter !== 'all') {
    filteredRequests = filteredRequests.filter(r => r.status === reqStatusFilter);
  }

  // Open Add/Edit User Dialog
  const handleOpenUserModal = (userToEdit?: Profile) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserFullName(userToEdit.full_name);
      setUserRole(userToEdit.role);
      setUserRollNo(userToEdit.roll_number || '');
      setUserDept(userToEdit.department);
      setUserParentName(userToEdit.parent_name || '');
      setUserParentContact(userToEdit.parent_contact || '');
      setUserFacultyId(userToEdit.assigned_faculty_id || '');
      setUserPhotoUrl(userToEdit.photo_url || '');
    } else {
      setEditingUser(null);
      setUserFullName('');
      setUserRole('student');
      setUserRollNo('');
      setUserDept('Computer Science');
      setUserParentName('');
      setUserParentContact('');
      setUserFacultyId('');
      setUserPhotoUrl('');
    }
    setIsUserModalOpen(true);
  };

  // Submit Add/Edit user
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName) return;

    // Generate unique ID if adding, keep existing ID if editing
    const id = editingUser ? editingUser.id : 'user-' + Math.random().toString(36).substr(2, 9);
    
    const profilePayload: Omit<Profile, 'created_at'> = {
      id,
      full_name: userFullName,
      role: userRole,
      roll_number: userRole === 'student' ? userRollNo : undefined,
      department: userDept,
      photo_url: userPhotoUrl || undefined,
      parent_name: userRole === 'student' ? userParentName : undefined,
      parent_contact: userRole === 'student' ? userParentContact : undefined,
      assigned_faculty_id: userRole === 'student' && userFacultyId ? userFacultyId : undefined,
    };

    const result = await upsertProfileAdmin(profilePayload);
    if (result.success) {
      setToast({ message: `User profile ${editingUser ? 'updated' : 'created'} successfully!`, type: 'success' });
      setIsUserModalOpen(false);
    } else {
      setToast({ message: result.error || 'Operation failed', type: 'error' });
    }
  };

  // Delete User Profile
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user profile? This action is irreversible.')) return;
    
    const result = await deleteProfileAdmin(userId);
    if (result.success) {
      setToast({ message: 'User profile deleted successfully.', type: 'success' });
    } else {
      setToast({ message: result.error || 'Failed to delete user', type: 'error' });
    }
  };

  // Submit Manual Override
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReq) return;

    const result = await adminOverride(overrideReq.id, overrideStatus, overrideNotesText || undefined);
    if (result.success) {
      setToast({ message: 'Request status overridden successfully.', type: 'success' });
      setOverrideReq(null);
    } else {
      setToast({ message: result.error || 'Override failed', type: 'error' });
    }
  };

  // Export Request Database to CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      setToast({ message: 'No records available to export.', type: 'error' });
      return;
    }

    const headers = [
      'Request ID', 
      'Pass ID', 
      'Student Name', 
      'Roll Number', 
      'Department', 
      'Leave Category',
      'Leave Date', 
      'Time Out', 
      'Expected Back', 
      'Status', 
      'Faculty Notes', 
      'HOD Notes'
    ];

    const rows = filteredRequests.map(r => [
      r.id,
      r.pass_id || 'N/A',
      r.student?.full_name || 'N/A',
      r.student?.roll_number || 'N/A',
      r.student?.department || 'N/A',
      r.reason_category,
      r.requested_date,
      r.time_out,
      r.time_expected_back || 'Not Returning',
      r.status,
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
    link.setAttribute("download", `Global_GatePass_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'CSV exported successfully!', type: 'success' });
  };

  // Compute Analytics Metrics
  const totalReqs = requests.length;
  const pendingFaculty = requests.filter(r => r.status === 'pending_faculty').length;
  const pendingHod = requests.filter(r => r.status === 'pending_hod').length;
  const totalPending = pendingFaculty + pendingHod;
  
  const rejections = requests.filter(r => ['rejected_by_faculty', 'rejected_by_hod'].includes(r.status)).length;
  const rejectionRate = totalReqs > 0 ? ((rejections / totalReqs) * 100).toFixed(1) : '0.0';

  // Average Approval Time Mock calculations (in hours)
  const avgApprovalTime = totalReqs > 0 ? '1.8' : '0.0';

  return (
    <div className="space-y-6">
      {/* Header and Subtitles */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <h2 className="text-xl font-bold tracking-tight">System Administration Console</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Configure accounts, audit gate registers, and review campus logs.</p>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2
            ${activeTab === 'users' ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users className="w-4 h-4" />
          User Profiles ({profiles.length})
          {activeTab === 'users' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2
            ${activeTab === 'requests' ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Leave Database ({requests.length})
          {activeTab === 'requests' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2
            ${activeTab === 'analytics' ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics Dashboard
          {activeTab === 'analytics' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
        </button>
      </div>

      {/* View router */}
      {activeTab === 'users' && (
        /* User Profiles tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-700 tracking-wide">REGISTERED PROFILES</h3>
            <button
              onClick={() => handleOpenUserModal()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add User Profile
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                    <th className="px-6 py-3.5">Full Name</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Roll No. / Dept</th>
                    <th className="px-6 py-3.5">Linkages (Faculty/Parent)</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {profiles.map(user => {
                    const assignedFaculty = profiles.find(p => p.id === user.assigned_faculty_id);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-500">
                              {user.photo_url ? (
                                <img src={user.photo_url} alt="User" className="w-full h-full object-cover" />
                              ) : (
                                user.full_name.charAt(0)
                              )}
                            </div>
                            <span className="font-bold text-slate-800">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
                            ${user.role === 'hod' ? 'bg-indigo-100 text-indigo-800' : ''}
                            ${user.role === 'faculty' ? 'bg-sky-100 text-sky-800' : ''}
                            ${user.role === 'student' ? 'bg-slate-100 text-slate-800' : ''}
                          `}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {user.role === 'student' ? (
                            <>
                              <span className="font-bold text-slate-700 block">{user.roll_number}</span>
                              <span className="text-[10px] text-slate-400">{user.department}</span>
                            </>
                          ) : (
                            <span className="font-semibold text-slate-700">{user.department}</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {user.role === 'student' ? (
                            <div className="space-y-0.5 text-[10px] text-slate-500">
                              <div>Advisor: <strong className="text-slate-700">{assignedFaculty?.full_name || 'Unassigned'}</strong></div>
                              <div>Parent: <strong className="text-slate-700">{user.parent_name} ({user.parent_contact})</strong></div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                            title="Edit User"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        /* Requests registry log */
        <div className="space-y-4">
          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end text-xs font-semibold">
            <div className="flex-1 min-w-[200px] flex flex-col gap-1">
              <span className="text-slate-400">Search Name/Roll/PassID</span>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or pass ID..."
                  value={reqSearch}
                  onChange={e => setReqSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400">Department</span>
              <select
                value={reqDeptFilter}
                onChange={e => setReqDeptFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400">Status</span>
              <select
                value={reqStatusFilter}
                onChange={e => setReqStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending_faculty">Pending Faculty</option>
                <option value="pending_hod">Pending HOD</option>
                <option value="approved">Approved</option>
                <option value="rejected_by_faculty">Rejected by Faculty</option>
                <option value="rejected_by_hod">Rejected by HOD</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setReqSearch('');
                  setReqDeptFilter('all');
                  setReqStatusFilter('all');
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

          {/* Database log table */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 mb-1">No requests matched search query</h4>
              <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <th className="px-4 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Dept</th>
                      <th className="px-4 py-3.5">Pass ID</th>
                      <th className="px-4 py-3.5">Date / Time</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 block">{req.student?.full_name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{req.student?.roll_number}</span>
                        </td>
                        <td className="px-4 py-3.5">{req.student?.department}</td>
                        <td className="px-4 py-3.5 font-bold font-mono text-indigo-600">{req.pass_id || '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className="block">{req.requested_date}</span>
                          <span className="text-[10px] text-slate-400">{req.time_out} - {req.time_expected_back || 'No return'}</span>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={req.status} /></td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setOverrideReq(req);
                              setOverrideStatus(req.status);
                              setOverrideNotesText('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded inline-flex items-center gap-1 font-bold text-[10px] border border-slate-200"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Override
                          </button>
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

      {activeTab === 'analytics' && (
        /* Analytics Graphs and metrics */
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Submissions</span>
              <span className="text-2xl font-extrabold text-slate-800 block mt-1">{totalReqs}</span>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Actions</span>
              <span className="text-2xl font-extrabold text-amber-600 block mt-1">{totalPending}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Rejection Rate</span>
              <span className="text-2xl font-extrabold text-rose-600 block mt-1">{rejectionRate}%</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg Approval Time</span>
              <span className="text-2xl font-extrabold text-emerald-600 block mt-1">{avgApprovalTime}h</span>
            </div>
          </div>

          {/* SVG Graphs component */}
          <SVGCharts requests={requests} />
        </div>
      )}

      {/* User Management Form Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-slide-in-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">{editingUser ? 'Edit User Profile' : 'Add User Profile'}</h3>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={e => setUserFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">User Role</label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="hod">HOD (Department Head)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                  <select
                    value={userDept}
                    onChange={e => setUserDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Administration">Administration</option>
                    <option value="Security Gate 1">Security Gate 1</option>
                  </select>
                </div>
              </div>

              {/* Conditional fields for Student Role */}
              {userRole === 'student' && (
                <div className="border-t border-slate-100 pt-3 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wide">STUDENT SPECIFIC FIELDS</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Roll Number</label>
                      <input
                        type="text"
                        required={userRole === 'student'}
                        value={userRollNo}
                        onChange={e => setUserRollNo(e.target.value)}
                        placeholder="e.g. CS-2023-042"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Assigned Faculty Advisor</label>
                      <select
                        value={userFacultyId}
                        onChange={e => setUserFacultyId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="">Select Faculty...</option>
                        {profiles.filter(p => p.role === 'faculty').map(fac => (
                          <option key={fac.id} value={fac.id}>{fac.full_name} ({fac.department})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Parent Name</label>
                      <input
                        type="text"
                        required={userRole === 'student'}
                        value={userParentName}
                        onChange={e => setUserParentName(e.target.value)}
                        placeholder="e.g. Suresh Aneja"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Parent Contact Number</label>
                      <input
                        type="text"
                        required={userRole === 'student'}
                        value={userParentContact}
                        onChange={e => setUserParentContact(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Photo URL (Optional)</label>
                <input
                  type="text"
                  value={userPhotoUrl}
                  onChange={e => setUserPhotoUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Override Status Modal */}
      {overrideReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-slide-in-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Manual Leave Override</h3>
              <button 
                onClick={() => setOverrideReq(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 flex items-start gap-2 leading-normal">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Manual Action Alert:</strong> You are overriding request status for student <strong className="text-slate-900 font-bold">{overrideReq.student?.full_name}</strong>. This bypasses the normal approval flow.
                </span>
              </div>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Set Status To</label>
                <select
                  value={overrideStatus}
                  onChange={e => setOverrideStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="pending_faculty">Pending Faculty</option>
                  <option value="pending_hod">Pending HOD</option>
                  <option value="approved">Approved (Generate Pass ID)</option>
                  <option value="rejected_by_faculty">Rejected by Faculty</option>
                  <option value="rejected_by_hod">Rejected by HOD</option>
                  <option value="completed">Completed (Checked In)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Reason for Override (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Student forgot to checkout, manual override"
                  value={overrideNotesText}
                  onChange={e => setOverrideNotesText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideReq(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow transition-colors"
                >
                  Apply Override
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
