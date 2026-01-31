import React, { useState } from 'react';
import {
  DashboardHeader,
  EncryptedDataUploader,
  DataTable,
  KPICard
} from '@varity-labs/ui-kit';
import { useKYC } from '../hooks/useKYC';
import {
  UserCheck,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import type { KYCApplication } from '../types';

/**
 * KYCVerification - Know Your Customer verification workflow
 *
 * Features:
 * - Document upload with Lit Protocol encryption
 * - Identity verification status tracking
 * - Multi-step KYC workflow
 * - Automated document analysis
 * - Compliance checklist
 * - Encrypted storage on Filecoin via Varity L3
 */
export const KYCVerification: React.FC = () => {
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const {
    applications,
    metrics,
    loading,
    error,
    submitDocument,
    approveApplication,
    rejectApplication
  } = useKYC();

  const handleDocumentUpload = async (files: File[], applicationId: string) => {
    try {
      // Upload to encrypted storage via @varity-labs/ui-kit
      await submitDocument(applicationId, files);
    } catch (err) {
      console.error('Document upload failed:', err);
    }
  };

  const kycColumns = [
    {
      key: 'id',
      label: 'Application ID',
      render: (app: KYCApplication) => (
        <span className="font-mono text-sm">{app.id.slice(0, 8)}...</span>
      )
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      render: (app: KYCApplication) => (
        <div>
          <p className="font-medium">{app.customerName}</p>
          <p className="text-sm text-gray-600">{app.email}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (app: KYCApplication) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {app.type}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (app: KYCApplication) => {
        const statusConfig = {
          approved: { color: 'green', icon: CheckCircle },
          rejected: { color: 'red', icon: XCircle },
          pending: { color: 'yellow', icon: Clock },
          review: { color: 'blue', icon: AlertTriangle }
        };
        const config = statusConfig[app.status] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
            <Icon className="w-3 h-3" />
            {app.status}
          </span>
        );
      }
    },
    {
      key: 'documentsSubmitted',
      label: 'Documents',
      render: (app: KYCApplication) => (
        <span className="text-sm">{app.documentsSubmitted}/{app.documentsRequired}</span>
      )
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      render: (app: KYCApplication) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          app.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
          app.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {app.riskLevel}
        </span>
      )
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (app: KYCApplication) => formatDate(app.submittedAt)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (app: KYCApplication) => (
        <div className="flex gap-2">
          {app.status === 'pending' && (
            <>
              <button
                onClick={() => approveApplication(app.id)}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => rejectApplication(app.id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Reject
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
        <h3 className="text-red-800 font-semibold">Error loading KYC data</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="KYC Verification"
        subtitle="Customer identity verification and document management"
        icon={<UserCheck className="w-6 h-6" />}
      />

      {/* KYC Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Applications"
          value={metrics?.totalApplications || 0}
          change={metrics?.applicationsChange || 0}
          icon={<FileText className="w-5 h-5" />}
          trend={metrics?.applicationsTrend || 'up'}
        />
        <KPICard
          title="Pending Review"
          value={metrics?.pendingReview || 0}
          change={metrics?.pendingChange || 0}
          icon={<Clock className="w-5 h-5" />}
          trend="neutral"
          variant="warning"
        />
        <KPICard
          title="Approved"
          value={metrics?.approved || 0}
          change={metrics?.approvedChange || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={metrics?.approvedTrend || 'up'}
          variant="success"
        />
        <KPICard
          title="Approval Rate"
          value={`${((metrics?.approvalRate || 0) * 100).toFixed(1)}%`}
          change={metrics?.rateChange || 0}
          icon={<UserCheck className="w-5 h-5" />}
          trend={metrics?.rateTrend || 'up'}
        />
      </div>

      {/* Document Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload KYC Documents (Encrypted)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          All documents are encrypted using Lit Protocol before storage on Filecoin.
          Only authorized parties can decrypt and view these documents.
        </p>
        <EncryptedDataUploader
          onUpload={(files) => selectedApplication && handleDocumentUpload(files, selectedApplication)}
          acceptedFileTypes={['image/*', 'application/pdf']}
          maxFileSize={10 * 1024 * 1024} // 10MB
          encryptionEnabled={true}
          storageNamespace="customer-kyc-documents"
        />
      </div>

      {/* KYC Checklist */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Required Documents Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Government-issued ID', required: true },
            { label: 'Proof of Address', required: true },
            { label: 'Social Security Number / Tax ID', required: true },
            { label: 'Bank Statement', required: false },
            { label: 'Source of Funds Documentation', required: false },
            { label: 'Beneficial Ownership Declaration', required: true }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                item.required ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {item.required && <span className="text-blue-600 text-xs">*</span>}
              </div>
              <span className="text-sm">{item.label}</span>
              {item.required && (
                <span className="ml-auto text-xs text-gray-500">Required</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={kycColumns}
          data={applications}
          loading={loading}
          pagination={{
            enabled: true,
            pageSize: 15
          }}
          searchable={true}
          exportable={true}
          onRowClick={(app) => {
            setSelectedApplication(app.id);
            console.log('Application selected:', app.id);
          }}
        />
      </div>
    </div>
  );
};

export default KYCVerification;
