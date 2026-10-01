import client from './client';

export async function listCategories() {
  const res = await client.get('/categories');
  return res.data.categories;
}

export async function createCategory(data) {
  const res = await client.post('/categories', data);
  return res.data.category;
}

export async function updateCategory(id, data) {
  const res = await client.patch(`/categories/${id}`, data);
  return res.data.category;
}

export async function deleteCategory(id) {
  await client.delete(`/categories/${id}`);
}