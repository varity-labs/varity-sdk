// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IPimlicoPaymaster.sol";

/**
 * @title SimplifiedPaymaster
 * @notice Simplified Paymaster for local testing - mock ERC-4337 functionality
 * @dev This is a simplified version for local testing without full AA infrastructure
 */
contract SimplifiedPaymaster is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IPimlicoPaymaster
{
    /**
     * @dev Company-specific configuration for multi-tenant deployments
     */
    struct CompanyConfig {
        bytes32 companyId;          // Unique company identifier
        string companyName;          // Company display name
        uint256 deploymentTimestamp; // When this instance was deployed
        address deployer;            // Who deployed this instance
        string templateVersion;      // Template version (e.g., "v1.0.0")
        bool isActive;               // Company status
    }

    /// @notice Company configuration for multi-tenant deployments
    CompanyConfig public companyConfig;

    // Custom errors
    error InsufficientBalance();
    error UserNotWhitelisted();
    error QuotaExceeded();
    error InvalidConfiguration();
    error TransferFailed();
    error SponsorshipDisabled();

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SPONSOR_ROLE = keccak256("SPONSOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // State variables
    mapping(address => SponsorshipConfig) private sponsorshipConfigs;
    mapping(address => UserQuota) private userQuotas;
    mapping(address => mapping(uint256 => uint256)) private dailyUsage;
    mapping(bytes32 => SponsorshipConfig) private roleBasedSponsorship;

    // Wallet sponsorship variables
    mapping(address => bool) public sponsoredWallets;
    mapping(address => uint256) public walletGasBudget;
    address public walletFactory;

    address[] private whitelistedUsers;
    uint256 public globalDailyLimit;
    uint256 public globalTransactionLimit;
    bool public sponsorshipEnabled;

    // Events
    event UserWhitelisted(address indexed user, SponsorshipConfig config);
    event UserRemovedFromWhitelist(address indexed user);
    event SponsorshipConfigUpdated(address indexed user, SponsorshipConfig config);
    event PaymasterDeposit(address indexed depositor, uint256 amount);
    event GasSponsored(address indexed user, uint256 gasAmount, uint256 cost);
    event WalletSponsored(address indexed wallet, uint256 gasBudget);
    event WalletFactorySet(address indexed factory);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the paymaster contract
     * @param _admin Admin address
     * @param _globalDailyLimit Global daily gas limit in wei
     * @param _globalTransactionLimit Global transaction limit per user
     */
    
    /// @notice Emitted when company configuration is set
    event CompanyConfigured(bytes32 indexed companyId, string companyName, string templateVersion);

function initialize(
        address _admin,
        uint256 _globalDailyLimit,
        uint256 _globalTransactionLimit
    ) external initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        globalDailyLimit = _globalDailyLimit;
        globalTransactionLimit = _globalTransactionLimit;
        sponsorshipEnabled = true;
    }

    /**
     * @notice Add user to whitelist with sponsorship configuration
     * @param _user User address
     * @param _config Sponsorship configuration
     */
    function addToWhitelist(
        address _user,
        SponsorshipConfig calldata _config
    ) external override onlyRole(ADMIN_ROLE) {
        if (_user == address(0)) revert InvalidConfiguration();
        if (sponsorshipConfigs[_user].isActive) revert InvalidConfiguration();

        sponsorshipConfigs[_user] = _config;
        whitelistedUsers.push(_user);

        emit UserWhitelisted(_user, _config);
    }

    /**
     * @notice Remove user from whitelist
     * @param _user User address to remove
     */
    function removeFromWhitelist(address _user) external override onlyRole(ADMIN_ROLE) {
        if (!sponsorshipConfigs[_user].isActive) revert UserNotWhitelisted();

        delete sponsorshipConfigs[_user];
        delete userQuotas[_user];

        // Remove from array
        for (uint256 i = 0; i < whitelistedUsers.length; i++) {
            if (whitelistedUsers[i] == _user) {
                whitelistedUsers[i] = whitelistedUsers[whitelistedUsers.length - 1];
                whitelistedUsers.pop();
                break;
            }
        }

        emit UserRemovedFromWhitelist(_user);
    }

    /**
     * @notice Update sponsorship configuration for a user
     * @param _user User address
     * @param _config New sponsorship configuration
     */
    function updateSponsorshipConfig(
        address _user,
        SponsorshipConfig calldata _config
    ) external override onlyRole(ADMIN_ROLE) {
        if (!sponsorshipConfigs[_user].isActive) revert UserNotWhitelisted();

        sponsorshipConfigs[_user] = _config;
        emit SponsorshipConfigUpdated(_user, _config);
    }

    /**
     * @notice Whitelist an entire role for sponsorship
     * @param _role Role to whitelist
     * @param _config Sponsorship configuration for the role
     */
    function whitelistRole(
        bytes32 _role,
        SponsorshipConfig calldata _config
    ) external override onlyRole(ADMIN_ROLE) {
        roleBasedSponsorship[_role] = _config;
    }

    /**
     * @notice Reset user quota (for testing)
     * @param _user User address
     */
    function resetUserQuota(address _user) external override onlyRole(ADMIN_ROLE) {
        delete userQuotas[_user];
        uint256 today = block.timestamp / 1 days;
        delete dailyUsage[_user][today];
    }

    /**
     * @notice Update global limits
     * @param _dailyLimit New global daily limit
     * @param _transactionLimit New global transaction limit
     */
    function updateGlobalLimits(
        uint256 _dailyLimit,
        uint256 _transactionLimit
    ) external override onlyRole(ADMIN_ROLE) {
        globalDailyLimit = _dailyLimit;
        globalTransactionLimit = _transactionLimit;
    }

    /**
     * @notice Enable or disable sponsorship
     * @param _enabled Whether sponsorship is enabled
     */
    function setSponsorshipEnabled(bool _enabled) external override onlyRole(ADMIN_ROLE) {
        sponsorshipEnabled = _enabled;
    }

    /**
     * @notice Set the wallet factory address
     * @param _factory Address of the wallet factory contract
     */
    function setWalletFactory(address _factory) external onlyRole(ADMIN_ROLE) {
        require(_factory != address(0), "Invalid factory address");
        walletFactory = _factory;
        emit WalletFactorySet(_factory);
    }

    /**
     * @notice Sponsor a wallet created by the factory
     * @param wallet Address of the wallet to sponsor
     * @param gasBudget Gas budget for the wallet in wei
     */
    function sponsorWallet(address wallet, uint256 gasBudget) external {
        require(msg.sender == walletFactory || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(wallet != address(0), "Invalid wallet address");
        require(gasBudget > 0, "Invalid gas budget");

        sponsoredWallets[wallet] = true;
        walletGasBudget[wallet] = gasBudget;

        emit WalletSponsored(wallet, gasBudget);
    }

    /**
     * @notice Check if a wallet is sponsored
     * @param wallet Wallet address to check
     * @return bool True if the wallet is sponsored
     */
    function isSponsoredWallet(address wallet) external view returns (bool) {
        return sponsoredWallets[wallet];
    }

    /**
     * @notice Get the gas budget for a sponsored wallet
     * @param wallet Wallet address
     * @return uint256 Gas budget in wei
     */
    function getWalletGasBudget(address wallet) external view returns (uint256) {
        return walletGasBudget[wallet];
    }

    /**
     * @notice Deposit funds to the paymaster
     */
    function deposit() external payable override {
        if (msg.value == 0) revert InvalidConfiguration();
        emit PaymasterDeposit(msg.sender, msg.value);
    }

    /**
     * @notice Simulate gas sponsorship (for testing)
     * @param _user User requesting sponsorship
     * @param _gasAmount Amount of gas to sponsor
     * @return success Whether sponsorship was successful
     */
    function sponsorGas(address _user, uint256 _gasAmount)
        external
        whenNotPaused
        returns (bool success)
    {
        if (!sponsorshipEnabled) revert SponsorshipDisabled();

        SponsorshipConfig memory config = sponsorshipConfigs[_user];
        if (!config.isActive) revert UserNotWhitelisted();

        UserQuota storage quota = userQuotas[_user];
        uint256 today = block.timestamp / 1 days;

        // Check daily reset
        if (quota.resetTimestamp < today) {
            quota.transactionsUsed = 0;
            quota.gasUsed = 0;
            quota.resetTimestamp = today;
        }

        // Check limits
        if (quota.transactionsUsed >= config.maxTransactions) revert QuotaExceeded();
        if (quota.gasUsed + _gasAmount > config.dailyLimit) revert QuotaExceeded();
        if (_gasAmount > config.maxGasPerTransaction) revert QuotaExceeded();

        // Update usage
        quota.transactionsUsed++;
        quota.gasUsed += _gasAmount;
        quota.lastUsed = block.timestamp;
        dailyUsage[_user][today] += _gasAmount;

        uint256 cost = _gasAmount * tx.gasprice;
        if (address(this).balance < cost) revert InsufficientBalance();

        emit GasSponsored(_user, _gasAmount, cost);
        return true;
    }

    // View functions

    function getSponsorshipConfig(address _user)
        external
        view
        override
        returns (SponsorshipConfig memory)
    {
        return sponsorshipConfigs[_user];
    }

    function getUserQuota(address _user)
        external
        view
        override
        returns (UserQuota memory)
    {
        return userQuotas[_user];
    }

    function isUserWhitelisted(address _user)
        external
        view
        override
        returns (bool)
    {
        return sponsorshipConfigs[_user].isActive;
    }

    function getWhitelistedUsers()
        external
        view
        override
        returns (address[] memory)
    {
        return whitelistedUsers;
    }

    function getDailyUsage(address _user, uint256 _day)
        external
        view
        override
        returns (uint256)
    {
        return dailyUsage[_user][_day];
    }

    function getPaymasterStats()
        external
        view
        override
        returns (PaymasterStats memory)
    {
        return PaymasterStats({
            totalSponsored: whitelistedUsers.length,
            totalWhitelisted: whitelistedUsers.length,
            globalDailyLimit: globalDailyLimit,
            globalTransactionLimit: globalTransactionLimit,
            paymasterBalance: address(this).balance,
            sponsorshipEnabled: sponsorshipEnabled
        });
    }

    // Admin functions

    function withdraw(address payable _to, uint256 _amount)
        external
        onlyRole(ADMIN_ROLE)
    {
        if (_to == address(0)) revert InvalidConfiguration();
        if (_amount > address(this).balance) revert InsufficientBalance();

        (bool success, ) = _to.call{value: _amount}("");
        if (!success) revert TransferFailed();
    }

    
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
        require(companyConfig.deploymentTimestamp == 0, "Already configured");

        companyConfig = CompanyConfig({
            companyId: _companyId,
            companyName: _companyName,
            deploymentTimestamp: block.timestamp,
            deployer: msg.sender,
            templateVersion: _templateVersion,
            isActive: true
        });

        emit CompanyConfigured(_companyId, _companyName, _templateVersion);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    receive() external payable {
        emit PaymasterDeposit(msg.sender, msg.value);
    }

    /**
     * @dev Storage gap for future upgrades
     * Reserves 50 storage slots for safe contract upgrades
     */
    uint256[50] private __gap;
}