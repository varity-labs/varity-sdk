/**
 * Finance Industry Dashboard Template
 *
 * Pre-configured dashboard for financial services industry
 * Features: Banking, Compliance, Transactions, Risk Management
 */

import React from 'react'
import { DeployedDashboard } from '../../../modules/templates'

export interface FinanceDashboardProps {
  dashboard: DeployedDashboard
  onCustomize?: (customization: any) => void
  className?: string
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  dashboard,
  onCustomize,
  className = ''
}) => {
  const { customization, metrics, storage } = dashboard

  return (
    <div className={`finance-dashboard ${className}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="branding">
          <h1>{customization.branding?.companyName || 'Finance Dashboard'}</h1>
          <p className="subtitle">Financial Services & Compliance</p>
        </div>
        <div className="metrics-summary">
          <div className="metric">
            <span className="label">Uptime</span>
            <span className="value">{metrics.uptime.toFixed(2)}%</span>
          </div>
          <div className="metric">
            <span className="label">Active Users</span>
            <span className="value">{metrics.activeUsers}</span>
          </div>
          <div className="metric">
            <span className="label">Requests/Day</span>
            <span className="value">{metrics.requestsPerDay.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* KPI Cards */}
        <section className="kpi-section">
          <h2>Key Performance Indicators</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>Total Volume</h3>
              <p className="kpi-value">$1.5M</p>
              <span className="kpi-change positive">+12.5%</span>
            </div>
            <div className="kpi-card">
              <h3>Transactions</h3>
              <p className="kpi-value">1,234</p>
              <span className="kpi-change positive">+8.2%</span>
            </div>
            <div className="kpi-card">
              <h3>Compliance Score</h3>
              <p className="kpi-value">98.5%</p>
              <span className="kpi-change positive">+2.1%</span>
            </div>
            <div className="kpi-card">
              <h3>Risk Rating</h3>
              <p className="kpi-value">Low</p>
              <span className="kpi-badge">Excellent</span>
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section className="transactions-section">
          <h2>Recent Transactions</h2>
          <div className="transaction-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2025-01-31</td>
                  <td>Wire Transfer</td>
                  <td>$50,000</td>
                  <td><span className="status-badge success">Completed</span></td>
                  <td><span className="compliance-badge verified">PCI-DSS</span></td>
                </tr>
                {/* More transactions would be loaded dynamically */}
              </tbody>
            </table>
          </div>
        </section>

        {/* Compliance Dashboard */}
        <section className="compliance-section">
          <h2>Compliance Status</h2>
          <div className="compliance-grid">
            <div className="compliance-item">
              <h4>PCI-DSS</h4>
              <div className="compliance-status verified">
                <span>✓ Compliant</span>
              </div>
              <p className="last-audit">Last Audit: Jan 15, 2025</p>
            </div>
            <div className="compliance-item">
              <h4>SOC 2</h4>
              <div className="compliance-status verified">
                <span>✓ Compliant</span>
              </div>
              <p className="last-audit">Last Audit: Jan 10, 2025</p>
            </div>
            <div className="compliance-item">
              <h4>GDPR</h4>
              <div className="compliance-status verified">
                <span>✓ Compliant</span>
              </div>
              <p className="last-audit">Last Audit: Jan 5, 2025</p>
            </div>
          </div>
        </section>

        {/* Storage Info */}
        <section className="storage-section">
          <h2>Data Storage</h2>
          <div className="storage-info">
            <div className="storage-item">
              <h4>Industry Knowledge Base (Layer 2 - Shared)</h4>
              <p>Namespace: {storage.layer2Namespace}</p>
              <p>Encrypted with Lit Protocol</p>
            </div>
            <div className="storage-item">
              <h4>Private Customer Data (Layer 3)</h4>
              <p>Namespace: {storage.layer3Namespace}</p>
              <p>Documents: {storage.totalDocuments.toLocaleString()}</p>
              <p>Storage Used: {storage.storageUsedGB.toFixed(2)} GB</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Powered by Varity | Deployed on Varity L3 (Chain ID: 421614)</p>
        <p>Dashboard URL: {dashboard.dashboardUrl}</p>
      </footer>
    </div>
  )
}
