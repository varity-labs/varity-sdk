// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IPimlicoPaymaster
 * @notice Interface for the PimlicoPaymaster contract
 */
interface IPimlicoPaymaster {
    // Structs
    struct SponsorshipConfig {
        uint256 maxTransactions;
        uint256 maxGasPerTransaction;
        uint256 dailyLimit;
        bool isActive;
    }

    struct UserQuota {
        uint256 transactionsUsed;
        uint256 gasUsed;
        uint256 lastUsed;
        uint256 resetTimestamp;
    }

    struct PaymasterStats {
        uint256 totalSponsored;
        uint256 totalWhitelisted;
        uint256 globalDailyLimit;
        uint256 globalTransactionLimit;
        uint256 paymasterBalance;
        bool sponsorshipEnabled;
    }

    // Functions
    function addToWhitelist(
        address _user,
        SponsorshipConfig calldata _config
    ) external;

    function removeFromWhitelist(address _user) external;

    function updateSponsorshipConfig(
        address _user,
        SponsorshipConfig calldata _config
    ) external;

    function whitelistRole(
        bytes32 _role,
        SponsorshipConfig calldata _config
    ) external;

    function resetUserQuota(address _user) external;

    function updateGlobalLimits(
        uint256 _dailyLimit,
        uint256 _transactionLimit
    ) external;

    function setSponsorshipEnabled(bool _enabled) external;

    function deposit() external payable;

    function getSponsorshipConfig(
        address _user
    ) external view returns (SponsorshipConfig memory);

    function getUserQuota(
        address _user
    ) external view returns (UserQuota memory);

    function isUserWhitelisted(address _user) external view returns (bool);

    function getWhitelistedUsers() external view returns (address[] memory);

    function getDailyUsage(
        address _user,
        uint256 _day
    ) external view returns (uint256);

    function getPaymasterStats() external view returns (PaymasterStats memory);
}

/**
 * @title SimplifiedUserOperation
 * @notice Simplified UserOperation for local testing
 */
struct SimplifiedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

/**
 * @title UserOperationLib
 * @notice Library for UserOperation struct operations
 */
library UserOperationLib {
    function getSender(SimplifiedUserOperation calldata userOp) internal pure returns (address) {
        return userOp.sender;
    }

    function gasPrice(SimplifiedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.maxFeePerGas;
    }
}