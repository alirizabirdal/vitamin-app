import webpush from 'web-push';
import { redis, istanbulDay } from '../lib/redis.js';

const MAIN = [
  'Miyav! Vitamin saati geldi 🌼',
  'Kedi uyandı, vitamininizi bekliyor 🐾',
  'Saat 22:00, yasemin açmak için sizi bekliyor 🌼',
  'Mırr... Vitamin zamanı, Yasemin Hanım 💛'
];
const LATE = [
  'Kedi hâlâ bekliyor... Vitamini unutmayalım mı? 🐾',
  'Küçük bir hatırlatma: bu akşamki vitamin henüz içilmedi 🌼'
];
const pick = a => a[Math.floor(Math.random() * a.length)];

// Dışarıdan (cron-job.org) çağrılır: /api/cron?key=GIZLI  ve  /api/cron?key=GIZLI&type=late
export default async function handler(req, res) {
  const given = String(req.query.key || '') || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!process.env.CRON_SECRET || given !== process.env.CRON_SECRET) return res.status(401).json({ ok: false });

  const late = req.query.type === 'late';
  const day = istanbulDay();
  if (await redis.get('taken:' + day)) return res.status(200).json({ ok: true, skipped: 'already taken', day });

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subs = (await redis.hgetall('subs')) || {};
  const payload = JSON.stringify({ title: 'Vitamin saati', body: pick(late ? LATE : MAIN) });
  let sent = 0, removed = 0;

  await Promise.all(Object.entries(subs).map(async ([endpoint, raw]) => {
    try {
      await webpush.sendNotification(JSON.parse(raw), payload, { TTL: 60 * 60, urgency: 'high' });
      sent++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) { await redis.hdel('subs', endpoint); removed++; }
    }
  }));

  res.status(200).json({ ok: true, day, late, sent, removed });
}
