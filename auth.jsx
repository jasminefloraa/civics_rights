import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, Circle, Eye, EyeOff, MapPin, Copy, History } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useTitle } from '../hooks/useFetch.js';
import { Field } from '../components/ui.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rules = (p) => [['8+ characters', p.length >= 8], ['A letter', /[A-Za-z]/.test(p)], ['A number', /\d/.test(p)], ['A symbol or 12+ characters', /[^A-Za-z0-9]/.test(p) || p.length >= 12]];
function PasswordInput({ id, value, onChange, onBlur, auto }) {
  const [show, setShow] = useState(false);
  return (<div className="pwbox"><input id={id} type={show ? 'text' : 'password'} autoComplete={auto} value={value} onChange={onChange} onBlur={onBlur} />
    <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>);
}

export default function Auth({ mode }) {
  const reg = mode === 'register'; useTitle(reg ? 'Create account' : 'Log in');
  const { user, login, register, toast } = useApp(), nav = useNavigate(), loc = useLocation();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' }), [touched, setT] = useState({}), [srv, setSrv] = useState({}), [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setSrv({ ...srv, [k]: '' }); };
  const blur = (k) => () => setT({ ...touched, [k]: true });
  const r = rules(f.password), score = r.filter(([, ok]) => ok).length;
  const errs = {};
  if (reg && f.name.trim().length < 2) errs.name = 'Enter your full name.';
  if (!EMAIL.test(f.email)) errs.email = 'Enter a valid email address.';
  if (reg ? !(r[0][1] && r[1][1] && r[2][1]) : !f.password) errs.password = reg ? 'Meet the first three requirements below.' : 'Enter your password.';
  if (reg && f.password !== f.confirm) errs.confirm = 'Passwords do not match.';
  const show = (k) => (touched[k] || touched.all ? errs[k] : '') || srv[k];
  const submit = async (e) => {
    e.preventDefault(); setT({ ...touched, all: true }); if (Object.keys(errs).length) return;
    setBusy(true);
    try { reg ? await register({ name: f.name, email: f.email, password: f.password }) : await login(f.email, f.password); nav(loc.state?.from || '/dashboard', { replace: true }); }
    catch (x) { setSrv(x.errors || {}); toast(x.message, true); } finally { setBusy(false); }
  };
  const perks = [[MapPin, 'Pin problems on the map', 'Click the map or use your location, only when you choose to.'], [Copy, 'Avoid duplicates', 'We show similar nearby reports before you submit.'], [History, 'Follow every update', 'See each status change with the date and notes.']];
  return (
    <div className="authwrap">
      <aside className="authside">
        <span className="eyebrow" style={{ alignSelf: 'flex-start', color: '#111' }}>{reg ? 'Join CivicSignal' : 'Welcome back'}</span>
        <h1 style={{ fontSize: '2.2rem' }}>{reg ? 'Be the signal your neighbourhood needs.' : 'Pick up where you left off.'}</h1>
        <ul>{perks.map(([Icon, t, d]) => <li key={t}><span className="ico" style={{ color: '#111' }}><Icon size={18} /></span><div><strong style={{ color: '#fff' }}>{t}</strong><p className="small">{d}</p></div></li>)}</ul>
      </aside>
      <div className="authform">
        <form className="card stack" onSubmit={submit} noValidate>
          <div><h2>{reg ? 'Create your account' : 'Log in'}</h2><p className="small mute">{reg ? 'Free, and it takes under a minute.' : 'Enter your details to continue.'}</p></div>
          {reg && <Field id="n" label="Full name" error={show('name')}><input id="n" autoComplete="name" value={f.name} onChange={set('name')} onBlur={blur('name')} /></Field>}
          <Field id="e" label="Email address" error={show('email')}><input id="e" type="email" autoComplete="email" value={f.email} onChange={set('email')} onBlur={blur('email')} /></Field>
          <Field id="p" label="Password" error={show('password')}>
            <PasswordInput id="p" auto={reg ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} onBlur={blur('password')} />
            {reg && f.password && (<><div className={`meter ${score === 4 ? 's4' : ''}`} aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} className={i < score ? 'on' : ''} />)}</div>
              <div className="req" aria-live="polite">{r.map(([t, ok]) => <span key={t} className={ok ? 'ok' : ''}>{ok ? <Check size={13} /> : <Circle size={13} />}{t}</span>)}</div></>)}
          </Field>
          {reg && <Field id="c" label="Confirm password" error={show('confirm')}><PasswordInput id="c" auto="new-password" value={f.confirm} onChange={set('confirm')} onBlur={blur('confirm')} />
            {f.confirm && f.password === f.confirm && <p className="small" style={{ marginTop: 4 }}><Check size={13} /> Passwords match</p>}</Field>}
          <button className="btn" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
          <p className="small mute">{reg ? <>Already registered? <Link to="/login"><u>Log in</u></Link></> : <>New here? <Link to="/register"><u>Create an account</u></Link></>}</p>
        </form>
      </div>
    </div>
  );
}