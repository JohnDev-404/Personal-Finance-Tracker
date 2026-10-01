import { useState, useEffect, useCallback } from 'react';
import * as transactionApi from '../api/transaction.api';

export function useTransactions(filters = {}) {
  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters are an object; stringify so the effect dependency comparison is stable.
  const filtersKey = JSON.stringify(filters);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await transactionApi.listTransactions(filters);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...data, loading, error, refetch };
}