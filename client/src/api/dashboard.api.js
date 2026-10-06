import client from './client';

/**
 * Fetch dashboard summary for a date range.
 *
 * @param {Object} params
 *   @property {string} [params.from] - ISO datetime string
 *   @property {string} [params.to]   - ISO datetime string
 *
 * @param {Object} [config]
 *   @property {AbortSignal} [config.signal] - optional AbortSignal
 *
 * @returns {Promise<Object>} dashboard summary payload
 */
export async function getSummary(params = {}, config = {}) {
  const { data } = await client.get('/dashboard/summary', {
    params,
    signal: config.signal,
  });
  return data;
}

/* ---- keep any additional exports your app uses ---- */

// Example: if you also have these, keep them:
//
// export async function getByCategory(params = {}, config = {}) {
//   const { data } = await client.get('/dashboard/by-category', {
//     params,
//     signal: config.signal,
//   });
//   return data;
// }
//
// export async function getByMonth(params = {}, config = {}) {
//   const { data } = await client.get('/dashboard/by-month', {
//     params,
//     signal: config.signal,
//   });
//   return data;
// }