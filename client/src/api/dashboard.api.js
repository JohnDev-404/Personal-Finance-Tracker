import client from './client';

export async function getSummary({ from, to } = {}) {
  const params = {};
  if (from) params.from = from.toISOString();
  if (to) params.to = to.toISOString();
  const res = await client.get('/dashboard/summary', { params });
  return res.data;
}