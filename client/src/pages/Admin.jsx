import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { api, CATEGORIES, STATUSES, fmt, qs } from '../services/api.js';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge, Skeletons, ErrorBox, Empty } from '../components/ui.jsx';
export default function Admin() {
  useTitle('Administration'); const { toast } = useApp();
  const [f, setF] = useState({ q: '', category: '', status: '', page: 1 }), [dq, setDq] = useState(f), [sel, setSel] = useState(null), [next, setNext] = useState(''), [note, setNote] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDq(f), 300); return () => clearTimeout(t); }, [f]);
  const stats = useFetch('/admin/stats'), users = useFetch('/admin/users'), list = useFetch(`/admin/reports?${qs({ ...dq, limit: 10 })}`);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value, page: 1 });
  const save = async () => {
    setBusy(true);
    try { await api(`/admin/reports/${sel._id}/status`, { method: 'PATCH', body: { status: next, note } }); toast('Status updated.'); setSel(null); setNote(''); list.reload(); stats.reload(); }
    catch (e) { toast(e.message, true); } finally { setBusy(false); }
  };
  const p = list.data?.pagination;
  return (
    <div className="stack">
      <h1 style={{ fontSize: '1.6rem' }}>Administration</h1>
      {stats.error ? <ErrorBox message={stats.error} onRetry={stats.reload} /> : <div className="grid g4">{[['Reports', stats.data?.total], ['Registered users', stats.data?.users], ...STATUSES.map((s) => [s, stats.data?.byStatus[s]])].map(([l, v]) => <div className="card" key={l}><div className="stat">{v ?? '…'}</div><p className="small mute">{l}</p></div>)}</div>}
      <section className="card stack"><h2>Review reports</h2>
        <div className="grid g3"><input aria-label="Search reports" placeholder="Search…" value={f.q} onChange={up('q')} /><select aria-label="Category" value={f.category} onChange={up('category')}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select><select aria-label="Status" value={f.status} onChange={up('status')}><option value="">All statuses</option>{STATUSES.map((c) => <option key={c}>{c}</option>)}</select></div>
        {list.loading && !list.data ? <Skeletons n={3} /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : !list.data.reports.length ? <Empty title="No reports found">Adjust the filters.</Empty> : (
          <div className="scroll"><table><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>
            {list.data.reports.map((r) => <tr key={r._id}><td><Link to={`/reports/${r._id}`}><u>{r.title}</u></Link></td><td>{r.category}</td><td><StatusBadge status={r.status} /></td><td>{fmt(r.createdAt)}</td><td><button className="btn sec sm" onClick={() => { setSel(r); setNext(r.status); setNote(''); }}>Update status</button></td></tr>)}</tbody></table></div>)}
        {p && <div className="row between"><span className="small mute">Page {p.page} of {p.pages || 1}</span><div className="row"><button className="btn sec sm" disabled={p.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Previous</button><button className="btn sec sm" disabled={p.page >= p.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next</button></div></div>}
      </section>
      <section className="card stack"><h2>Registered users</h2>{users.loading ? <Skeletons n={2} /> : users.error ? <ErrorBox message={users.error} onRetry={users.reload} /> : <div className="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{users.data.users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{fmt(u.createdAt)}</td></tr>)}</tbody></table></div>}</section>
      {sel && <div className="modal" role="dialog" aria-modal="true" aria-labelledby="us"><div className="card stack"><h2 id="us">Update status</h2><p className="small mute">{sel.title}</p>
        <div><label htmlFor="ns">New status</label><select id="ns" value={next} onChange={(e) => setNext(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label htmlFor="nn">Note (optional)</label><textarea id="nn" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 80 }} /></div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn sec" onClick={() => setSel(null)}>Cancel</button><button className="btn" disabled={busy || next === sel.status} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></div></div></div>}
    </div>
  );
}
