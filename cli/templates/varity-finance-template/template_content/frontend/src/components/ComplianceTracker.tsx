import React, { useState } from 'react';
import {
  DashboardHeader,
  KPICard,
  DataTable,
  AnalyticsChart
} from '@varity-labs/ui-kit';
import { useCompliance } from '../hooks/useCompliance';
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  TrendingDown
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import type { ComplianceReport, ComplianceFilter } from '../types';

/**
 * ComplianceTracker - AML/KYC compliance monitoring dashboard
 *
 * Features:
 * - Real-time compliance status monitoring
 * - AML transaction screening
 * - KYC verification status tracking
 * - Regulatory reporting
 * - Audit trail and documentation
 * - Compliance alerts and notifications
 */
export const ComplianceTracker: React.FC = () => {
  const [filter, setFilter] = useState<ComplianceFilter>({
    framework: '{{ regulatory_framework }}',
    status: 'all',
    severity: 'all'
  });

  const {
    reports,
    metrics,
    amlAlerts,
    kycStatus,
    loading,
    error
  } = useCompliance(filter);

  const complianceColumns = [
    {
      key: 'reportId',
      label: 'Report ID',
      render: (report: ComplianceReport) => (
        <span className="font-mono text-sm">{report.id}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (report: ComplianceReport) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FileText className="w-3 h-3" />
          {report.type}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (report: ComplianceReport) => {
        const statusConfig = {
          passed: { color: 'green', icon: CheckCircle },
          failed: { color: 'red', icon: AlertCircle },
          pending: { color: 'yellow', icon: Clock }
        };
        const config = statusConfig[report.status] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
            <Icon className="w-3 h-3" />
            {report.status}
          </span>
        );
      }
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (report: ComplianceReport) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          report.severity === 'high' ? 'bg-red-100 text-red-800' :
          report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {report.severity}
        </span>
      )
    },
    {
      key: 'timestamp',
      label: 'Date',
      render: (report: ComplianceReport) => formatDate(report.timestamp)
    },
    {
      key: 'framework',
      label: 'Framework',
      render: (report: ComplianceReport) => report.framework.toUpperCase()
    }
  ];

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error loading compliance data</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Compliance Tracker"
        subtitle="AML/KYC monitoring and regulatory compliance"
        icon={<Shield className="w-6 h-6" />}
      />

      {/* Compliance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Compliance Score"
          value={`${((metrics?.complianceScore || 0) * 100).toFixed(1)}%`}
          change={metrics?.scoreChange || 0}
          icon={<Shield className="w-5 h-5" />}
          trend={metrics?.scoreTrend || 'up'}
          variant="success"
        />
        <KPICard
          title="Active Alerts"
          value={metrics?.activeAlerts || 0}
          change={metrics?.alertsChange || 0}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={metrics?.alertsTrend || 'down'}
          variant="warning"
        />
        <KPICard
          title="Pending KYC"
          value={kycStatus?.pending || 0}
          change={kycStatus?.pendingChange || 0}
          icon={<Clock className="w-5 h-5" />}
          trend="neutral"
        />
        <KPICard
          title="Reports Filed"
          value={metrics?.reportsFiled || 0}
          change={metrics?.reportsChange || 0}
          icon={<FileText className="w-5 h-5" />}
          trend={metrics?.reportsTrend || 'up'}
        />
      </div>

      {/* AML Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          AML Alerts (Last 30 Days)
        </h3>
        <div className="space-y-3">
          {amlAlerts?.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${
                  alert.severity === 'high' ? 'text-red-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-gray-600'
                }`} />
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{formatDate(alert.timestamp)}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Compliance Score Trend</h3>
          <AnalyticsChart
            data={metrics?.scoreHistory || []}
            type="line"
            xKey="date"
            yKeys={['score']}
            colors={['#0066CC']}
            height={250}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Alert Distribution</h3>
          <AnalyticsChart
            data={metrics?.alertDistribution || []}
            type="pie"
            dataKey="value"
            nameKey="category"
            height={250}
          />
        </div>
      </div>

      {/* Compliance Reports Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={complianceColumns}
          data={reports}
          loading={loading}
          pagination={{
            enabled: true,
            pageSize: 15
          }}
          searchable={true}
          exportable={true}
          onRowClick={(report) => {
            console.log('Report clicked:', report.id);
          }}
        />
      </div>
    </div>
  );
};

export default ComplianceTracker;
