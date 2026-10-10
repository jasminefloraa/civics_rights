import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LocateFixed, X } from 'lucide-react';
import { api, CATEGORIES, assetUrl } from '../services/api.js';
import { useApp } from '../context/AppContext.jsx';
import { useTitle } from '../hooks/useFetch.js';
import { Field, StatusBadge } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';
const empty = { title: '', category: '', description: '', locationName: '', latitude: '', longitude: '' };
export default function ReportForm() {
  useTitle('Report an issue'); const { toast } = useApp(), nav = useNavigate();
  const [f, setF] = useState(empty), [errs, setErrs] = useState({}), [file, setFile] = useState(null), [preview, setPreview] = useState(''), [busy, setBusy] = useState(false), [dups, setDups] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { if (!file) return setPreview(''); const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);
  const pickFile = (e) => {
    const x = e.target.files[0]; if (!x) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(x.type)) { setErrs({ ...errs, image: 'Use a JPG, PNG or WebP image.' }); e.target.value = ''; return; }
    if (x.size > 5 * 1024 * 1024) { setErrs({ ...errs, image: 'Image must be 5 MB or smaller.' }); e.target.value = ''; return; }
    setErrs({ ...errs, image: '' }); setFile(x);
  };
  const locate = () => {
    if (!navigator.geolocation) return toast('Geolocation is not available in this browser. Click the map or enter coordinates.', true);
    navigator.geolocation.getCurrentPosition((p) => setF((o) => ({ ...o, latitude: +p.coords.latitude.toFixed(6), longitude: +p.coords.longitude.toFixed(6) })),
      () => toast('Location permission was denied or unavailable. Click the map or enter coordinates manually.', true), { timeout: 10000 });
  };
  const validate = () => {
    const e = {}; const t = f.title.trim(), d = f.description.trim();
    if (t.length < 5 || t.length > 120) e.title = 'Title must be 5-120 characters.';
    if (!f.category) e.category = 'Choose a category.';
    if (d.length < 10 || d.length > 2000) e.description = 'Description must be 10-2000 characters.';
    if (f.locationName.trim().length < 2) e.locationName = 'Enter an address or location name.';
    const has = f.latitude !== '' || f.longitude !== '';
    if (has && (f.latitude === '' || f.longitude === '' || Math.abs(f.latitude) > 90 || Math.abs(f.longitude) > 180)) e.latitude = 'Enter a valid latitude (-90 to 90) and longitude (-180 to 180), or clear both.';
    return e;
  };
  const create = async () => {
    setBusy(true);
    try {
      const fd = new FormData(); Object.entries(f).forEach(([k, v]) => v !== '' && fd.append(k, v)); if (file) fd.append('image', file);
      const { report } = await api('/reports', { method: 'POST', form: fd });
      toast('Report submitted. Thank you.'); nav(`/reports/${report._id}`);
    } catch (x) { setErrs(x.errors || {}); toast(x.message, true); } finally { setBusy(false); }
  };
  const submit = async (e) => {
    e.preventDefault(); const er = validate(); setErrs(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { const { matches } = await api('/reports/check-duplicates', { method: 'POST', body: f }); if (matches.length) { setDups(matches); setBusy(false); return; } }
    catch { /* duplicate check is advisory; continue if it fails */ }
    await create();
  };
  const picker = f.latitude !== '' && f.longitude !== '' ? { lat: +f.latitude, lng: +f.longitude } : null;
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: '1.6rem' }}>Report an issue</h1>
      {dups && (
        <div className="card dup stack" role="alert"><h2>Similar reports already exist</h2><p className="small mute">Matched by category, distance and wording. Please check whether your problem is already reported.</p>
          {dups.map((d) => <div key={d._id} className="card row between"><div><strong>{d.title}</strong><p className="small mute">{d.locationName}{d.distanceMeters != null && ` · ${d.distanceMeters} m away`}</p></div><div className="row"><StatusBadge status={d.status} /><Link className="btn sec sm" to={`/reports/${d._id}`} target="_blank">Open</Link></div></div>)}
          <div className="row"><button className="btn" disabled={busy} onClick={create}>{busy ? 'Submitting…' : 'This is a separate issue, submit anyway'}</button><button className="btn sec" onClick={() => setDups(null)}>Go back and edit</button></div></div>)}
      <form className="card stack" onSubmit={submit} noValidate>
        <Field id="t" label="Issue title" error={errs.title}><input id="t" maxLength={120} value={f.title} onChange={set('title')} /></Field>
        <Field id="c" label="Category" error={errs.category}><select id="c" value={f.category} onChange={set('category')}><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field id="d" label={`Detailed description (${f.description.length}/2000)`} error={errs.description}><textarea id="d" maxLength={2000} value={f.description} onChange={set('description')} /></Field>
        <Field id="l" label="Address or location name" error={errs.locationName}><input id="l" value={f.locationName} onChange={set('locationName')} /></Field>
        <div className="stack"><div className="row between"><label style={{ margin: 0 }}>Pin the location (click the map)</label><button type="button" className="btn sec sm" onClick={locate}><LocateFixed size={14} />Use my location</button></div>
          <MapView picker={picker} onPick={(p) => setF((o) => ({ ...o, latitude: p.lat, longitude: p.lng }))} />
          <div className="grid g2"><Field id="la" label="Latitude" error={errs.latitude}><input id="la" type="number" step="any" value={f.latitude} onChange={set('latitude')} /></Field><Field id="lo" label="Longitude" error={errs.longitude}><input id="lo" type="number" step="any" value={f.longitude} onChange={set('longitude')} /></Field></div>
          <p className="small mute">Coordinates are optional. Without them the report is listed but not shown on the map.</p></div>
        <Field id="i" label="Photograph (optional, JPG/PNG/WebP, max 5 MB)" error={errs.image}>
          {preview ? <div className="row"><img src={preview} alt="Selected upload preview" style={{ maxWidth: 160, borderRadius: 8 }} /><button type="button" className="btn sec sm" onClick={() => setFile(null)}><X size={14} />Remove</button></div> : <input id="i" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} />}</Field>
        <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Submit report'}</button>
      </form>
    </div>
  );
}
