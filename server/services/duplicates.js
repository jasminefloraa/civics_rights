import Report from '../models/Report.js';
// Documented algorithm (no AI/ML). Candidates share the category (Rejected reports are skipped).
//   score = 0.5 * proximity + 0.5 * textSimilarity
//   proximity: 1 - distance/radius when both have coordinates and distance <= radius, else 0
//   textSimilarity: Jaccard overlap of lowercase word sets (title + description, stop-words removed)
// Candidates scoring >= THRESHOLD are returned (max 5). The user decides whether it is a real duplicate.
const STOP = new Set('the a an and or of to in on at is are was it this that with for from near by there very'.split(' '));
const THRESHOLD = 0.2;
export const tokens = (s = '') => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0; for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function scoreCandidate(input, cand, radius) {
  let prox = 0, distance = null;
  const c = cand.location?.coordinates;
  if (input.latitude != null && input.longitude != null && c?.length === 2) {
    distance = haversine(input.latitude, input.longitude, c[1], c[0]);
    if (distance <= radius) prox = 1 - distance / radius;
  }
  const text = jaccard(tokens(`${input.title} ${input.description}`), tokens(`${cand.title} ${cand.description}`));
  return { score: 0.5 * prox + 0.5 * text, distance, text, prox };
}
export async function findDuplicates(input, radius = Number(process.env.DUPLICATE_RADIUS_METERS) || 200) {
  const candidates = await Report.find({ category: input.category, status: { $ne: 'Rejected' } }).sort({ createdAt: -1 }).limit(300).lean();
  return candidates
    .map((c) => ({ c, s: scoreCandidate(input, c, radius) }))
    .filter(({ s }) => s.score >= THRESHOLD)
    .sort((a, b) => b.s.score - a.s.score).slice(0, 5)
    .map(({ c, s }) => ({ _id: c._id, title: c.title, status: c.status, locationName: c.locationName, distanceMeters: s.distance != null ? Math.round(s.distance) : null, score: Number(s.score.toFixed(2)) }));
}
