import { useState, useEffect, useCallback } from "react";

// ============================================================
// SUPABASE CONFIG — Replace with your values (see DEPLOY-GUIDE)
// ============================================================
const SUPABASE_URL = "https://vtsbkgpkchzlajaekiav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HbLTQoeTTIiw81nHYV3Pzg_b3Oh0Hxf";

// ============================================================
// Supabase client (no SDK, just fetch)
// ============================================================
let accessToken = null;

const sb = {
  headers: () => ({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }),
  async query(method, path, body) {
    const opts = { method, headers: sb.headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
    if (!res.ok) { const e = await res.text(); throw new Error(`${method} ${path}: ${res.status} ${e}`); }
    if (method === "DELETE") return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },
  // Auth
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },
  async getUser(token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  },
  async refresh(refreshToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return res.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
  },
  // Data
  getProjects: (uid) => sb.query("GET", `projects?user_id=eq.${uid}&select=*&order=sort_order`),
  insertProject: (p) => sb.query("POST", "projects", p),
  updateProject: (id, u) => sb.query("PATCH", `projects?id=eq.${id}`, u),
  deleteProject: (id) => sb.query("DELETE", `projects?id=eq.${id}`),
  getTasks: (uid) => sb.query("GET", `tasks?user_id=eq.${uid}&select=*`),
  insertTask: (t) => sb.query("POST", "tasks", t),
  updateTask: (id, u) => sb.query("PATCH", `tasks?id=eq.${id}`, u),
  deleteTask: (id) => sb.query("DELETE", `tasks?id=eq.${id}`),
};

// ============================================================
// Icons
// ============================================================
const IC = {
  plus: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>,
  check: () => <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9.5 10,2.5"/></svg>,
  edit: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-9 9H2v-3z"/></svg>,
  up: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="13" x2="8" y2="3"/><polyline points="3,7 8,3 13,7"/></svg>,
  down: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="3" x2="8" y2="13"/><polyline points="3,9 8,13 13,9"/></svg>,
  clock: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><polyline points="8,4.5 8,8 10.5,9.5"/></svg>,
  grip: () => <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" opacity="0.25"><circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/><circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/><circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/></svg>,
  menu: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="11" rx="2"/><line x1="5.5" y1="2.5" x2="5.5" y2="13.5"/></svg>,
  x: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>,
  trash: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3,4 13,4"/><path d="M5.5,4V3a1,1,0,0,1,1-1h3a1,1,0,0,1,1,1V4"/><path d="M4,4l.8,9a1,1,0,0,0,1,.9h4.4a1,1,0,0,0,1-.9L12,4"/></svg>,
  zap: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="9,1 3,9 8,9 7,15 13,7 8,7"/></svg>,
  sync: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a5 5 0 019.5-1.5M13 8a5 5 0 01-9.5 1.5"/><polyline points="3,3 3,6.5 6.5,6.5"/><polyline points="13,13 13,9.5 9.5,9.5"/></svg>,
  logout: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3"/><polyline points="10,11 14,8 10,5"/><line x1="14" y1="8" x2="6" y2="8"/></svg>,
  folder: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12V4a1 1 0 011-1h3l2 2h5a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z"/></svg>,
  overview: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/></svg>,
  settings: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.75 3.75l1.1 1.1M11.15 11.15l1.1 1.1M3.75 12.25l1.1-1.1M11.15 4.85l1.1-1.1"/></svg>,
};

// Colors
const AC = "#D4600A", AL = "#FFF3EC", AM = "#FDDCC6", BG = "#FAF8F5", W = "#FFFFFF", BD = "#EDE9E3", T1 = "#1A1715", T2 = "#8C8580", T3 = "#B5AFA9";

const genId = () => Math.random().toString(36).substr(2, 9);

// ============================================================
// AUTH SCREEN
// ============================================================
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (mode === "signup") {
        const res = await sb.signUp(email, password);
        if (res.error) throw new Error(res.error.message || res.msg || "Signup failed");
        if (res.access_token) { onAuth(res.access_token, res.refresh_token, res.user); }
        else { setSignupDone(true); }
      } else {
        const res = await sb.signIn(email, password);
        if (res.error) throw new Error(res.error.message || res.msg || "Login failed");
        if (!res.access_token) throw new Error("No token returned");
        onAuth(res.access_token, res.refresh_token, res.user);
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Satoshi', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}::selection{background:${AM}}input:focus{outline:none;border-color:${AC}!important}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ width: "100%", maxWidth: 380, padding: "40px 32px", background: W, borderRadius: 20, border: `1px solid ${BD}`, boxShadow: "0 8px 40px rgba(26,23,21,0.06)", animation: "fadeIn .4s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: T1, marginBottom: 4 }}>Tasks</div>
          <div style={{ fontSize: 13, color: T3, fontWeight: 500 }}>{mode === "login" ? "Welcome back" : "Create your account"}</div>
        </div>

        {signupDone ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: T1, marginBottom: 8, fontWeight: 600 }}>Check your email</div>
            <div style={{ fontSize: 13, color: T2, marginBottom: 20 }}>Click the confirmation link, then come back and log in.</div>
            <button onClick={() => { setMode("login"); setSignupDone(false); }} style={primBtn}>Go to login</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <Lbl>Email</Lbl>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="you@example.com" required autoFocus />
            <Lbl>Password</Lbl>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} required minLength={mode === "signup" ? 6 : 1} />
            {error && <div style={{ padding: "10px 14px", background: "#FFF5F3", border: "1px solid #F0D5D0", borderRadius: 8, fontSize: 12.5, color: "#C0392B", fontWeight: 500, marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ ...primBtn, opacity: loading ? 0.6 : 1 }}>
              {loading ? "..." : mode === "login" ? "Log in" : "Create account"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                style={{ background: "none", border: "none", color: AC, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const tryRefresh = async () => {
    const rt = localStorage.getItem("sb_refresh");
    if (!rt) return false;
    try {
      const res = await sb.refresh(rt);
      if (res && res.access_token) {
        accessToken = res.access_token;
        localStorage.setItem("sb_token", res.access_token);
        localStorage.setItem("sb_refresh", res.refresh_token);
        setToken(res.access_token); setUser(res.user);
        return true;
      }
    } catch {}
    return false;
  };

  useEffect(() => {
    const saved = localStorage.getItem("sb_token");
    if (saved) {
      accessToken = saved;
      sb.getUser(saved).then(async u => {
        if (u && u.id) { setUser(u); setToken(saved); setCheckingAuth(false); }
        else {
          // Token expired — try refresh
          const ok = await tryRefresh();
          if (!ok) { localStorage.removeItem("sb_token"); localStorage.removeItem("sb_refresh"); }
          setCheckingAuth(false);
        }
      }).catch(async () => {
        const ok = await tryRefresh();
        if (!ok) { localStorage.removeItem("sb_token"); localStorage.removeItem("sb_refresh"); }
        setCheckingAuth(false);
      });
    } else { setCheckingAuth(false); }
  }, []);

  // Auto-refresh token every 50 minutes to keep session alive
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      await tryRefresh();
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const handleAuth = (tok, refreshTok, usr) => {
    accessToken = tok;
    localStorage.setItem("sb_token", tok);
    if (refreshTok) localStorage.setItem("sb_refresh", refreshTok);
    setToken(tok); setUser(usr);
  };

  const handleLogout = async () => {
    if (token) await sb.signOut(token).catch(() => {});
    accessToken = null;
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_refresh");
    setToken(null); setUser(null);
  };

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Satoshi', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet" />
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: T1 }}>Tasks</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={handleAuth} />;
  return <TaskApp user={user} onLogout={handleLogout} />;
}

// ============================================================
// TASK APP
// ============================================================
function TaskApp({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [suggested, setSuggested] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [sidebar, setSidebar] = useState(true);
  const [form, setForm] = useState({ title: "", notes: "", project: "", priority: "medium" });
  const [mins, setMins] = useState(60);
  const [projModal, setProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [editingProj, setEditingProj] = useState(null);

  const uid = user.id;

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([sb.getProjects(uid), sb.getTasks(uid)]);
      setProjects(p || []); setTasks(t || []); setError(null);
    } catch (e) { setError("Could not load data. Check connection."); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  // Project management
  const addProject = async () => {
    if (!newProjName.trim()) return;
    const p = { id: genId(), user_id: uid, name: newProjName.trim(), sort_order: projects.length, icon: "folder" };
    setProjects(prev => [...prev, p]); setNewProjName(""); setSyncing(true);
    try { await sb.insertProject(p); } catch { load(); }
    setSyncing(false);
  };

  const removeProject = async (id) => {
    const hasTasks = tasks.some(t => t.project === id);
    if (hasTasks && !confirm("This project has tasks. Delete them too?")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.project !== id));
    if (tab === id) setTab("overview");
    setSyncing(true);
    try {
      // Delete tasks in this project first
      const projTasks = tasks.filter(t => t.project === id);
      for (const t of projTasks) await sb.deleteTask(t.id);
      await sb.deleteProject(id);
    } catch { load(); }
    setSyncing(false);
  };

  const renameProject = async () => {
    if (!editingProj || !editingProj.name.trim()) return;
    setProjects(prev => prev.map(p => p.id === editingProj.id ? { ...p, name: editingProj.name } : p));
    setSyncing(true);
    try { await sb.updateProject(editingProj.id, { name: editingProj.name }); } catch { load(); }
    setSyncing(false); setEditingProj(null);
  };

  // Task operations
  const addTask = async () => {
    if (!form.title.trim() || !form.project) return;
    const t = { id: genId(), user_id: uid, title: form.title, notes: form.notes, project: form.project, priority: form.priority, in_priority: false, sort_order: tasks.filter(x => !x.in_priority && x.project === form.project).length, done: false, created_at: new Date().toISOString() };
    setForm({ title: "", notes: "", project: tab === "overview" ? (projects[0]?.id || "") : tab, priority: "medium" });
    setAddOpen(false);
    setTasks(p => [...p, t]); setSyncing(true);
    try { await sb.insertTask(t); } catch { load(); }
    setSyncing(false);
  };

  const upd = async (id, u) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, ...u } : t)); setSyncing(true);
    try { await sb.updateTask(id, u); } catch { load(); }
    setSyncing(false);
  };

  const del = async (id) => {
    setTasks(p => p.filter(t => t.id !== id)); setSyncing(true);
    try { await sb.deleteTask(id); } catch { load(); }
    setSyncing(false);
  };

  const save = () => { if (!editing) return; const { id, title, notes, project, priority } = editing; setEditing(null); upd(id, { title, notes, project, priority }); };
  const toggle = (id) => { const t = tasks.find(x => x.id === id); if (t) upd(id, { done: !t.done }); };
  const toPri = (id) => upd(id, { in_priority: true, sort_order: tasks.filter(t => t.in_priority && !t.done).length });
  const toBl = (id) => upd(id, { in_priority: false, sort_order: 999 });

  // Drag and drop
  const onDS = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; };
  const onDO = (e, id) => { e.preventDefault(); if (id !== dragId) setOverId(id); };
  const onDrop = (e, tid, sec) => {
    e.preventDefault();
    if (!dragId || dragId === tid) { setDragId(null); setOverId(null); return; }
    const inP = sec === "priority";
    let up = tasks.map(t => t.id === dragId ? { ...t, in_priority: inP } : t);
    const tgt = up.find(t => t.id === tid);
    if (tgt) {
      const d = up.find(t => t.id === dragId); d.sort_order = tgt.sort_order - 0.5;
      const s = up.filter(t => t.in_priority === inP && !t.done).sort((a, b) => a.sort_order - b.sort_order);
      const batch = [];
      s.forEach((t, i) => { const u = up.find(x => x.id === t.id); if (u) { u.sort_order = i; batch.push({ id: u.id, sort_order: i, in_priority: u.in_priority }); } });
      setTasks([...up]);
      (async () => { setSyncing(true); for (const b of batch) { try { await sb.updateTask(b.id, { sort_order: b.sort_order, in_priority: b.in_priority }); } catch {} } setSyncing(false); })();
    }
    setDragId(null); setOverId(null);
  };
  const onDropSec = (e, sec) => {
    e.preventDefault(); if (!dragId) return;
    const inP = sec === "priority"; const mx = tasks.filter(t => t.in_priority === inP && !t.done && t.id !== dragId).length;
    setTasks(p => p.map(t => t.id === dragId ? { ...t, in_priority: inP, sort_order: mx } : t));
    upd(dragId, { in_priority: inP, sort_order: mx }); setDragId(null); setOverId(null);
  };

  // Focus time
  const suggest = () => {
    const act = tasks.filter(t => !t.done && t.in_priority).sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] !== p[b.priority] ? p[a.priority] - p[b.priority] : a.sort_order - b.sort_order; });
    let rem = mins; const s = [];
    for (const t of act) { if (rem <= 0) break; const est = t.priority === "high" ? 45 : t.priority === "medium" ? 30 : 15; s.push({ ...t, allocatedMins: Math.min(est, rem) }); rem -= est; }
    setSuggested(s); setTimeOpen(false);
  };

  // Derived
  const allProjects = [{ id: "overview", name: "Overview", icon: "overview" }, ...projects];
  const filt = tab === "overview" ? tasks : tasks.filter(t => t.project === tab);
  const pri = filt.filter(t => t.in_priority && !t.done).sort((a, b) => a.sort_order - b.sort_order);
  const bl = filt.filter(t => !t.in_priority && !t.done).sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] !== p[b.priority] ? p[a.priority] - p[b.priority] : a.sort_order - b.sort_order; });
  const done = filt.filter(t => t.done);
  const totA = tasks.filter(t => !t.done).length, totP = tasks.filter(t => t.in_priority && !t.done).length;

  const projName = (id) => projects.find(p => p.id === id)?.name || id;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Satoshi', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: T1, marginBottom: 8 }}>Tasks</div><div style={{ fontSize: 13, color: T3 }}>Loading...</div></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T1, fontFamily: "'Satoshi', 'Helvetica Neue', sans-serif", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}::selection{background:${AM}}input:focus,textarea:focus,select:focus{outline:none;border-color:${AC}!important}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.task-card{animation:fadeIn .25s ease both}.task-card:hover .grip-handle{opacity:1}.grip-handle{opacity:0;transition:opacity .15s}.action-btn{opacity:0;transition:all .15s}.task-card:hover .action-btn{opacity:1}.sb{transition:all .15s}.sb:hover{background:${AL};color:${AC}}.modal-content{animation:modalIn .2s ease both}input,textarea,select{font-family:'Satoshi',sans-serif}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${BD};border-radius:3px}`}</style>

      {/* Sidebar */}
      <div style={{ width: sidebar ? 256 : 0, minWidth: sidebar ? 256 : 0, background: W, borderRight: `1px solid ${BD}`, transition: "all .3s cubic-bezier(.4,0,.2,1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 22px 20px", borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: T1 }}>Tasks</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {syncing && <div style={{ animation: "spin 1s linear infinite", color: T3, display: "flex" }}><IC.sync /></div>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: T3, marginTop: 4, fontWeight: 500, letterSpacing: ".02em" }}>{totA} active / {totP} prioritized</div>
        </div>
        {error && <div style={{ padding: "10px 22px", background: "#FFF5F3", borderBottom: "1px solid #F0D5D0", fontSize: 12, color: "#C0392B", fontWeight: 500 }}>{error}<button onClick={load} style={{ marginLeft: 8, background: "none", border: "none", color: AC, cursor: "pointer", fontWeight: 600, fontSize: 12, textDecoration: "underline" }}>Retry</button></div>}

        <div style={{ padding: "14px 10px", flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: ".1em" }}>Projects</div>
            <button onClick={() => setProjModal(true)} style={{ background: "none", border: "none", color: T3, cursor: "pointer", display: "flex", padding: 2 }} onMouseEnter={e => e.currentTarget.style.color = AC} onMouseLeave={e => e.currentTarget.style.color = T3}><IC.plus /></button>
          </div>

          {/* Overview tab */}
          <button className="sb" onClick={() => setTab("overview")} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", borderRadius: 8, background: tab === "overview" ? AL : "transparent", color: tab === "overview" ? AC : T2, cursor: "pointer", fontSize: 13.5, fontWeight: tab === "overview" ? 600 : 500, textAlign: "left", marginBottom: 1, fontFamily: "'Satoshi', sans-serif" }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: tab === "overview" ? AC : "#F0ECE7" }}><IC.overview style={{ color: tab === "overview" ? "#fff" : T3 }} /></span>
            <span style={{ flex: 1 }}>Overview</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: tab === "overview" ? AC : T3 }}>{totA}</span>
          </button>

          {/* Project tabs */}
          {projects.map((p, i) => {
            const c = tasks.filter(t => t.project === p.id && !t.done).length;
            const a = tab === p.id;
            return (<button key={p.id} className="sb" onClick={() => setTab(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", borderRadius: 8, background: a ? AL : "transparent", color: a ? AC : T2, cursor: "pointer", fontSize: 13.5, fontWeight: a ? 600 : 500, textAlign: "left", marginBottom: 1, animation: `slideIn .2s ease ${i * .03}s both`, fontFamily: "'Satoshi', sans-serif" }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: a ? AC : "#F0ECE7" }}><IC.folder style={{ color: a ? "#fff" : T3 }} /></span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              {c > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: a ? AC : T3 }}>{c}</span>}
            </button>);
          })}

          {projects.length === 0 && (
            <div style={{ padding: "20px 12px", textAlign: "center", color: T3, fontSize: 13, fontStyle: "italic" }}>
              No projects yet. Click + to add one.
            </div>
          )}
        </div>

        <div style={{ padding: "8px 10px", borderTop: `1px solid ${BD}` }}>
          <button onClick={() => setTimeOpen(true)} className="sb" style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${BD}`, borderRadius: 10, background: "transparent", color: T2, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Satoshi', sans-serif" }}><IC.clock /> I have time now...</button>
        </div>
        <div style={{ padding: "8px 10px 14px" }}>
          <button onClick={onLogout} className="sb" style={{ width: "100%", padding: "9px 14px", border: "none", borderRadius: 8, background: "transparent", color: T3, cursor: "pointer", fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Satoshi', sans-serif" }}><IC.logout /> Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "18px 36px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: W }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebar(!sidebar)} style={{ background: "none", border: "none", color: T3, cursor: "pointer", padding: "6px", borderRadius: 6, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = AC} onMouseLeave={e => e.currentTarget.style.color = T3}><IC.menu /></button>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, fontFamily: "'Instrument Serif', serif", color: T1, letterSpacing: "-.02em" }}>
              {tab === "overview" ? "Overview" : projName(tab)}
            </h1>
            {tab !== "overview" && (
              <button onClick={() => { const p = projects.find(x => x.id === tab); if (p) setEditingProj({ ...p }); }} style={{ background: "none", border: "none", color: T3, cursor: "pointer", display: "flex", padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = AC} onMouseLeave={e => e.currentTarget.style.color = T3}><IC.settings /></button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={load} title="Refresh" style={{ background: "none", border: "none", color: T3, cursor: "pointer", padding: "6px", borderRadius: 6, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = AC} onMouseLeave={e => e.currentTarget.style.color = T3}><IC.sync /></button>
            <button onClick={() => { setForm({ title: "", notes: "", project: tab === "overview" ? (projects[0]?.id || "") : tab, priority: "medium" }); setAddOpen(true); }} disabled={projects.length === 0} style={{ padding: "9px 18px", border: "none", borderRadius: 9, background: projects.length === 0 ? T3 : T1, color: W, cursor: projects.length === 0 ? "default" : "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all .15s", fontFamily: "'Satoshi', sans-serif", opacity: projects.length === 0 ? 0.5 : 1 }} onMouseEnter={e => { if (projects.length > 0) { e.currentTarget.style.background = AC; e.currentTarget.style.transform = "translateY(-1px)"; } }} onMouseLeave={e => { if (projects.length > 0) { e.currentTarget.style.background = T1; e.currentTarget.style.transform = "translateY(0)"; } }}><IC.plus /> New task</button>
          </div>
        </div>

        {/* Focus suggestion */}
        {suggested && (
          <div style={{ margin: "22px 36px 0", padding: "20px 24px", background: AL, border: `1px solid ${AM}`, borderRadius: 14, animation: "fadeIn .3s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: AC }}><IC.zap /> Focus session — {mins} min</div>
              <button onClick={() => setSuggested(null)} style={{ background: "none", border: "none", color: T3, cursor: "pointer", display: "flex" }}><IC.x /></button>
            </div>
            {suggested.length === 0 ? <div style={{ color: T2, fontSize: 13 }}>No priority tasks. Move some to your priority queue first.</div> : suggested.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < suggested.length - 1 ? `1px solid ${AM}` : "none" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: AC, background: "#fff", padding: "3px 8px", borderRadius: 5, minWidth: 22, textAlign: "center" }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: T1 }}>{t.title}</span>
                <span style={{ fontSize: 12, color: T2, fontWeight: 500 }}>~{t.allocatedMins}m</span>
                {tab === "overview" && <span style={{ fontSize: 10, fontWeight: 600, color: T3, background: "#fff", padding: "3px 8px", borderRadius: 5 }}>{projName(t.project)}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 36px 80px" }}>
          {tab === "overview" ? (
            <div>
              {projects.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12, marginBottom: 36 }}>
                  {projects.map((p, i) => {
                    const pt = tasks.filter(t => t.project === p.id && !t.done), hc = pt.filter(t => t.priority === "high").length;
                    return (<button key={p.id} onClick={() => setTab(p.id)} style={{ padding: "18px 16px", background: W, border: `1px solid ${BD}`, borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all .2s", animation: `fadeIn .3s ease ${i * .05}s both`, fontFamily: "'Satoshi', sans-serif" }} onMouseEnter={e => { e.currentTarget.style.borderColor = AM; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,96,10,.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#F0ECE7", marginBottom: 10, color: T2 }}><IC.folder /></div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T1, marginBottom: 3 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: T3, fontWeight: 500 }}>{pt.length} task{pt.length !== 1 ? "s" : ""}{hc > 0 && <span style={{ color: AC }}> / {hc} urgent</span>}</div>
                    </button>);
                  })}
                </div>
              )}
              {projects.length === 0 && <div style={{ padding: "60px 20px", textAlign: "center" }}><div style={{ color: T2, fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No projects yet</div><div style={{ color: T3, fontSize: 13, marginBottom: 20 }}>Create your first project to start adding tasks.</div><button onClick={() => setProjModal(true)} style={{ ...primBtn, width: "auto", display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px" }}><IC.plus /> Add project</button></div>}
              {tasks.length > 0 && <>
                <Sec label="Priority queue" count={pri.length} accent />{pri.length === 0 ? <Empty text="No priority tasks" /> : pri.map((t, i) => <Card key={t.id} task={t} index={i} showProj projName={projName} onToggle={toggle} onEdit={setEditing} onDel={del} toBl={toBl} toPri={toPri} dragId={dragId} overId={overId} onDS={onDS} onDO={onDO} onDr={(e, id) => onDrop(e, id, "priority")} />)}
                <Sec label="Backlog" count={bl.length} style={{ marginTop: 36 }} />{bl.length === 0 ? <Empty text="Backlog is empty" /> : bl.map((t, i) => <Card key={t.id} task={t} index={i} showProj projName={projName} onToggle={toggle} onEdit={setEditing} onDel={del} toBl={toBl} toPri={toPri} dragId={dragId} overId={overId} onDS={onDS} onDO={onDO} onDr={(e, id) => onDrop(e, id, "backlog")} />)}
              </>}
            </div>
          ) : (
            <div>
              <div onDragOver={e => e.preventDefault()} onDrop={e => onDropSec(e, "priority")}>
                <Sec label="Priority queue" count={pri.length} accent hint="Drag to reorder" />
                {pri.length === 0 ? <div style={{ padding: 36, textAlign: "center", border: `1.5px dashed ${BD}`, borderRadius: 12, color: T3, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Drag tasks here or use the arrow to prioritize</div> : pri.map((t, i) => <Card key={t.id} task={t} index={i} projName={projName} onToggle={toggle} onEdit={setEditing} onDel={del} toBl={toBl} toPri={toPri} dragId={dragId} overId={overId} onDS={onDS} onDO={onDO} onDr={(e, id) => onDrop(e, id, "priority")} />)}
              </div>
              <div style={{ marginTop: 36 }} onDragOver={e => e.preventDefault()} onDrop={e => onDropSec(e, "backlog")}>
                <Sec label="Backlog" count={bl.length} />{bl.length === 0 ? <Empty text="No backlog tasks" /> : bl.map((t, i) => <Card key={t.id} task={t} index={i} projName={projName} onToggle={toggle} onEdit={setEditing} onDel={del} toBl={toBl} toPri={toPri} dragId={dragId} overId={overId} onDS={onDS} onDO={onDO} onDr={(e, id) => onDrop(e, id, "backlog")} />)}
              </div>
              {done.length > 0 && <div style={{ marginTop: 36 }}><Sec label="Completed" count={done.length} muted />{done.map((t, i) => <Card key={t.id} task={t} index={i} isDone projName={projName} onToggle={toggle} onEdit={setEditing} onDel={del} toBl={toBl} toPri={toPri} dragId={dragId} overId={overId} onDS={onDS} onDO={onDO} onDr={() => {}} />)}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Add task modal */}
      {addOpen && <Modal onClose={() => setAddOpen(false)}><div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: T1, marginBottom: 24 }}>New task</div><Lbl>Title</Lbl><input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} onKeyDown={e => e.key === "Enter" && add()} style={inp} placeholder="What needs to be done?" /><Lbl>Project</Lbl><select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} style={inp}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><Lbl>Priority</Lbl><div style={{ display: "flex", gap: 8, marginBottom: 20 }}>{["high", "medium", "low"].map(p => <button key={p} onClick={() => setForm({ ...form, priority: p })} style={pbtn(form.priority === p, p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}</div><Lbl>Notes</Lbl><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, minHeight: 80, resize: "vertical" }} placeholder="Additional details..." /><button onClick={addTask} style={primBtn}>Add task</button></Modal>}

      {/* Edit task modal */}
      {editing && <Modal onClose={() => setEditing(null)}><div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: T1, marginBottom: 24 }}>Edit task</div><Lbl>Title</Lbl><input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} style={inp} /><Lbl>Project</Lbl><select value={editing.project} onChange={e => setEditing({ ...editing, project: e.target.value })} style={inp}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><Lbl>Priority</Lbl><div style={{ display: "flex", gap: 8, marginBottom: 20 }}>{["high", "medium", "low"].map(p => <button key={p} onClick={() => setEditing({ ...editing, priority: p })} style={pbtn(editing.priority === p, p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}</div><Lbl>Notes</Lbl><textarea value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} style={{ ...inp, minHeight: 80, resize: "vertical" }} /><div style={{ display: "flex", gap: 8 }}><button onClick={save} style={{ ...primBtn, flex: 1 }}>Save</button><button onClick={() => { del(editing.id); setEditing(null); }} style={{ padding: "11px 18px", border: "1.5px solid #F0D5D0", borderRadius: 10, background: "#FFF5F3", color: "#C0392B", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Satoshi',sans-serif" }}><IC.trash /> Delete</button></div></Modal>}

      {/* Project management modal */}
      {projModal && <Modal onClose={() => setProjModal(false)}><div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: T1, marginBottom: 24 }}>Manage projects</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={newProjName} onChange={e => setNewProjName(e.target.value)} onKeyDown={e => e.key === "Enter" && addProject()} style={{ ...inp, marginBottom: 0, flex: 1 }} placeholder="New project name..." autoFocus />
          <button onClick={addProject} style={{ padding: "10px 16px", border: "none", borderRadius: 9, background: T1, color: W, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi',sans-serif", whiteSpace: "nowrap" }}>Add</button>
        </div>
        {projects.length === 0 && <div style={{ color: T3, fontSize: 13, textAlign: "center", padding: "16px 0", fontStyle: "italic" }}>No projects yet</div>}
        {projects.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${BD}` }}>
            <span style={{ color: T2, display: "flex" }}><IC.folder /></span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T1 }}>{p.name}</span>
            <span style={{ fontSize: 11, color: T3 }}>{tasks.filter(t => t.project === p.id && !t.done).length} tasks</span>
            <button onClick={() => setEditingProj({ ...p })} style={{ background: "none", border: "none", color: T3, cursor: "pointer", display: "flex", padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = AC} onMouseLeave={e => e.currentTarget.style.color = T3}><IC.edit /></button>
            <button onClick={() => removeProject(p.id)} style={{ background: "none", border: "none", color: T3, cursor: "pointer", display: "flex", padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = "#C0392B"} onMouseLeave={e => e.currentTarget.style.color = T3}><IC.trash /></button>
          </div>
        ))}
      </Modal>}

      {/* Edit project modal */}
      {editingProj && <Modal onClose={() => setEditingProj(null)}><div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: T1, marginBottom: 24 }}>Rename project</div><Lbl>Name</Lbl><input value={editingProj.name} onChange={e => setEditingProj({ ...editingProj, name: e.target.value })} onKeyDown={e => e.key === "Enter" && renameProject()} style={inp} autoFocus /><div style={{ display: "flex", gap: 8 }}><button onClick={renameProject} style={{ ...primBtn, flex: 1 }}>Save</button><button onClick={() => { removeProject(editingProj.id); setEditingProj(null); }} style={{ padding: "11px 18px", border: "1.5px solid #F0D5D0", borderRadius: 10, background: "#FFF5F3", color: "#C0392B", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Satoshi',sans-serif" }}><IC.trash /> Delete project</button></div></Modal>}

      {/* Focus time modal */}
      {timeOpen && <Modal onClose={() => setTimeOpen(false)}><div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: T1, marginBottom: 4 }}>Focus time</div><div style={{ fontSize: 13, color: T2, marginBottom: 22, fontWeight: 500 }}>How long can you work? I'll pick your top tasks.</div><div style={{ display: "flex", gap: 8, marginBottom: 18 }}>{[15, 30, 60, 120].map(m => <button key={m} onClick={() => setMins(m)} style={{ flex: 1, padding: "11px 8px", border: mins === m ? `2px solid ${AC}` : `1.5px solid ${BD}`, borderRadius: 10, background: mins === m ? AL : W, color: mins === m ? AC : T2, cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "'Satoshi',sans-serif" }}>{m < 60 ? `${m}m` : `${m / 60}h`}</button>)}</div><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 22 }}><span style={{ fontSize: 13, color: T3, fontWeight: 500 }}>Custom:</span><input type="number" value={mins} onChange={e => setMins(Math.max(5, parseInt(e.target.value) || 0))} style={{ ...inp, width: 72, marginBottom: 0, textAlign: "center" }} /><span style={{ fontSize: 13, color: T3, fontWeight: 500 }}>minutes</span></div><button onClick={suggest} style={primBtn}><span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><IC.zap /> Show me what to work on</span></button></Modal>}
    </div>
  );
}

// ============================================================
// Shared components
// ============================================================
function Card({ task: t, index: i, showProj, isDone, projName, onToggle, onEdit, onDel, toBl, toPri, dragId, overId, onDS, onDO, onDr }) {
  const pc = { high: AC, medium: "#C8922A", low: T3 }, pb = { high: "#FFF3EC", medium: "#FFF8EC", low: "#F5F3F0" };
  return (
    <div className="task-card" draggable={!isDone} onDragStart={e => onDS(e, t.id)} onDragOver={e => onDO(e, t.id)} onDrop={e => onDr(e, t.id)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", marginBottom: 4, background: overId === t.id ? AL : dragId === t.id ? "#F5F2EE" : W, border: `1px solid ${overId === t.id ? AM : BD}`, borderRadius: 10, cursor: isDone ? "default" : "grab", opacity: isDone ? .45 : dragId === t.id ? .4 : 1, transition: "all .15s", animationDelay: `${i * .03}s` }}>
      {!isDone && <div className="grip-handle" style={{ paddingTop: 5, cursor: "grab" }}><IC.grip /></div>}
      <button onClick={() => onToggle(t.id)} style={{ width: 20, height: 20, minWidth: 20, marginTop: 1, border: `1.5px solid ${isDone ? "#8CB88C" : pc[t.priority]}`, borderRadius: 5, background: isDone ? "#8CB88C" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: 0 }}>{isDone && <IC.check />}</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: isDone ? T3 : T1, textDecoration: isDone ? "line-through" : "none", lineHeight: 1.45 }}>
          {t.in_priority && !isDone && <span style={{ fontSize: 11, fontWeight: 700, color: AC, marginRight: 7, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>}
          {t.title}
        </div>
        {t.notes && <div style={{ fontSize: 12, color: T3, marginTop: 3, lineHeight: 1.4 }}>{t.notes}</div>}
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: pc[t.priority], background: pb[t.priority], padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{t.priority}</span>
          {showProj && <span style={{ fontSize: 10.5, fontWeight: 600, color: T3, background: "#F5F3F0", padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ display: "flex" }}><IC.folder /></span> {projName(t.project)}</span>}
        </div>
      </div>
      {!isDone && <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {t.in_priority ? <Abtn t="Move to backlog" onClick={() => toBl(t.id)}><IC.down /></Abtn> : <Abtn t="Move to priority" onClick={() => toPri(t.id)}><IC.up /></Abtn>}
        <Abtn t="Edit" onClick={() => onEdit(t)}><IC.edit /></Abtn>
      </div>}
    </div>
  );
}

function Abtn({ children, onClick, t: title }) {
  return <button className="action-btn" title={title} onClick={onClick} style={{ width: 28, height: 28, border: "none", borderRadius: 6, background: "transparent", color: T3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} onMouseEnter={e => { e.currentTarget.style.background = AL; e.currentTarget.style.color = AC; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T3; }}>{children}</button>;
}

function Sec({ label, count, accent, muted, hint, style = {} }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, ...style }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: accent ? AC : muted ? "#C5C0BA" : BD, ...(accent ? { boxShadow: "0 0 8px rgba(212,96,10,.3)" } : {}) }} /><span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 17, fontWeight: 400, color: accent ? T1 : muted ? T3 : T2, fontStyle: muted ? "italic" : "normal" }}>{label}</span><span style={{ fontSize: 12, color: T3, fontWeight: 500 }}>{count}</span>{hint && <span style={{ fontSize: 11, color: T3, fontWeight: 450, marginLeft: "auto" }}>{hint}</span>}</div>;
}

function Empty({ text }) { return <div style={{ padding: 28, textAlign: "center", color: T3, fontSize: 13, fontWeight: 500, fontStyle: "italic" }}>{text}</div>; }

function Modal({ children, onClose }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(26,23,21,.3)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: W, border: `1px solid ${BD}`, borderRadius: 16, padding: 30, width: "100%", maxWidth: 420, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(26,23,21,.12)" }}>{children}</div></div>;
}

function Lbl({ children }) { return <div style={{ fontSize: 11, fontWeight: 600, color: T3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>{children}</div>; }

const inp = { width: "100%", padding: "10px 14px", border: `1.5px solid ${BD}`, borderRadius: 9, background: BG, color: T1, fontSize: 13.5, fontWeight: 450, outline: "none", marginBottom: 18, boxSizing: "border-box", transition: "border-color .15s" };
const primBtn = { width: "100%", padding: 12, border: "none", borderRadius: 10, background: T1, color: W, cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "'Satoshi',sans-serif" };
function pbtn(a, l) { const c = { high: AC, medium: "#C8922A", low: T3 }, b = { high: AL, medium: "#FFF8EC", low: "#F5F3F0" }; return { flex: 1, padding: 10, cursor: "pointer", border: a ? `2px solid ${c[l]}` : `1.5px solid ${BD}`, borderRadius: 9, background: a ? b[l] : W, color: a ? c[l] : T3, fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi',sans-serif" }; }
