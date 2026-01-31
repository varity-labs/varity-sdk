// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title GenericTemplate
 * @notice Generic template for company-specific deployments across industries
 * @dev Abstracts common patterns: EntityRegistry, ManagerPerformance, TransactionVault, CalculationEngine
 *
 * Industry Examples:
 * - Finance: Entities=Clients, Managers=Advisors, Transactions=Trades, Calculations=CommissionFees
 * - Healthcare: Entities=Patients, Managers=Doctors, Transactions=Appointments, Calculations=BillingRates
 * - Retail: Entities=Customers, Managers=SalesReps, Transactions=Orders, Calculations=Discounts
 * - ISO: Entities=Merchants, Managers=Reps, Transactions=Payments, Calculations=Residuals
 *
 * Security Features:
 * - UUPS upgradeable pattern
 * - Role-based access control
 * - Reentrancy protection
 * - Pausable for emergency stop
 * - Custom errors for gas optimization
 *
 * Integration:
 * - Celestia DA for data availability proofs
 * - Filecoin/IPFS for decentralized storage
 * - Akash Network for compute jobs
 * - Lit Protocol for encryption/access control
 */
contract GenericTemplate is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // ============ Role Definitions ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant SYSTEM_ROLE = keccak256("SYSTEM_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ============ Company Configuration ============

    struct CompanyConfig {
        bytes32 companyId;              // Unique company identifier
        string companyName;              // Display name
        string industry;                 // Industry type (finance, healthcare, retail, iso)
        string entityType;               // e.g., "merchant", "patient", "customer"
        string managerType;              // e.g., "rep", "doctor", "advisor"
        string transactionType;          // e.g., "payment", "appointment", "order"
        uint256 deploymentTimestamp;     // Deployment time
        address deployer;                // Deployer address
        string templateVersion;          // Template version
        bool isActive;                   // Active status
    }

    CompanyConfig public companyConfig;

    // ============ Entity Registry ============

    enum EntityStatus { ACTIVE, INACTIVE, SUSPENDED, FLAGGED }

    struct Entity {
        bytes32 entityId;
        address ownerAddress;
        string name;
        bytes32 assignedManagerId;
        EntityStatus status;
        uint256 registrationDate;
        uint256 totalVolume;
        uint256 totalValue;
        uint256 transactionCount;
        bool isFlagged;
        string flagReason;
        string metadata;                 // JSON metadata (industry-specific)
    }

    mapping(bytes32 => Entity) private entities;
    mapping(address => bytes32) private ownerToEntityId;
    mapping(bytes32 => bytes32[]) private managerToEntityIds;
    mapping(bytes32 => uint256) private entityIdToIndex;
    bytes32[] private entityIdList;

    // ============ Manager Performance ============

    enum ManagerStatus { ACTIVE, INACTIVE, ONBOARDING, SUSPENDED }

    struct Manager {
        bytes32 managerId;
        address walletAddress;
        string name;
        string contactInfo;              // Encrypted contact
        ManagerStatus status;
        uint256 joinDate;
        uint256 totalVolume;
        uint256 totalValue;
        uint256 totalTransactions;
        uint256 entityCount;
        uint256 compensationRate;        // In basis points (commission/fee/etc)
        string metadata;                 // JSON metadata (industry-specific)
    }

    mapping(bytes32 => Manager) private managers;
    mapping(address => bytes32) private walletToManagerId;
    mapping(bytes32 => uint256) private managerIdToIndex;
    bytes32[] private managerIdList;

    // ============ Transaction Vault ============

    enum TransactionType { STANDARD, ADJUSTMENT, REVERSAL, FORECAST }

    struct Transaction {
        bytes32 transactionId;
        bytes32 entityId;
        bytes32 managerId;
        uint256 transactionDate;
        uint256 amount;
        uint256 calculatedValue;         // Fee, charge, discount, etc.
        TransactionType txType;
        bool isForecast;
        uint256 recordedAt;
        bytes32 batchId;
        string metadata;                 // JSON metadata (industry-specific)
    }

    Transaction[] private transactions;
    mapping(bytes32 => uint256) private transactionIdToIndex;
    mapping(bytes32 => uint256[]) private entityTransactionIndices;
    mapping(bytes32 => uint256[]) private managerTransactionIndices;
    mapping(uint256 => uint256[]) private dailyTransactionIndices;

    // ============ Calculation Engine ============

    struct CalculationConfig {
        uint256 baseRateBps;             // Base rate in basis points
        uint256 volumeTier1;             // Tier 1 threshold
        uint256 volumeTier2;             // Tier 2 threshold
        uint256 tier1RateBps;            // Tier 1 rate
        uint256 tier2RateBps;            // Tier 2 rate
        uint256 tier3RateBps;            // Tier 3 rate
    }

    mapping(bytes32 => CalculationConfig) private entityCalculationConfigs;
    CalculationConfig private defaultCalculationConfig;
    mapping(bytes32 => uint256[]) private entityHistoricalRates;
    mapping(bytes32 => int256[]) private entityValueHistory;

    // ============ Data Storage Integration ============

    // Celestia PDA data commitment storage (for encrypted data)
    mapping(bytes32 => bytes32) private dataCommitments;

    // IPFS/Filecoin storage references
    mapping(bytes32 => bytes32[]) private entityDataCIDs;
    mapping(bytes32 => bytes32[]) private managerDataCIDs;

    // ============ Akash Network Compute Jobs ============

    struct ComputeJob {
        bytes32 jobId;
        string jobType;                  // "analytics", "ml_inference", "report_generation"
        bytes32 entityId;
        address requestor;
        uint256 requestedAt;
        uint256 completedAt;
        bool isComplete;
        string akashDeploymentId;        // Akash deployment reference
        bytes32 resultCID;               // IPFS CID of result
    }

    mapping(bytes32 => ComputeJob) private computeJobs;
    bytes32[] private computeJobIds;
    mapping(bytes32 => uint256) private jobIdToIndex;

    // ============ Constants ============

    uint256 private constant MAX_NAME_LENGTH = 100;
    uint256 private constant MAX_METADATA_LENGTH = 1000;
    uint256 private constant MAX_FLAG_REASON_LENGTH = 200;
    uint256 private constant HISTORY_LIMIT = 100;
    uint256 private constant BPS_DENOMINATOR = 10000;

    // ============ Custom Errors ============

    error InvalidEntityId();
    error InvalidManagerId();
    error InvalidTransactionId();
    error InvalidJobId();
    error EntityAlreadyExists();
    error ManagerAlreadyExists();
    error EntityNotFound();
    error ManagerNotFound();
    error TransactionNotFound();
    error JobNotFound();
    error InvalidName();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidRate();
    error InvalidMetadata();
    error UnauthorizedAccess();
    error AlreadyConfigured();
    error InvalidConfiguration();
    error OwnerAlreadyHasEntity();
    error WalletAlreadyHasManager();

    // ============ Events ============

    event CompanyConfigured(bytes32 indexed companyId, string companyName, string industry);
    event EntityRegistered(bytes32 indexed entityId, address indexed owner, bytes32 managerId);
    event EntityStatusChanged(bytes32 indexed entityId, EntityStatus newStatus);
    event EntityFlagged(bytes32 indexed entityId, string reason);
    event ManagerRegistered(bytes32 indexed managerId, address indexed wallet, string name);
    event ManagerStatusChanged(bytes32 indexed managerId, ManagerStatus newStatus);
    event TransactionRecorded(bytes32 indexed transactionId, bytes32 indexed entityId, bytes32 indexed managerId, uint256 amount);
    event BatchTransactionsRecorded(bytes32 indexed batchId, uint256 count);
    event CalculationPerformed(bytes32 indexed entityId, uint256 amount, uint256 calculatedValue);
    event DataStoredOnFilecoin(bytes32 indexed entityId, bytes32 dataCID, bytes32 dataCommitment);
    event ComputeJobSubmitted(bytes32 indexed jobId, string jobType, bytes32 entityId);
    event ComputeJobCompleted(bytes32 indexed jobId, bytes32 resultCID);

    // ============ Modifiers ============

    modifier validEntityId(bytes32 entityId) {
        if (entityId == bytes32(0)) revert InvalidEntityId();
        if (entities[entityId].registrationDate == 0) revert EntityNotFound();
        _;
    }

    modifier validManagerId(bytes32 managerId) {
        if (managerId == bytes32(0)) revert InvalidManagerId();
        if (managers[managerId].joinDate == 0) revert ManagerNotFound();
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initializes the contract
     * @param _admin Address to grant initial admin role
     */
    function initialize(address _admin) public initializer {
        if (_admin == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _setRoleAdmin(MANAGER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(SYSTEM_ROLE, ADMIN_ROLE);
    }

    // ============ Company Configuration ============

    /**
     * @notice Sets company configuration
     * @param companyId Unique company identifier
     * @param companyName Company display name
     * @param industry Industry type
     * @param entityType Entity type name
     * @param managerType Manager type name
     * @param transactionType Transaction type name
     * @param templateVersion Template version
     */
    function setCompanyConfig(
        bytes32 companyId,
        string calldata companyName,
        string calldata industry,
        string calldata entityType,
        string calldata managerType,
        string calldata transactionType,
        string calldata templateVersion
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (companyConfig.deploymentTimestamp != 0) revert AlreadyConfigured();
        if (companyId == bytes32(0)) revert InvalidConfiguration();

        companyConfig = CompanyConfig({
            companyId: companyId,
            companyName: companyName,
            industry: industry,
            entityType: entityType,
            managerType: managerType,
            transactionType: transactionType,
            deploymentTimestamp: block.timestamp,
            deployer: msg.sender,
            templateVersion: templateVersion,
            isActive: true
        });

        emit CompanyConfigured(companyId, companyName, industry);
    }

    // ============ Entity Management ============

    /**
     * @notice Registers a new entity
     * @param name Entity name
     * @param ownerAddress Owner wallet address
     * @param managerId Assigned manager ID
     * @param metadata Industry-specific metadata (JSON)
     * @return entityId Generated entity ID
     */
    function registerEntity(
        string calldata name,
        address ownerAddress,
        bytes32 managerId,
        string calldata metadata
    ) external whenNotPaused nonReentrant onlyRole(MANAGER_ROLE) returns (bytes32) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) revert InvalidName();
        if (ownerAddress == address(0)) revert InvalidAddress();
        if (managerId == bytes32(0)) revert InvalidManagerId();
        if (ownerToEntityId[ownerAddress] != bytes32(0)) revert OwnerAlreadyHasEntity();

        bytes32 entityId = keccak256(
            abi.encodePacked(block.timestamp, ownerAddress, name, block.number)
        );

        if (entities[entityId].registrationDate != 0) revert EntityAlreadyExists();

        entities[entityId] = Entity({
            entityId: entityId,
            ownerAddress: ownerAddress,
            name: name,
            assignedManagerId: managerId,
            status: EntityStatus.ACTIVE,
            registrationDate: block.timestamp,
            totalVolume: 0,
            totalValue: 0,
            transactionCount: 0,
            isFlagged: false,
            flagReason: "",
            metadata: metadata
        });

        ownerToEntityId[ownerAddress] = entityId;
        entityIdToIndex[entityId] = entityIdList.length;
        entityIdList.push(entityId);
        managerToEntityIds[managerId].push(entityId);

        // Update manager entity count
        managers[managerId].entityCount++;

        emit EntityRegistered(entityId, ownerAddress, managerId);

        return entityId;
    }

    /**
     * @notice Updates entity status
     * @param entityId Entity ID
     * @param newStatus New status
     */
    function updateEntityStatus(
        bytes32 entityId,
        EntityStatus newStatus
    ) external whenNotPaused validEntityId(entityId) onlyRole(MANAGER_ROLE) {
        entities[entityId].status = newStatus;
        emit EntityStatusChanged(entityId, newStatus);
    }

    /**
     * @notice Assigns a new manager to an entity
     * @param entityId Entity ID
     * @param newManagerId New manager ID
     */
    function assignManager(
        bytes32 entityId,
        bytes32 newManagerId
    ) external whenNotPaused validEntityId(entityId) validManagerId(newManagerId) onlyRole(MANAGER_ROLE) {
        bytes32 oldManagerId = entities[entityId].assignedManagerId;
        if (oldManagerId == newManagerId) return;

        // Remove from old manager's list
        _removeFromManagerList(oldManagerId, entityId);
        managers[oldManagerId].entityCount--;

        // Add to new manager's list
        managerToEntityIds[newManagerId].push(entityId);
        managers[newManagerId].entityCount++;

        entities[entityId].assignedManagerId = newManagerId;
    }

    /**
     * @notice Flags an entity
     * @param entityId Entity ID
     * @param reason Flag reason
     */
    function flagEntity(
        bytes32 entityId,
        string calldata reason
    ) external whenNotPaused validEntityId(entityId) onlyRole(MANAGER_ROLE) {
        if (bytes(reason).length == 0 || bytes(reason).length > MAX_FLAG_REASON_LENGTH) {
            revert InvalidMetadata();
        }

        entities[entityId].isFlagged = true;
        entities[entityId].flagReason = reason;
        entities[entityId].status = EntityStatus.FLAGGED;

        emit EntityFlagged(entityId, reason);
        emit EntityStatusChanged(entityId, EntityStatus.FLAGGED);
    }

    /**
     * @notice Gets entity details
     * @param entityId Entity ID
     * @return Entity struct
     */
    function getEntity(bytes32 entityId) external view validEntityId(entityId) returns (Entity memory) {
        return entities[entityId];
    }

    /**
     * @notice Gets entities by manager
     * @param managerId Manager ID
     * @return Array of entity IDs
     */
    function getEntitiesByManager(bytes32 managerId) external view returns (bytes32[] memory) {
        return managerToEntityIds[managerId];
    }

    /**
     * @notice Gets entity by owner address
     * @param ownerAddress Owner wallet address
     * @return Entity ID
     */
    function getEntityByOwner(address ownerAddress) external view returns (bytes32) {
        return ownerToEntityId[ownerAddress];
    }

    /**
     * @notice Gets total entity count
     * @return Count of entities
     */
    function getEntityCount() external view returns (uint256) {
        return entityIdList.length;
    }

    /**
     * @notice Gets all entities (paginated)
     * @param offset Start index
     * @param limit Number to return
     * @return Array of entity IDs
     */
    function getAllEntities(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        if (offset >= entityIdList.length) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > entityIdList.length) {
            end = entityIdList.length;
        }

        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = entityIdList[i];
        }

        return result;
    }

    // ============ Manager Management ============

    /**
     * @notice Registers a new manager
     * @param wallet Manager wallet address
     * @param name Manager name
     * @param contactInfo Contact information (encrypted)
     * @param compensationRate Compensation rate in basis points
     * @param metadata Industry-specific metadata (JSON)
     * @return managerId Generated manager ID
     */
    function registerManager(
        address wallet,
        string calldata name,
        string calldata contactInfo,
        uint256 compensationRate,
        string calldata metadata
    ) external whenNotPaused nonReentrant onlyRole(ADMIN_ROLE) returns (bytes32) {
        if (wallet == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) revert InvalidName();
        if (compensationRate > BPS_DENOMINATOR) revert InvalidRate();
        if (walletToManagerId[wallet] != bytes32(0)) revert WalletAlreadyHasManager();

        bytes32 managerId = keccak256(
            abi.encodePacked(block.timestamp, wallet, name, block.number)
        );

        if (managers[managerId].joinDate != 0) revert ManagerAlreadyExists();

        managers[managerId] = Manager({
            managerId: managerId,
            walletAddress: wallet,
            name: name,
            contactInfo: contactInfo,
            status: ManagerStatus.ACTIVE,
            joinDate: block.timestamp,
            totalVolume: 0,
            totalValue: 0,
            totalTransactions: 0,
            entityCount: 0,
            compensationRate: compensationRate,
            metadata: metadata
        });

        walletToManagerId[wallet] = managerId;
        managerIdToIndex[managerId] = managerIdList.length;
        managerIdList.push(managerId);

        emit ManagerRegistered(managerId, wallet, name);

        return managerId;
    }

    /**
     * @notice Updates manager status
     * @param managerId Manager ID
     * @param newStatus New status
     */
    function updateManagerStatus(
        bytes32 managerId,
        ManagerStatus newStatus
    ) external whenNotPaused validManagerId(managerId) onlyRole(ADMIN_ROLE) {
        managers[managerId].status = newStatus;
        emit ManagerStatusChanged(managerId, newStatus);
    }

    /**
     * @notice Updates manager compensation rate
     * @param managerId Manager ID
     * @param newRate New rate in basis points
     */
    function updateCompensationRate(
        bytes32 managerId,
        uint256 newRate
    ) external whenNotPaused validManagerId(managerId) onlyRole(ADMIN_ROLE) {
        if (newRate > BPS_DENOMINATOR) revert InvalidRate();
        managers[managerId].compensationRate = newRate;
    }

    /**
     * @notice Gets manager details
     * @param managerId Manager ID
     * @return Manager struct
     */
    function getManager(bytes32 managerId) external view validManagerId(managerId) returns (Manager memory) {
        return managers[managerId];
    }

    /**
     * @notice Gets manager by wallet address
     * @param wallet Wallet address
     * @return Manager ID
     */
    function getManagerByWallet(address wallet) external view returns (bytes32) {
        return walletToManagerId[wallet];
    }

    /**
     * @notice Gets total manager count
     * @return Count of managers
     */
    function getManagerCount() external view returns (uint256) {
        return managerIdList.length;
    }

    // ============ Transaction Management ============

    /**
     * @notice Records a single transaction
     * @param entityId Entity ID
     * @param managerId Manager ID
     * @param amount Transaction amount
     * @param calculatedValue Calculated value (fee/charge/etc)
     * @param txType Transaction type
     * @param metadata Industry-specific metadata (JSON)
     * @return transactionId Generated transaction ID
     */
    function recordTransaction(
        bytes32 entityId,
        bytes32 managerId,
        uint256 amount,
        uint256 calculatedValue,
        TransactionType txType,
        string calldata metadata
    ) external whenNotPaused nonReentrant validEntityId(entityId) validManagerId(managerId) onlyRole(SYSTEM_ROLE) returns (bytes32) {
        if (amount == 0) revert InvalidAmount();

        bytes32 transactionId = keccak256(
            abi.encodePacked(block.timestamp, entityId, managerId, amount, transactions.length)
        );

        Transaction memory newTx = Transaction({
            transactionId: transactionId,
            entityId: entityId,
            managerId: managerId,
            transactionDate: block.timestamp,
            amount: amount,
            calculatedValue: calculatedValue,
            txType: txType,
            isForecast: false,
            recordedAt: block.timestamp,
            batchId: bytes32(0),
            metadata: metadata
        });

        _recordTransactionInternal(newTx);

        emit TransactionRecorded(transactionId, entityId, managerId, amount);

        return transactionId;
    }

    /**
     * @notice Records batch transactions
     * @param txs Array of transactions
     * @return batchId Batch identifier
     * @return count Number of transactions recorded
     */
    function recordBatchTransactions(
        Transaction[] calldata txs
    ) external whenNotPaused nonReentrant onlyRole(SYSTEM_ROLE) returns (bytes32 batchId, uint256 count) {
        batchId = keccak256(abi.encodePacked(block.timestamp, msg.sender, txs.length));

        for (uint256 i = 0; i < txs.length; i++) {
            Transaction memory txn = txs[i];
            txn.batchId = batchId;
            _recordTransactionInternal(txn);
        }

        count = txs.length;
        emit BatchTransactionsRecorded(batchId, count);

        return (batchId, count);
    }

    /**
     * @dev Internal transaction recording logic
     */
    function _recordTransactionInternal(Transaction memory txn) private {
        transactionIdToIndex[txn.transactionId] = transactions.length;
        transactions.push(txn);

        // Update indices
        entityTransactionIndices[txn.entityId].push(transactions.length - 1);
        managerTransactionIndices[txn.managerId].push(transactions.length - 1);

        uint256 dayIndex = txn.transactionDate / 1 days;
        dailyTransactionIndices[dayIndex].push(transactions.length - 1);

        // Update entity metrics
        entities[txn.entityId].totalVolume += txn.amount;
        entities[txn.entityId].totalValue += txn.calculatedValue;
        entities[txn.entityId].transactionCount++;

        // Update manager metrics
        managers[txn.managerId].totalVolume += txn.amount;
        managers[txn.managerId].totalValue += txn.calculatedValue;
        managers[txn.managerId].totalTransactions++;
    }

    /**
     * @notice Gets transactions by entity (paginated)
     * @param entityId Entity ID
     * @param offset Start index
     * @param limit Number to return
     * @return Array of transactions
     */
    function getTransactionsByEntity(
        bytes32 entityId,
        uint256 offset,
        uint256 limit
    ) external view validEntityId(entityId) returns (Transaction[] memory) {
        uint256[] memory indices = entityTransactionIndices[entityId];
        return _getTransactionsByIndices(indices, offset, limit);
    }

    /**
     * @notice Gets transactions by manager (paginated)
     * @param managerId Manager ID
     * @param offset Start index
     * @param limit Number to return
     * @return Array of transactions
     */
    function getTransactionsByManager(
        bytes32 managerId,
        uint256 offset,
        uint256 limit
    ) external view validManagerId(managerId) returns (Transaction[] memory) {
        uint256[] memory indices = managerTransactionIndices[managerId];
        return _getTransactionsByIndices(indices, offset, limit);
    }

    /**
     * @notice Gets transactions by date range
     * @param startDate Start timestamp
     * @param endDate End timestamp
     * @param offset Start index
     * @param limit Number to return
     * @return Array of transactions
     */
    function getTransactionsByDateRange(
        uint256 startDate,
        uint256 endDate,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory) {
        uint256 startDay = startDate / 1 days;
        uint256 endDay = endDate / 1 days;

        // Collect all indices in range
        uint256[] memory allIndices;
        uint256 totalCount = 0;

        for (uint256 day = startDay; day <= endDay; day++) {
            totalCount += dailyTransactionIndices[day].length;
        }

        allIndices = new uint256[](totalCount);
        uint256 currentIndex = 0;

        for (uint256 day = startDay; day <= endDay; day++) {
            uint256[] memory dayIndices = dailyTransactionIndices[day];
            for (uint256 i = 0; i < dayIndices.length; i++) {
                allIndices[currentIndex++] = dayIndices[i];
            }
        }

        return _getTransactionsByIndices(allIndices, offset, limit);
    }

    /**
     * @dev Helper to get transactions by indices
     */
    function _getTransactionsByIndices(
        uint256[] memory indices,
        uint256 offset,
        uint256 limit
    ) private view returns (Transaction[] memory) {
        if (offset >= indices.length) {
            return new Transaction[](0);
        }

        uint256 end = offset + limit;
        if (end > indices.length) {
            end = indices.length;
        }

        Transaction[] memory result = new Transaction[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = transactions[indices[i]];
        }

        return result;
    }

    /**
     * @notice Gets total transaction count
     * @return Count of transactions
     */
    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    // ============ Calculation Engine ============

    /**
     * @notice Calculates value from amount and rate
     * @param amount Base amount
     * @param rateBps Rate in basis points
     * @return Calculated value
     */
    function calculateValue(uint256 amount, uint256 rateBps) public pure returns (uint256) {
        return (amount * rateBps) / BPS_DENOMINATOR;
    }

    /**
     * @notice Calculates tiered value for entity
     * @param entityId Entity ID
     * @param amount Transaction amount
     * @return calculatedValue Final calculated value
     * @return appliedRate Rate that was applied
     * @return tier Tier level (1, 2, or 3)
     */
    function calculateTieredValue(
        bytes32 entityId,
        uint256 amount
    ) external view validEntityId(entityId) returns (uint256 calculatedValue, uint256 appliedRate, uint256 tier) {
        CalculationConfig memory config = entityCalculationConfigs[entityId];

        // Use default if not configured
        if (config.baseRateBps == 0) {
            config = defaultCalculationConfig;
        }

        uint256 entityVolume = entities[entityId].totalVolume;

        // Determine tier and rate
        if (entityVolume < config.volumeTier1) {
            tier = 1;
            appliedRate = config.baseRateBps;
        } else if (entityVolume < config.volumeTier2) {
            tier = 2;
            appliedRate = config.tier1RateBps;
        } else {
            tier = 3;
            appliedRate = config.tier2RateBps;
        }

        calculatedValue = calculateValue(amount, appliedRate);

        return (calculatedValue, appliedRate, tier);
    }

    /**
     * @notice Sets calculation config for entity
     * @param entityId Entity ID
     * @param config Calculation configuration
     */
    function setEntityCalculationConfig(
        bytes32 entityId,
        CalculationConfig calldata config
    ) external whenNotPaused validEntityId(entityId) onlyRole(ADMIN_ROLE) {
        entityCalculationConfigs[entityId] = config;
    }

    /**
     * @notice Sets default calculation config
     * @param config Calculation configuration
     */
    function setDefaultCalculationConfig(
        CalculationConfig calldata config
    ) external whenNotPaused onlyRole(ADMIN_ROLE) {
        defaultCalculationConfig = config;
    }

    /**
     * @notice Detects anomalies in entity data
     * @param entityId Entity ID
     * @return anomalies Array of anomaly descriptions
     */
    function detectAnomalies(bytes32 entityId) external view validEntityId(entityId) returns (string[] memory anomalies) {
        // Simple anomaly detection - can be enhanced
        string[] memory result = new string[](3);
        uint256 count = 0;

        Entity memory entity = entities[entityId];

        // Check for zero transactions
        if (entity.transactionCount == 0 && block.timestamp - entity.registrationDate > 30 days) {
            result[count++] = "No transactions in 30 days";
        }

        // Check for flagged status
        if (entity.isFlagged) {
            result[count++] = "Entity is flagged";
        }

        // Check for inactive status
        if (entity.status != EntityStatus.ACTIVE) {
            result[count++] = "Entity is not active";
        }

        // Resize array to actual count
        string[] memory finalResult = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }

    // ============ Data Storage (Filecoin/IPFS + Celestia) ============

    /**
     * @notice Stores entity data on Filecoin with Celestia commitment
     * @param entityId Entity ID
     * @param dataCID IPFS/Filecoin CID
     * @param celestiaCommitment Celestia DA commitment hash
     */
    function storeEntityData(
        bytes32 entityId,
        bytes32 dataCID,
        bytes32 celestiaCommitment
    ) external whenNotPaused validEntityId(entityId) onlyRole(SYSTEM_ROLE) {
        entityDataCIDs[entityId].push(dataCID);
        dataCommitments[dataCID] = celestiaCommitment;

        emit DataStoredOnFilecoin(entityId, dataCID, celestiaCommitment);
    }

    /**
     * @notice Gets entity data CIDs
     * @param entityId Entity ID
     * @return Array of data CIDs
     */
    function getEntityDataCIDs(bytes32 entityId) external view validEntityId(entityId) returns (bytes32[] memory) {
        return entityDataCIDs[entityId];
    }

    /**
     * @notice Stores manager data on Filecoin
     * @param managerId Manager ID
     * @param dataCID IPFS/Filecoin CID
     */
    function storeManagerData(
        bytes32 managerId,
        bytes32 dataCID
    ) external whenNotPaused validManagerId(managerId) onlyRole(SYSTEM_ROLE) {
        managerDataCIDs[managerId].push(dataCID);
    }

    /**
     * @notice Gets manager data CIDs
     * @param managerId Manager ID
     * @return Array of data CIDs
     */
    function getManagerDataCIDs(bytes32 managerId) external view validManagerId(managerId) returns (bytes32[] memory) {
        return managerDataCIDs[managerId];
    }

    // ============ Akash Compute Jobs ============

    /**
     * @notice Submits compute job to Akash Network
     * @param jobType Type of job (analytics, ml_inference, etc)
     * @param entityId Entity ID
     * @param akashDeploymentId Akash deployment ID
     * @return jobId Generated job ID
     */
    function submitComputeJob(
        string calldata jobType,
        bytes32 entityId,
        string calldata akashDeploymentId
    ) external whenNotPaused validEntityId(entityId) returns (bytes32 jobId) {
        jobId = keccak256(abi.encodePacked(block.timestamp, entityId, jobType));

        computeJobs[jobId] = ComputeJob({
            jobId: jobId,
            jobType: jobType,
            entityId: entityId,
            requestor: msg.sender,
            requestedAt: block.timestamp,
            completedAt: 0,
            isComplete: false,
            akashDeploymentId: akashDeploymentId,
            resultCID: bytes32(0)
        });

        jobIdToIndex[jobId] = computeJobIds.length;
        computeJobIds.push(jobId);

        emit ComputeJobSubmitted(jobId, jobType, entityId);

        return jobId;
    }

    /**
     * @notice Marks compute job as complete
     * @param jobId Job ID
     * @param resultCID IPFS CID of result
     */
    function completeComputeJob(
        bytes32 jobId,
        bytes32 resultCID
    ) external whenNotPaused onlyRole(SYSTEM_ROLE) {
        ComputeJob storage job = computeJobs[jobId];
        if (job.requestedAt == 0) revert JobNotFound();
        if (job.isComplete) return;

        job.isComplete = true;
        job.completedAt = block.timestamp;
        job.resultCID = resultCID;

        emit ComputeJobCompleted(jobId, resultCID);
    }

    /**
     * @notice Gets compute job details
     * @param jobId Job ID
     * @return ComputeJob struct
     */
    function getComputeJob(bytes32 jobId) external view returns (ComputeJob memory) {
        return computeJobs[jobId];
    }

    /**
     * @notice Gets all compute jobs for entity
     * @param entityId Entity ID
     * @return Array of job IDs
     */
    function getEntityComputeJobs(bytes32 entityId) external view validEntityId(entityId) returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < computeJobIds.length; i++) {
            if (computeJobs[computeJobIds[i]].entityId == entityId) {
                count++;
            }
        }

        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < computeJobIds.length; i++) {
            if (computeJobs[computeJobIds[i]].entityId == entityId) {
                result[index++] = computeJobIds[i];
            }
        }

        return result;
    }

    // ============ Batch Read Functions ============

    /**
     * @notice Batch gets entities
     * @param entityIds Array of entity IDs
     * @return Array of Entity structs
     */
    function batchGetEntities(bytes32[] calldata entityIds) external view returns (Entity[] memory) {
        Entity[] memory result = new Entity[](entityIds.length);
        for (uint256 i = 0; i < entityIds.length; i++) {
            result[i] = entities[entityIds[i]];
        }
        return result;
    }

    /**
     * @notice Batch gets managers
     * @param managerIds Array of manager IDs
     * @return Array of Manager structs
     */
    function batchGetManagers(bytes32[] calldata managerIds) external view returns (Manager[] memory) {
        Manager[] memory result = new Manager[](managerIds.length);
        for (uint256 i = 0; i < managerIds.length; i++) {
            result[i] = managers[managerIds[i]];
        }
        return result;
    }

    /**
     * @notice Batch gets transactions
     * @param txIds Array of transaction IDs
     * @return Array of Transaction structs
     */
    function batchGetTransactions(bytes32[] calldata txIds) external view returns (Transaction[] memory) {
        Transaction[] memory result = new Transaction[](txIds.length);
        for (uint256 i = 0; i < txIds.length; i++) {
            uint256 index = transactionIdToIndex[txIds[i]];
            result[i] = transactions[index];
        }
        return result;
    }

    /**
     * @notice Gets dashboard summary
     * @return totalEntities Total number of entities
     * @return activeEntities Number of active entities
     * @return totalManagers Total number of managers
     * @return totalTransactions Total number of transactions
     * @return totalVolume Total transaction volume
     */
    function getDashboardSummary() external view returns (
        uint256 totalEntities,
        uint256 activeEntities,
        uint256 totalManagers,
        uint256 totalTransactions,
        uint256 totalVolume
    ) {
        totalEntities = entityIdList.length;
        totalManagers = managerIdList.length;
        totalTransactions = transactions.length;

        for (uint256 i = 0; i < entityIdList.length; i++) {
            Entity memory entity = entities[entityIdList[i]];
            if (entity.status == EntityStatus.ACTIVE) {
                activeEntities++;
            }
            totalVolume += entity.totalVolume;
        }

        return (totalEntities, activeEntities, totalManagers, totalTransactions, totalVolume);
    }

    // ============ Internal Helpers ============

    /**
     * @dev Removes entity from manager's list
     */
    function _removeFromManagerList(bytes32 managerId, bytes32 entityId) private {
        bytes32[] storage managerEntities = managerToEntityIds[managerId];

        for (uint256 i = 0; i < managerEntities.length; i++) {
            if (managerEntities[i] == entityId) {
                managerEntities[i] = managerEntities[managerEntities.length - 1];
                managerEntities.pop();
                break;
            }
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Pauses contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Authorizes contract upgrade
     * @param newImplementation New implementation address
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[50] private __gap;
}
