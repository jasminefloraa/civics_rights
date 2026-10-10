import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { useApp } from '../context/AppContext.jsx';
import { api, assetUrl, fmt, CATEGORIES } from '../services/api.js';
import { StatusBadge, Skeletons, ErrorBox, Confirm, Field } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';
export default function ReportDetail() {
  const { id } = useParams(), { user, toast } = useApp(), nav = useNavigate();
  const { data, loading, error, reload } = useFetch(`/reports/${id}`);
  const [del, setDel] = useState(false), [busy, setBusy] = useState(false), [edit, setEdit] = useState(null), [errs, setErrs] = useState({});
  const r = data?.report; useTitle(r?.title || 'Report');
  if (loading) return <div className="container" style={{ padding: 28 }}><Skeletons /></div>;
  if (error) return <div className="container" style={{ padding: 28 }}><ErrorBox message={error} onRetry={reload} /><Link to="/explore" className="btn sec" style={{ marginTop: 12 }}>Back to reports</Link></div>;
  const owner = user && String(r.createdBy?._id) === String(user._id), canChange = owner && r.status === 'Reported';
  const remove = async () => { setBusy(true); try { await api(`/reports/${id}`, { method: 'DELETE' }); toast('Report deleted.'); nav('/dashboard'); } catch (e) { toast(e.message, true); setDel(false); } finally { setBusy(false); } };
  const save = async (e) => { e.preventDefault(); setBusy(true); try { await api(`/reports/${id}`, { method: 'PATCH', body: edit }); toast('Report updated.'); setEdit(null); setErrs({}); reload(); } catch (x) { setErrs(x.errors || {}); toast(x.message, true); } finally { setBusy(false); } };
  return (
    <div className="container stack" style={{ padding: '28px 20px' }}>
      <Link to="/explore" className="small"><u>← Back to reports</u></Link>
      <div className="card stack">
        <div className="row between"><StatusBadge status={r.status} />{canChange && !edit && <div className="row"><button className="btn sec sm" onClick={() => setEdit({ title: r.title, description: r.description, category: r.category, locationName: r.locationName })}>Edit</button><button className="btn danger sm" onClick={() => setDel(true)}>Delete</button></div>}</div>
        {edit ? <form className="stack" onSubmit={save}>
          <Field id="et" label="Title" error={errs.title}><input id="et" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field id="ec" label="Category" error={errs.category}><select id="ec" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field id="ed" label="Description" error={errs.description}><textarea id="ed" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <Field id="el" label="Location" error={errs.locationName}><input id="el" value={edit.locationName} onChange={(e) => setEdit({ ...edit, locationName: e.target.value })} /></Field>
          <div className="row"><button className="btn" disabled={busy}>Save changes</button><button type="button" className="btn sec" onClick={() => setEdit(null)}>Cancel</button></div></form> : <>
          <h1 style={{ fontSize: '1.7rem' }}>{r.title}</h1>
          <p className="small mute">{r.category} · {r.locationName} · Reported by {r.createdBy?.name || 'a community member'} on {fmt(r.createdAt)} · Updated {fmt(r.updatedAt)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{r.description}</p></>}
        {r.imageUrl && <img src={assetUrl(r.imageUrl)} alt={`Photo for ${r.title}`} style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 10, objectFit: 'contain', background: '#f5f5f5' }} onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('p'), { textContent: 'Photograph is unavailable.', className: 'small mute' })); }} />}
      </div>
      <div className="grid g2">
        <div className="card stack"><h2>Location</h2>{r.location ? <MapView reports={[r]} /> : <p className="mute small">No map coordinates were provided for this report.</p>}</div>
        <div className="card stack"><h2>Status timeline</h2><div className="tl">{[...r.statusHistory].reverse().map((h, i) => <div key={i}><strong>{h.newStatus}</strong>{h.previousStatus && <span className="small mute"> (from {h.previousStatus})</span>}<p className="small mute">{fmt(h.changedAt)}{h.changedBy?.name && ` · ${h.changedBy.name}`}</p>{h.note && <p className="small">{h.note}</p>}</div>)}</div></div>
      </div>
      {del && <Confirm title="Delete this report?" text="This permanently removes the report and cannot be undone." busy={busy} onYes={remove} onNo={() => setDel(false)} />}
    </div>
  );
}
