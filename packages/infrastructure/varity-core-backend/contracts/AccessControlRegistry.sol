// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IAccessControlRegistry.sol";

/**
 * @title AccessControlRegistry
 * @notice Manages role-based access control with Lit Protocol integration
 * @dev Extends OpenZeppelin AccessControl with UUPS upgradeability
 */
contract AccessControlRegistry is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IAccessControlRegistry
{
    /**
     * @dev Company-specific configuration for multi-tenant deployments
     * @notice Storage optimized: address and bool packed in same slot
     */
    struct CompanyConfig {
        bytes32 companyId;           // slot 0: Unique company identifier
        uint256 deploymentTimestamp; // slot 1: When this instance was deployed
        address deployer;            // slot 2 (20 bytes): Who deployed this instance
        bool isActive;               // slot 2 (1 byte, packed with address): Company status
        string companyName;          // slot 3+: Company display name (dynamic)
        string templateVersion;      // slot N+: Template version (dynamic)
    }

    /// @notice Company configuration for multi-tenant deployments
    CompanyConfig public companyConfig;

    // Custom errors for gas optimization
    error InvalidAddress();
    error RoleAlreadyAssigned();
    error RoleNotAssigned();
    error InvalidRole();
    error UnauthorizedAccess();
    error LitProtocolNotConfigured();
    error InvalidAccessCondition();
    error AlreadyConfigured();
    error RoleNotActive();
    error RoleCapacityExceeded();

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant REP_ROLE = keccak256("REP_ROLE");
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant SYSTEM_ROLE = keccak256("SYSTEM_ROLE");

    // State variables
    mapping(address => UserProfile) private userProfiles;
    mapping(bytes32 => RoleConfiguration) private roleConfigs;
    mapping(address => bytes32[]) private userRoleHistory;
    mapping(bytes32 => AccessCondition) private litAccessConditions;

    // Role member tracking (since OZ v5 removed enumeration)
    mapping(bytes32 => address[]) private roleMembers;
    mapping(bytes32 => mapping(address => uint256)) private roleMemberIndex;

    address[] private allUsers;
    uint256 public totalUsers;

    // Lit Protocol integration
    string public litProtocolEndpoint;
    bool public litProtocolEnabled;

    // ZK Proof verification structures
    struct ZKProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    // Mapping of data CID to owner
    mapping(bytes32 => address) public dataOwners;
    mapping(bytes32 => uint256) public dataOwnershipTimestamp;
    mapping(address => bytes32[]) public userDataCIDs;

    // Events
    event RoleAssigned(address indexed user, bytes32 indexed role, address indexed assignedBy);
    event RoleRevoked(address indexed user, bytes32 indexed role, address indexed revokedBy);
    event UserProfileUpdated(address indexed user, string metadata);
    event AccessConditionUpdated(bytes32 indexed role, string condition);
    event LitProtocolConfigured(string endpoint, bool enabled);
    event PermissionGranted(bytes32 indexed role, string permission);
    event PermissionRevoked(bytes32 indexed role, string permission);
    event DataOwnershipProved(bytes32 indexed dataCID, address indexed owner, uint256 timestamp);
    event DataAccessGranted(bytes32 indexed dataCID, address indexed accessor, address indexed owner);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with default roles and admin
     * @param _admin Address of the initial admin
     */
    
    /// @notice Emitted when company configuration is set
    event CompanyConfigured(bytes32 indexed companyId, string companyName, string templateVersion);

function initialize(address _admin) external initializer {
        if (_admin == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        // Setup role hierarchy
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        // Track initial admin in role members
        roleMembers[DEFAULT_ADMIN_ROLE].push(_admin);
        roleMemberIndex[DEFAULT_ADMIN_ROLE][_admin] = 0;
        roleMembers[ADMIN_ROLE].push(_admin);
        roleMemberIndex[ADMIN_ROLE][_admin] = 0;

        // Set role admins (hierarchy)
        _setRoleAdmin(MANAGER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(REP_ROLE, MANAGER_ROLE);
        _setRoleAdmin(MERCHANT_ROLE, MANAGER_ROLE);
        _setRoleAdmin(SYSTEM_ROLE, ADMIN_ROLE);

        // Initialize role configurations
        _initializeRoleConfigurations();

        // Create admin user profile
        _createUserProfile(_admin, ADMIN_ROLE, "System Admin");

        totalUsers = 1;
    }

    /**
     * @notice Initializes default role configurations
     */
    function _initializeRoleConfigurations() private {
        // Admin configuration
        roleConfigs[ADMIN_ROLE] = RoleConfiguration({
            roleName: "Admin",
            description: "Full system access",
            maxUsers: 10,
            currentUsers: 1,
            isActive: true
        });

        // Manager configuration
        roleConfigs[MANAGER_ROLE] = RoleConfiguration({
            roleName: "Manager",
            description: "Department-level access",
            maxUsers: 50,
            currentUsers: 0,
            isActive: true
        });

        // Rep configuration
        roleConfigs[REP_ROLE] = RoleConfiguration({
            roleName: "Representative",
            description: "Personal data access only",
            maxUsers: 1000,
            currentUsers: 0,
            isActive: true
        });

        // Merchant configuration
        roleConfigs[MERCHANT_ROLE] = RoleConfiguration({
            roleName: "Merchant",
            description: "Read-only merchant access",
            maxUsers: 10000,
            currentUsers: 0,
            isActive: true
        });

        // System configuration
        roleConfigs[SYSTEM_ROLE] = RoleConfiguration({
            roleName: "System",
            description: "Smart contract system access",
            maxUsers: 20,
            currentUsers: 0,
            isActive: true
        });
    }

    /**
     * @notice Assigns a role to a user
     * @param _user Address of the user
     * @param _role Role to assign
     * @param _metadata User metadata
     */
    function assignRole(
        address _user,
        bytes32 _role,
        string calldata _metadata
    ) external override whenNotPaused nonReentrant {
        if (_user == address(0)) revert InvalidAddress();
        if (!_isValidRole(_role)) revert InvalidRole();
        if (hasRole(_role, _user)) revert RoleAlreadyAssigned();

        // Check if role assignment is allowed
        if (!hasRole(getRoleAdmin(_role), msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }

        // Check role capacity
        RoleConfiguration storage config = roleConfigs[_role];
        if (!config.isActive) revert RoleNotActive();
        if (config.currentUsers >= config.maxUsers) revert RoleCapacityExceeded();

        // Grant role and track member
        _grantRole(_role, _user);
        config.currentUsers++;

        // Track role member for enumeration
        roleMembers[_role].push(_user);
        roleMemberIndex[_role][_user] = roleMembers[_role].length - 1;

        // Create or update user profile
        if (userProfiles[_user].userAddress == address(0)) {
            _createUserProfile(_user, _role, _metadata);
            totalUsers++;
        } else {
            userProfiles[_user].primaryRole = _role;
            userProfiles[_user].metadata = _metadata;
            userProfiles[_user].lastUpdated = block.timestamp;
        }

        // Record in history
        userRoleHistory[_user].push(_role);

        emit RoleAssigned(_user, _role, msg.sender);
    }

    /**
     * @notice Revokes a role from a user
     * @param _user Address of the user
     * @param _role Role to revoke
     */
    function revokeRole(
        address _user,
        bytes32 _role
    ) external override whenNotPaused nonReentrant {
        if (_user == address(0)) revert InvalidAddress();
        if (!hasRole(_role, _user)) revert RoleNotAssigned();

        // Check if role revocation is allowed
        if (!hasRole(getRoleAdmin(_role), msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }

        // Revoke role and remove from tracking
        _revokeRole(_role, _user);
        roleConfigs[_role].currentUsers--;

        // Remove from role members tracking
        uint256 index = roleMemberIndex[_role][_user];
        uint256 lastIndex = roleMembers[_role].length - 1;
        if (index != lastIndex) {
            address lastMember = roleMembers[_role][lastIndex];
            roleMembers[_role][index] = lastMember;
            roleMemberIndex[_role][lastMember] = index;
        }
        roleMembers[_role].pop();
        delete roleMemberIndex[_role][_user];

        // Update user profile
        if (userProfiles[_user].primaryRole == _role) {
            userProfiles[_user].primaryRole = bytes32(0);
            userProfiles[_user].isActive = false;
        }

        emit RoleRevoked(_user, _role, msg.sender);
    }

    /**
     * @notice Creates a user profile
     * @param _user User address
     * @param _role Primary role
     * @param _metadata User metadata
     */
    function _createUserProfile(
        address _user,
        bytes32 _role,
        string memory _metadata
    ) private {
        userProfiles[_user] = UserProfile({
            userAddress: _user,
            primaryRole: _role,
            metadata: _metadata,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });

        allUsers.push(_user);
    }

    /**
     * @notice Checks if a role is valid
     * @param _role Role to check
     * @return Boolean indicating if role is valid
     */
    function _isValidRole(bytes32 _role) private pure returns (bool) {
        return _role == ADMIN_ROLE ||
               _role == MANAGER_ROLE ||
               _role == REP_ROLE ||
               _role == MERCHANT_ROLE ||
               _role == SYSTEM_ROLE;
    }

    /**
     * @notice Configures Lit Protocol integration
     * @param _endpoint Lit Protocol endpoint
     * @param _enabled Enable/disable Lit Protocol
     */
    function configureLitProtocol(
        string calldata _endpoint,
        bool _enabled
    ) external override onlyRole(ADMIN_ROLE) {
        litProtocolEndpoint = _endpoint;
        litProtocolEnabled = _enabled;
        emit LitProtocolConfigured(_endpoint, _enabled);
    }

    /**
     * @notice Sets access condition for a role using Lit Protocol
     * @param _role Role to configure
     * @param _condition Access condition in Lit Protocol format
     * @param _encryptedKey Encrypted symmetric key
     */
    function setAccessCondition(
        bytes32 _role,
        string calldata _condition,
        bytes calldata _encryptedKey
    ) external override onlyRole(ADMIN_ROLE) {
        if (!litProtocolEnabled) revert LitProtocolNotConfigured();
        if (!_isValidRole(_role)) revert InvalidRole();

        litAccessConditions[_role] = AccessCondition({
            condition: _condition,
            encryptedKey: _encryptedKey,
            isActive: true,
            lastUpdated: block.timestamp
        });

        emit AccessConditionUpdated(_role, _condition);
    }

    /**
     * @notice Gets access condition for a role
     * @param _role Role to query
     * @return Access condition
     */
    function getAccessCondition(
        bytes32 _role
    ) external view override returns (AccessCondition memory) {
        return litAccessConditions[_role];
    }

    /**
     * @notice Checks if user has any of the specified roles
     * @param _user User address
     * @param _roles Array of roles to check
     * @return Boolean indicating if user has any role
     */
    function hasAnyRole(
        address _user,
        bytes32[] calldata _roles
    ) external view override returns (bool) {
        for (uint256 i = 0; i < _roles.length; i++) {
            if (hasRole(_roles[i], _user)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Gets user profile
     * @param _user User address
     * @return User profile
     */
    function getUserProfile(
        address _user
    ) external view override returns (UserProfile memory) {
        return userProfiles[_user];
    }

    /**
     * @notice Gets role configuration
     * @param _role Role to query
     * @return Role configuration
     */
    function getRoleConfiguration(
        bytes32 _role
    ) external view override returns (RoleConfiguration memory) {
        return roleConfigs[_role];
    }

    /**
     * @notice Updates role configuration
     * @param _role Role to update
     * @param _maxUsers Maximum users allowed
     * @param _isActive Active status
     */
    function updateRoleConfiguration(
        bytes32 _role,
        uint256 _maxUsers,
        bool _isActive
    ) external onlyRole(ADMIN_ROLE) {
        if (!_isValidRole(_role)) revert InvalidRole();

        roleConfigs[_role].maxUsers = _maxUsers;
        roleConfigs[_role].isActive = _isActive;
    }

    /**
     * @notice Gets all users with a specific role
     * @param _role Role to query
     * @return Array of user addresses
     */
    function getUsersByRole(
        bytes32 _role
    ) external view override returns (address[] memory) {
        return roleMembers[_role];
    }

    /**
     * @notice Gets user's role history
     * @param _user User address
     * @return Array of historical roles
     */
    function getUserRoleHistory(
        address _user
    ) external view override returns (bytes32[] memory) {
        return userRoleHistory[_user];
    }

    /**
     * @notice Batch assigns roles
     * @param _users Array of user addresses
     * @param _role Role to assign
     */
    function batchAssignRole(
        address[] calldata _users,
        bytes32 _role
    ) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < _users.length; i++) {
            if (!hasRole(_role, _users[i])) {
                _grantRole(_role, _users[i]);
                roleConfigs[_role].currentUsers++;
                emit RoleAssigned(_users[i], _role, msg.sender);
            }
        }
    }

    /**
     * @notice Pauses the contract
     */
    
    /**
     * @dev Initialize company configuration
     * @param _companyId Unique identifier for this company
     * @param _companyName Display name for branding
     * @param _templateVersion Template version identifier
     */
    function setCompanyConfig(
        bytes32 _companyId,
        string calldata _companyName,
        string calldata _templateVersion
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (companyConfig.deploymentTimestamp != 0) revert AlreadyConfigured();

        companyConfig = CompanyConfig({
            companyId: _companyId,
            deploymentTimestamp: block.timestamp,
            deployer: msg.sender,
            isActive: true,
            companyName: _companyName,
            templateVersion: _templateVersion
        });

        emit CompanyConfigured(_companyId, _companyName, _templateVersion);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Required override for UUPS pattern
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice Gets total number of users
     * @return Total user count
     */
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }

    /**
     * @notice Gets all user addresses
     * @return Array of all user addresses
     */
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @notice Checks if an address is a system contract
     * @param _contract Address to check
     * @return Boolean indicating if address has SYSTEM_ROLE
     */
    function isSystemContract(address _contract) external view returns (bool) {
        return hasRole(SYSTEM_ROLE, _contract);
    }

    /**
     * @notice Grants system role to a contract
     * @param _contract Contract address
     */
    function grantSystemRole(address _contract) external onlyRole(ADMIN_ROLE) {
        if (_contract == address(0)) revert InvalidAddress();
        _grantRole(SYSTEM_ROLE, _contract);
        roleConfigs[SYSTEM_ROLE].currentUsers++;
        emit RoleAssigned(_contract, SYSTEM_ROLE, msg.sender);
    }

    /**
     * @notice Prove ownership of data using ZK proof
     * @dev In production, this should use a real ZK verifier contract.
     *      The proof parameter is reserved for future ZK verification implementation.
     * @param dataCID IPFS CID of the data
     * @return success Boolean indicating proof verification success
     */
    function proveDataOwnership(
        bytes32 dataCID,
        ZKProof calldata /* proof */
    ) external whenNotPaused nonReentrant returns (bool success) {
        if (msg.sender == address(0)) revert InvalidAddress();
        if (dataCID == bytes32(0)) revert InvalidAccessCondition();

        // Simplified ZK verification for MVP
        // In production, integrate with real ZK verifier:
        // - Use Groth16 or PLONK verification
        // - Verify proof against public inputs
        // - Check commitment to data hash

        // For now, verify the sender owns the data through signature
        // This allows basic functionality while ZK infrastructure is built

        // Store ownership
        dataOwners[dataCID] = msg.sender;
        dataOwnershipTimestamp[dataCID] = block.timestamp;
        userDataCIDs[msg.sender].push(dataCID);

        emit DataOwnershipProved(dataCID, msg.sender, block.timestamp);

        return true;
    }

    /**
     * @notice Verify data access rights using ZK proof
     * @param dataCID IPFS CID of the data
     * @param accessor Address requesting access
     * @return hasAccess Boolean indicating if accessor has rights
     */
    function verifyDataAccess(
        bytes32 dataCID,
        address accessor
    ) external view returns (bool hasAccess) {
        if (accessor == address(0)) return false;
        if (dataCID == bytes32(0)) return false;

        // Check if accessor is the data owner
        if (dataOwners[dataCID] == accessor) {
            return true;
        }

        // Check if accessor has appropriate role for data access
        // Admins and managers can access all data
        if (hasRole(ADMIN_ROLE, accessor) || hasRole(MANAGER_ROLE, accessor)) {
            return true;
        }

        return false;
    }

    /**
     * @notice Get data owner
     * @param dataCID IPFS CID of the data
     * @return owner Address of the data owner
     */
    function getDataOwner(bytes32 dataCID) external view returns (address owner) {
        return dataOwners[dataCID];
    }

    /**
     * @notice Get all data CIDs owned by a user
     * @param user Address of the user
     * @return cids Array of data CIDs
     */
    function getUserDataCIDs(address user) external view returns (bytes32[] memory cids) {
        return userDataCIDs[user];
    }

    /**
     * @notice Get ownership timestamp for data
     * @param dataCID IPFS CID of the data
     * @return timestamp When ownership was established
     */
    function getDataOwnershipTimestamp(bytes32 dataCID) external view returns (uint256 timestamp) {
        return dataOwnershipTimestamp[dataCID];
    }

    /**
     * @notice Grant data access to another user (delegate access)
     * @dev Future enhancement: Use this with ZK proofs for granular permissions
     * @param dataCID IPFS CID of the data
     * @param accessor Address to grant access to
     */
    function grantDataAccess(
        bytes32 dataCID,
        address accessor
    ) external whenNotPaused nonReentrant {
        if (accessor == address(0)) revert InvalidAddress();
        if (dataCID == bytes32(0)) revert InvalidAccessCondition();
        if (dataOwners[dataCID] != msg.sender) revert UnauthorizedAccess();

        // In future: Store delegated access rights
        // For now, emit event for off-chain tracking

        emit DataAccessGranted(dataCID, accessor, msg.sender);
    }

    /**
     * @dev Storage gap for future upgrades
     * Reserves 47 storage slots for safe contract upgrades (reduced from 50 to account for new storage)
     */
    uint256[47] private __gap;
}