/**
 * ISO Merchant Services Dashboard Template
 *
 * Pre-configured dashboard for ISO/payment processing industry
 * Features: Payment Processing, PCI Compliance, Merchant Onboarding
 */

import React from 'react'
import { DeployedDashboard } from '../../../modules/templates'

export interface ISODashboardProps {
  dashboard: DeployedDashboard
  onCustomize?: (customization: any) => void
  className?: string
}

export const ISODashboard: React.FC<ISODashboardProps> = ({
  dashboard,
  onCustomize,
  className = ''
}) => {
  const { customization, metrics, storage } = dashboard

  return (
    <div className={`iso-dashboard ${className}`}>
      {/* Header */}
      <header className="dashboard-header iso-theme">
        <div className="branding">
          <h1>{customization.branding?.companyName || 'ISO Merchant Dashboard'}</h1>
          <p className="subtitle">Payment Processing & Merchant Services</p>
        </div>
        <div className="metrics-summary">
          <div className="metric">
            <span className="label">Gateway Uptime</span>
            <span className="value">{metrics.uptime.toFixed(2)}%</span>
          </div>
          <div className="metric">
            <span className="label">Active Merchants</span>
            <span className="value">{metrics.activeUsers}</span>
          </div>
          <div className="metric">
            <span className="label">Transactions/Day</span>
            <span className="value">{metrics.requestsPerDay.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Payment Processing Overview */}
        <section className="processing-overview-section">
          <h2>Payment Processing</h2>
          <div className="processing-grid">
            <div className="processing-card">
              <h3>Daily Volume</h3>
              <p className="processing-value">$1.2M</p>
              <span className="processing-change positive">+15.2% vs yesterday</span>
            </div>
            <div className="processing-card">
              <h3>Transactions</h3>
              <p className="processing-value">5,234</p>
              <span className="processing-change positive">+8.5%</span>
            </div>
            <div className="processing-card">
              <h3>Avg Transaction</h3>
              <p className="processing-value">$229.35</p>
              <span className="processing-change neutral">-1.2%</span>
            </div>
            <div className="processing-card">
              <h3>Success Rate</h3>
              <p className="processing-value">98.7%</p>
              <span className="processing-badge success">Excellent</span>
            </div>
          </div>
        </section>

        {/* Merchant Portfolio */}
        <section className="merchant-portfolio-section">
          <h2>Merchant Portfolio</h2>
          <div className="merchant-grid">
            <div className="merchant-card">
              <h4>Total Merchants</h4>
              <p className="merchant-count">1,245</p>
              <div className="merchant-breakdown">
                <span className="active">1,120 Active</span>
                <span className="pending">85 Pending Approval</span>
                <span className="inactive">40 Inactive</span>
              </div>
            </div>
            <div className="merchant-card">
              <h4>Onboarding Status</h4>
              <ul className="onboarding-list">
                <li>
                  <span className="merchant-name">Acme Retail Corp</span>
                  <span className="status-badge pending">KYC Pending</span>
                </li>
                <li>
                  <span className="merchant-name">TechStart Solutions</span>
                  <span className="status-badge approved">Approved</span>
                </li>
                <li>
                  <span className="merchant-name">Food Services LLC</span>
                  <span className="status-badge reviewing">Under Review</span>
                </li>
              </ul>
            </div>
            <div className="merchant-card">
              <h4>Top Merchants by Volume</h4>
              <ul className="top-merchants-list">
                <li>
                  <span className="merchant-name">Enterprise Corp</span>
                  <span className="merchant-volume">$450K</span>
                </li>
                <li>
                  <span className="merchant-name">Retail Chain Inc</span>
                  <span className="merchant-volume">$325K</span>
                </li>
                <li>
                  <span className="merchant-name">Tech Services</span>
                  <span className="merchant-volume">$280K</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PCI Compliance Dashboard */}
        <section className="pci-compliance-section">
          <h2>PCI-DSS Compliance Status</h2>
          <div className="compliance-grid">
            <div className="compliance-item verified">
              <h4>Network Security</h4>
              <div className="compliance-status">
                <span>✓ Level 1 Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>Firewall Configuration: Verified</li>
                <li>Network Segmentation: Active</li>
                <li>Intrusion Detection: Enabled</li>
              </ul>
            </div>
            <div className="compliance-item verified">
              <h4>Data Protection</h4>
              <div className="compliance-status">
                <span>✓ Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>Card Data Encryption: Lit Protocol</li>
                <li>Key Management: Secure</li>
                <li>Data Retention: Compliant</li>
              </ul>
            </div>
            <div className="compliance-item verified">
              <h4>Access Control</h4>
              <div className="compliance-status">
                <span>✓ Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>MFA Enabled: 100%</li>
                <li>Access Logs: Real-time</li>
                <li>Password Policy: Enforced</li>
              </ul>
            </div>
            <div className="compliance-item verified">
              <h4>Monitoring & Testing</h4>
              <div className="compliance-status">
                <span>✓ Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>Security Monitoring: 24/7</li>
                <li>Vulnerability Scans: Weekly</li>
                <li>Penetration Tests: Quarterly</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Transaction Analytics */}
        <section className="transaction-analytics-section">
          <h2>Transaction Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Payment Methods</h4>
              <ul className="payment-methods-list">
                <li><span>Credit Card</span><span>65%</span></li>
                <li><span>Debit Card</span><span>22%</span></li>
                <li><span>ACH</span><span>10%</span></li>
                <li><span>Other</span><span>3%</span></li>
              </ul>
            </div>
            <div className="analytics-card">
              <h4>Chargeback Rate</h4>
              <p className="chargeback-rate">0.15%</p>
              <span className="chargeback-status excellent">Excellent (Below 0.5% threshold)</span>
            </div>
            <div className="analytics-card">
              <h4>Decline Rate</h4>
              <p className="decline-rate">1.3%</p>
              <span className="decline-note">45 declined transactions today</span>
            </div>
          </div>
        </section>

        {/* Storage Info */}
        <section className="storage-section">
          <h2>Secure Payment Data Storage</h2>
          <div className="storage-info">
            <div className="storage-item">
              <h4>ISO Knowledge Base (Layer 2 - Shared)</h4>
              <p>Namespace: {storage.layer2Namespace}</p>
              <p>Contains: PCI-DSS requirements, payment processing guides, compliance docs</p>
              <p>Encryption: Lit Protocol (Industry-level access)</p>
            </div>
            <div className="storage-item">
              <h4>Merchant & Transaction Data (Layer 3 - Private)</h4>
              <p>Namespace: {storage.layer3Namespace}</p>
              <p>Total Records: {storage.totalDocuments.toLocaleString()}</p>
              <p>Storage Used: {storage.storageUsedGB.toFixed(2)} GB</p>
              <p>Encryption: Lit Protocol (PCI-compliant, customer-only access)</p>
              <p>Tokenization: Enabled for all card data</p>
            </div>
          </div>
        </section>

        {/* Residuals & Revenue */}
        <section className="residuals-section">
          <h2>Residuals & Revenue</h2>
          <div className="residuals-grid">
            <div className="residual-card">
              <h4>Monthly Residuals</h4>
              <p className="residual-value">$45,230</p>
              <span className="residual-change positive">+$3,120 vs last month</span>
            </div>
            <div className="residual-card">
              <h4>Avg Residual per Merchant</h4>
              <p className="residual-value">$36.31</p>
              <span className="residual-trend">Growing steadily</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Powered by Varity | PCI-DSS Level 1 Compliant Platform</p>
        <p>All payment data encrypted with Lit Protocol</p>
        <p>Dashboard URL: {dashboard.dashboardUrl}</p>
      </footer>
    </div>
  )
}
