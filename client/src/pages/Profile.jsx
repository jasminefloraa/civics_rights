import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { Field, ReportCard, Skeletons } from '../components/ui.jsx';
export default function Profile() {
  useTitle('Profile'); const { user, setUser, logout, toast } = useApp(), nav = useNavigate(), sum = useFetch('/users/me/summary');
  const [name, setName] = useState(user.name), [pw, setPw] = useState({ currentPassword: '', newPassword: '' }), [errs, setErrs] = useState({}), [busy, setBusy] = useState('');
  const run = (key, fn) => async (e) => { e.preventDefault(); setBusy(key); setErrs({}); try { await fn(); } catch (x) { setErrs(x.errors || {}); toast(x.message, true); } finally { setBusy(''); } };
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: '1.6rem' }}>Profile</h1>
      <div className="grid g2">
        <form className="card stack" onSubmit={run('n', async () => { const d = await api('/users/me', { method: 'PATCH', body: { name } }); setUser(d.user); toast('Name updated.'); })}>
          <h2>Your details</h2><p className="small mute">{user.email} · {sum.data ? `${sum.data.reportCount} report${sum.data.reportCount !== 1 ? 's' : ''}` : '…'}</p>
          <Field id="pn" label="Full name" error={errs.name}><input id="pn" value={name} onChange={(e) => setName(e.target.value)} /></Field><button className="btn" disabled={busy === 'n'}>Save name</button></form>
        <form className="card stack" onSubmit={run('p', async () => { await api('/users/me/password', { method: 'PATCH', body: pw }); setPw({ currentPassword: '', newPassword: '' }); toast('Password changed.'); })}>
          <h2>Change password</h2>
          <Field id="cp" label="Current password" error={errs.currentPassword}><input id="cp" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field id="np" label="New password" error={errs.newPassword}><input id="np" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field><button className="btn" disabled={busy === 'p'}>Update password</button></form>
      </div>
      <section className="stack"><h2>Recent submissions</h2>{sum.loading ? <Skeletons n={2} /> : sum.data?.recent.length ? sum.data.recent.map((r) => <ReportCard key={r._id} r={r} />) : <p className="mute small">No submissions yet.</p>}</section>
      <div><button className="btn sec" onClick={async () => { await logout(); nav('/'); }}>Log out</button></div>
    </div>
  );
}
