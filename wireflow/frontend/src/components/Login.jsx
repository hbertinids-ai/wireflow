import { useState } from 'react';
import apiFetch from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
      onLogin(data.token, data.user);
    } catch (err) {
      if (err && err.data && err.data.error) setError(err.data.error);
      else setError('Login failed');
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2 items-center">
      <input className="px-2 py-1 border rounded" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
      <input className="px-2 py-1 border rounded" placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="px-2 py-1 bg-blue-600 text-white rounded" type="submit">Login</button>
      {error && <div className="text-red-600 text-sm ml-2">{error}</div>}
    </form>
  );
}
