// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITransactionVault
 * @notice Interface for the TransactionVault contract
 */
interface ITransactionVault {
    // Enums
    enum TransactionType {
        SALE,
        REFUND,
        ADJUSTMENT,
        FORECAST
    }

    // Structs
    struct Transaction {
        bytes32 transactionId;
        bytes32 merchantId;
        bytes32 repId;
        uint256 transactionDate;
        uint256 transactionAmount;
        uint256 grossResidual;
        TransactionType txType;
        bool isForecast;
        uint256 recordedAt;
        bytes32 batchId;
    }

    // Events - Comprehensive for The Graph indexing
    event TransactionRecorded(
        bytes32 indexed transactionId,
        bytes32 indexed merchantId,
        bytes32 indexed repId,
        uint256 transactionDate,
        uint256 transactionAmount,
        uint256 grossResidual,
        TransactionType txType,
        bool isForecast,
        uint256 blockTimestamp
    );

    event BatchTransactionsRecorded(
        bytes32 indexed batchId,
        uint256 transactionCount,
        uint256 totalVolume,
        uint256 totalResiduals
    );

    // Core Functions (APPEND-ONLY, NO UPDATES/DELETES)
    function recordTransaction(
        bytes32 merchantId,
        bytes32 repId,
        uint256 transactionDate,
        uint256 transactionAmount,
        uint256 grossResidual,
        TransactionType txType,
        bool isForecast
    ) external returns (bytes32 transactionId);

    function recordBatchTransactions(
        Transaction[] calldata transactions
    ) external returns (bytes32 batchId, uint256 count);

    // View Functions
    function getTransaction(bytes32 txId) external view returns (Transaction memory);

    function getTransactionsByMerchant(
        bytes32 merchantId,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory);

    function getTransactionsByRep(
        bytes32 repId,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory);

    function getTransactionsByDateRange(
        uint256 startDate,
        uint256 endDate,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory);

    function getTransactionCount() external view returns (uint256);

    function getTotalVolume() external view returns (uint256);

    function getTotalResiduals() external view returns (uint256);
}