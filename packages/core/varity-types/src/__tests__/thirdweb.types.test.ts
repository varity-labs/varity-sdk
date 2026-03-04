/**
 * Thirdweb Type Tests
 *
 * Comprehensive type tests for Thirdweb integration types.
 * Tests type compatibility, inference, and USDC decimal handling.
 */

import {
  // Core types
  VarityChain,
  VarityChainConstants,
  VarityWalletConfig,
  VaritySmartWalletOptions,
  VarityWalletConnectionResult,
  VarityContractConfig,
  VarityDeploymentParams,
  VarityDeploymentResult,
  VarityContractReadOptions,
  VarityContractWriteOptions,
  SIWEMessage,
  SIWEVerifyResult,
  SIWEAuthPayload,
  VarityGasEstimation,
  VarityTransactionFeeOptions,
  VarityEventFilter,
  VarityContractEvent,
  USDCAmount,

  // Wrapper types
  ThirdwebEthersHybrid,
  ThirdwebWrapperConfig,

  // API Response types
  ContractDeployResponse,
  ContractCallResponse,
  SIWEAuthResponse,
  ChainInfoResponse,
  WalletBalanceResponse,

  // Configuration types
  ThirdwebClientConfig,
  ThirdwebAuthConfig,
  ThirdwebStorageConfig,

  // Utility functions
  isVarityChain,
  isSIWEMessage,
  formatUSDC,
  parseUSDC,
  VARITY_L3_TESTNET,
  USDC_DECIMALS
} from '../thirdweb'

describe('Thirdweb Type Tests', () => {
  describe('Chain Configuration Types', () => {
    test('VarityChain type structure', () => {
      const varityChain: VarityChain = {
        id: 33529,
        name: 'Varity Testnet',
        nativeCurrency: {
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6 // CRITICAL: Must be 6
        },
        rpc: 'https://varity-testnet-rpc.conduit.xyz',
        blockExplorer: 'https://varity-testnet-explorer.conduit.xyz',
        testnet: true
      }

      expect(varityChain.id).toBe(33529)
      expect(varityChain.nativeCurrency.decimals).toBe(6)
      expect(isVarityChain(varityChain)).toBe(true)
    })

    test('VarityChain type guard rejects invalid chains', () => {
      const invalidChain = {
        id: 1,
        name: 'Ethereum',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18 // Wrong decimals!
        },
        rpc: 'https://eth.example.com',
        testnet: false
      }

      expect(isVarityChain(invalidChain)).toBe(false)
    })

    test('VarityChainConstants values', () => {
      expect(VARITY_L3_TESTNET.CHAIN_ID).toBe(33529)
      expect(VARITY_L3_TESTNET.NATIVE_CURRENCY_SYMBOL).toBe('USDC')
      expect(VARITY_L3_TESTNET.NATIVE_CURRENCY_DECIMALS).toBe(6)
      expect(VARITY_L3_TESTNET.IS_TESTNET).toBe(true)
    })

    test('USDC decimals constant', () => {
      expect(USDC_DECIMALS).toBe(6)
    })
  })

  describe('Wallet Configuration Types', () => {
    test('VarityWalletConfig type structure', () => {
      const walletConfig: VarityWalletConfig = {
        clientId: 'test-client-id',
        chain: {
          id: 33529,
          name: 'Varity Testnet',
          nativeCurrency: {
            name: 'USDC',
            symbol: 'USDC',
            decimals: 6
          },
          rpc: 'https://varity-testnet-rpc.conduit.xyz',
          testnet: true
        },
        privateKey: '0x1234567890abcdef',
        smartWalletOptions: {
          gasless: true,
          version: 'v0.7'
        }
      }

      expect(walletConfig.clientId).toBe('test-client-id')
      expect(walletConfig.smartWalletOptions?.gasless).toBe(true)
    })

    test('VaritySmartWalletOptions type structure', () => {
      const smartWalletOptions: VaritySmartWalletOptions = {
        factoryAddress: '0x1234567890123456789012345678901234567890',
        gasless: true,
        bundlerUrl: 'https://bundler.example.com',
        paymasterUrl: 'https://paymaster.example.com',
        version: 'v0.7'
      }

      expect(smartWalletOptions.gasless).toBe(true)
      expect(smartWalletOptions.version).toBe('v0.7')
    })

    test('VarityWalletConnectionResult type structure', () => {
      const connectionResult: VarityWalletConnectionResult = {
        address: '0x1234567890123456789012345678901234567890',
        chainId: 33529,
        isSmartWallet: true,
        factoryAddress: '0x9876543210987654321098765432109876543210',
        balance: 1000000n // 1 USDC
      }

      expect(connectionResult.chainId).toBe(33529)
      expect(connectionResult.balance).toBe(1000000n)
    })
  })

  describe('Contract Types', () => {
    test('VarityContractConfig type structure', () => {
      const contractConfig: VarityContractConfig = {
        address: '0x1234567890123456789012345678901234567890',
        abi: [{ type: 'function', name: 'transfer' }],
        chainId: 33529
      }

      expect(contractConfig.chainId).toBe(33529)
    })

    test('VarityDeploymentParams type structure', () => {
      const deployParams: VarityDeploymentParams = {
        contractType: 'ERC20',
        name: 'Test Token',
        symbol: 'TEST',
        constructorParams: [1000000n]
      }

      expect(deployParams.contractType).toBe('ERC20')
    })

    test('VarityDeploymentResult type structure', () => {
      const deployResult: VarityDeploymentResult = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        transactionHash: '0xabcdef1234567890',
        blockNumber: 12345,
        gasUsed: 500000n,
        totalCost: 1500000n // 1.5 USDC (6 decimals)
      }

      expect(deployResult.blockNumber).toBe(12345)
      expect(deployResult.totalCost).toBe(1500000n)
    })
  })

  describe('SIWE Types', () => {
    test('SIWEMessage type structure', () => {
      const siweMessage: SIWEMessage = {
        address: '0x1234567890123456789012345678901234567890',
        chainId: 33529,
        domain: 'app.varity.io',
        uri: 'https://app.varity.io',
        nonce: 'random-nonce-123',
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        statement: 'Sign in to Varity',
        resources: ['https://api.varity.io']
      }

      expect(isSIWEMessage(siweMessage)).toBe(true)
      expect(siweMessage.chainId).toBe(33529)
    })

    test('SIWEMessage type guard rejects invalid messages', () => {
      const invalidMessage = {
        address: '0x1234567890123456789012345678901234567890',
        // Missing required fields
        domain: 'app.varity.io'
      }

      expect(isSIWEMessage(invalidMessage)).toBe(false)
    })

    test('SIWEVerifyResult type structure', () => {
      const verifyResult: SIWEVerifyResult = {
        valid: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 33529,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }

      expect(verifyResult.valid).toBe(true)
      expect(verifyResult.chainId).toBe(33529)
    })

    test('SIWEAuthPayload type structure', () => {
      const authPayload: SIWEAuthPayload = {
        message: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: 33529,
          domain: 'app.varity.io',
          uri: 'https://app.varity.io',
          nonce: 'random-nonce-123',
          issuedAt: new Date().toISOString()
        },
        signature: '0xsignature123'
      }

      expect(authPayload.signature).toBe('0xsignature123')
    })
  })

  describe('Gas and Fee Types', () => {
    test('VarityGasEstimation type structure', () => {
      const gasEstimation: VarityGasEstimation = {
        gasLimit: 21000n,
        gasPrice: 100n,
        maxFeePerGas: 150n,
        maxPriorityFeePerGas: 50n,
        estimatedCost: 2100000n, // 2.1 USDC (6 decimals)
        estimatedCostFormatted: '2.10 USDC'
      }

      expect(gasEstimation.estimatedCost).toBe(2100000n)
      expect(gasEstimation.estimatedCostFormatted).toBe('2.10 USDC')
    })

    test('VarityTransactionFeeOptions type structure', () => {
      const feeOptions: VarityTransactionFeeOptions = {
        gasLimit: 100000n,
        maxFeePerGas: 200n,
        maxPriorityFeePerGas: 100n,
        feeMultiplier: 1.5
      }

      expect(feeOptions.feeMultiplier).toBe(1.5)
    })
  })

  describe('Event Types', () => {
    test('VarityEventFilter type structure', () => {
      const eventFilter: VarityEventFilter = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        eventName: 'Transfer',
        filters: {
          from: '0x0000000000000000000000000000000000000000'
        },
        fromBlock: 1000,
        toBlock: 'latest'
      }

      expect(eventFilter.eventName).toBe('Transfer')
      expect(eventFilter.toBlock).toBe('latest')
    })

    test('VarityContractEvent type structure', () => {
      const contractEvent: VarityContractEvent = {
        eventName: 'Transfer',
        blockNumber: 12345,
        transactionHash: '0xabcdef',
        logIndex: 0,
        args: {
          from: '0x0000000000000000000000000000000000000000',
          to: '0x1234567890123456789012345678901234567890',
          amount: 1000000n
        },
        raw: {
          data: '0x...',
          topics: ['0x...']
        }
      }

      expect(contractEvent.blockNumber).toBe(12345)
    })
  })

  describe('Wrapper Pattern Types', () => {
    test('ThirdwebEthersHybrid type structure', () => {
      const hybridConfig: ThirdwebEthersHybrid = {
        useThirdweb: true,
        useFallback: true,
        preferredMethod: 'thirdweb',
        ethersRpcUrl: 'https://varity-testnet-rpc.conduit.xyz',
        logging: {
          enabled: true,
          logMethodSelection: true,
          logPerformance: false
        }
      }

      expect(hybridConfig.preferredMethod).toBe('thirdweb')
      expect(hybridConfig.logging?.enabled).toBe(true)
    })

    test('ThirdwebWrapperConfig type structure', () => {
      const wrapperConfig: ThirdwebWrapperConfig = {
        thirdwebClient: {
          clientId: 'test-client-id',
          secretKey: 'test-secret-key',
          chain: {
            id: 33529,
            name: 'Varity Testnet',
            nativeCurrency: {
              name: 'USDC',
              symbol: 'USDC',
              decimals: 6
            },
            rpc: 'https://varity-testnet-rpc.conduit.xyz',
            testnet: true
          }
        },
        hybridMode: {
          useThirdweb: true,
          useFallback: false,
          preferredMethod: 'thirdweb'
        },
        accountAbstraction: {
          enabled: true,
          options: {
            gasless: true,
            version: 'v0.7'
          }
        },
        storage: {
          gatewayUrl: 'https://gateway.pinata.cloud',
          provider: 'pinata'
        }
      }

      expect(wrapperConfig.thirdwebClient.clientId).toBe('test-client-id')
      expect(wrapperConfig.accountAbstraction?.enabled).toBe(true)
    })
  })

  describe('API Response Types', () => {
    test('ContractDeployResponse type structure', () => {
      const deployResponse: ContractDeployResponse = {
        success: true,
        data: {
          contractAddress: '0x1234567890123456789012345678901234567890',
          transactionHash: '0xabcdef',
          blockNumber: 12345,
          gasUsed: 500000n,
          totalCost: 1500000n
        },
        timestamp: new Date().toISOString()
      }

      expect(deployResponse.success).toBe(true)
      expect(deployResponse.data?.contractAddress).toBeTruthy()
    })

    test('ContractCallResponse type structure with error', () => {
      const callResponse: ContractCallResponse = {
        success: false,
        error: {
          code: 'CONTRACT_REVERTED',
          message: 'Transaction reverted',
          revertReason: 'Insufficient balance'
        },
        timestamp: new Date().toISOString()
      }

      expect(callResponse.success).toBe(false)
      expect(callResponse.error?.code).toBe('CONTRACT_REVERTED')
    })

    test('SIWEAuthResponse type structure', () => {
      const authResponse: SIWEAuthResponse = {
        success: true,
        data: {
          address: '0x1234567890123456789012345678901234567890',
          token: 'jwt-token-123',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          profile: {
            ensName: 'varity.eth',
            avatar: 'https://avatar.example.com'
          }
        },
        timestamp: new Date().toISOString()
      }

      expect(authResponse.success).toBe(true)
      expect(authResponse.data?.token).toBe('jwt-token-123')
    })

    test('ChainInfoResponse type structure', () => {
      const chainInfo: ChainInfoResponse = {
        chainId: 33529,
        name: 'Varity Testnet',
        nativeCurrency: {
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6
        },
        blockNumber: 12345,
        gasPrice: 100n,
        status: 'healthy',
        timestamp: new Date().toISOString()
      }

      expect(chainInfo.chainId).toBe(33529)
      expect(chainInfo.status).toBe('healthy')
    })

    test('WalletBalanceResponse type structure', () => {
      const balanceResponse: WalletBalanceResponse = {
        address: '0x1234567890123456789012345678901234567890',
        balance: {
          raw: 5000000n,
          formatted: '5.00 USDC',
          value: 5.0,
          decimals: 6
        },
        tokens: [
          {
            address: '0x9876543210987654321098765432109876543210',
            symbol: 'TEST',
            name: 'Test Token',
            balance: 1000000000000000000n,
            decimals: 18,
            formatted: '1.00 TEST'
          }
        ],
        timestamp: new Date().toISOString()
      }

      expect(balanceResponse.balance.decimals).toBe(6)
      expect(balanceResponse.balance.value).toBe(5.0)
    })
  })

  describe('Configuration Types', () => {
    test('ThirdwebClientConfig type structure', () => {
      const clientConfig: ThirdwebClientConfig = {
        clientId: 'test-client-id',
        secretKey: 'test-secret-key',
        chains: [
          {
            id: 33529,
            name: 'Varity Testnet',
            nativeCurrency: {
              name: 'USDC',
              symbol: 'USDC',
              decimals: 6
            },
            rpc: 'https://varity-testnet-rpc.conduit.xyz',
            testnet: true
          }
        ],
        supportedWallets: ['metamask', 'walletconnect', 'smart-wallet'],
        rpcOptions: {
          timeout: 30000,
          retries: 3,
          batch: true
        }
      }

      expect(clientConfig.clientId).toBe('test-client-id')
      expect(clientConfig.rpcOptions?.timeout).toBe(30000)
    })

    test('ThirdwebAuthConfig type structure', () => {
      const authConfig: ThirdwebAuthConfig = {
        domain: 'app.varity.io',
        uri: 'https://app.varity.io',
        sessionDuration: 86400,
        enableRefreshTokens: true,
        jwtSecret: 'jwt-secret-123',
        resources: ['https://api.varity.io']
      }

      expect(authConfig.domain).toBe('app.varity.io')
      expect(authConfig.sessionDuration).toBe(86400)
    })

    test('ThirdwebStorageConfig type structure', () => {
      const storageConfig: ThirdwebStorageConfig = {
        gatewayUrl: 'https://gateway.pinata.cloud',
        provider: 'pinata',
        credentials: {
          apiKey: 'pinata-api-key',
          apiSecret: 'pinata-api-secret'
        },
        uploadOptions: {
          pin: true,
          metadata: { project: 'varity' },
          wrapWithDirectory: false
        }
      }

      expect(storageConfig.provider).toBe('pinata')
      expect(storageConfig.uploadOptions?.pin).toBe(true)
    })
  })

  describe('USDC Utility Functions', () => {
    test('formatUSDC converts raw amount to USDCAmount', () => {
      const formatted = formatUSDC(1500000n)

      expect(formatted.raw).toBe(1500000n)
      expect(formatted.formatted).toBe('1.50 USDC')
      expect(formatted.value).toBe(1.5)
      expect(formatted.decimals).toBe(6)
    })

    test('formatUSDC handles large amounts', () => {
      const formatted = formatUSDC(1000000000000n) // 1 million USDC

      expect(formatted.raw).toBe(1000000000000n)
      expect(formatted.value).toBe(1000000)
    })

    test('parseUSDC converts string to raw amount', () => {
      const raw = parseUSDC('1.5')

      expect(raw).toBe(1500000n)
    })

    test('parseUSDC converts number to raw amount', () => {
      const raw = parseUSDC(2.75)

      expect(raw).toBe(2750000n)
    })

    test('parseUSDC handles edge cases', () => {
      expect(parseUSDC('0')).toBe(0n)
      expect(parseUSDC('0.000001')).toBe(1n) // Minimum USDC unit
      expect(parseUSDC('1000000')).toBe(1000000000000n) // 1M USDC
    })

    test('formatUSDC and parseUSDC are inverse operations', () => {
      const original = 3456789n
      const formatted = formatUSDC(original)
      const parsed = parseUSDC(formatted.value)

      expect(parsed).toBe(original)
    })
  })

  describe('Type Inference Tests', () => {
    test('USDCAmount type inference', () => {
      const amount: USDCAmount = {
        raw: 1000000n,
        formatted: '1.00 USDC',
        value: 1.0,
        decimals: 6
      }

      // Type should enforce decimals = 6
      expect(amount.decimals).toBe(6)
    })

    test('Chain ID type inference', () => {
      const chain: VarityChain = {
        id: 33529,
        name: 'Varity Testnet',
        nativeCurrency: {
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6
        },
        rpc: 'https://varity-testnet-rpc.conduit.xyz',
        testnet: true
      }

      // Chain ID should be a number
      const chainId: number = chain.id
      expect(chainId).toBe(33529)
    })

    test('Bigint type handling', () => {
      const gasEstimation: VarityGasEstimation = {
        gasLimit: 21000n,
        gasPrice: 100n,
        estimatedCost: 2100000n,
        estimatedCostFormatted: '2.10 USDC'
      }

      // All gas values should be bigint
      const total: bigint = gasEstimation.estimatedCost
      expect(typeof total).toBe('bigint')
    })
  })

  describe('USDC Decimal Validation', () => {
    test('Varity chain must have 6 decimals', () => {
      const varityChain: VarityChain = {
        id: 33529,
        name: 'Varity Testnet',
        nativeCurrency: {
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6 // MUST be 6
        },
        rpc: 'https://varity-testnet-rpc.conduit.xyz',
        testnet: true
      }

      expect(varityChain.nativeCurrency.decimals).toBe(6)
      expect(isVarityChain(varityChain)).toBe(true)
    })

    test('Chain with 18 decimals is not a valid Varity chain', () => {
      const invalidChain = {
        id: 33529,
        name: 'Varity Testnet',
        nativeCurrency: {
          name: 'USDC',
          symbol: 'USDC',
          decimals: 18 // WRONG!
        },
        rpc: 'https://varity-testnet-rpc.conduit.xyz',
        testnet: true
      }

      expect(isVarityChain(invalidChain)).toBe(false)
    })

    test('USDCAmount always has 6 decimals', () => {
      const amount: USDCAmount = formatUSDC(1000000n)

      expect(amount.decimals).toBe(6)
    })
  })
})
