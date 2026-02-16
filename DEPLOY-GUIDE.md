# Deploying your Task App — Complete Guide

Everything from zero to a live, private task app. ~25 minutes.

---

## What you'll set up

1. **Supabase** (free) — database + login system
2. **GitHub** (free) — hosts your code
3. **Vercel** (free) — deploys to a live URL

---

## Step 1: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (GitHub login works)
2. Click **New Project**
3. Name: `oscar-tasks`
4. Database password: set something (you won't need it in the app, but save it)
5. Region: **West EU (Ireland)** — closest to Norway
6. Click **Create new project** — wait ~1 minute

---

## Step 2: Create the database tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Paste this entire block and click **Run**:

```sql
-- Projects table
create table projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default 'folder',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Tasks table
create table tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text default '',
  project text not null references projects(id) on delete cascade,
  priority text not null default 'medium',
  in_priority boolean not null default false,
  sort_order integer not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Security: only see your own data
alter table projects enable row level security;
alter table tasks enable row level security;

create policy "Users see own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users see own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

You should see **"Success. No rows returned"** — that means it worked.

---

## Step 3: Configure authentication

1. In Supabase, go to **Authentication** → **Providers** (left sidebar)
2. Make sure **Email** is enabled (it should be by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your future Vercel URL (you can update this after Step 7)
   - For now, set it to: `http://localhost:5173`

**Optional — skip email confirmation (recommended for personal use):**
1. Go to **Authentication** → **Providers** → **Email**
2. Turn OFF **"Confirm email"**
3. This lets you sign up and start using the app immediately

---

## Step 4: Get your Supabase credentials

1. Go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** — like `https://abcdefgh.supabase.co`
   - **anon public key** — long string starting with `eyJ...`

---

## Step 5: Add credentials to the code

1. Unzip `oscar-tasks.zip` on your computer
2. Open `src/App.jsx` in any text editor
3. Find lines 6–7 near the top:

```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

4. Replace with your actual values:

```js
const SUPABASE_URL = "https://abcdefgh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIs...";
```

5. Save the file

---

## Step 6: Upload to GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name: `oscar-tasks`, set to **Private**
3. Don't check any initialization boxes → **Create repository**
4. Click **"uploading an existing file"**
5. Drag the **contents** of the `oscar-tasks` folder (not the folder itself):
   - `package.json`, `vite.config.js`, `index.html`, `src/`, `.gitignore`, etc.
6. Click **Commit changes**

---

## Step 7: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. **Add New...** → **Project**
3. Find `oscar-tasks` → **Import**
4. Don't change any settings → **Deploy**
5. Wait ~30 seconds — you'll get a URL like `oscar-tasks.vercel.app`

**After deploying:** Go back to Supabase → **Authentication** → **URL Configuration** and update the **Site URL** to your Vercel URL (e.g. `https://oscar-tasks.vercel.app`).

---

## Step 8: Create your account

1. Open your Vercel URL
2. You'll see a login screen
3. Click **"Need an account? Sign up"**
4. Enter your email and a password (min 6 characters)
5. If you turned off email confirmation (Step 3), you're in immediately
6. If not, check your email for a confirmation link first

---

## Step 9: Add to your phone

- **iPhone**: Safari → share icon → **Add to Home Screen**
- **Android**: Chrome → three dots → **Add to Home screen**

---

## How security works

- Every task and project is linked to your user account
- Row Level Security (RLS) means the database only returns YOUR data
- Even if someone knows your Supabase URL, they can't see anything without your login
- Your session token is stored in your browser so you stay logged in

---

## First time using the app

1. Log in
2. Click the **+** next to "Projects" in the sidebar to create your first projects
   (e.g. Studies, Millennium, Applaus Creative, Aett Events, Texicon)
3. Start adding tasks!

Projects are fully dynamic now — add, rename, or delete them anytime
from the sidebar or the project management modal.

---

## Making changes later

- Edit files on GitHub → Vercel auto-redeploys in seconds
- Or come back to me with changes you want and I'll update the code

---

## Costs

Everything is free:
- **Supabase free tier**: 500 MB database, 50k monthly active users
- **Vercel free tier**: unlimited personal deploys
- **GitHub**: free private repos
