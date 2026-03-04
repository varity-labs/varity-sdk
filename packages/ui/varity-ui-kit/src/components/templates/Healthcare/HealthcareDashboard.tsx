/**
 * Healthcare Industry Dashboard Template
 *
 * Pre-configured dashboard for healthcare industry
 * Features: HIPAA Compliance, Patient Data, Medical Operations
 */

import React from 'react'
import { DeployedDashboard } from '../../../modules/templates'

export interface HealthcareDashboardProps {
  dashboard: DeployedDashboard
  onCustomize?: (customization: any) => void
  className?: string
}

export const HealthcareDashboard: React.FC<HealthcareDashboardProps> = ({
  dashboard,
  onCustomize,
  className = ''
}) => {
  const { customization, metrics, storage } = dashboard

  return (
    <div className={`healthcare-dashboard ${className}`}>
      {/* Header */}
      <header className="dashboard-header healthcare-theme">
        <div className="branding">
          <h1>{customization.branding?.companyName || 'Healthcare Dashboard'}</h1>
          <p className="subtitle">Patient Care & Medical Operations</p>
        </div>
        <div className="metrics-summary">
          <div className="metric">
            <span className="label">System Health</span>
            <span className="value">{metrics.uptime.toFixed(2)}%</span>
          </div>
          <div className="metric">
            <span className="label">Active Patients</span>
            <span className="value">{metrics.activeUsers}</span>
          </div>
          <div className="metric">
            <span className="label">Records Processed</span>
            <span className="value">{metrics.requestsPerDay.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Patient Summary */}
        <section className="patient-summary-section">
          <h2>Patient Overview</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Total Patients</h3>
              <p className="summary-value">2,456</p>
              <span className="summary-change positive">+156 this month</span>
            </div>
            <div className="summary-card">
              <h3>Appointments Today</h3>
              <p className="summary-value">42</p>
              <span className="summary-badge">12 pending</span>
            </div>
            <div className="summary-card">
              <h3>HIPAA Compliance</h3>
              <p className="summary-value">100%</p>
              <span className="summary-badge success">Fully Compliant</span>
            </div>
            <div className="summary-card">
              <h3>Data Encryption</h3>
              <p className="summary-value">Active</p>
              <span className="summary-badge">Lit Protocol</span>
            </div>
          </div>
        </section>

        {/* Recent Activities */}
        <section className="activities-section">
          <h2>Recent Medical Activities</h2>
          <div className="activities-list">
            <div className="activity-item">
              <span className="activity-icon">📋</span>
              <div className="activity-details">
                <h4>Patient Record Updated</h4>
                <p>Patient ID: 12345 - Updated by Dr. Smith</p>
                <time>2 minutes ago</time>
              </div>
              <span className="activity-status">HIPAA Logged</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">💊</span>
              <div className="activity-details">
                <h4>Prescription Issued</h4>
                <p>Patient ID: 67890 - Prescription #PR-2025-001</p>
                <time>15 minutes ago</time>
              </div>
              <span className="activity-status">Encrypted</span>
            </div>
            {/* More activities would be loaded dynamically */}
          </div>
        </section>

        {/* HIPAA Compliance Dashboard */}
        <section className="hipaa-compliance-section">
          <h2>HIPAA Compliance Status</h2>
          <div className="compliance-grid">
            <div className="compliance-item verified">
              <h4>Administrative Safeguards</h4>
              <div className="compliance-status">
                <span>✓ Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>Access Control: Enabled</li>
                <li>Audit Logs: Active</li>
                <li>Workforce Training: Complete</li>
              </ul>
            </div>
            <div className="compliance-item verified">
              <h4>Physical Safeguards</h4>
              <div className="compliance-status">
                <span>✓ Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>Data Center Security: Multi-layer</li>
                <li>Device Controls: Implemented</li>
                <li>Disposal Procedures: Secure</li>
              </ul>
            </div>
            <div className="compliance-item verified">
              <h4>Technical Safeguards</h4>
              <div className="compliance-status">
                <span>✓ Compliant</span>
              </div>
              <ul className="compliance-details">
                <li>Encryption: Lit Protocol</li>
                <li>Integrity Controls: Active</li>
                <li>Transmission Security: TLS 1.3</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Encrypted Storage Info */}
        <section className="storage-section">
          <h2>Secure Medical Data Storage</h2>
          <div className="storage-info">
            <div className="storage-item">
              <h4>Healthcare Knowledge Base (Layer 2 - Shared)</h4>
              <p>Namespace: {storage.layer2Namespace}</p>
              <p>Contains: Medical procedures, HIPAA guidelines, best practices</p>
              <p>Encryption: Lit Protocol (Industry-level access)</p>
            </div>
            <div className="storage-item">
              <h4>Patient Records (Layer 3 - Private)</h4>
              <p>Namespace: {storage.layer3Namespace}</p>
              <p>Patient Records: {storage.totalDocuments.toLocaleString()}</p>
              <p>Storage Used: {storage.storageUsedGB.toFixed(2)} GB</p>
              <p>Encryption: Lit Protocol (Customer-only access)</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Powered by Varity | HIPAA-Compliant Infrastructure</p>
        <p>All patient data encrypted with Lit Protocol</p>
        <p>Dashboard URL: {dashboard.dashboardUrl}</p>
      </footer>
    </div>
  )
}
