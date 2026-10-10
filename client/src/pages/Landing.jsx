import { Link } from 'react-router-dom';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { ReportCard, Skeletons, ErrorBox } from '../components/ui.jsx';
export default function Landing() {
  useTitle('Report local problems');
  const stats = useFetch('/dashboard/stats'), recent = useFetch('/dashboard/recent');
  const s = stats.data;
  return (<>
    <section className="hero"><div className="container stack" style={{ maxWidth: 760 }}>
      <h1>Report local problems. Make your community better.</h1>
      <p className="mute" style={{ fontSize: '1.1rem' }}>CivicSignal lets residents report potholes, broken streetlights, water leaks and more, check whether a problem has already been reported, and follow each report from submission to resolution.</p>
      <div className="row"><Link to="/report/new" className="btn">Report an Issue</Link><Link to="/explore" className="btn sec">Explore Reports</Link></div>
    </div></section>
    <section className="container" style={{ padding: '32px 20px' }}>
      <div className="grid g3" aria-live="polite">
        {[['Total reports', s?.total], ['Resolved reports', s?.resolved], ['Active reports', s?.active]].map(([l, v]) => (
          <div className="card" key={l}><div className="stat">{stats.error ? '—' : v ?? '…'}</div><p className="mute small">{l}</p></div>))}
      </div>
    </section>
    <section id="how" className="container" style={{ padding: '8px 20px 32px' }}>
      <h2 style={{ marginBottom: 16 }}>How it works</h2>
      <div className="grid g3">
        {[['Report', 'Describe the problem, pin it on the map and attach a photo.'], ['Check', 'We compare it with nearby reports in the same category so you can avoid duplicates.'], ['Track', 'Follow status changes recorded by administrators on a public timeline.']].map(([t, d], i) => (
          <div key={t} className="card stack"><div className="step-n">{i + 1}</div><h3>{t}</h3><p className="mute small">{d}</p></div>))}
      </div>
    </section>
    <section className="container" style={{ padding: '0 20px 48px' }}>
      <h2 style={{ marginBottom: 16 }}>Recently reported</h2>
      {recent.loading ? <Skeletons /> : recent.error ? <ErrorBox message={recent.error} onRetry={recent.reload} /> :
        recent.data.reports.length ? <div className="grid g2">{recent.data.reports.map((r) => <ReportCard key={r._id} r={r} />)}</div> : <p className="mute">No reports yet. Be the first to report an issue.</p>}
    </section>
  </>);
}
