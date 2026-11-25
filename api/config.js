import { getVapid } from '../lib/redis.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { publicKey } = await getVapid();
    res.status(200).json({ publicKey });
  } catch (e) {
    res.status(200).json({ publicKey: '' });
  }
}
