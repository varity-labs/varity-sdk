import React from 'react';
import {
  DashboardHeader,
  KPICard,
  AnalyticsChart,
  DataTable
} from '@varity-labs/ui-kit';
import { useRiskMetrics } from '../hooks/useRiskMetrics';
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { RiskMetric } from '../types';

/**
 * RiskDashboard - Comprehensive risk monitoring and forecasting
 *
 * Features:
 * - Portfolio risk analysis
 * - VaR (Value at Risk) calculation
 * - Stress testing scenarios
 * - Risk concentration heatmaps
 * - Predictive risk forecasting
 * - Regulatory capital requirements
 */
export const RiskDashboard: React.FC = () => {
  const {
    metrics,
    portfolio,
    stressTests,
    forecast,
    loading,
    error
  } = useRiskMetrics();

  const riskColumns = [
    {
      key: 'category',
      label: 'Risk Category',
      render: (metric: RiskMetric) => (
        <span className="font-medium">{metric.category}</span>
      )
    },
    {
      key: 'exposure',
      label: 'Exposure',
      render: (metric: RiskMetric) => formatCurrency(metric.exposure)
    },
    {
      key: 'var95',
      label: 'VaR (95%)',
      render: (metric: RiskMetric) => formatCurrency(metric.var95)
    },
    {
      key: 'var99',
      label: 'VaR (99%)',
      render: (metric: RiskMetric) => formatCurrency(metric.var99)
    },
    {
      key: 'concentration',
      label: 'Concentration',
      render: (metric: RiskMetric) => formatPercentage(metric.concentration)
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      render: (metric: RiskMetric) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          metric.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
          metric.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {metric.riskLevel}
        </span>
      )
    }
  ];

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error loading risk metrics</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Risk Dashboard"
        subtitle="Portfolio risk analysis and forecasting"
        icon={<Shield className="w-6 h-6" />}
      />

      {/* Risk KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Risk Exposure"
          value={formatCurrency(metrics?.totalExposure || 0)}
          change={metrics?.exposureChange || 0}
          icon={<Activity className="w-5 h-5" />}
          trend={metrics?.exposureTrend || 'up'}
        />
        <KPICard
          title="Portfolio VaR (95%)"
          value={formatCurrency(metrics?.portfolioVaR95 || 0)}
          change={metrics?.varChange || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={metrics?.varTrend || 'down'}
        />
        <KPICard
          title="Risk Score"
          value={`${((metrics?.riskScore || 0) * 100).toFixed(0)}/100`}
          change={metrics?.scoreChange || 0}
          icon={<Target className="w-5 h-5" />}
          trend={metrics?.scoreTrend || 'down'}
          variant={metrics?.riskScore > 0.7 ? 'danger' : 'success'}
        />
        <KPICard
          title="Capital Adequacy"
          value={formatPercentage(metrics?.capitalAdequacy || 0)}
          change={metrics?.capitalChange || 0}
          icon={<Shield className="w-5 h-5" />}
          trend={metrics?.capitalTrend || 'up'}
          variant="success"
        />
      </div>

      {/* Risk Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Exposure by Category</h3>
          <AnalyticsChart
            data={portfolio?.exposureByCategory || []}
            type="bar"
            xKey="category"
            yKeys={['exposure']}
            colors={['#0066CC']}
            height={300}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">VaR Trend (95% Confidence)</h3>
          <AnalyticsChart
            data={metrics?.varHistory || []}
            type="line"
            xKey="date"
            yKeys={['var95', 'var99']}
            colors={['#0066CC', '#EF4444']}
            height={300}
          />
        </div>
      </div>

      {/* Risk Concentration Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Risk Concentration Heatmap
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {portfolio?.concentrationMap?.map((cell, index) => (
            <div
              key={index}
              className="aspect-square rounded flex items-center justify-center text-white text-xs font-medium"
              style={{
                backgroundColor: `rgba(239, 68, 68, ${cell.concentration})`
              }}
              title={`${cell.sector}: ${formatPercentage(cell.concentration)}`}
            >
              {cell.sector.slice(0, 3)}
            </div>
          ))}
        </div>
      </div>

      {/* Stress Testing Scenarios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Stress Testing Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stressTests?.map((test) => (
            <div key={test.id} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium mb-2">{test.scenario}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Potential Loss:</span>
                  <span className="font-medium text-red-600">{formatCurrency(test.potentialLoss)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impact:</span>
                  <span className={`font-medium ${
                    test.impact === 'severe' ? 'text-red-600' :
                    test.impact === 'moderate' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {test.impact}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Probability:</span>
                  <span className="font-medium">{formatPercentage(test.probability)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Forecast */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">30-Day Risk Forecast</h3>
        <AnalyticsChart
          data={forecast?.predictions || []}
          type="area"
          xKey="date"
          yKeys={['predicted', 'upperBound', 'lowerBound']}
          colors={['#0066CC', '#EF4444', '#10B981']}
          height={300}
        />
      </div>

      {/* Risk Metrics Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={riskColumns}
          data={portfolio?.riskMetrics || []}
          loading={loading}
          pagination={{
            enabled: true,
            pageSize: 10
          }}
          searchable={true}
          exportable={true}
        />
      </div>
    </div>
  );
};

export default RiskDashboard;
