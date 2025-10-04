import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer';
import apiFetch from '../api';
import TeamManager from './TeamManager';
import OwnerManager from './OwnerManager';

const API = '/admin';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg p-6 min-w-[300px] max-w-[90vw]">
        {children}
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTasks({ token, role }) {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [message, setMessage] = useState('');
  const [backups, setBackups] = useState([]);
  const [backupInfo, setBackupInfo] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreInput, setRestoreInput] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupFilter, setBackupFilter] = useState('');
  const [versionFilter, setVersionFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const navigate = useNavigate();
  const [redirectInSeconds, setRedirectInSeconds] = useState(3);
  const [cancelRedirect, setCancelRedirect] = useState(false);
  const [openTeams, setOpenTeams] = useState(false);
  const [openOwners, setOpenOwners] = useState(false);
  const [openBackups, setOpenBackups] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);

  useEffect(() => {
    if (!token || role !== 'admin') {
      setVersions([]);
      setBackups([]);
      setUsers([]);
      return;
    }
    apiFetch('/admin/workflow-versions', { method: 'GET' }, token).then(setVersions).catch(() => setVersions([]));
    apiFetch('/admin/backups', { method: 'GET' }, token).then(setBackups).catch(() => setBackups([]));
    apiFetch('/auth/users', { method: 'GET' }, token).then(setUsers).catch(() => setUsers([]));
  }, [token, role]);

  useEffect(() => {
    if (token && role === 'admin') return;
    if (cancelRedirect) return;
    let sec = 3;
    setRedirectInSeconds(sec);
    const t = setInterval(() => {
      sec -= 1;
      setRedirectInSeconds(sec);
      if (sec <= 0) {
        clearInterval(t);
        navigate('/');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [token, role, cancelRedirect, navigate]);

  const handlePreview = (versionFile) => {
    apiFetch(`/admin/workflow-versions/${encodeURIComponent(versionFile)}`, { method: 'GET' }, token).then(setPreviewData).catch(console.error);
    setSelectedVersion(versionFile);
  };

  const handleRestore = (versionFile) => {
    apiFetch(`/admin/workflow-versions/restore/${encodeURIComponent(versionFile)}`, { method: 'POST' }, token).then(data => setMessage(data.message || 'Restored!')).catch(console.error);
  };

  const handleBackup = () => {
    apiFetch('/admin/backup', { method: 'POST' }, token).then(data => setMessage(data.message || 'Backup triggered!')).catch(console.error);
  };

  async function createUser(e) {
    e.preventDefault();
    try {
      const resp = await apiFetch('/auth/users', { method: 'POST', body: newUser }, token);
      setUsers(prev => [...prev, resp]);
      setNewUser({ username: '', password: '', role: 'user' });
    } catch (err) {
      console.error('create user failed', err);
      alert(err.message || JSON.stringify(err));
    }
  }

  async function deleteUser(username) {
    if (!confirm(`Delete user ${username}?`)) return;
    try {
      await apiFetch(`/auth/users/${encodeURIComponent(username)}`, { method: 'DELETE' }, token);
      setUsers(prev => prev.filter(u => u.username !== username));
    } catch (err) {
      console.error('delete user failed', err);
      alert(err.message || JSON.stringify(err));
    }
  }

  async function handleBackupInfo(backup) {
    try {
      const info = await apiFetch(`/admin/backups/${encodeURIComponent(backup.file)}/info`, { method: 'GET' }, token);
      setBackupInfo({ ...info, backup });
      setShowInfoModal(true);
    } catch (err) {
      console.error('backup info failed', err);
      alert('Failed to load backup info');
    }
  }

  async function updateUser(username, updates) {
    try {
      const resp = await apiFetch(`/auth/users/${encodeURIComponent(username)}`, { method: 'PUT', body: updates }, token);
      setUsers(prev => prev.map(u => u.username === username ? resp : u));
      setMessage('User updated');
    } catch (err) {
      console.error('update user failed', err);
      alert(err.message || JSON.stringify(err));
    }
  }

  const handleBackupRestore = (file) => {
    setRestoreFile(file);
    setRestoreInput('');
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (restoreInput !== 'Barcelona!') return;
    setShowRestoreModal(false);
    setMessage('Backing up current data...');
    await apiFetch('/admin/backup', { method: 'POST' }, token);
    setMessage('Restoring backup...');
    await apiFetch(`/admin/backups/${encodeURIComponent(restoreFile)}/restore`, { method: 'POST' }, token);
    setMessage('Backup restored!');
    setRestoreFile(null);
  };

  // Derived lists
  const filteredBackups = backups.filter(b => b.file && b.file.toLowerCase().includes(backupFilter.toLowerCase()));
  const filteredVersions = versions.filter(v => v.name && v.name.toLowerCase().includes(versionFilter.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Manage Teams */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between bg-white p-3 border rounded cursor-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={openTeams}
          onClick={() => setOpenTeams(s => !s)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenTeams(s => !s); }}
        >
          <div className="font-semibold">Manage Teams</div>
          <div className="text-gray-500 text-sm">{openTeams ? '▾' : '▸'}</div>
        </div>
        {openTeams && (
          <div className="mt-3">
            <TeamManager inline={true} token={token} hideHeader={true} />
          </div>
        )}
      </div>

      {/* Manage Owners */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between bg-white p-3 border rounded cursor-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={openOwners}
          onClick={() => setOpenOwners(s => !s)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenOwners(s => !s); }}
        >
          <div className="font-semibold">Manage Owners</div>
          <div className="text-gray-500 text-sm">{openOwners ? '▾' : '▸'}</div>
        </div>
        {openOwners && (
          <div className="mt-3">
            <OwnerManager inline={true} token={token} hideHeader={true} />
          </div>
        )}
      </div>

      {/* Admin notice when not admin */}
      <div className="mt-4" />
      {!(token && role === 'admin') && (
        <div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Admin access required.</strong>
              <div className="text-sm">You will be redirected to the home page in {redirectInSeconds} second{redirectInSeconds === 1 ? '' : 's'}.</div>
            </div>
            <div>
              <button onClick={() => setCancelRedirect(true)} className="px-3 py-1 bg-yellow-600 text-white rounded">Stay on page</button>
            </div>
          </div>
        </div>
      )}

      {/* Backups & Versions */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between bg-white p-3 border rounded cursor-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={openBackups}
          onClick={() => setOpenBackups(s => !s)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenBackups(s => !s); }}
        >
          <div className="font-semibold">Backups & Versions</div>
          <div className="text-gray-500 text-sm">{openBackups ? '▾' : '▸'}</div>
        </div>

        {openBackups && (
          <div className="mt-3 bg-white p-4 border rounded">
            <button onClick={handleBackup} className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Trigger Backup</button>
            {message && <div className="mb-4 text-green-700">{message}</div>}

            <h3 className="text-lg font-semibold mb-2">Latest Backups</h3>
            <div className="mb-2">
              <input
                type="text"
                placeholder="Filter backups by filename..."
                value={backupFilter}
                onChange={(e) => setBackupFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-y-auto max-h-64 border rounded p-2 bg-gray-50 mb-4">
              {filteredBackups.length === 0 ? (
                <div>No backups found.</div>
              ) : (
                <ul>
                  {filteredBackups.map(b => (
                    <li key={b.file} className="flex items-center justify-between border-b py-1">
                      <span className="flex-1">
                        <span className="font-semibold">{b.file}</span>
                        <span className="ml-2 text-gray-500 text-xs">{b.date}</span>
                      </span>
                      <span>
                        <button onClick={() => handleBackupInfo(b)} className="text-blue-600 hover:underline mr-2">Info</button>
                        <button onClick={() => handleBackupRestore(b.file)} className="text-red-600 hover:underline">Restore</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Modal open={showInfoModal} onClose={() => setShowInfoModal(false)}>
              {backupInfo && backupInfo.backup ? (
                <>
                  <h4 className="font-bold mb-2">Backup Info - {(() => {
                    const now = new Date();
                    const backupDate = new Date(backupInfo.backup.date);
                    const ageHours = Math.floor((now - backupDate) / (1000 * 60 * 60));
                    return `${ageHours} hours old (${backupInfo.backup.date})`;
                  })()}</h4>
                  <table className="w-full border-collapse border border-gray-300 mb-2">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Teams</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{backupInfo.teams}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Owners</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{backupInfo.owners}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Tags</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{backupInfo.tags}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Workflows</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{backupInfo.workflows}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Nodes</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{backupInfo.nodes}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              ) : (
                <div>Loading...</div>
              )}
            </Modal>

            <Modal open={showRestoreModal} onClose={() => setShowRestoreModal(false)}>
              <h4 className="font-bold mb-2">Restore Backup</h4>
              <p className="mb-2">Type <span className="font-mono bg-gray-100 px-1">Barcelona!</span> to confirm restore. This will backup current data and restore from the selected archive.</p>
              <input className="border px-2 py-1 rounded w-full mb-2" value={restoreInput} onChange={e => setRestoreInput(e.target.value)} placeholder="Type Barcelona! to confirm" />
              <button className={`px-4 py-2 rounded text-white ${restoreInput === 'Barcelona!' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`} disabled={restoreInput !== 'Barcelona!'} onClick={confirmRestore}>Restore</button>
            </Modal>

            <h3 className="text-lg font-semibold mb-2">Last 1000 Workflow Versions</h3>
            <div className="mb-2">
              <input type="text" placeholder="Filter versions by workflow name..." value={versionFilter} onChange={(e) => setVersionFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="overflow-y-auto max-h-64 border rounded p-2 bg-gray-50 mb-4">
              {filteredVersions.length === 0 ? (
                <div>No versions found.</div>
              ) : (
                <ul>
                  {filteredVersions.map(v => (
                    <li key={v.file} className="flex items-center justify-between border-b py-1">
                      <span className="flex-1">
                        <span className="font-semibold">{v.name}</span>
                        <span className="ml-2 text-gray-500 text-xs">{v.date}</span>
                        <span className="ml-2 text-gray-400 text-xs">v{v.version}</span>
                      </span>
                      <span>
                        <button onClick={() => handlePreview(v.file)} className="text-blue-600 hover:underline mr-2">Preview</button>
                        <button onClick={() => handleRestore(v.file)} className="text-red-600 hover:underline">Restore</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {previewData && (
              <div className="border rounded p-3 bg-white shadow">
                <h4 className="font-bold mb-2">Preview: {selectedVersion}</h4>
                <div className="mb-2 text-sm text-gray-600">
                  <strong>{previewData.name || 'Untitled Workflow'}</strong>
                  {previewData.description && <span className="ml-2">- {previewData.description}</span>}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {previewData.nodes?.length || 0} nodes • {previewData.edges?.length || 0} connections
                  {previewData.tags && previewData.tags.length > 0 && (
                    <span className="ml-2">
                      • Tags: {previewData.tags.join(', ')}
                    </span>
                  )}
                </div>
                <div style={{ height: '400px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <ReactFlow
                    nodes={previewData.nodes || []}
                    edges={previewData.edges || []}
                    fitView
                    attributionPosition="bottom-left"
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    zoomOnScroll={false}
                    panOnScroll={false}
                    preventScrolling={false}
                  >
                    <Background color="#aaa" gap={16} />
                    <Controls showInteractive={false} />
                    <MiniMap 
                      nodeColor={(node) => {
                        if (node.type === 'input') return '#86efac';
                        if (node.type === 'output') return '#fca5a5';
                        if (node.type === 'decision') return '#fde047';
                        return '#bfdbfe';
                      }}
                      maskColor="rgba(0, 0, 0, 0.1)"
                    />
                  </ReactFlow>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    View JSON Data
                  </summary>
                  <pre className="text-xs overflow-x-auto max-h-64 mt-2 p-2 bg-gray-50 rounded border">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Management */}
      <div className="mt-6">
        <div
          className="flex items-center justify-between bg-white p-3 border rounded cursor-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={openUsers}
          onClick={() => setOpenUsers(s => !s)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenUsers(s => !s); }}
        >
          <div className="font-semibold">User Management</div>
          <div className="text-gray-500 text-sm">{openUsers ? '▾' : '▸'}</div>
        </div>

        {openUsers && (
          <div className="mt-3 bg-white p-4 border rounded">
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">User Management</h3>
              <div className="mb-3 text-sm text-gray-600">Create a new user (admin only):</div>
              <form onSubmit={createUser} className="flex gap-2 mb-4">
                <input className="p-2 border rounded" placeholder="username" value={newUser.username} onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))} />
                <input type="password" className="p-2 border rounded" placeholder="password" value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))} />
                <select className="p-2 border rounded" value={newUser.role} onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit">Create</button>
              </form>

              <div className="overflow-y-auto max-h-48 border rounded p-2 bg-gray-50">
                {users.length === 0 ? <div>No users found.</div> : (
                  <ul>
                    {users.map(u => (
                      <li key={u.username} className="flex items-center justify-between border-b py-1">
                        <div className="flex-1">
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-gray-500">Role: {u.role}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            const newRole = u.role === 'admin' ? 'user' : 'admin';
                            if (!confirm(`Change role of ${u.username} to ${newRole}?`)) return;
                            updateUser(u.username, { role: newRole });
                          }} className="text-sm px-2 py-1 bg-yellow-400 rounded">Toggle Role</button>
                          <button onClick={() => {
                            const pw = prompt(`Set new password for ${u.username}`);
                            if (!pw) return;
                            updateUser(u.username, { password: pw });
                          }} className="text-sm px-2 py-1 bg-indigo-400 text-white rounded">Set Password</button>
                          <button onClick={() => deleteUser(u.username)} className="text-sm px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
