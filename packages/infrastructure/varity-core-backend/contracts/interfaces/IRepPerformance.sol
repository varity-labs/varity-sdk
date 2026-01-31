// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IRepPerformance
 * @notice Interface for the RepPerformance contract
 */
interface IRepPerformance {
    // Enums
    enum RepStatus {
        Active,
        Inactive,
        Suspended
    }

    enum LeaderboardType {
        Volume,
        Residuals,
        Transactions
    }

    // Structs
    struct Representative {
        bytes32 repId;
        address walletAddress;
        string repName;
        string contactEmail;
        RepStatus status;
        uint256 joinDate;
        uint256 totalVolume;
        uint256 totalResiduals;
        uint256 totalTransactions;
        uint256 merchantCount;
        uint256 commissionRate;
    }

    struct LeaderboardEntry {
        bytes32 repId;
        uint256 value;
        uint256 rank;
    }

    // Functions
    function registerRep(
        bytes32 _repId,
        address _walletAddress,
        string calldata _name,
        string calldata _contactEmail,
        uint256 _commissionRate
    ) external;

    function updateRepStatus(bytes32 _repId, RepStatus _status) external;

    function updateCommissionRate(bytes32 _repId, uint256 _newRate) external;

    function assignMerchant(bytes32 _repId, bytes32 _merchantId) external;

    function updatePerformance(
        bytes32 _repId,
        uint256 _volume,
        uint256 _residual
    ) external;

    function updateLeaderboards() external;

    function getTopRepsByVolume(uint256 _limit) external view returns (LeaderboardEntry[] memory);

    function getTopRepsByResiduals(uint256 _limit) external view returns (LeaderboardEntry[] memory);

    function getTopRepsByTransactions(uint256 _limit) external view returns (LeaderboardEntry[] memory);

    function getRep(bytes32 _repId) external view returns (Representative memory);

    function getRepByWallet(address _wallet) external view returns (Representative memory);

    function getRepMerchants(bytes32 _repId) external view returns (bytes32[] memory);
}