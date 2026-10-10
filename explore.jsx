import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { CATEGORIES, STATUSES, qs } from '../services/api.js';
import { ReportCard, Skeletons, ErrorBox, Empty } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';
export default function Explore() {
  useTitle('Explore reports');
  const [sp] = useSearchParams(), c0 = CATEGORIES.includes(sp.get('category')) ? sp.get('category') : '';
  const [f, setF] = useState({ q: '', category: c0, status: '', from: '', to: '', sort: 'newest', page: 1 }), [debounced, setD] = useState(f), [view, setView] = useState('list');
  useEffect(() => { const t = setTimeout(() => setD(f), 300); return () => clearTimeout(t); }, [f]);
  const { data, loading, error, reload } = useFetch(`/reports?${qs({ ...debounced, limit: view === 'map' ? 50 : 9 })}`);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value, page: 1 });
  const p = data?.pagination;
  return (
    <div className="container stack" style={{ padding: '28px 20px' }}>
      <div className="row between"><h1 style={{ fontSize: '1.6rem' }}>Explore reports</h1><div className="tabs" role="tablist"><button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>List</button><button role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>Map</button></div></div>
      <div className="card grid g3">
        <div><label htmlFor="q">Search</label><div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 10, top: 13, color: '#777' }} /><input id="q" style={{ paddingLeft: 32 }} placeholder="Title, description or location" value={f.q} onChange={up('q')} /></div></div>
        <div><label htmlFor="cat">Category</label><select id="cat" value={f.category} onChange={up('category')}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label htmlFor="st">Status</label><select id="st" value={f.status} onChange={up('status')}><option value="">All statuses</option>{STATUSES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label htmlFor="fr">From date</label><input id="fr" type="date" value={f.from} onChange={up('from')} /></div>
        <div><label htmlFor="to">To date</label><input id="to" type="date" value={f.to} onChange={up('to')} /></div>
        <div><label htmlFor="so">Sort by</label><select id="so" value={f.sort} onChange={up('sort')}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="updated">Recently updated</option></select></div>
      </div>
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Skeletons /> : !data.reports.length ? <Empty title="No reports match your filters">Try clearing the search or filters.</Empty> : view === 'map' ? (<>
        <MapView className="tall" reports={data.reports} />{data.reports.some((r) => !r.location) && <p className="small mute">Reports without coordinates are not shown on the map.</p>}</>) : (<>
        <div className="grid g2" style={{ opacity: loading ? .6 : 1 }}>{data.reports.map((r) => <ReportCard key={r._id} r={r} />)}</div>
        <div className="row between"><span className="small mute">{p.total} report{p.total !== 1 && 's'} · page {p.page} of {p.pages}</span><div className="row"><button className="btn sec sm" disabled={p.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Previous</button><button className="btn sec sm" disabled={p.page >= p.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next</button></div></div></>)}
    </div>
  );
}