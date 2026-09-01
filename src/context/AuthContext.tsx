import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export type UserRole = 'student' | 'faculty' | 'hod' | 'admin' | 'guard';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  roll_number?: string;
  department: string;
  photo_url?: string;
  parent_name?: string;
  parent_contact?: string;
  assigned_faculty_id?: string;
  created_at: string;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  registerStudent: (rollNumber: string, email: string, password: string, assignedFacultyId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Static seed data for Demo/Mock Mode
export const DEMO_PROFILES: Record<string, Profile & { email: string }> = {
  'admin@college.edu': {
    id: 'a1000000-0000-0000-0000-000000000000',
    full_name: 'Dr. Tarun Kumar (Admin)',
    role: 'admin',
    department: 'Administration',
    email: 'admin@college.edu',
    created_at: new Date().toISOString()
  },
  'hod@college.edu': {
    id: 'h1000000-0000-0000-0000-000000000000',
    full_name: 'Dr. Rajesh Sharma (HOD)',
    role: 'hod',
    department: 'Computer Science',
    email: 'hod@college.edu',
    created_at: new Date().toISOString()
  },
  'faculty@college.edu': {
    id: 'f1000000-0000-0000-0000-000000000000',
    full_name: 'Prof. Amit Verma (Faculty)',
    role: 'faculty',
    department: 'Computer Science',
    email: 'faculty@college.edu',
    created_at: new Date().toISOString()
  },
  'student@college.edu': {
    id: 's1000000-0000-0000-0000-000000000000',
    full_name: 'Rahul Aneja (Student)',
    role: 'student',
    roll_number: 'CS-2023-042',
    department: 'Computer Science',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    parent_name: 'Suresh Aneja',
    parent_contact: '+91 98765 43210',
    assigned_faculty_id: 'f1000000-0000-0000-0000-000000000000',
    email: 'student@college.edu',
    created_at: new Date().toISOString()
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isSupabaseConfigured;

  // Initialize and load session
  useEffect(() => {
    if (!isDemoMode) {
      // Live Supabase Mode
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Mock Mode - Check local storage for session
      const savedUser = localStorage.getItem('gp_mock_user');
      const savedProfiles = localStorage.getItem('gp_mock_profiles');
      
      // Seed initial profiles in local storage if not present
      if (!savedProfiles) {
        localStorage.setItem('gp_mock_profiles', JSON.stringify(Object.values(DEMO_PROFILES)));
      }

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Find matching profile from local storage
        const currentProfilesList = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
        const userProfile = currentProfilesList.find((p: any) => p.id === parsedUser.id) || null;
        setProfile(userProfile);
      }
      setLoading(false);
    }
  }, [isDemoMode]);

  // Fetch profile from Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Login implementation
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    if (!isDemoMode) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        setUser(data.user);
        await fetchProfile(data.user!.id);
        return { success: true };
      } catch (e: any) {
        setLoading(false);
        return { success: false, error: e.message || 'An error occurred during sign in.' };
      }
    } else {
      // Mock Mode Login
      const demoUser = DEMO_PROFILES[email.toLowerCase().trim()];
      if (demoUser && password === 'password123') {
        const mockUserSession = { id: demoUser.id, email: demoUser.email, role: demoUser.role };
        localStorage.setItem('gp_mock_user', JSON.stringify(mockUserSession));
        setUser(mockUserSession);
        
        // Find actual saved profile in local storage
        const currentProfilesList = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
        let userProfile = currentProfilesList.find((p: any) => p.id === demoUser.id);
        if (!userProfile) {
          userProfile = { ...demoUser };
          currentProfilesList.push(userProfile);
          localStorage.setItem('gp_mock_profiles', JSON.stringify(currentProfilesList));
        }
        setProfile(userProfile);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: 'Invalid credentials. Use preset demo accounts and password "password123".' };
      }
    }
  };

  // Logout implementation
  const logout = async () => {
    setLoading(true);
    if (!isDemoMode) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('gp_mock_user');
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  // Update profile details
  const updateProfile = async (profileData: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'No active profile found' };

    if (!isDemoMode) {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile.id);
      
      if (error) return { success: false, error: error.message };
      setProfile(prev => prev ? { ...prev, ...profileData } : null);
      return { success: true };
    } else {
      // Mock Mode Update
      const currentProfilesList = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
      const updatedList = currentProfilesList.map((p: any) => {
        if (p.id === profile.id) {
          return { ...p, ...profileData };
        }
        return p;
      });
      localStorage.setItem('gp_mock_profiles', JSON.stringify(updatedList));
      setProfile(prev => prev ? { ...prev, ...profileData } : null);
      return { success: true };
    }
  };

  // Register Student with roll number verification
  const registerStudent = async (rollNumber: string, email: string, password: string, assignedFacultyId: string): Promise<{ success: boolean; error?: string }> => {
    const cleanRoll = rollNumber.toUpperCase().trim();
    
    if (!isDemoMode) {
      try {
        // 1. Verify roll number in admission_records
        const { data: record, error: recordError } = await supabase
          .from('admission_records')
          .select('*')
          .eq('roll_number', cleanRoll)
          .single();

        if (recordError || !record) {
          return { success: false, error: 'Roll number not found in college admissions database.' };
        }

        // 2. Register user with metadata
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: record.full_name,
              role: 'student',
              roll_number: cleanRoll,
              department: record.department,
              parent_name: record.parent_name,
              parent_contact: record.parent_contact,
              assigned_faculty_id: assignedFacultyId
            }
          }
        });

        if (signUpError) return { success: false, error: signUpError.message };
        if (!signUpData.user) return { success: false, error: 'Registration failed.' };
        
        // Supabase will trigger handle_new_user automatically, which populates the profile.
        // We log them in by fetching their profile:
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signUpData.user.id)
          .single();

        setUser(signUpData.user);
        setProfile(profileData);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      // Mock Mode registration
      const storedAdmissions = JSON.parse(localStorage.getItem('gp_mock_admissions') || '[]');
      const matchedRecord = storedAdmissions.find((r: any) => r.roll_number.toUpperCase().trim() === cleanRoll);

      if (!matchedRecord) {
        return { success: false, error: 'Roll number not found in college admissions database.' };
      }

      // Create new mock student profile
      const newId = 's' + Math.random().toString(36).substr(2, 9);
      const newProfile: Profile = {
        id: newId,
        full_name: matchedRecord.full_name,
        role: 'student',
        roll_number: cleanRoll,
        department: matchedRecord.department,
        photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', // default photo
        parent_name: matchedRecord.parent_name,
        parent_contact: matchedRecord.parent_contact,
        assigned_faculty_id: assignedFacultyId,
        created_at: new Date().toISOString()
      };

      const mockProfiles = JSON.parse(localStorage.getItem('gp_mock_profiles') || '[]');
      
      // Seed default profiles if not present in mock
      if (mockProfiles.length === 0) {
        Object.keys(DEMO_PROFILES).forEach(k => {
          mockProfiles.push(DEMO_PROFILES[k]);
        });
      }

      mockProfiles.push(newProfile);
      localStorage.setItem('gp_mock_profiles', JSON.stringify(mockProfiles));

      // Log in
      setUser({ id: newId, email });
      setProfile(newProfile);
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemoMode, login, logout, updateProfile, registerStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
