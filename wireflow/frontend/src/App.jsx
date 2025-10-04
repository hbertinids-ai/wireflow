import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

import WorkflowList from './components/WorkflowList';
import WorkflowEditor from './components/WorkflowEditor';
import AdminTasks from './components/AdminTasks';
import TagManager from './components/TagManager';
import Login from './components/Login';
import apiFetch from './api';

function App() {
  const [totals, setTotals] = useState({
    teams: 0,
    owners: 0,
    tags: 0,
    workflows: 0,
    nodes: 0
  });

  const [token, setToken] = useState(() => localStorage.getItem('wf_token') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wf_user') || 'null'); } catch(e) { return null; }
  });

  useEffect(() => {
    // Fetch totals from various endpoints
    const fetchTotals = async () => {
      try {
        const [teams, owners, tags, workflows] = await Promise.all([
          apiFetch('/api/teams', { method: 'GET' }, token),
          apiFetch('/api/owners', { method: 'GET' }, token),
          apiFetch('/api/tags', { method: 'GET' }, token),
          apiFetch('/api/workflows', { method: 'GET' }, token)
        ]);

        let totalNodes = 0;
        (workflows || []).forEach(workflow => {
          if (workflow.nodes && Array.isArray(workflow.nodes)) totalNodes += workflow.nodes.length;
        });

        setTotals({
          teams: (teams || []).length,
          owners: (owners || []).length,
          tags: (tags || []).length,
          workflows: (workflows || []).length,
          nodes: totalNodes
        });
      } catch (error) {
        console.error('Error fetching totals:', error);
      }
    };

    fetchTotals();
  }, []);

  const onLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('wf_token', newToken);
    localStorage.setItem('wf_user', JSON.stringify(newUser));
    // Refresh totals after login
    window.location.reload();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wf_token');
    localStorage.removeItem('wf_user');
    window.location.reload();
  };

  // Change password UI state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changing, setChanging] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  const changePassword = async () => {
    if (!user) return;
    if (!currentPw || !newPw) return alert('Current and new password required');
    setChanging(true);
    try {
      await apiFetch(`/auth/users/${encodeURIComponent(user.username)}`, { method: 'PUT', body: { currentPassword: currentPw, password: newPw } }, token);
      alert('Password changed. You will need to re-login.');
      setShowChangePw(false);
      logout();
    } catch (err) {
      console.error('change pw failed', err);
      alert(err?.data?.error || err?.error || err.message || JSON.stringify(err));
    } finally {
      setChanging(false);
      setCurrentPw('');
      setNewPw('');
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow mb-4 px-4 py-2 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Link to="/" className="flex items-center gap-2">
              <img src="/static/img/wireflowlogo_small.png" alt="Wireflow" className="h-9 w-auto" />
            </Link>
            {/* New workflow quick icon */}
            <Link to="/editor/new" title="New workflow" className="relative inline-flex items-center">
              <img src="/static/img/wireflow_new.png" alt="New workflow" className="h-8 w-auto" />
              <span className="absolute right-0 bottom-0 -mr-1 -mb-1 bg-yellow-400 text-black rounded-full text-xs w-5 h-5 flex items-center justify-center transform scale-75">
                <span className="inline-block transform scale-125">+</span>
              </span>
            </Link>
            {/* left-side admin link removed (admin button moved to far right) */}
            <button onClick={() => setShowTagManager(true)} title="Manage tags" aria-label="Manage tags" className="flex items-center">
              {/* styled icon (bigger and blue) */}
              <span className="relative inline-flex">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded bg-white border border-gray-200" style={{ transform: 'scaleX(-1)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {/* taller tag-like shape (flipped via container transform) */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 10v7a2 2 0 0 1-2 2h-7l-7-7 9-9 7 7z" />
                    <circle cx="9" cy="6" r="1.4" fill="currentColor" />
                  </svg>
                </span>
                <span className="absolute right-0 bottom-0 -mr-1 -mb-1 bg-yellow-400 text-black rounded-full text-xs w-5 h-5 flex items-center justify-center transform scale-75">
                  <span className="inline-block transform scale-125">…</span>
                </span>
              </span>
            </button>
          </div>
          <div className="text-sm text-gray-600 flex gap-4 items-center">
            <span>Teams: {totals.teams}</span>
            <span>Owners: {totals.owners}</span>
            <span>Tags: {totals.tags}</span>
            <span>Workflows: {totals.workflows}</span>
            <span>Nodes: {totals.nodes}</span>
            {user ? (
              <div className="ml-4 flex items-center gap-2">
                <span className="text-xs">{user.username} ({user.role})</span>
                <button title="Change password" onClick={() => setShowChangePw(true)} className="px-2 py-1 bg-gray-100 rounded text-xs">🔑</button>
                <button onClick={logout} className="px-2 py-1 bg-gray-200 rounded text-xs">Logout</button>
              </div>
            ) : (
              <div className="ml-4">
                <Login onLogin={onLogin} />
              </div>
            )}
            {
              (() => {
                const ver = import.meta.env.VITE_APP_VERSION || '0.0.0';
                const sha = import.meta.env.VITE_COMMIT_SHA || import.meta.env.VITE_GIT_SHA || '';
                const date = import.meta.env.VITE_BUILD_DATE || '';
                const parts = [`v${ver}`];
                if (sha) parts.push(`commit:${sha}`);
                if (date) parts.push(`built:${date}`);
                const title = parts.join(' | ');
                return (
                  <>
                    <span title={title} className="ml-auto text-xs text-gray-600 font-mono" aria-label={title}>
                      {`v${ver}`}
                    </span>
                    {user && user.role === 'admin' && (
                      <Link to="/admin" title="Admin" className="ml-3 inline-flex items-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded bg-white border border-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M3 12h18M3 18h18" />
                          </svg>
                        </span>
                      </Link>
                    )}
                  </>
                );
              })()
            }
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<WorkflowList token={token} role={user?.role} />} />
          <Route path="/editor/:id" element={<WorkflowEditor token={token} role={user?.role} />} />
          <Route path="/editor/new" element={<WorkflowEditor token={token} role={user?.role} />} />
          <Route path="/admin" element={<AdminTasks token={token} role={user?.role} />} />
        </Routes>
        {/* Change password modal */}
  <TagManager isOpen={showTagManager} onClose={() => setShowTagManager(false)} token={token} onTagsUpdate={() => window.location.reload()} />
        {showChangePw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded shadow-lg p-6 min-w-[300px] max-w-[90vw]">
              <h3 className="font-semibold mb-2">Change password for {user?.username}</h3>
              <div className="mb-2">
                <input type="password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="mb-2">
                <input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowChangePw(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                <button onClick={changePassword} disabled={changing} className="px-3 py-1 bg-blue-600 text-white rounded">{changing ? 'Saving...' : 'Change'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;