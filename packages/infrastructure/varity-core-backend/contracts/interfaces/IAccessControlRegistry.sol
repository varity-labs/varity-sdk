// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IAccessControlRegistry
 * @notice Interface for the AccessControl contract
 */
interface IAccessControlRegistry {
    // Structs
    struct UserProfile {
        address userAddress;
        bytes32 primaryRole;
        string metadata;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
    }

    struct RoleConfiguration {
        string roleName;
        string description;
        uint256 maxUsers;
        uint256 currentUsers;
        bool isActive;
    }

    struct AccessCondition {
        string condition;
        bytes encryptedKey;
        bool isActive;
        uint256 lastUpdated;
    }

    // Functions
    function assignRole(
        address _user,
        bytes32 _role,
        string calldata _metadata
    ) external;

    function revokeRole(address _user, bytes32 _role) external;

    function configureLitProtocol(
        string calldata _endpoint,
        bool _enabled
    ) external;

    function setAccessCondition(
        bytes32 _role,
        string calldata _condition,
        bytes calldata _encryptedKey
    ) external;

    function getAccessCondition(
        bytes32 _role
    ) external view returns (AccessCondition memory);

    function hasAnyRole(
        address _user,
        bytes32[] calldata _roles
    ) external view returns (bool);

    function getUserProfile(
        address _user
    ) external view returns (UserProfile memory);

    function getRoleConfiguration(
        bytes32 _role
    ) external view returns (RoleConfiguration memory);

    function getUsersByRole(
        bytes32 _role
    ) external view returns (address[] memory);

    function getUserRoleHistory(
        address _user
    ) external view returns (bytes32[] memory);
}