-- ==========================================
-- Campus Gate Pass Database Schema
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop existing triggers and functions if they exist
-- (Note: Triggers on tables are automatically dropped when the tables are dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_unique_pass_id();
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_department(uuid);

-- 3. Drop existing tables if they exist
DROP TABLE IF EXISTS public.activity_log;
DROP TABLE IF EXISTS public.leave_requests;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.admission_records;

-- 4. Drop existing enums if they exist
DROP TYPE IF EXISTS leave_status;
DROP TYPE IF EXISTS leave_category;
DROP TYPE IF EXISTS user_role;

-- 5. Create Enums
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'hod', 'admin');
CREATE TYPE leave_category AS ENUM ('medical', 'family emergency', 'personal', 'other');
CREATE TYPE leave_status AS ENUM (
  'pending_faculty', 
  'pending_hod', 
  'approved', 
  'rejected_by_faculty', 
  'rejected_by_hod', 
  'expired'
);

-- 6. Create Pre-Authorized Admissions Table
CREATE TABLE public.admission_records (
  roll_number text PRIMARY KEY,
  full_name text NOT NULL,
  department text NOT NULL,
  parent_name text NOT NULL,
  parent_contact text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Profiles Table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, -- References auth.users(id)
  full_name text NOT NULL,
  role user_role NOT NULL,
  roll_number text UNIQUE, -- Nullable (for students only)
  department text NOT NULL, -- e.g. 'Computer Science', 'Electronics'
  photo_url text, -- Nullable student photo
  parent_name text, -- Nullable (for students only)
  parent_contact text, -- Nullable (for students only)
  assigned_faculty_id uuid REFERENCES public.profiles(id), -- Nullable
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Leave Requests Table
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) NOT NULL,
  reason text NOT NULL,
  reason_category leave_category NOT NULL,
  requested_date date NOT NULL DEFAULT CURRENT_DATE,
  time_out time without time zone NOT NULL,
  time_expected_back time without time zone, -- Nullable (checkbox: Not returning today)
  status leave_status NOT NULL DEFAULT 'pending_faculty',
  
  -- Faculty fields
  faculty_id uuid REFERENCES public.profiles(id),
  faculty_confirmed_parent boolean NOT NULL DEFAULT false,
  faculty_action_at timestamp with time zone,
  faculty_notes text,

  -- HOD fields
  hod_id uuid REFERENCES public.profiles(id),
  hod_action_at timestamp with time zone,
  hod_notes text,

  -- Gate Pass fields
  pass_id text UNIQUE,
  pass_pdf_url text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Activity Log Table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id uuid REFERENCES public.leave_requests(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) NOT NULL,
  action text NOT NULL, -- 'submitted', 'faculty_confirmed_parent', 'faculty_approved', 'hod_approved'
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text
);

-- 10. Add Database Constraints & Indexes
CREATE UNIQUE INDEX unique_pending_student_request 
ON public.leave_requests (student_id) 
WHERE (status IN ('pending_faculty', 'pending_hod'));

CREATE UNIQUE INDEX unique_approved_student_request 
ON public.leave_requests (student_id, requested_date) 
WHERE (status = 'approved');

CREATE INDEX idx_leave_requests_pass_id ON public.leave_requests(pass_id);
CREATE INDEX idx_leave_requests_requested_date ON public.leave_requests(requested_date);

-- 11. Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text AS $$
  SELECT department FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 12. Pass ID Generation Trigger
CREATE OR REPLACE FUNCTION public.generate_unique_pass_id()
RETURNS trigger AS $$
DECLARE
  date_str text;
  random_suffix text;
  final_pass_id text;
  is_unique boolean := false;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending_hod' AND NEW.pass_id IS NULL THEN
    date_str := to_char(CURRENT_DATE, 'YYYY-MM-DD');
    WHILE NOT is_unique LOOP
      random_suffix := substring(md5(random()::text) from 1 for 4);
      final_pass_id := 'GP-' || date_str || '-' || random_suffix;
      SELECT NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE pass_id = final_pass_id) INTO is_unique;
    END LOOP;
    NEW.pass_id := final_pass_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_pass_id
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_unique_pass_id();

-- 13. Row Level Security Configuration
ALTER TABLE public.admission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Admissions Records Policies
CREATE POLICY "Enable read access for all (anonymous signups verification)"
ON public.admission_records FOR SELECT
USING (true);

CREATE POLICY "Enable all admin operations on admissions"
ON public.admission_records FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Profiles Policies
CREATE POLICY "Enable read access for authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for admins" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Enable update for users on own profile or admins" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Enable delete for admins" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Leave Requests Policies
CREATE POLICY "Students can view their own requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can create their own requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid() AND status = 'pending_faculty');

CREATE POLICY "Students can update their own requests before action"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND status = 'pending_faculty');

CREATE POLICY "Faculty can view relevant requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (
  faculty_id = auth.uid() OR 
  student_id IN (SELECT id FROM public.profiles WHERE assigned_faculty_id = auth.uid())
);

CREATE POLICY "Faculty can update pending requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (
  (faculty_id = auth.uid() OR student_id IN (SELECT id FROM public.profiles WHERE assigned_faculty_id = auth.uid())) 
  AND status = 'pending_faculty'
);

CREATE POLICY "HOD can view departmental requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'hod' AND 
  public.get_user_department(student_id) = public.get_user_department(auth.uid())
);

CREATE POLICY "HOD can update pending departmental requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'hod' AND 
  public.get_user_department(student_id) = public.get_user_department(auth.uid()) AND
  status = 'pending_hod'
);

CREATE POLICY "Admin has full access on leave requests"
ON public.leave_requests FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Activity Log Policies
CREATE POLICY "Allow read access to activity logs based on request visibility"
ON public.activity_log FOR SELECT
TO authenticated
USING (
  leave_request_id IN (SELECT id FROM public.leave_requests)
);

CREATE POLICY "Allow insertions by active actors"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Admin has full access on activity logs"
ON public.activity_log FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 14. Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, department, roll_number, parent_name, parent_contact, assigned_faculty_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science'),
    NEW.raw_user_meta_data->>'roll_number',
    NEW.raw_user_meta_data->>'parent_name',
    NEW.raw_user_meta_data->>'parent_contact',
    CASE 
      WHEN NEW.raw_user_meta_data->>'assigned_faculty_id' IS NOT NULL THEN (NEW.raw_user_meta_data->>'assigned_faculty_id')::uuid
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
