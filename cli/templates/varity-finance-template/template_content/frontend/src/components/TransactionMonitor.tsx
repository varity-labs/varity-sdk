import React, { useState, useEffect } from 'react';
import {
  DataTable,
  KPICard,
  AnalyticsChart,
  DashboardHeader
} from '@varity-labs/ui-kit';
import { useTransactions } from '../hooks/useTransactions';
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Transaction, TransactionFilter } from '../types';

/**
 * TransactionMonitor - Real-time transaction tracking and monitoring
 *
 * Features:
 * - Live transaction feed with auto-refresh
 * - Advanced filtering by amount, date, status, type
 * - Fraud detection alerts
 * - Transaction analytics and trends
 * - Export capabilities
 */
export const TransactionMonitor: React.FC = () => {
  const [filter, setFilter] = useState<TransactionFilter>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
    status: 'all',
    minAmount: null,
    maxAmount: null
  });

  const {
    transactions,
    loading,
    error,
    metrics,
    refetch
  } = useTransactions(filter);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const transactionColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (tx: Transaction) => (
        <span className="font-mono text-sm">{tx.id.slice(0, 8)}...</span>
      )
    },
    {
      key: 'timestamp',
      label: 'Date/Time',
      render: (tx: Transaction) => formatDate(tx.timestamp)
    },
    {
      key: 'from',
      label: 'From',
      render: (tx: Transaction) => (
        <div className="max-w-[150px] truncate">{tx.from}</div>
      )
    },
    {
      key: 'to',
      label: 'To',
      render: (tx: Transaction) => (
        <div className="max-w-[150px] truncate">{tx.to}</div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (tx: Transaction) => (
        <span className="font-semibold">{formatCurrency(tx.amount)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (tx: Transaction) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          tx.status === 'flagged' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {tx.status === 'completed' && <CheckCircle className="w-3 h-3" />}
          {tx.status === 'flagged' && <AlertTriangle className="w-3 h-3" />}
          {tx.status}
        </span>
      )
    },
    {
      key: 'riskScore',
      label: 'Risk',
      render: (tx: Transaction) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          tx.riskScore > 0.7 ? 'bg-red-100 text-red-800' :
          tx.riskScore > 0.4 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {(tx.riskScore * 100).toFixed(0)}%
        </span>
      )
    }
  ];

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error loading transactions</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Transaction Monitor"
        subtitle="Real-time transaction tracking and fraud detection"
        icon={<Activity className="w-6 h-6" />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Transactions"
          value={metrics?.totalTransactions || 0}
          change={metrics?.transactionChange || 0}
          icon={<Activity className="w-5 h-5" />}
          trend={metrics?.transactionTrend || 'up'}
        />
        <KPICard
          title="Transaction Volume"
          value={formatCurrency(metrics?.totalVolume || 0)}
          change={metrics?.volumeChange || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={metrics?.volumeTrend || 'up'}
        />
        <KPICard
          title="Flagged Transactions"
          value={metrics?.flaggedCount || 0}
          change={metrics?.flaggedChange || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={metrics?.flaggedTrend || 'down'}
          variant="warning"
        />
        <KPICard
          title="Average Risk Score"
          value={`${((metrics?.avgRiskScore || 0) * 100).toFixed(1)}%`}
          change={metrics?.riskChange || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={metrics?.riskTrend || 'down'}
        />
      </div>

      {/* Transaction Volume Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction Volume Trend</h3>
        <AnalyticsChart
          data={metrics?.volumeChart || []}
          type="area"
          xKey="date"
          yKeys={['volume', 'count']}
          colors={['#0066CC', '#00AA55']}
          height={300}
        />
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={transactionColumns}
          data={transactions}
          loading={loading}
          pagination={{
            enabled: true,
            pageSize: 20
          }}
          searchable={true}
          exportable={true}
          onRowClick={(tx) => {
            // Navigate to transaction detail
            console.log('Transaction clicked:', tx.id);
          }}
        />
      </div>
    </div>
  );
};

export default TransactionMonitor;
