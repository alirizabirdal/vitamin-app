import { redis } from '../lib/redis.js';

// Telefonun bildirim kaydını saklar (endpoint başına bir kayıt).
export default async function handler(req, res) {
  const sub = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!sub.endpoint || !String(sub.endpoint).startsWith('https://')) return res.status(400).json({ ok: false });

  if (req.method === 'POST') {
    await redis.hset('subs', { [sub.endpoint]: JSON.stringify(sub) });
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await redis.hdel('subs', sub.endpoint);
    return res.status(200).json({ ok: true });
  }
  res.status(405).json({ ok: false });
}
