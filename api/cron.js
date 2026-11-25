import webpush from 'web-push';
import { redis, istanbulDay, istanbulTime, getVapid } from '../lib/redis.js';

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
const TEST = ['Deneme bildirimi: kedi hazır, akşam 22:00\'de görüşürüz 🐾'];
const pick = a => a[Math.floor(Math.random() * a.length)];

// cron-job.org bu adresi 22:00 ve 22:30'da çağırır: /api/cron
// Hangi bildirimin gideceğine Türkiye saatine bakarak kendisi karar verir.
// Aynı akşam aynı bildirim bir kez gider, adres kaç kez açılırsa açılsın.
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && String(req.query.key || '') !== process.env.CRON_SECRET)
    return res.status(401).json({ ok: false });

  const day = istanbulDay();
  const { h, m } = istanbulTime();
  const kind = h === 22 && m < 30 ? 'main' : (h === 22 || h === 23) ? 'late' : 'test';

  if (kind !== 'test' && await redis.get('taken:' + day))
    return res.status(200).json({ ok: true, kind, skipped: 'already taken', day });

  // tekrar gönderimi engelle (deneme bildirimi saatte en fazla bir kez)
  const lock = kind === 'test' ? `sent:${day}:test:${h}` : `sent:${day}:${kind}`;
  if (!(await redis.set(lock, '1', { nx: true, ex: 60 * 60 * 48 })))
    return res.status(200).json({ ok: true, kind, skipped: 'already sent', day });

  const { publicKey, privateKey } = await getVapid();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:vitamin@example.com', publicKey, privateKey);

  const subs = (await redis.hgetall('subs')) || {};
  const payload = JSON.stringify({ title: 'Vitamin saati', body: pick(kind === 'late' ? LATE : kind === 'test' ? TEST : MAIN) });
  let sent = 0, removed = 0;

  await Promise.all(Object.entries(subs).map(async ([endpoint, raw]) => {
    try {
      await webpush.sendNotification(JSON.parse(raw), payload, { TTL: 60 * 60, urgency: 'high' });
      sent++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) { await redis.hdel('subs', endpoint); removed++; }
    }
  }));

  res.status(200).json({ ok: true, kind, day, sent, removed });
}
