import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Copy, History, Map as MapIcon, Search, ShieldCheck, MapPin } from 'lucide-react';
import { useFetch, useTitle } from '../hooks/useFetch.js';
import { CATEGORIES } from '../services/api.js';
import { ReportCard, Skeletons, ErrorBox, StatusBadge } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';

// Counts up from 0 when scrolled into view. Shows the real number immediately if motion is reduced.
function CountUp({ value }) {
  const ref = useRef(), [n, setN] = useState(0);
  useEffect(() => {
    if (value == null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(value);
    let raf; const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect(); const t0 = performance.now();
      const tick = (t) => { const p = Math.min(1, (t - t0) / 1000); setN(Math.round(value * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current); return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{value == null ? '…' : n}</span>;
}

const STAGES = [
  ['Reported', 'Report received and visible to the community.'],
  ['Under Review', 'An administrator is checking the details.'],
  ['In Progress', 'Work to fix the problem has started.'],
  ['Resolved', 'The problem has been fixed and the report is closed.']
];
// Illustration only: shows how status tracking works. It is labelled as an example, not real data.
function LiveDemo() {
  const [i, setI] = useState(0), [hold, setHold] = useState(false);
  useEffect(() => { if (hold) return; const t = setInterval(() => setI((x) => (x + 1) % STAGES.length), 2600); return () => clearInterval(t); }, [hold]);
  return (
    <div className="card demo stack" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} aria-label="Example of status tracking">
      <div className="row between"><span className="small mute">Example report (illustration)</span><StatusBadge status={STAGES[i][0]} /></div>
      <div><h3>Broken streetlight on Sample Road</h3><p className="small mute"><MapPin size={12} /> Sample Road, Demo City</p></div>
      <div className="track" aria-hidden><div style={{ width: `${((i + 1) / STAGES.length) * 100}%` }} /></div>
      <div className="demo-steps">{STAGES.map(([s], k) => <button key={s} className={k === i ? 'on' : k < i ? 'done' : ''} onClick={() => { setI(k); setHold(true); }}>{s}</button>)}</div>
      <p className="small" aria-live="polite">{STAGES[i][1]}</p>
      <p className="small mute">Click a stage to preview it. Real reports show this timeline with the administrator's notes.</p>
    </div>
  );
}

const STEPS = [
  ['Report', 'Describe the problem, choose a category, click the map (or use your location) and add a photo. Coordinates and photos are optional.'],
  ['Check', 'Before saving, CivicSignal compares your report with others in the same category by distance and wording, and shows possible matches. You decide whether yours is separate.'],
  ['Track', 'Every status change by an administrator is recorded with a date and optional note, so you can follow the report until it is resolved.']
];
const FEATURES = [
  [MapIcon, 'Interactive map', 'Browse reports on OpenStreetMap and open any marker to see details.'],
  [Copy, 'Duplicate check', 'Similar nearby reports are flagged before you submit. A transparent scoring method, not AI.'],
  [Camera, 'Photo evidence', 'Attach a JPG, PNG or WebP photo up to 5 MB, verified on the server.'],
  [Search, 'Search and filters', 'Find reports by keyword, category, status and date, with sorting and paging.'],
  [History, 'Status history', 'A timeline shows who changed a status, when, and why.'],
  [ShieldCheck, 'Admin review', 'Only administrators can change statuses. Owners can edit their report until it is reviewed.']
];
const FAQ = [
  ['Do I need an account to browse?', 'No. Anyone can explore reports and the map. You need an account to submit a report.'],
  ['Do you need my location?', 'Never by default. "Use my location" only asks your browser for permission when you click it. You can also click the map or type coordinates.'],
  ['Can I edit a report after submitting?', 'Yes, until an administrator moves it out of "Reported". After that it is locked so the record stays accurate.'],
  ['What if my problem is already reported?', 'We will show similar reports before you submit. You can open them, or continue if yours is a different problem.']
];

export default function Landing() {
  useTitle('Report local problems');
  const stats = useFetch('/dashboard/stats'), recent = useFetch('/dashboard/recent'), all = useFetch('/reports?limit=50');
  const s = stats.data, [step, setStep] = useState(0);
  return (<>
    <section className="hero"><div className="container hero2">
      <div className="stack">
        <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>Community problem reporting</span>
        <h1>Report local problems. <em>Make your community better.</em></h1>
        <p className="mute" style={{ fontSize: '1.1rem' }}>Report potholes, broken streetlights, water leaks and more. Check whether a problem is already reported, then follow it from submission to resolution.</p>
        <div className="row"><Link to="/report/new" className="btn">Report an Issue <ArrowRight size={16} /></Link><Link to="/explore" className="btn sec">Explore Reports</Link></div>
      </div>
      <LiveDemo />
    </div></section>

    <section className="container band" style={{ paddingBottom: 0 }}>
      <div className="grid g3" aria-live="polite">
        {[['Total reports', s?.total], ['Resolved reports', s?.resolved], ['Active reports', s?.active]].map(([l, v]) => (
          <div className="card" key={l}><div className="stat">{stats.error ? '—' : <CountUp value={v} />}</div><p className="mute small">{l}</p></div>))}
      </div>
    </section>

    <section className="container band">
      <div className="sec-h"><h2>What is going wrong near you?</h2><p className="mute">Pick a category to see the reports already filed.</p></div>
      <div className="chips">{CATEGORIES.map((c) => <Link key={c} className="chip" to={`/explore?category=${encodeURIComponent(c)}`}>{c}</Link>)}</div>
    </section>

    <section id="how" className="container band" style={{ paddingTop: 0 }}>
      <div className="sec-h"><h2>How it works</h2></div>
      <div className="steps-ui">
        <div role="tablist" aria-label="Steps">{STEPS.map(([t], i) => (
          <button key={t} role="tab" aria-selected={step === i} className={`step-tab ${step === i ? 'on' : ''}`} onClick={() => setStep(i)}><span className="step-n">{i + 1}</span><strong>{t}</strong></button>))}</div>
        <div className="card stack" role="tabpanel"><span className="step-n">{step + 1}</span><h3>{STEPS[step][0]}</h3><p className="mute">{STEPS[step][1]}</p>
          <div className="row">{step < 2 ? <button className="btn sec sm" onClick={() => setStep(step + 1)}>Next step</button> : <Link to="/report/new" className="btn sm">Try it now</Link>}</div></div>
      </div>
    </section>

    <section id="features" className="band dark"><div className="container">
      <div className="sec-h"><h2>Built for real follow-through</h2><p className="mute">Everything a resident or administrator needs, and nothing that pretends to work.</p></div>
      <div className="grid g3">{FEATURES.map(([Icon, t, d]) => <div key={t} className="card feat" style={{ color: '#111' }}><div className="ico"><Icon size={20} /></div><h3>{t}</h3><p className="small mute">{d}</p></div>)}</div>
    </div></section>

    <section className="container band">
      <div className="row between sec-h" style={{ maxWidth: 'none' }}><div><h2>Live map of reports</h2><p className="mute small">Pins come straight from the database. Reports without coordinates are not plotted.</p></div><Link to="/explore" className="btn sec sm">Open full explorer</Link></div>
      {all.loading ? <div className="sk" style={{ height: 340 }} /> : all.error ? <ErrorBox message={all.error} onRetry={all.reload} /> : <MapView reports={all.data.reports} />}
    </section>

    <section className="container band" style={{ paddingTop: 0 }}>
      <div className="sec-h"><h2>Recently reported</h2></div>
      {recent.loading ? <Skeletons /> : recent.error ? <ErrorBox message={recent.error} onRetry={recent.reload} /> :
        recent.data.reports.length ? <div className="grid g2">{recent.data.reports.map((r) => <ReportCard key={r._id} r={r} />)}</div> : <p className="mute">No reports yet. Be the first to report an issue.</p>}
    </section>

    <section className="container band" style={{ paddingTop: 0 }}>
      <div className="sec-h"><h2>Questions</h2></div>
      <div className="faq card">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p className="mute small">{a}</p></details>)}</div>
    </section>

    <section className="container" style={{ paddingBottom: 56 }}>
      <div className="cta"><div><h2>See a problem? Say something.</h2><p>It takes about a minute.</p></div><Link to="/register" className="btn">Create a free account <ArrowRight size={16} /></Link></div>
    </section>
  </>);
}