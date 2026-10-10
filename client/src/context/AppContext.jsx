import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [toasts, setToasts] = useState([]);
  useEffect(() => { api('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const toast = useCallback((message, bad = false) => {
    const id = Math.random(); setToasts((t) => [...t, { id, message, bad }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const login = async (email, password) => setUser((await api('/auth/login', { method: 'POST', body: { email, password } })).user);
  const register = async (b) => setUser((await api('/auth/register', { method: 'POST', body: b })).user);
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); };
  return (
    <Ctx.Provider value={{ user, setUser, loading, login, register, logout, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.bad ? 'bad' : ''}`}>{t.message}</div>)}</div>
    </Ctx.Provider>
  );
}
