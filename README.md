# Campus Gate Pass - Emergency Leave Portal

An enterprise-ready, mobile-optimized digital gate pass registry designed for colleges to manage and track emergency student departures. Built with **React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL)**, featuring secure multi-role workflows, automated parent-verification checks, and dynamic PDF pass generation.

Currently branded for **Indore Institute of Science & Technology (IIST)**.

---

## 🚀 Key Features

*   **Secure Student Self-Registration**: Registration is locked down. Students can only sign up if their Roll Number exists in the pre-authorized admissions list uploaded by the administrator. Name, department, and parent details are auto-filled to prevent fakes or typos.
*   **Three-Tier Verification Workflow**:
    1.  **Student**: Submits leave requests with category, reason, expected timings, and selected Faculty Advisor.
    2.  **Faculty Advisor**: Receives the request in their dashboard, calls the student's parent directly via click-to-call, records call notes, and checks a parent-verification checkbox to escalate.
    3.  **HOD**: Approves and signs the pass, creating a verifiable digital Gate Pass ID.
*   **Verification & PDF Generation**: Generates official PDF passes featuring college branding, clean transparent handwritten signature stamps of HOD and Faculty, student profile photos, and verifiable Pass IDs.
*   **Administrative Roster Management**: Administrators can bulk pre-authorize students by uploading a CSV directory and manage staff accounts (Faculty, HODs) directly.
*   **Responsive Mobile Layout**: Grid lists, charts, and form modals are optimized to scroll smoothly on portrait mobile screens when virtual keyboards appear.

---

## 🛠️ Tech Stack

*   **Frontend**: React (v18), TypeScript, Tailwind CSS (v4), Vite, Lucide React (Icons).
*   **Database & Auth**: Supabase (PostgreSQL, Row Level Security (RLS) policies, database triggers).
*   **PDF Generation**: jsPDF, html2canvas, DOMPurify.

---

## 📊 Database Schema

Run the SQL script found in `supabase/schema.sql` to initialize your database structure:

1.  **`admission_records`**: Stores roll numbers, names, departments, and parent contacts of pre-authorized students.
2.  **`profiles`**: User profiles (HODs, Faculty, Students, Admins). Synced automatically when a user signs up.
3.  **`leave_requests`**: Stores request data, categories, reasons, timestamps, status logs, and verification remarks.

### Supabase Database Trigger
The table `profiles` is automatically synced with newly registered users in `auth.users` using this PostgreSQL trigger:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department, roll_number, parent_name, parent_contact, photo_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'department', ''),
    new.raw_user_meta_data->>'roll_number',
    new.raw_user_meta_data->>'parent_name',
    new.raw_user_meta_data->>'parent_contact',
    new.raw_user_meta_data->>'photo_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 💻 Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Tarunmakode123/campus-pass.git
    cd campus-pass
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure environment variables**:
    Create a `.env` file in the root folder and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=https://your-project-url.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-public-key
    ```
4.  **Run locally**:
    ```bash
    npm run dev
    ```

---

## 🌐 Production Deployment

### 1. Vercel Hosting
*   Import your GitHub repository to Vercel.
*   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the project Settings.
*   Deploy.

### 2. Supabase Auth Configuration
*   Go to **Authentication** &rarr; **Providers** &rarr; **Email** in the Supabase Dashboard.
*   Turn **OFF** the "Confirm email" switch to allow instant registrations without waiting for email verification links (highly recommended for testing).

### 3. Create the First Admin Account
To log in as the Administrator for the first time:
1. Go to **Authentication** &rarr; **Users** in the Supabase Dashboard.
2. Click **Add User** &rarr; **Create User**.
3. Check the **"Auto-confirm User"** option.
4. Input your admin email and password.
5. Under **User Metadata**, paste this JSON payload:
    ```json
    {
      "role": "admin",
      "full_name": "College Administrator",
      "department": "Administration"
    }
    ```
6. Click **Save**. You can now log in to the website to upload student directories and register Faculty/HOD staff credentials.

---

## 🏫 Creating a Copy for another College (e.g., Acropolis College)

To clone and configure a completely separate copy of this system for another college:

1.  **Duplicate the Repo**: Clone this project locally, create a new repository on GitHub (e.g., `acropolis-gate-pass`), and push your code there.
2.  **Branding Updates**:
    *   **Logo**: Swap out `public/iist-logo.png` with the new Acropolis logo.
    *   **Tab Title**: Edit `<title>` in `index.html` to represent the new college.
    *   **Portal Titles**: Update text titles inside `src/views/Login.tsx` and `src/components/Layout.tsx`.
    *   **PDF Design**: Update the printed college name in `src/components/PDFGenerator.ts` and change references.
3.  **New Supabase Project**: Set up a new project in Supabase, run the database triggers from `schema.sql`, and connect the Vercel variables to this new project.
