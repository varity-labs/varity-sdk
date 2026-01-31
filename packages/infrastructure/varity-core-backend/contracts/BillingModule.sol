// SPDX-License-Identifier: PROPRIETARY
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BillingModule
 * @notice Tracks usage metrics for customer billing
 * @dev PROPRIETARY - DO NOT DISTRIBUTE
 */
contract BillingModule is Ownable, ReentrancyGuard {
    // Usage types
    bytes32 public constant USAGE_TYPE_COMPUTE = keccak256("COMPUTE");
    bytes32 public constant USAGE_TYPE_STORAGE = keccak256("STORAGE");
    bytes32 public constant USAGE_TYPE_BANDWIDTH = keccak256("BANDWIDTH");
    bytes32 public constant USAGE_TYPE_LLM_CALLS = keccak256("LLM_CALLS");
    bytes32 public constant USAGE_TYPE_RAG_QUERIES = keccak256("RAG_QUERIES");

    struct UsageRecord {
        string customerId;
        bytes32 usageType;
        uint256 amount;
        uint256 timestamp;
        uint256 billingPeriod;
    }

    struct CustomerBilling {
        string customerId;
        uint256 currentPeriodStart;
        uint256 currentPeriodEnd;
        uint256 totalComputeUnits;
        uint256 totalStorageGB;
        uint256 totalBandwidthGB;
        uint256 totalLLMCalls;
        uint256 totalRAGQueries;
        bool active;
    }

    // Mapping: customerId => CustomerBilling
    mapping(string => CustomerBilling) public customerBilling;

    // Mapping: customerId => billingPeriod => UsageRecord[]
    mapping(string => mapping(uint256 => UsageRecord[])) public usageHistory;

    // Billing period duration (30 days in seconds)
    uint256 public constant BILLING_PERIOD = 30 days;

    // Events
    event UsageRecorded(
        string indexed customerId,
        bytes32 indexed usageType,
        uint256 amount,
        uint256 billingPeriod,
        uint256 timestamp
    );

    event BillingPeriodStarted(
        string indexed customerId,
        uint256 periodStart,
        uint256 periodEnd,
        uint256 timestamp
    );

    event BillingPeriodEnded(
        string indexed customerId,
        uint256 periodEnd,
        uint256 totalCompute,
        uint256 totalStorage,
        uint256 totalBandwidth,
        uint256 totalLLMCalls,
        uint256 totalRAGQueries,
        uint256 timestamp
    );

    // Custom errors
    error InvalidCustomerId();
    error InvalidUsageType();
    error InvalidAmount();
    error CustomerNotActive();
    error BillingPeriodNotStarted();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Initialize billing for a new customer
     * @param customerId Customer identifier
     */
    function initializeCustomer(string calldata customerId)
        external
        onlyOwner
        nonReentrant
    {
        if (bytes(customerId).length == 0) revert InvalidCustomerId();

        CustomerBilling storage billing = customerBilling[customerId];
        require(!billing.active, "Customer already initialized");

        uint256 periodStart = block.timestamp;
        uint256 periodEnd = periodStart + BILLING_PERIOD;

        billing.customerId = customerId;
        billing.currentPeriodStart = periodStart;
        billing.currentPeriodEnd = periodEnd;
        billing.active = true;

        emit BillingPeriodStarted(
            customerId,
            periodStart,
            periodEnd,
            block.timestamp
        );
    }

    /**
     * @notice Record usage for a customer
     * @param customerId Customer identifier
     * @param usageType Type of usage (COMPUTE, STORAGE, etc.)
     * @param amount Usage amount
     */
    function recordUsage(
        string calldata customerId,
        bytes32 usageType,
        uint256 amount
    ) external onlyOwner {
        if (bytes(customerId).length == 0) revert InvalidCustomerId();
        if (amount == 0) revert InvalidAmount();

        CustomerBilling storage billing = customerBilling[customerId];
        if (!billing.active) revert CustomerNotActive();

        // Check if billing period needs to be rotated
        if (block.timestamp > billing.currentPeriodEnd) {
            _rotateBillingPeriod(customerId);
        }

        // Calculate current billing period number
        uint256 billingPeriod = (block.timestamp - billing.currentPeriodStart) / BILLING_PERIOD;

        // Record usage
        UsageRecord memory record = UsageRecord({
            customerId: customerId,
            usageType: usageType,
            amount: amount,
            timestamp: block.timestamp,
            billingPeriod: billingPeriod
        });

        usageHistory[customerId][billingPeriod].push(record);

        // Update totals
        if (usageType == USAGE_TYPE_COMPUTE) {
            billing.totalComputeUnits += amount;
        } else if (usageType == USAGE_TYPE_STORAGE) {
            billing.totalStorageGB += amount;
        } else if (usageType == USAGE_TYPE_BANDWIDTH) {
            billing.totalBandwidthGB += amount;
        } else if (usageType == USAGE_TYPE_LLM_CALLS) {
            billing.totalLLMCalls += amount;
        } else if (usageType == USAGE_TYPE_RAG_QUERIES) {
            billing.totalRAGQueries += amount;
        } else {
            revert InvalidUsageType();
        }

        emit UsageRecorded(
            customerId,
            usageType,
            amount,
            billingPeriod,
            block.timestamp
        );
    }

    /**
     * @notice Rotate billing period and reset counters
     * @param customerId Customer identifier
     */
    function _rotateBillingPeriod(string memory customerId) internal {
        CustomerBilling storage billing = customerBilling[customerId];

        emit BillingPeriodEnded(
            customerId,
            billing.currentPeriodEnd,
            billing.totalComputeUnits,
            billing.totalStorageGB,
            billing.totalBandwidthGB,
            billing.totalLLMCalls,
            billing.totalRAGQueries,
            block.timestamp
        );

        // Reset counters
        billing.totalComputeUnits = 0;
        billing.totalStorageGB = 0;
        billing.totalBandwidthGB = 0;
        billing.totalLLMCalls = 0;
        billing.totalRAGQueries = 0;

        // Set new period
        billing.currentPeriodStart = billing.currentPeriodEnd;
        billing.currentPeriodEnd = billing.currentPeriodStart + BILLING_PERIOD;

        emit BillingPeriodStarted(
            customerId,
            billing.currentPeriodStart,
            billing.currentPeriodEnd,
            block.timestamp
        );
    }

    /**
     * @notice Get current billing data for a customer
     * @param customerId Customer identifier
     * @return CustomerBilling struct
     */
    function getCustomerBilling(string calldata customerId)
        external
        view
        returns (CustomerBilling memory)
    {
        CustomerBilling memory billing = customerBilling[customerId];
        if (!billing.active) revert CustomerNotActive();
        return billing;
    }

    /**
     * @notice Get usage history for a billing period
     * @param customerId Customer identifier
     * @param billingPeriod Billing period number
     * @return Array of UsageRecord
     */
    function getUsageHistory(
        string calldata customerId,
        uint256 billingPeriod
    ) external view returns (UsageRecord[] memory) {
        return usageHistory[customerId][billingPeriod];
    }

    /**
     * @notice Calculate estimated monthly cost (in wei)
     * @param customerId Customer identifier
     * @return Estimated cost in wei
     */
    function calculateEstimatedCost(string calldata customerId)
        external
        view
        returns (uint256)
    {
        CustomerBilling memory billing = customerBilling[customerId];
        if (!billing.active) revert CustomerNotActive();

        // Cost breakdown (example pricing):
        // - Compute: 0.001 ETH per 1000 units
        // - Storage: 0.0001 ETH per GB
        // - Bandwidth: 0.0001 ETH per GB
        // - LLM Calls: 0.00001 ETH per call
        // - RAG Queries: 0.000001 ETH per query

        uint256 computeCost = (billing.totalComputeUnits * 1e15) / 1000;
        uint256 storageCost = billing.totalStorageGB * 1e14;
        uint256 bandwidthCost = billing.totalBandwidthGB * 1e14;
        uint256 llmCost = billing.totalLLMCalls * 1e13;
        uint256 ragCost = billing.totalRAGQueries * 1e12;

        return computeCost + storageCost + bandwidthCost + llmCost + ragCost;
    }

    /**
     * @notice Deactivate billing for a customer
     * @param customerId Customer identifier
     */
    function deactivateCustomer(string calldata customerId)
        external
        onlyOwner
    {
        CustomerBilling storage billing = customerBilling[customerId];
        if (!billing.active) revert CustomerNotActive();

        billing.active = false;

        emit BillingPeriodEnded(
            customerId,
            block.timestamp,
            billing.totalComputeUnits,
            billing.totalStorageGB,
            billing.totalBandwidthGB,
            billing.totalLLMCalls,
            billing.totalRAGQueries,
            block.timestamp
        );
    }

    /**
     * @notice Get current billing period number
     * @param customerId Customer identifier
     * @return Current period number
     */
    function getCurrentBillingPeriod(string calldata customerId)
        external
        view
        returns (uint256)
    {
        CustomerBilling memory billing = customerBilling[customerId];
        if (!billing.active) revert CustomerNotActive();

        return (block.timestamp - billing.currentPeriodStart) / BILLING_PERIOD;
    }
}
