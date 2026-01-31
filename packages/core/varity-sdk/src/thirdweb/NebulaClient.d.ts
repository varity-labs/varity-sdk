/**
 * thirdweb Nebula AI Client
 *
 * Natural language blockchain interactions powered by AI
 * Enables developers to interact with smart contracts using plain English
 *
 * Features:
 * - Generate smart contracts from natural language descriptions
 * - Query blockchain data using natural language
 * - Explain transaction data in human-readable format
 * - Generate contract interaction code
 * - Analyze contracts for security issues
 */
import type { ThirdwebClient, Chain } from 'thirdweb';
/**
 * Nebula AI configuration
 */
export interface NebulaConfig {
    /**
     * thirdweb client instance
     */
    client: ThirdwebClient;
    /**
     * API key for Nebula AI (optional - uses client's credentials if not provided)
     */
    apiKey?: string;
}
/**
 * Contract generation options
 */
export interface GenerateContractOptions {
    /**
     * Natural language description of the contract
     * @example "Create a marketplace contract where users can list NFTs for sale"
     */
    prompt: string;
    /**
     * Contract type hint (optional)
     */
    contractType?: 'token' | 'nft' | 'marketplace' | 'dao' | 'custom';
    /**
     * Solidity version (default: 0.8.20)
     */
    solidityVersion?: string;
    /**
     * Include security features (default: true)
     */
    includeSecurity?: boolean;
}
/**
 * Generated contract result
 */
export interface GeneratedContract {
    /**
     * Generated Solidity source code
     */
    sourceCode: string;
    /**
     * Contract ABI
     */
    abi: any[];
    /**
     * Contract bytecode
     */
    bytecode: string;
    /**
     * Explanation of the contract
     */
    explanation: string;
    /**
     * Detected security issues (if any)
     */
    securityIssues?: string[];
}
/**
 * Blockchain query options
 */
export interface QueryChainOptions {
    /**
     * Natural language query
     * @example "What is the total supply of USDC on Arbitrum?"
     */
    prompt: string;
    /**
     * Chain to query
     */
    chain: Chain;
    /**
     * Contract address (optional - if querying specific contract)
     */
    contractAddress?: string;
}
/**
 * Query result
 */
export interface QueryResult {
    /**
     * Answer to the query
     */
    answer: string;
    /**
     * Structured data (if applicable)
     */
    data?: any;
    /**
     * Sources used to answer the query
     */
    sources?: string[];
    /**
     * Confidence score (0-1)
     */
    confidence: number;
}
/**
 * Transaction explanation options
 */
export interface ExplainTransactionOptions {
    /**
     * Transaction hash
     */
    txHash: string;
    /**
     * Chain where transaction occurred
     */
    chain: Chain;
    /**
     * Detail level
     */
    detail?: 'simple' | 'detailed' | 'technical';
}
/**
 * Transaction explanation
 */
export interface TransactionExplanation {
    /**
     * Human-readable summary
     */
    summary: string;
    /**
     * Detailed breakdown
     */
    details: {
        from: string;
        to: string;
        value: string;
        function: string;
        parameters: Record<string, any>;
    };
    /**
     * Risk assessment
     */
    risks?: string[];
    /**
     * Gas cost explanation
     */
    gasCost: {
        total: string;
        explanation: string;
    };
}
/**
 * Code generation options
 */
export interface GenerateCodeOptions {
    /**
     * Natural language description of what to do
     * @example "Call the mint function with 1000 tokens"
     */
    prompt: string;
    /**
     * Contract address
     */
    contractAddress: string;
    /**
     * Chain
     */
    chain: Chain;
    /**
     * Programming language
     */
    language?: 'typescript' | 'python' | 'go' | 'rust';
}
/**
 * Generated code
 */
export interface GeneratedCode {
    /**
     * Generated code
     */
    code: string;
    /**
     * Explanation of the code
     */
    explanation: string;
    /**
     * Required dependencies
     */
    dependencies?: string[];
}
/**
 * Contract analysis options
 */
export interface AnalyzeContractOptions {
    /**
     * Contract source code or address
     */
    contract: string;
    /**
     * Chain (if analyzing deployed contract)
     */
    chain?: Chain;
    /**
     * Analysis focus
     */
    focus?: 'security' | 'gas' | 'general';
}
/**
 * Contract analysis result
 */
export interface ContractAnalysis {
    /**
     * Overall assessment
     */
    summary: string;
    /**
     * Security issues found
     */
    security: {
        severity: 'critical' | 'high' | 'medium' | 'low';
        issue: string;
        location: string;
        recommendation: string;
    }[];
    /**
     * Gas optimization suggestions
     */
    gasOptimizations?: {
        location: string;
        currentCost: string;
        optimizedCost: string;
        suggestion: string;
    }[];
    /**
     * Best practices violations
     */
    bestPractices?: string[];
}
/**
 * thirdweb Nebula AI Client
 *
 * Interact with blockchain using natural language powered by AI
 */
export declare class NebulaClient {
    private client;
    private apiKey?;
    private baseUrl;
    constructor(config: NebulaConfig);
    /**
     * Generate a smart contract from natural language description
     */
    generateContract(options: GenerateContractOptions): Promise<GeneratedContract>;
    /**
     * Query blockchain data using natural language
     */
    queryChain(options: QueryChainOptions): Promise<QueryResult>;
    /**
     * Explain a transaction in human-readable format
     */
    explainTransaction(options: ExplainTransactionOptions): Promise<TransactionExplanation>;
    /**
     * Generate code to interact with a contract
     */
    generateCode(options: GenerateCodeOptions): Promise<GeneratedCode>;
    /**
     * Analyze a contract for security issues and optimizations
     */
    analyzeContract(options: AnalyzeContractOptions): Promise<ContractAnalysis>;
    /**
     * Make HTTP request to Nebula API
     */
    private request;
    /**
     * Mock response for development
     * TODO: Remove when Nebula AI is fully released
     */
    private getMockResponse;
}
/**
 * Create Nebula AI client instance
 */
export declare function createNebulaClient(config: NebulaConfig): NebulaClient;
//# sourceMappingURL=NebulaClient.d.ts.map