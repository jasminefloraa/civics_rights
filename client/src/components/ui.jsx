import { Link } from 'react-router-dom';
import { MapPin, Image as Img, AlertCircle } from 'lucide-react';
import { assetUrl, fmt } from '../services/api.js';
export const StatusBadge = ({ status }) => <span className={`badge s-${status.replace(' ', '-')}`}>{status}</span>;
export const Skeletons = ({ n = 3 }) => <div className="stack" aria-busy="true">{Array.from({ length: n }, (_, i) => <div key={i} className="sk" />)}</div>;
export const ErrorBox = ({ message, onRetry }) => (
  <div className="card empty" role="alert"><AlertCircle /><p>{message}</p>{onRetry && <button className="btn sec sm" style={{ marginTop: 12 }} onClick={onRetry}>Try again</button>}</div>
);
export const Empty = ({ title, children }) => <div className="card empty"><h3>{title}</h3><p className="small">{children}</p></div>;
export function ReportCard({ r }) {
  return (
    <Link to={`/reports/${r._id}`} className="card rc">
      {r.imageUrl ? <img className="thumb" src={assetUrl(r.imageUrl)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /> : <div className="thumb" aria-hidden><Img size={20} /></div>}
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ gap: 8 }}><StatusBadge status={r.status} /><span className="small mute">{r.category}</span></div>
        <h3 style={{ margin: '6px 0 2px' }}>{r.title}</h3>
        <p className="small mute"><MapPin size={12} /> {r.locationName} · {fmt(r.createdAt)}</p>
      </div>
    </Link>
  );
}
export function Confirm({ title, text, onYes, onNo, busy }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ct"><div className="card stack">
      <h2 id="ct">{title}</h2><p className="mute">{text}</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn sec" onClick={onNo}>Cancel</button><button className="btn" disabled={busy} onClick={onYes}>{busy ? 'Working…' : 'Confirm'}</button></div>
    </div></div>
  );
}
export const Field = ({ label, error, children, id }) => <div className={`field ${error ? 'bad' : ''}`}><label htmlFor={id}>{label}</label>{children}{error && <p className="err" role="alert">{error}</p>}</div>;
