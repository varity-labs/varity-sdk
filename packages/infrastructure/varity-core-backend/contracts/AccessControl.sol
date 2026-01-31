// SPDX-License-Identifier: PROPRIETARY
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AccessControl
 * @notice Manages customer wallet permissions and access levels
 * @dev PROPRIETARY - DO NOT DISTRIBUTE
 */
contract AccessControl is Ownable, ReentrancyGuard {
    // Access levels
    uint8 public constant ACCESS_LEVEL_NONE = 0;
    uint8 public constant ACCESS_LEVEL_READ = 1;
    uint8 public constant ACCESS_LEVEL_WRITE = 2;
    uint8 public constant ACCESS_LEVEL_ADMIN = 3;

    struct AccessRecord {
        address wallet;
        string resourceId;
        uint8 accessLevel;
        uint256 grantedAt;
        uint256 expiresAt;
        bool active;
    }

    // Mapping: wallet => resourceId => AccessRecord
    mapping(address => mapping(string => AccessRecord)) public accessRecords;

    // Mapping: resourceId => wallet array for enumeration
    mapping(string => address[]) public resourceWallets;

    // Events
    event AccessGranted(
        address indexed wallet,
        string indexed resourceId,
        uint8 accessLevel,
        uint256 expiresAt,
        uint256 timestamp
    );

    event AccessRevoked(
        address indexed wallet,
        string indexed resourceId,
        uint256 timestamp
    );

    event AccessUpdated(
        address indexed wallet,
        string indexed resourceId,
        uint8 newAccessLevel,
        uint256 timestamp
    );

    // Custom errors
    error InvalidWallet();
    error InvalidResourceId();
    error InvalidAccessLevel();
    error AccessAlreadyGranted(address wallet, string resourceId);
    error AccessNotFound(address wallet, string resourceId);
    error AccessExpired(address wallet, string resourceId);
    error InsufficientPermissions(address wallet, string resourceId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Grant access to a wallet for a resource
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier (e.g., dashboard ID, storage namespace)
     * @param accessLevel Access level (0=None, 1=Read, 2=Write, 3=Admin)
     * @param expiresAt Expiration timestamp (0 for no expiration)
     */
    function grantAccess(
        address wallet,
        string calldata resourceId,
        uint8 accessLevel,
        uint256 expiresAt
    ) external onlyOwner nonReentrant {
        if (wallet == address(0)) revert InvalidWallet();
        if (bytes(resourceId).length == 0) revert InvalidResourceId();
        if (accessLevel > ACCESS_LEVEL_ADMIN) revert InvalidAccessLevel();

        AccessRecord storage record = accessRecords[wallet][resourceId];
        if (record.grantedAt != 0 && record.active) {
            revert AccessAlreadyGranted(wallet, resourceId);
        }

        record.wallet = wallet;
        record.resourceId = resourceId;
        record.accessLevel = accessLevel;
        record.grantedAt = block.timestamp;
        record.expiresAt = expiresAt;
        record.active = true;

        resourceWallets[resourceId].push(wallet);

        emit AccessGranted(
            wallet,
            resourceId,
            accessLevel,
            expiresAt,
            block.timestamp
        );
    }

    /**
     * @notice Revoke access from a wallet
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     */
    function revokeAccess(
        address wallet,
        string calldata resourceId
    ) external onlyOwner {
        AccessRecord storage record = accessRecords[wallet][resourceId];
        if (record.grantedAt == 0) {
            revert AccessNotFound(wallet, resourceId);
        }

        record.active = false;

        emit AccessRevoked(wallet, resourceId, block.timestamp);
    }

    /**
     * @notice Update access level for existing access
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     * @param newAccessLevel New access level
     */
    function updateAccessLevel(
        address wallet,
        string calldata resourceId,
        uint8 newAccessLevel
    ) external onlyOwner {
        if (newAccessLevel > ACCESS_LEVEL_ADMIN) revert InvalidAccessLevel();

        AccessRecord storage record = accessRecords[wallet][resourceId];
        if (record.grantedAt == 0) {
            revert AccessNotFound(wallet, resourceId);
        }

        record.accessLevel = newAccessLevel;

        emit AccessUpdated(wallet, resourceId, newAccessLevel, block.timestamp);
    }

    /**
     * @notice Check if wallet has access to resource
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     * @return Boolean indicating access status
     */
    function hasAccess(
        address wallet,
        string calldata resourceId
    ) external view returns (bool) {
        AccessRecord memory record = accessRecords[wallet][resourceId];

        if (!record.active || record.grantedAt == 0) {
            return false;
        }

        // Check expiration
        if (record.expiresAt > 0 && block.timestamp > record.expiresAt) {
            return false;
        }

        return record.accessLevel > ACCESS_LEVEL_NONE;
    }

    /**
     * @notice Check if wallet has specific access level
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     * @param requiredLevel Minimum required access level
     * @return Boolean indicating if wallet has required level
     */
    function hasAccessLevel(
        address wallet,
        string calldata resourceId,
        uint8 requiredLevel
    ) external view returns (bool) {
        AccessRecord memory record = accessRecords[wallet][resourceId];

        if (!record.active || record.grantedAt == 0) {
            return false;
        }

        // Check expiration
        if (record.expiresAt > 0 && block.timestamp > record.expiresAt) {
            return false;
        }

        return record.accessLevel >= requiredLevel;
    }

    /**
     * @notice Get access record details
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     * @return AccessRecord struct
     */
    function getAccessRecord(
        address wallet,
        string calldata resourceId
    ) external view returns (AccessRecord memory) {
        AccessRecord memory record = accessRecords[wallet][resourceId];
        if (record.grantedAt == 0) {
            revert AccessNotFound(wallet, resourceId);
        }
        return record;
    }

    /**
     * @notice Get all wallets with access to a resource
     * @param resourceId Resource identifier
     * @return Array of wallet addresses
     */
    function getResourceWallets(string calldata resourceId)
        external
        view
        returns (address[] memory)
    {
        return resourceWallets[resourceId];
    }

    /**
     * @notice Require specific access level (revert if insufficient)
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     * @param requiredLevel Minimum required access level
     */
    function requireAccessLevel(
        address wallet,
        string calldata resourceId,
        uint8 requiredLevel
    ) external view {
        AccessRecord memory record = accessRecords[wallet][resourceId];

        if (!record.active || record.grantedAt == 0) {
            revert AccessNotFound(wallet, resourceId);
        }

        if (record.expiresAt > 0 && block.timestamp > record.expiresAt) {
            revert AccessExpired(wallet, resourceId);
        }

        if (record.accessLevel < requiredLevel) {
            revert InsufficientPermissions(wallet, resourceId);
        }
    }

    /**
     * @notice Extend expiration time for access
     * @param wallet Customer wallet address
     * @param resourceId Resource identifier
     * @param newExpiresAt New expiration timestamp
     */
    function extendAccess(
        address wallet,
        string calldata resourceId,
        uint256 newExpiresAt
    ) external onlyOwner {
        AccessRecord storage record = accessRecords[wallet][resourceId];
        if (record.grantedAt == 0) {
            revert AccessNotFound(wallet, resourceId);
        }

        require(
            newExpiresAt > record.expiresAt,
            "New expiration must be later than current"
        );

        record.expiresAt = newExpiresAt;

        emit AccessUpdated(wallet, resourceId, record.accessLevel, block.timestamp);
    }
}
