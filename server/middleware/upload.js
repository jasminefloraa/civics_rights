import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { HttpError } from './error.js';
export const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export const parseImage = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_r, f, cb) => ALLOWED.includes(f.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG and WebP images are allowed.'))
}).single('image');
// Verify the real file type from magic bytes; never trust the client MIME type alone.
function sniff(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}
// Saves the file and returns its URL; throws a clear error when storage is not configured.
export function saveImage(file) {
  if (!file) return '';
  if (process.env.IMAGE_STORAGE !== 'local')
    throw new HttpError(503, 'Image uploads are not configured on this server. Submit without a photo or ask the administrator to enable storage.');
  const ext = sniff(file.buffer);
  if (!ext) throw new HttpError(400, 'The file is not a valid JPG, PNG or WebP image.');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, name), file.buffer);
  return `/uploads/${name}`;
}
