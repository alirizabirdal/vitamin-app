import { redis, DAY_RE } from '../lib/redis.js';

// "Bu akşam içildi" bilgisini tutar; içildiyse 22:00 / 22:30 bildirimleri gönderilmez.
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!DAY_RE.test(body.day || '')) return res.status(400).json({ ok: false });
    await redis.set('taken:' + body.day, '1', { ex: 60 * 60 * 72 });
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const day = String(req.query.day || '');
    if (!DAY_RE.test(day)) return res.status(400).json({ ok: false });
    await redis.del('taken:' + day);
    return res.status(200).json({ ok: true });
  }
  res.status(405).json({ ok: false });
}
