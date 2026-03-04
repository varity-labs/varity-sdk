/**
 * Retail Industry Dashboard Template
 *
 * Pre-configured dashboard for retail industry
 * Features: E-commerce, Inventory, Supply Chain, Sales Analytics
 */

import React from 'react'
import { DeployedDashboard } from '../../../modules/templates'

export interface RetailDashboardProps {
  dashboard: DeployedDashboard
  onCustomize?: (customization: any) => void
  className?: string
}

export const RetailDashboard: React.FC<RetailDashboardProps> = ({
  dashboard,
  onCustomize,
  className = ''
}) => {
  const { customization, metrics, storage } = dashboard

  return (
    <div className={`retail-dashboard ${className}`}>
      {/* Header */}
      <header className="dashboard-header retail-theme">
        <div className="branding">
          <h1>{customization.branding?.companyName || 'Retail Dashboard'}</h1>
          <p className="subtitle">E-commerce & Inventory Management</p>
        </div>
        <div className="metrics-summary">
          <div className="metric">
            <span className="label">Online Store Uptime</span>
            <span className="value">{metrics.uptime.toFixed(2)}%</span>
          </div>
          <div className="metric">
            <span className="label">Active Customers</span>
            <span className="value">{metrics.activeUsers}</span>
          </div>
          <div className="metric">
            <span className="label">Orders/Day</span>
            <span className="value">{metrics.requestsPerDay.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Sales Overview */}
        <section className="sales-overview-section">
          <h2>Sales Performance</h2>
          <div className="sales-grid">
            <div className="sales-card">
              <h3>Today&apos;s Sales</h3>
              <p className="sales-value">$12,456</p>
              <span className="sales-change positive">+18.5% vs yesterday</span>
            </div>
            <div className="sales-card">
              <h3>Orders</h3>
              <p className="sales-value">234</p>
              <span className="sales-change positive">+12%</span>
            </div>
            <div className="sales-card">
              <h3>Avg Order Value</h3>
              <p className="sales-value">$53.25</p>
              <span className="sales-change neutral">-2.1%</span>
            </div>
            <div className="sales-card">
              <h3>Conversion Rate</h3>
              <p className="sales-value">3.8%</p>
              <span className="sales-change positive">+0.5%</span>
            </div>
          </div>
        </section>

        {/* Inventory Status */}
        <section className="inventory-section">
          <h2>Inventory Management</h2>
          <div className="inventory-grid">
            <div className="inventory-item">
              <h4>Total SKUs</h4>
              <p className="inventory-count">1,245</p>
              <div className="inventory-breakdown">
                <span className="in-stock">980 In Stock</span>
                <span className="low-stock">145 Low Stock</span>
                <span className="out-of-stock">120 Out of Stock</span>
              </div>
            </div>
            <div className="inventory-item">
              <h4>Top Selling Products</h4>
              <ul className="product-list">
                <li>
                  <span className="product-name">Wireless Headphones</span>
                  <span className="product-sales">234 units</span>
                </li>
                <li>
                  <span className="product-name">Smart Watch</span>
                  <span className="product-sales">189 units</span>
                </li>
                <li>
                  <span className="product-name">Laptop Stand</span>
                  <span className="product-sales">156 units</span>
                </li>
              </ul>
            </div>
            <div className="inventory-item">
              <h4>Restock Alerts</h4>
              <div className="alert-list">
                <div className="alert urgent">
                  <span>⚠️ Wireless Mouse - Only 5 left</span>
                </div>
                <div className="alert warning">
                  <span>⚡ USB-C Cable - Low stock (12 units)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supply Chain */}
        <section className="supply-chain-section">
          <h2>Supply Chain Status</h2>
          <div className="supply-chain-grid">
            <div className="shipment-card">
              <h4>Incoming Shipments</h4>
              <p className="shipment-count">12 shipments</p>
              <div className="shipment-status">
                <span className="status-in-transit">8 in transit</span>
                <span className="status-delayed">2 delayed</span>
                <span className="status-delivered">2 delivered</span>
              </div>
            </div>
            <div className="shipment-card">
              <h4>Fulfillment Status</h4>
              <p className="fulfillment-rate">96.5%</p>
              <span className="fulfillment-note">234/242 orders fulfilled</span>
            </div>
            <div className="shipment-card">
              <h4>Supplier Performance</h4>
              <div className="supplier-ratings">
                <div className="supplier">
                  <span>Supplier A</span>
                  <span className="rating">⭐⭐⭐⭐⭐</span>
                </div>
                <div className="supplier">
                  <span>Supplier B</span>
                  <span className="rating">⭐⭐⭐⭐</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E-commerce Analytics */}
        <section className="ecommerce-analytics-section">
          <h2>E-commerce Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Traffic Sources</h4>
              <ul className="traffic-list">
                <li><span>Direct</span><span>42%</span></li>
                <li><span>Organic Search</span><span>31%</span></li>
                <li><span>Social Media</span><span>18%</span></li>
                <li><span>Paid Ads</span><span>9%</span></li>
              </ul>
            </div>
            <div className="analytics-card">
              <h4>Customer Acquisition</h4>
              <p className="cac">CAC: $12.50</p>
              <p className="ltv">LTV: $185.00</p>
              <span className="ltv-cac-ratio">LTV/CAC: 14.8x</span>
            </div>
          </div>
        </section>

        {/* Storage Info */}
        <section className="storage-section">
          <h2>Retail Data Storage</h2>
          <div className="storage-info">
            <div className="storage-item">
              <h4>Retail Knowledge Base (Layer 2 - Shared)</h4>
              <p>Namespace: {storage.layer2Namespace}</p>
              <p>Contains: E-commerce best practices, inventory optimization, supply chain guides</p>
              <p>Encryption: Lit Protocol (Industry-level access)</p>
            </div>
            <div className="storage-item">
              <h4>Product & Customer Data (Layer 3 - Private)</h4>
              <p>Namespace: {storage.layer3Namespace}</p>
              <p>Total Records: {storage.totalDocuments.toLocaleString()}</p>
              <p>Storage Used: {storage.storageUsedGB.toFixed(2)} GB</p>
              <p>Encryption: Lit Protocol (Customer-only access)</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Powered by Varity | E-commerce & Retail Management Platform</p>
        <p>Dashboard URL: {dashboard.dashboardUrl}</p>
      </footer>
    </div>
  )
}
