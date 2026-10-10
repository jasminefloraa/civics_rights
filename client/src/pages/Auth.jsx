import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useTitle } from '../hooks/useFetch.js';
import { Field } from '../components/ui.jsx';
export default function Auth({ mode }) {
  const reg = mode === 'register'; useTitle(reg ? 'Create account' : 'Log in');
  const { user, login, register, toast } = useApp(), nav = useNavigate(), loc = useLocation();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' }), [errs, setErrs] = useState({}), [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); const er = {};
    if (reg && f.name.trim().length < 2) er.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = 'Enter a valid email address.';
    if (reg && (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) er.password = 'At least 8 characters with a letter and a number.';
    if (!reg && !f.password) er.password = 'Enter your password.';
    if (reg && f.password !== f.confirm) er.confirm = 'Passwords do not match.';
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { reg ? await register({ name: f.name, email: f.email, password: f.password }) : await login(f.email, f.password); nav(loc.state?.from || '/dashboard', { replace: true }); }
    catch (x) { setErrs(x.errors || {}); toast(x.message, true); } finally { setBusy(false); }
  };
  return (
    <div className="container" style={{ maxWidth: 440, padding: '48px 20px' }}>
      <form className="card stack" onSubmit={submit} noValidate>
        <h2>{reg ? 'Create your account' : 'Welcome back'}</h2>
        {reg && <Field id="n" label="Full name" error={errs.name}><input id="n" autoComplete="name" value={f.name} onChange={set('name')} /></Field>}
        <Field id="e" label="Email address" error={errs.email}><input id="e" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field id="p" label="Password" error={errs.password}><input id="p" type="password" autoComplete={reg ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} /></Field>
        {reg && <Field id="c" label="Confirm password" error={errs.confirm}><input id="c" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></Field>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        <p className="small mute">{reg ? <>Already registered? <Link to="/login"><u>Log in</u></Link></> : <>New here? <Link to="/register"><u>Create an account</u></Link></>}</p>
      </form>
    </div>
  );
}
