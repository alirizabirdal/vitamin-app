import { Redis } from '@upstash/redis';

// Vercel'in Upstash entegrasyonu KV_REST_API_* ya da UPSTASH_REDIS_REST_* adlarıyla ekler; ikisi de çalışır.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  automaticDeserialization: false,
  enableAutoPipelining: false
});

// Türkiye saatine göre bugünün tarihi: "2026-11-25"
export const istanbulDay = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
