import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { useApp } from '../context/AppContext.jsx';
import { ReportCard, Skeletons, ErrorBox, Empty } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';
export default function Dashboard() {
  useTitle('Dashboard'); const { user } = useApp();
  const stats = useFetch('/dashboard/stats'), recent = useFetch('/dashboard/recent'), mine = useFetch('/reports/my-reports?limit=5'), all = useFetch('/reports?limit=50');
  const s = stats.data;
  return (
    <div className="stack">
      <div className="row between"><div><h1 style={{ fontSize: '1.6rem' }}>Hello, {user.name.split(' ')[0]}</h1><p className="mute">Community overview</p></div><Link to="/report/new" className="btn"><PlusCircle size={16} />Report an Issue</Link></div>
      {stats.error ? <ErrorBox message={stats.error} onRetry={stats.reload} /> :
        <div className="grid g4">{[['Total reports', s?.total], ['Reported', s?.byStatus.Reported], ['Under review', s?.byStatus['Under Review']], ['Resolved', s?.byStatus.Resolved]].map(([l, v]) => <div className="card" key={l}><div className="stat">{v ?? '…'}</div><p className="small mute">{l}</p></div>)}</div>}
      <div className="grid g2">
        <section className="stack"><h2>Report locations</h2>{all.loading ? <div className="sk" style={{ height: 340 }} /> : <MapView reports={all.data?.reports || []} />}</section>
        <section className="stack"><h2>Recently submitted</h2>{recent.loading ? <Skeletons /> : recent.error ? <ErrorBox message={recent.error} onRetry={recent.reload} /> : recent.data.reports.length ? recent.data.reports.slice(0, 4).map((r) => <ReportCard key={r._id} r={r} />) : <Empty title="No reports yet">Submit the first one.</Empty>}</section>
      </div>
      <section className="stack"><h2>My recent reports</h2>{mine.loading ? <Skeletons n={2} /> : mine.error ? <ErrorBox message={mine.error} onRetry={mine.reload} /> : mine.data.reports.length ? <div className="grid g2">{mine.data.reports.map((r) => <ReportCard key={r._id} r={r} />)}</div> : <Empty title="You haven't reported anything yet">Your submissions will appear here.</Empty>}</section>
    </div>
  );
}
