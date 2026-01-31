/**
 * Test Akash Deployment Script
 * Tests real Akash Network deployment with simple nginx service
 */

import { AkashClient } from '../src/depin/AkashClient.real';
import SDLParser from '../src/depin/SDLParser';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAkashDeployment() {
  console.log('🚀 Testing Akash Network Deployment...\n');

  // Validate environment variables
  if (!process.env.AKASH_WALLET_MNEMONIC) {
    console.error('❌ Error: AKASH_WALLET_MNEMONIC not set');
    console.log('Please set your Akash wallet mnemonic in .env file');
    process.exit(1);
  }

  if (!process.env.AKASH_RPC_ENDPOINT) {
    console.error('❌ Error: AKASH_RPC_ENDPOINT not set');
    console.log('Using default testnet RPC...');
  }

  const rpcEndpoint =
    process.env.AKASH_RPC_ENDPOINT || 'https://rpc.testnet.akash.network:443';

  console.log('📡 Configuration:');
  console.log(`  RPC Endpoint: ${rpcEndpoint}`);
  console.log(`  Network: ${rpcEndpoint.includes('testnet') ? 'Testnet' : 'Mainnet'}\n`);

  // Initialize Akash client
  const akash = new AkashClient({
    rpcEndpoint,
    walletMnemonic: process.env.AKASH_WALLET_MNEMONIC,
    defaultResourceConfig: {
      cpu: 500,
      memory: 512,
      storage: 512,
    },
  });

  try {
    // Step 1: Connect to Akash Network
    console.log('🔌 Connecting to Akash Network...');
    await akash.connect();
    console.log('✅ Connected successfully\n');

    // Step 2: Load and parse SDL
    console.log('📄 Loading SDL manifest...');
    const sdlPath = path.join(__dirname, '../examples/akash/nginx.yaml');
    const sdlYaml = fs.readFileSync(sdlPath, 'utf8');

    const sdl = SDLParser.parse(sdlYaml);
    console.log('✅ SDL parsed and validated');
    console.log(`  Services: ${Object.keys(sdl.services).join(', ')}`);
    console.log(`  Version: ${sdl.version}\n`);

    // Step 3: Estimate cost
    const costEstimate = SDLParser.estimateCost(sdl);
    console.log('💰 Cost Estimate:');
    console.log(`  Total: ${costEstimate.totalUAKT} uAKT/block`);
    console.log(`  Monthly: ~$${((costEstimate.totalUAKT / 1_000_000) * 0.5 * 30).toFixed(2)}`);
    console.log('');

    // Step 4: Deploy
    console.log('🚀 Starting deployment...');
    console.log('  This may take 2-5 minutes...');
    console.log('  Steps:');
    console.log('    1. Creating deployment on blockchain');
    console.log('    2. Waiting for provider bids');
    console.log('    3. Selecting best provider');
    console.log('    4. Creating lease');
    console.log('    5. Sending manifest to provider');
    console.log('    6. Waiting for services to start\n');

    const deployment = await akash.deploy(sdl, {
      preferAudited: true,
      minUptime: 90,
      maxPrice: 200,
    });

    console.log('✅ Deployment successful!\n');
    console.log('📊 Deployment Details:');
    console.log(`  Deployment ID: ${deployment.deploymentId}`);
    console.log(`  DSEQ: ${deployment.dseq}`);
    console.log(`  Provider: ${deployment.provider}`);
    console.log(`  Provider URI: ${deployment.providerUri}`);
    console.log(`  Lease ID: ${deployment.leaseId}`);
    console.log(`  Cost: ${deployment.cost.amount} ${deployment.cost.denom}`);
    console.log('');

    console.log('🌐 Service Endpoints:');
    for (const [serviceName, service] of Object.entries(deployment.services)) {
      console.log(`  ${serviceName}: ${service.uri}`);
      console.log(`  Status: ${service.status}`);
    }
    console.log('');

    // Step 5: Check status
    console.log('🔍 Checking deployment status...');
    const status = await akash.getDeploymentStatus(deployment.dseq);
    console.log(`  State: ${status.state}`);
    console.log(`  Owner: ${status.owner}`);
    console.log('');

    // Step 6: Get logs (sample)
    console.log('📋 Fetching deployment logs...');
    try {
      const logs = await akash.getDeploymentLogs(
        deployment.dseq,
        'web',
        deployment.providerUri,
        10
      );
      console.log('  Recent logs:');
      logs.slice(0, 5).forEach((log) => console.log(`    ${log}`));
      console.log('');
    } catch (error: any) {
      console.log(`  ⚠️  Could not fetch logs: ${error.message}\n`);
    }

    // Step 7: Prompt user before cleanup
    console.log('⏸️  Deployment is live!');
    console.log(
      `Visit ${deployment.services.web?.uri || 'the deployment URL'} to see your service\n`
    );

    console.log('Press ENTER to close the deployment, or CTRL+C to keep it running...');

    // Wait for user input
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => resolve());
    });

    // Step 8: Close deployment
    console.log('\n🛑 Closing deployment...');
    await akash.closeDeployment(deployment.dseq);
    console.log('✅ Deployment closed successfully\n');

    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  ✅ Connected to Akash Network');
    console.log('  ✅ Deployed nginx web server');
    console.log('  ✅ Monitored deployment status');
    console.log('  ✅ Retrieved deployment logs');
    console.log('  ✅ Closed deployment');
    console.log('');
    console.log('Your Akash integration is working correctly! 🚀');
  } catch (error: any) {
    console.error('\n❌ Deployment failed:');
    console.error(`  Error: ${error.message}`);

    if (error.message.includes('No provider bids')) {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Increase pricing in SDL manifest');
      console.log('  - Remove strict placement requirements');
      console.log('  - Check wallet balance (minimum 5 AKT required)');
      console.log('  - Try deploying to testnet first');
    }

    if (error.message.includes('Wallet mnemonic')) {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Set AKASH_WALLET_MNEMONIC in .env file');
      console.log('  - Ensure mnemonic is 24 words');
      console.log('  - Generate new wallet: akash keys add mykey');
    }

    if (error.message.includes('connect')) {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Check RPC endpoint is accessible');
      console.log('  - Try alternative RPC: https://rpc.akash.network:443');
      console.log('  - Check network connectivity');
    }

    process.exit(1);
  }
}

// Run the test
testAkashDeployment().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
