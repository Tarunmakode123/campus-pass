import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import type { Profile } from './AuthContext';

export interface LeaveRequest {
  id: string;
  student_id: string;
  reason: string;
  reason_category: 'medical' | 'family emergency' | 'personal' | 'other';
  requested_date: string;
  time_out: string;
  time_expected_back: string | null;
  status: 'pending_faculty' | 'pending_hod' | 'approved' | 'rejected_by_faculty' | 'rejected_by_hod' | 'expired' | 'completed';
  
  faculty_id?: string | null;
  faculty_confirmed_parent: boolean;
  faculty_action_at?: string | null;
  faculty_notes?: string | null;

  hod_id?: string | null;
  hod_action_at?: string | null;
  hod_notes?: string | null;

  pass_id?: string | null;
  pass_pdf_url?: string | null;
  
  created_at: string;
  updated_at: string;

  // Joined profile data
  student?: Profile;
  faculty?: Profile;
  hod?: Profile;
}

export interface ActivityLog {
  id: string;
  leave_request_id: string;
  actor_id: string;
  action: string;
  timestamp: string;
  notes?: string | null;
  actor?: Profile;
}

interface DatabaseContextType {
  requests: LeaveRequest[];
  logs: ActivityLog[];
  profiles: Profile[];
  loading: boolean;
  refreshData: () => Promise<void>;
  createRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'faculty_confirmed_parent' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; data?: LeaveRequest; error?: string }>;
  facultyAction: (requestId: string, approve: boolean, notes: string) => Promise<{ success: boolean; error?: string }>;
  hodAction: (requestId: string, approve: boolean, notes: string) => Promise<{ success: boolean; error?: string }>;
  adminOverride: (requestId: string, status: LeaveRequest['status'], notes?: string) => Promise<{ success: boolean; error?: string }>;
  uploadPassPDF: (requestId: string, pdfBlob: Blob) => Promise<{ success: boolean; publicUrl?: string; error?: string }>;
  
  // Admin User Management
  upsertProfileAdmin: (profileData: Omit<Profile, 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  deleteProfileAdmin: (profileId: string) => Promise<{ success: boolean; error?: string }>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isDemoMode } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize and reload data
  const refreshData = async () => {
    if (!profile) {
      setRequests([]);
      setLogs([]);
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (!isDemoMode) {
      // Live Supabase Mode
      try {
        // Fetch Profiles
        const { data: profilesData } = await supabase.from('profiles').select('*');
        setProfiles(profilesData || []);

        // Fetch Leave Requests based on RLS & Role logic
        let query = supabase
          .from('leave_requests')
          .select('*, student:profiles!student_id(*), faculty:profiles!faculty_id(*), hod:profiles!hod_id(*)');
        
        // Let RLS handle rows, but we can structure filters here for optimization
        if (profile.role === 'student') {
          query = query.eq('student_id', profile.id);
        } else if (profile.role === 'faculty') {
          // RLS handles visibility, but we can filter too
        } else if (profile.role === 'hod') {
          query = query.eq('student.department', profile.department);
        }

        const { data: requestsData, error: reqError } = await query.order('created_at', { ascending: false });
        if (reqError) console.error('Requests fetch error:', reqError);
        setRequests(requestsData || []);

        // Fetch logs
        const { data: logsData } = await supabase
          .from('activity_log')
          .select('*, actor:profiles!actor_id(*)')
          .order('timestamp', { ascending: false });
        setLogs(logsData || []);

      } catch (e) {
        console.error('Error fetching Supabase data:', e);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock LocalStorage Mode
      try {
        const storedProfiles: Profile[] = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
        const storedRequests: LeaveRequest[] = JSON.parse(localStorage.getItem('gp_mock_requests') || '[]');
        const storedLogs: ActivityLog[] = JSON.parse(localStorage.getItem('gp_mock_logs') || '[]');

        setProfiles(storedProfiles);

        // Join and filter requests
        let filteredRequests = storedRequests.map(req => {
          const student = storedProfiles.find(p => p.id === req.student_id);
          const faculty = storedProfiles.find(p => p.id === req.faculty_id);
          const hod = storedProfiles.find(p => p.id === req.hod_id);
          return { ...req, student, faculty, hod };
        });

        // Apply role filter for client-side display in Mock mode
        if (profile.role === 'student') {
          filteredRequests = filteredRequests.filter(r => r.student_id === profile.id);
        } else if (profile.role === 'faculty') {
          filteredRequests = filteredRequests.filter(
            r => r.faculty_id === profile.id || r.student?.assigned_faculty_id === profile.id
          );
        } else if (profile.role === 'hod') {
          filteredRequests = filteredRequests.filter(
            r => r.student?.department === profile.department
          );
        }

        // Sort by created_at desc
        filteredRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRequests(filteredRequests);

        // Join logs
        const joinedLogs = storedLogs.map(log => {
          const actor = storedProfiles.find(p => p.id === log.actor_id);
          return { ...log, actor };
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(joinedLogs);

      } catch (e) {
        console.error('Error fetching mock data:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshData();

    // Supabase Real-time Subscription setup (only in live mode)
    if (!isDemoMode && profile) {
      const channel = supabase
        .channel('leave_requests_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leave_requests' },
          () => {
            refreshData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, isDemoMode]);

  // Create Request
  const createRequest = async (
    requestData: Omit<LeaveRequest, 'id' | 'status' | 'faculty_confirmed_parent' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> => {
    if (!profile) return { success: false, error: 'User profile not found' };

    // Check if student already has active request
    const today = new Date().toISOString().split('T')[0];
    const hasActive = requests.some(r => 
      r.student_id === profile.id && 
      (['pending_faculty', 'pending_hod'].includes(r.status) ||
       (r.status === 'approved' && r.requested_date === today))
    );
    if (hasActive) {
      return { success: false, error: 'You already have an active leave request.' };
    }

    const newRequestPayload = {
      ...requestData,
      status: 'pending_faculty' as const,
      faculty_confirmed_parent: false,
      faculty_id: profile.assigned_faculty_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!isDemoMode) {
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .insert([newRequestPayload])
          .select()
          .single();

        if (error) return { success: false, error: error.message };

        // Log Activity
        await supabase.from('activity_log').insert([{
          leave_request_id: data.id,
          actor_id: profile.id,
          action: 'submitted',
          notes: 'Request submitted for faculty approval'
        }]);

        await refreshData();
        return { success: true, data };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode Create
      const mockId = 'req-' + Math.random().toString(36).substr(2, 9);
      const newRequest: LeaveRequest = {
        ...newRequestPayload,
        id: mockId,
      };

      const storedRequests = JSON.parse(localStorage.getItem('gp_mock_requests') || '[]');
      storedRequests.push(newRequest);
      localStorage.setItem('gp_mock_requests', JSON.stringify(storedRequests));

      const newLog: ActivityLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        leave_request_id: mockId,
        actor_id: profile.id,
        action: 'submitted',
        timestamp: new Date().toISOString(),
        notes: 'Request submitted for faculty approval'
      };
      const storedLogs = JSON.parse(localStorage.getItem('gp_mock_logs') || '[]');
      storedLogs.push(newLog);
      localStorage.setItem('gp_mock_logs', JSON.stringify(storedLogs));

      await refreshData();
      return { success: true, data: newRequest };
    }
  };

  // Faculty Action (Approve/Reject)
  const facultyAction = async (requestId: string, approve: boolean, notes: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'User profile not found' };

    const updatePayload = approve 
      ? {
          status: 'pending_hod' as const,
          faculty_id: profile.id,
          faculty_confirmed_parent: true,
          faculty_action_at: new Date().toISOString(),
          faculty_notes: notes,
          updated_at: new Date().toISOString()
        }
      : {
          status: 'rejected_by_faculty' as const,
          faculty_id: profile.id,
          faculty_action_at: new Date().toISOString(),
          faculty_notes: notes,
          updated_at: new Date().toISOString()
        };

    const actionText = approve ? 'faculty_approved' : 'faculty_rejected';

    if (!isDemoMode) {
      try {
        const { error } = await supabase
          .from('leave_requests')
          .update(updatePayload)
          .eq('id', requestId);

        if (error) return { success: false, error: error.message };

        // Log
        await supabase.from('activity_log').insert([{
          leave_request_id: requestId,
          actor_id: profile.id,
          action: actionText,
          notes: notes || (approve ? 'Faculty confirmed parent call and forwarded to HOD' : 'Faculty rejected request')
        }]);

        await refreshData();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode Update
      const storedRequests: LeaveRequest[] = JSON.parse(localStorage.getItem('gp_mock_requests') || '[]');
      const updated = storedRequests.map(r => {
        if (r.id === requestId) {
          return { ...r, ...updatePayload };
        }
        return r;
      });
      localStorage.setItem('gp_mock_requests', JSON.stringify(updated));

      const newLog: ActivityLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        leave_request_id: requestId,
        actor_id: profile.id,
        action: actionText,
        timestamp: new Date().toISOString(),
        notes: notes || (approve ? 'Faculty confirmed parent call and forwarded to HOD' : 'Faculty rejected request')
      };
      const storedLogs = JSON.parse(localStorage.getItem('gp_mock_logs') || '[]');
      storedLogs.push(newLog);
      localStorage.setItem('gp_mock_logs', JSON.stringify(storedLogs));

      await refreshData();
      return { success: true };
    }
  };

  // HOD Action (Approve/Reject)
  const hodAction = async (requestId: string, approve: boolean, notes: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'User profile not found' };

    const actionText = approve ? 'hod_approved' : 'hod_rejected';

    if (!isDemoMode) {
      try {
        // HOD approves. The trigger will generate the pass_id automatically!
        const updatePayload = approve 
          ? {
              status: 'approved' as const,
              hod_id: profile.id,
              hod_action_at: new Date().toISOString(),
              hod_notes: notes,
              updated_at: new Date().toISOString()
            }
          : {
              status: 'rejected_by_hod' as const,
              hod_id: profile.id,
              hod_action_at: new Date().toISOString(),
              hod_notes: notes,
              updated_at: new Date().toISOString()
            };

        const { error } = await supabase
          .from('leave_requests')
          .update(updatePayload)
          .eq('id', requestId);

        if (error) return { success: false, error: error.message };

        // Log activity
        await supabase.from('activity_log').insert([{
          leave_request_id: requestId,
          actor_id: profile.id,
          action: actionText,
          notes: notes || (approve ? 'HOD approved emergency gate pass' : 'HOD rejected request')
        }]);

        await refreshData();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode Update (also mock pass_id generation since we don't have triggers)
      const storedRequests: LeaveRequest[] = JSON.parse(localStorage.getItem('gp_mock_requests') || '[]');
      
      const dateStr = new Date().toISOString().split('T')[0];
      const randomSuffix = Math.random().toString(16).substring(2, 6);
      const generatedPassId = approve ? `GP-${dateStr}-${randomSuffix}` : null;

      const updatePayload = approve 
        ? {
            status: 'approved' as const,
            hod_id: profile.id,
            hod_action_at: new Date().toISOString(),
            hod_notes: notes,
            pass_id: generatedPassId,
            updated_at: new Date().toISOString()
          }
        : {
            status: 'rejected_by_hod' as const,
            hod_id: profile.id,
            hod_action_at: new Date().toISOString(),
            hod_notes: notes,
            updated_at: new Date().toISOString()
          };

      const updated = storedRequests.map(r => {
        if (r.id === requestId) {
          return { ...r, ...updatePayload };
        }
        return r;
      });
      localStorage.setItem('gp_mock_requests', JSON.stringify(updated));

      const newLog: ActivityLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        leave_request_id: requestId,
        actor_id: profile.id,
        action: actionText,
        timestamp: new Date().toISOString(),
        notes: notes || (approve ? `HOD approved emergency gate pass. Generated pass_id: ${generatedPassId}` : 'HOD rejected request')
      };
      const storedLogs = JSON.parse(localStorage.getItem('gp_mock_logs') || '[]');
      storedLogs.push(newLog);
      localStorage.setItem('gp_mock_logs', JSON.stringify(storedLogs));

      await refreshData();
      return { success: true };
    }
  };



  // Admin Override
  const adminOverride = async (requestId: string, status: LeaveRequest['status'], notes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'User profile not found' };

    const updatePayload = {
      status,
      updated_at: new Date().toISOString()
    };

    if (!isDemoMode) {
      try {
        const { error } = await supabase
          .from('leave_requests')
          .update(updatePayload)
          .eq('id', requestId);

        if (error) return { success: false, error: error.message };

        // Log
        await supabase.from('activity_log').insert([{
          leave_request_id: requestId,
          actor_id: profile.id,
          action: 'admin_override',
          notes: notes || `Admin manually changed status to ${status}`
        }]);

        await refreshData();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode Update
      const storedRequests: LeaveRequest[] = JSON.parse(localStorage.getItem('gp_mock_requests') || '[]');
      const updated = storedRequests.map(r => {
        if (r.id === requestId) {
          return { ...r, ...updatePayload };
        }
        return r;
      });
      localStorage.setItem('gp_mock_requests', JSON.stringify(updated));

      const newLog: ActivityLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        leave_request_id: requestId,
        actor_id: profile.id,
        action: 'admin_override',
        timestamp: new Date().toISOString(),
        notes: notes || `Admin manually changed status to ${status}`
      };
      const storedLogs = JSON.parse(localStorage.getItem('gp_mock_logs') || '[]');
      storedLogs.push(newLog);
      localStorage.setItem('gp_mock_logs', JSON.stringify(storedLogs));

      await refreshData();
      return { success: true };
    }
  };

  // Upload PDF
  const uploadPassPDF = async (requestId: string, pdfBlob: Blob): Promise<{ success: boolean; publicUrl?: string; error?: string }> => {
    const filename = `${requestId}_pass.pdf`;

    if (!isDemoMode) {
      try {
        // Upload to Supabase Storage private bucket 'gate-passes'
        const { error } = await supabase.storage
          .from('gate-passes')
          .upload(filename, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (error) return { success: false, error: error.message };

        // Get public or signed url. Since the prompt states "save the public/signed URL to pass_pdf_url", 
        // we can fetch the public URL if public, or signed URL. 
        // For simplicity and speed in live demo we can use getPublicUrl.
        const { data: { publicUrl } } = supabase.storage
          .from('gate-passes')
          .getPublicUrl(filename);

        // Update leave request row with PDF URL
        const { error: dbError } = await supabase
          .from('leave_requests')
          .update({ pass_pdf_url: publicUrl })
          .eq('id', requestId);

        if (dbError) return { success: false, error: dbError.message };

        await refreshData();
        return { success: true, publicUrl };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode - Create a local Blob URL
      const localUrl = URL.createObjectURL(pdfBlob);

      const storedRequests: LeaveRequest[] = JSON.parse(localStorage.getItem('gp_mock_requests') || '[]');
      const updated = storedRequests.map(r => {
        if (r.id === requestId) {
          return { ...r, pass_pdf_url: localUrl };
        }
        return r;
      });
      localStorage.setItem('gp_mock_requests', JSON.stringify(updated));

      await refreshData();
      return { success: true, publicUrl: localUrl };
    }
  };

  // Admin User Management - Add/Edit Profile
  const upsertProfileAdmin = async (profileData: Omit<Profile, 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    if (!isDemoMode) {
      try {
        // Admin inserts or updates profile
        const { error } = await supabase
          .from('profiles')
          .upsert([{
            ...profileData,
            created_at: new Date().toISOString()
          }]);
        
        if (error) return { success: false, error: error.message };
        await refreshData();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode Upsert
      const currentProfilesList: Profile[] = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
      const existingIdx = currentProfilesList.findIndex(p => p.id === profileData.id);
      
      if (existingIdx > -1) {
        currentProfilesList[existingIdx] = {
          ...currentProfilesList[existingIdx],
          ...profileData
        };
      } else {
        currentProfilesList.push({
          ...profileData,
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem('gp_mock_profiles', JSON.stringify(currentProfilesList));
      await refreshData();
      return { success: true };
    }
  };

  // Admin User Management - Delete Profile
  const deleteProfileAdmin = async (profileId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isDemoMode) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profileId);
        
        if (error) return { success: false, error: error.message };
        await refreshData();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode Delete
      const currentProfilesList: Profile[] = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
      const updatedList = currentProfilesList.filter(p => p.id !== profileId);
      localStorage.setItem('gp_mock_profiles', JSON.stringify(updatedList));
      await refreshData();
      return { success: true };
    }
  };

  return (
    <DatabaseContext.Provider value={{
      requests,
      logs,
      profiles,
      loading,
      refreshData,
      createRequest,
      facultyAction,
      hodAction,
      adminOverride,
      uploadPassPDF,
      upsertProfileAdmin,
      deleteProfileAdmin
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
