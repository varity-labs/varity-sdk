import { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from '../api/client';
import type { Transaction, TransactionFilter, TransactionMetrics, APIError } from '../types';

export const useTransactions = (filter: TransactionFilter) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<TransactionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txResponse, metricsResponse] = await Promise.all([
        transactionAPI.getTransactions(filter),
        transactionAPI.getMetrics(filter)
      ]);

      if (txResponse.success) {
        setTransactions(txResponse.data);
      }

      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }

      setError(null);
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch transactions',
        code: err.code || 'UNKNOWN_ERROR'
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions,
    metrics,
    loading,
    error,
    refetch: fetchData
  };
};
