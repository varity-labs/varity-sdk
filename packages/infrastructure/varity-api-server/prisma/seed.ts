/**
 * Prisma Database Seed Script
 * Populates database with sample data for development
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...\n');

  // Clean existing data (optional - comment out if you want to preserve data)
  console.log('Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.cacheEntry.deleteMany();
  await prisma.dashboardLog.deleteMany();
  await prisma.dashboardMetric.deleteMany();
  await prisma.file.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.templateCustomization.deleteMany();
  await prisma.template.deleteMany();
  await prisma.transactionRecord.deleteMany();
  await prisma.customerMetric.deleteMany();
  await prisma.revenueRecord.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('Existing data cleaned.\n');

  // Create Users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      chainId: 1,
      email: 'admin@varity.ai',
      username: 'admin',
      displayName: 'Varity Admin',
      isAdmin: true,
      isActive: true,
      emailVerified: true,
    },
  });

  const isoUser = await prisma.user.create({
    data: {
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      chainId: 1,
      email: 'iso@merchant.com',
      username: 'iso_merchant_1',
      displayName: 'ISO Merchant Rep',
      isActive: true,
    },
  });

  const financeUser = await prisma.user.create({
    data: {
      walletAddress: '0x9876543210987654321098765432109876543210',
      chainId: 1,
      email: 'finance@company.com',
      username: 'finance_user_1',
      displayName: 'Finance Manager',
      isActive: true,
    },
  });

  console.log(`Created ${3} users.\n`);

  // Create Templates
  console.log('Creating templates...');
  const isoTemplate = await prisma.template.create({
    data: {
      name: 'ISO Merchant Dashboard',
      slug: 'iso-merchant-v1',
      description:
        'Complete dashboard for ISO merchant processing with applications, residuals, and analytics',
      version: '1.0.0',
      industry: 'iso-merchant',
      category: 'payment-processing',
      tags: ['merchant', 'payment', 'iso', 'processing'],
      isActive: true,
      isFeatured: true,
      isPublic: true,
      tier: 'professional',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      setupFee: 99,
      creatorId: admin.id,
      features: [
        'Merchant application processing',
        'Residual tracking and reporting',
        'Real-time analytics',
        'Multi-layer encrypted storage',
        'RAG-powered AI assistant',
      ],
      defaultConfig: {
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
      },
      requirements: {
        minL3Version: '1.0.0',
        storage: '10GB',
        compute: 'standard',
      },
      storageConfig: {
        layers: ['industry-rag', 'customer-data'],
        defaultLayer: 'customer-data',
      },
      ipfsCid: 'Qm...iso-template',
    },
  });

  const financeTemplate = await prisma.template.create({
    data: {
      name: 'Finance Dashboard',
      slug: 'finance-v1',
      description: 'Banking and financial services dashboard with compliance and reporting',
      version: '1.0.0',
      industry: 'finance',
      category: 'banking',
      tags: ['finance', 'banking', 'compliance', 'reporting'],
      isActive: true,
      isFeatured: true,
      isPublic: true,
      tier: 'enterprise',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      setupFee: 499,
      creatorId: admin.id,
      features: [
        'Transaction monitoring',
        'Compliance reporting',
        'Financial analytics',
        'Risk management',
      ],
      defaultConfig: {
        theme: 'light',
        language: 'en',
        timezone: 'America/New_York',
      },
      requirements: {
        minL3Version: '1.0.0',
        storage: '50GB',
        compute: 'high',
      },
      ipfsCid: 'Qm...finance-template',
    },
  });

  const healthcareTemplate = await prisma.template.create({
    data: {
      name: 'Healthcare Dashboard',
      slug: 'healthcare-v1',
      description: 'HIPAA-compliant healthcare management dashboard',
      version: '1.0.0',
      industry: 'healthcare',
      category: 'medical',
      tags: ['healthcare', 'hipaa', 'medical', 'patient'],
      isActive: true,
      isFeatured: false,
      isPublic: true,
      tier: 'professional',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      setupFee: 199,
      creatorId: admin.id,
      features: [
        'Patient records management',
        'HIPAA compliance',
        'Appointment scheduling',
        'Medical billing',
      ],
      defaultConfig: {
        theme: 'light',
        language: 'en',
        timezone: 'America/New_York',
      },
      requirements: {
        minL3Version: '1.0.0',
        storage: '25GB',
        compute: 'standard',
      },
      ipfsCid: 'Qm...healthcare-template',
    },
  });

  const retailTemplate = await prisma.template.create({
    data: {
      name: 'Retail Dashboard',
      slug: 'retail-v1',
      description: 'E-commerce and retail management dashboard',
      version: '1.0.0',
      industry: 'retail',
      category: 'ecommerce',
      tags: ['retail', 'ecommerce', 'inventory', 'sales'],
      isActive: true,
      isFeatured: false,
      isPublic: true,
      tier: 'professional',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      setupFee: 49,
      creatorId: admin.id,
      features: [
        'Inventory management',
        'Sales analytics',
        'Customer insights',
        'Supply chain tracking',
      ],
      defaultConfig: {
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
      },
      requirements: {
        minL3Version: '1.0.0',
        storage: '15GB',
        compute: 'standard',
      },
      ipfsCid: 'Qm...retail-template',
    },
  });

  console.log(`Created ${4} templates.\n`);

  // Create Dashboards
  console.log('Creating dashboards...');
  const isoDashboard = await prisma.dashboard.create({
    data: {
      name: 'ISO Merchant Dashboard - Production',
      slug: 'iso-merchant-prod-1',
      description: 'Production dashboard for ISO merchant operations',
      userId: isoUser.id,
      templateId: isoTemplate.id,
      status: 'active',
      tier: 'professional',
      config: {
        branding: {
          logo: 'https://example.com/logo.png',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
        },
        features: {
          applications: true,
          residuals: true,
          analytics: true,
        },
      },
      components: {
        layout: 'grid',
        widgets: ['applications', 'residuals', 'analytics', 'notifications'],
      },
      l3NetworkId: 'varity-l3-mainnet',
      l3ChainId: 412346,
      storageUsed: BigInt(1073741824), // 1GB
      storageLimit: BigInt(10737418240), // 10GB
      computeUsed: BigInt(3600000), // 1 hour
      computeLimit: BigInt(86400000), // 24 hours
    },
  });

  const financeDashboard = await prisma.dashboard.create({
    data: {
      name: 'Finance Operations Dashboard',
      slug: 'finance-ops-1',
      description: 'Financial operations and compliance dashboard',
      userId: financeUser.id,
      templateId: financeTemplate.id,
      status: 'active',
      tier: 'enterprise',
      config: {
        branding: {
          logo: 'https://example.com/finance-logo.png',
          primaryColor: '#1F2937',
          secondaryColor: '#3B82F6',
        },
      },
      l3NetworkId: 'varity-l3-mainnet',
      l3ChainId: 412346,
      storageUsed: BigInt(5368709120), // 5GB
      storageLimit: BigInt(53687091200), // 50GB
    },
  });

  console.log(`Created ${2} dashboards.\n`);

  // Create Subscriptions
  console.log('Creating subscriptions...');
  await prisma.subscription.create({
    data: {
      userId: isoUser.id,
      templateId: isoTemplate.id,
      tier: 'professional',
      status: 'active',
      billingCycle: 'monthly',
      price: 299,
      currency: 'USD',
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      nextPaymentAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscription.create({
    data: {
      userId: financeUser.id,
      templateId: financeTemplate.id,
      tier: 'enterprise',
      status: 'active',
      billingCycle: 'yearly',
      price: 9990,
      currency: 'USD',
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      nextPaymentAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Created ${2} subscriptions.\n`);

  // Create Sample Files
  console.log('Creating sample files...');
  await prisma.file.create({
    data: {
      fileName: 'merchant_application_001.pdf',
      fileSize: BigInt(2097152), // 2MB
      mimeType: 'application/pdf',
      userId: isoUser.id,
      dashboardId: isoDashboard.id,
      storageLayer: 'customer-data',
      namespace: `customer-${isoUser.walletAddress}`,
      category: 'applications',
      ipfsCid: 'Qm...application-001',
      isEncrypted: true,
      isPinned: true,
      celestiaBlobId: 'celestia-blob-001',
      celestiaHeight: BigInt(123456),
    },
  });

  await prisma.file.create({
    data: {
      fileName: 'iso_industry_guide.pdf',
      fileSize: BigInt(5242880), // 5MB
      mimeType: 'application/pdf',
      userId: admin.id,
      storageLayer: 'industry-rag',
      namespace: 'industry-iso-merchant-rag',
      category: 'documentation',
      ipfsCid: 'Qm...iso-guide',
      isEncrypted: true,
      isPinned: true,
    },
  });

  console.log(`Created ${2} files.\n`);

  // Create Analytics Events
  console.log('Creating analytics events...');
  for (let i = 0; i < 10; i++) {
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'page_view',
        eventName: 'dashboard_view',
        userId: isoUser.id,
        properties: {
          page: '/dashboard',
          duration: Math.floor(Math.random() * 300),
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/dashboard',
      },
    });
  }

  console.log(`Created ${10} analytics events.\n`);

  // Create Revenue Records
  console.log('Creating revenue records...');
  await prisma.revenueRecord.create({
    data: {
      amount: 299,
      currency: 'USD',
      status: 'success',
      source: 'subscription',
      userId: isoUser.id,
      metadata: {
        subscriptionId: 'sub_123',
        plan: 'professional',
      },
    },
  });

  await prisma.revenueRecord.create({
    data: {
      amount: 9990,
      currency: 'USD',
      status: 'success',
      source: 'subscription',
      userId: financeUser.id,
      metadata: {
        subscriptionId: 'sub_456',
        plan: 'enterprise',
      },
    },
  });

  console.log(`Created ${2} revenue records.\n`);

  console.log('Database seed completed successfully!');
  console.log('\nSummary:');
  console.log(`- Users: 3 (1 admin, 2 regular)`);
  console.log(`- Templates: 4 (ISO, Finance, Healthcare, Retail)`);
  console.log(`- Dashboards: 2`);
  console.log(`- Subscriptions: 2`);
  console.log(`- Files: 2`);
  console.log(`- Analytics Events: 10`);
  console.log(`- Revenue Records: 2`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
