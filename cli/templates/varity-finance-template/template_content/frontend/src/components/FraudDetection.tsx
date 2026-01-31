import React, { useState } from 'react';
import {
  DashboardHeader,
  KPICard,
  AnalyticsChart,
  DataTable,
  AIChat
} from '@varity-labs/ui-kit';
import { useFraudDetection } from '../hooks/useFraudDetection';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  Brain,
  Target,
  Activity
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { FraudAlert } from '../types';

/**
 * FraudDetection - AI-powered fraud detection and investigation
 *
 * Features:
 * - Real-time fraud detection using Varity AI models
 * - Anomaly detection and pattern recognition
 * - Fraud score calculation and trending
 * - Investigation workflow
 * - AI-powered fraud analysis chat
 * - Automated alert system
 */
export const FraudDetection: React.FC = () => {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const {
    alerts,
    metrics,
    patterns,
    loading,
    error,
    investigateAlert,
    resolveAlert
  } = useFraudDetection();

  const fraudColumns = [
    {
      key: 'id',
      label: 'Alert ID',
      render: (alert: FraudAlert) => (
        <span className="font-mono text-sm">{alert.id.slice(0, 8)}...</span>
      )
    },
    {
      key: 'type',
      label: 'Fraud Type',
      render: (alert: FraudAlert) => (
        <div>
          <p className="font-medium">{alert.fraudType}</p>
          <p className="text-xs text-gray-600">{alert.pattern}</p>
        </div>
      )
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      render: (alert: FraudAlert) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                alert.riskScore > 0.7 ? 'bg-red-600' :
                alert.riskScore > 0.4 ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
              style={{ width: `${alert.riskScore * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium">{(alert.riskScore * 100).toFixed(0)}%</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (alert: FraudAlert) => (
        <span className="font-semibold text-red-600">{formatCurrency(alert.amount)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (alert: FraudAlert) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
          alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {alert.status}
        </span>
      )
    },
    {
      key: 'confidence',
      label: 'AI Confidence',
      render: (alert: FraudAlert) => (
        <span className="text-sm">{(alert.aiConfidence * 100).toFixed(1)}%</span>
      )
    },
    {
      key: 'detectedAt',
      label: 'Detected',
      render: (alert: FraudAlert) => formatDate(alert.detectedAt)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (alert: FraudAlert) => (
        <div className="flex gap-2">
          {alert.status === 'open' && (
            <>
              <button
                onClick={() => investigateAlert(alert.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Investigate
              </button>
              <button
                onClick={() => resolveAlert(alert.id, 'false_positive')}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error loading fraud detection data</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Fraud Detection"
        subtitle="AI-powered fraud detection and investigation"
        icon={<ShieldAlert className="w-6 h-6" />}
      />

      {/* Fraud Detection Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Active Alerts"
          value={metrics?.activeAlerts || 0}
          change={metrics?.alertsChange || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={metrics?.alertsTrend || 'down'}
          variant="danger"
        />
        <KPICard
          title="Blocked Amount"
          value={formatCurrency(metrics?.blockedAmount || 0)}
          change={metrics?.blockedChange || 0}
          icon={<ShieldAlert className="w-5 h-5" />}
          trend={metrics?.blockedTrend || 'up'}
          variant="success"
        />
        <KPICard
          title="Detection Rate"
          value={`${((metrics?.detectionRate || 0) * 100).toFixed(1)}%`}
          change={metrics?.rateChange || 0}
          icon={<Target className="w-5 h-5" />}
          trend={metrics?.rateTrend || 'up'}
        />
        <KPICard
          title="False Positive Rate"
          value={`${((metrics?.falsePositiveRate || 0) * 100).toFixed(1)}%`}
          change={metrics?.fpChange || 0}
          icon={<TrendingDown className="w-5 h-5" />}
          trend="down"
        />
      </div>

      {/* AI Fraud Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Fraud Patterns
          </h3>
          <div className="space-y-3">
            {patterns?.slice(0, 5).map((pattern) => (
              <div
                key={pattern.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pattern.name}</span>
                  <span className="text-sm text-gray-600">{pattern.occurrences} occurrences</span>
                </div>
                <p className="text-sm text-gray-600">{pattern.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${pattern.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{(pattern.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Fraud Trend Analysis</h3>
          <AnalyticsChart
            data={metrics?.fraudTrend || []}
            type="line"
            xKey="date"
            yKeys={['detected', 'blocked', 'falsePositive']}
            colors={['#EF4444', '#10B981', '#F59E0B']}
            height={250}
          />
        </div>
      </div>

      {/* AI Chat for Fraud Investigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Fraud Analyst
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ask the AI about fraud patterns, suspicious transactions, or investigation insights.
        </p>
        <AIChat
          systemPrompt="You are a fraud detection expert. Help analyze suspicious transactions and patterns."
          ragNamespace="industry-finance-rag"
          placeholder="Ask about fraud patterns or suspicious activity..."
          height="300px"
        />
      </div>

      {/* Fraud Alerts Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={fraudColumns}
          data={alerts}
          loading={loading}
          pagination={{
            enabled: true,
            pageSize: 15
          }}
          searchable={true}
          exportable={true}
          onRowClick={(alert) => {
            setSelectedAlert(alert.id);
            console.log('Alert selected:', alert.id);
          }}
        />
      </div>
    </div>
  );
};

export default FraudDetection;
