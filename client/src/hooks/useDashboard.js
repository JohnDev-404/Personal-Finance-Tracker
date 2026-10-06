import { useState, useEffect, useCallback, useRef } from 'react';
import * as dashboardApi from '../api/dashboard.api';

/**
 * useDashboard
 *
 * `range` shape: { from: string|null, to: string|null, label: string }
 *   • from/to are ISO datetime strings (from computeRange)
 *   • null means "no filter" — the param is skipped entirely
 */
export function useDashboard(range) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stable key — just the two date strings, nothing else
  const rangeKey = `${range?.from ?? ''}|${range?.to ?? ''}`;

  const abortRef = useRef(null);

  const refetch = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');

    // Build params — only include what's actually set
    const params = {};
    if (range?.from) params.from = range.from;
    if (range?.to) params.to = range.to;

    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log('[useDashboard] GET /dashboard', params);
    }

    try {
      const result = await dashboardApi.getSummary(params, {
        signal: controller.signal,
      });

      if (import.meta?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.log('[useDashboard] response:', result);
      }

      setData(result);
    } catch (err) {
      // Ignore aborts — they're expected when the range changes
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;

      // eslint-disable-next-line no-console
      console.error('[useDashboard] failed:', err);

      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to load dashboard'
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  useEffect(() => {
    refetch();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [refetch]);

  return { data, loading, error, refetch };
}