import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
// Leaflet's default marker images break under bundlers; use a simple monochrome divIcon instead.
const icon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:50%;background:#000;border:3px solid #fff;box-shadow:0 0 0 1px #000"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
export const DEFAULT_CENTER = [Number(import.meta.env.VITE_MAP_LAT) || 13.0827, Number(import.meta.env.VITE_MAP_LNG) || 80.2707];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// reports: array with location.coordinates [lng, lat]. picker: {lat,lng}|null + onPick -> click-to-select mode.
export default function MapView({ reports = [], picker, onPick, center, className = '', zoom = 12 }) {
  const el = useRef(), map = useRef(), layer = useRef(), pick = useRef(), nav = useNavigate();
  useEffect(() => {
    map.current = L.map(el.current).setView(center || DEFAULT_CENTER, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    if (onPick) map.current.on('click', (e) => onPick({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }));
    return () => map.current.remove();
  }, []); // eslint-disable-line
  useEffect(() => {
    layer.current.clearLayers();
    const pts = [];
    reports.forEach((r) => {
      const c = r.location?.coordinates; if (!c || c.length !== 2) return; // reports without coordinates are simply not plotted
      const m = L.marker([c[1], c[0]], { icon }).addTo(layer.current);
      m.bindPopup(`<strong>${esc(r.title)}</strong><br>${esc(r.category)} · ${esc(r.status)}<br><a href="/reports/${esc(r._id)}" data-id="${esc(r._id)}">Open report</a>`);
      m.on('popupopen', (e) => { const a = e.popup.getElement().querySelector('a[data-id]'); a && (a.onclick = (ev) => { ev.preventDefault(); nav(`/reports/${a.dataset.id}`); }); });
      pts.push([c[1], c[0]]);
    });
    if (pts.length > 1) map.current.fitBounds(pts, { padding: [30, 30], maxZoom: 15 }); else if (pts.length === 1) map.current.setView(pts[0], 15);
  }, [reports, nav]);
  useEffect(() => {
    if (pick.current) { pick.current.remove(); pick.current = null; }
    if (picker?.lat != null && picker?.lng != null) { pick.current = L.marker([picker.lat, picker.lng], { icon }).addTo(map.current); map.current.setView([picker.lat, picker.lng], Math.max(map.current.getZoom(), 15)); }
  }, [picker?.lat, picker?.lng]);
  return <div ref={el} className={`map ${className}`} role="application" aria-label="Map" />;
}
