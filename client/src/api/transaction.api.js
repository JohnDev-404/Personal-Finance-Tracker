import client from './client';

export async function listTransactions(params = {}) {
  const res = await client.get('/transactions', { params });
  return res.data; // { items, pagination }
}

export async function createTransaction(data) {
  const res = await client.post('/transactions', data);
  return res.data.transaction;
}

export async function updateTransaction(id, data) {
  const res = await client.patch(`/transactions/${id}`, data);
  return res.data.transaction;
}

export async function deleteTransaction(id) {
  await client.delete(`/transactions/${id}`);
}