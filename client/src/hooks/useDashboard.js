import { useState, useEffect, useCallback } from 'react';
import * as dashboardApi from '../api/dashboard.api';

export function useDashboard(range) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rangeKey = JSON.stringify({
    from: range?.from?.toISOString?.() ?? null,
    to: range?.to?.toISOString?.() ?? null,
  });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await dashboardApi.getSummary(range);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}