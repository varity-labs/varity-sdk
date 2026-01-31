// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMerchantRegistry
 * @notice Interface for the MerchantRegistry contract
 */
interface IMerchantRegistry {
    // Enums
    enum MerchantStatus {
        ACTIVE,
        INACTIVE,
        SUSPENDED,
        PROBLEMATIC
    }

    // Structs
    struct Merchant {
        bytes32 merchantId;
        address ownerAddress;
        string businessName;
        bytes32 assignedRepId;
        MerchantStatus status;
        uint256 registrationDate;
        uint256 totalLifetimeVolume;
        uint256 totalGrossResiduals;
        uint256 transactionCount;
        bool isFlagged;
        string flagReason;
    }

    // Events
    event MerchantRegistered(
        bytes32 indexed merchantId,
        address indexed ownerAddress,
        bytes32 indexed repId,
        uint256 timestamp
    );
    event MerchantStatusChanged(bytes32 indexed merchantId, MerchantStatus newStatus);
    event MerchantFlagged(bytes32 indexed merchantId, string reason, uint256 timestamp);
    event RepAssigned(bytes32 indexed merchantId, bytes32 indexed oldRepId, bytes32 indexed newRepId);

    // Core Functions
    function registerMerchant(
        string calldata businessName,
        address ownerAddress,
        bytes32 assignedRepId
    ) external returns (bytes32 merchantId);

    function updateMerchantStatus(bytes32 merchantId, MerchantStatus newStatus) external;

    function assignRep(bytes32 merchantId, bytes32 repId) external;

    function flagProblematicAccount(bytes32 merchantId, string calldata reason) external;

    function updateMerchantMetrics(
        bytes32 merchantId,
        uint256 volumeIncrease,
        uint256 residualIncrease
    ) external;

    // View Functions
    function getMerchant(bytes32 merchantId) external view returns (Merchant memory);

    function getMerchantsByRep(bytes32 repId) external view returns (bytes32[] memory);

    function getMerchantByOwner(address ownerAddress) external view returns (bytes32);

    function getMerchantCount() external view returns (uint256);

    function merchantExists(bytes32 merchantId) external view returns (bool);

    function getAllMerchants(uint256 offset, uint256 limit) external view returns (bytes32[] memory);
}