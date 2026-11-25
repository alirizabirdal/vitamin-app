import { Redis } from '@upstash/redis';
import webpush from 'web-push';

// Vercel'in Upstash entegrasyonu KV_REST_API_* ya da UPSTASH_REDIS_REST_* adlarıyla ekler; ikisi de çalışır.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  automaticDeserialization: false,
  enableAutoPipelining: false
});

// Türkiye saatine göre tarih ve saat
const parts = d => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
}).formatToParts(d).map(p => [p.type, p.value]));
export const istanbulDay = (d = new Date()) => { const p = parts(d); return `${p.year}-${p.month}-${p.day}`; };
export const istanbulTime = (d = new Date()) => { const p = parts(d); return { h: +p.hour, m: +p.minute }; };

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Bildirim (VAPID) anahtarları: ortam değişkeni varsa onu kullanır,
// yoksa ilk çalışmada üretip Redis'te saklar. Elle anahtar girmeye gerek yok.
export async function getVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  const saved = await redis.get('vapid');
  if (saved) return JSON.parse(saved);
  const keys = webpush.generateVAPIDKeys();
  const ok = await redis.set('vapid', JSON.stringify(keys), { nx: true });
  return ok ? keys : JSON.parse(await redis.get('vapid'));
}
