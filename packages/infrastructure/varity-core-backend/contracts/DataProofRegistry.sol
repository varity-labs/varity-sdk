// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title DataProofRegistry
 * @notice Registry for storing and verifying proofs of data stored on Filecoin/IPFS
 * @dev Provides cryptographic proof that data exists on decentralized storage
 *
 * Security Features:
 * - UUPS upgradeable pattern for future improvements
 * - ReentrancyGuard for all state-changing functions
 * - Pausable for emergency stop
 * - Custom errors for gas optimization
 *
 * Use Cases:
 * - Prove data ownership on Filecoin
 * - Verify data integrity with hash verification
 * - Track user data across decentralized storage
 * - Enable ZK-based access control for encrypted data
 */
contract DataProofRegistry is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /**
     * @dev Data proof structure containing all verification information
     * @notice Optimized storage: timestamps and hashes fit in single slots
     */
    struct DataProof {
        bytes32 dataCID;           // slot 0: IPFS/Filecoin Content Identifier
        address owner;             // slot 1 (20 bytes): Data owner
        bool isVerified;           // slot 1 (1 byte, packed): Verification status
        uint256 timestamp;         // slot 2: When proof was stored
        bytes32 dataHash;          // slot 3: Hash of encrypted data for verification
        string metadata;           // slot 4+: Additional metadata (JSON string)
    }

    // Custom errors for gas optimization
    error InvalidCID();
    error InvalidHash();
    error InvalidAddress();
    error ProofAlreadyExists();
    error ProofNotFound();
    error UnauthorizedAccess();
    error VerificationFailed();

    // State mappings
    mapping(bytes32 => DataProof) public dataProofs;
    mapping(address => bytes32[]) public userDataCIDs;
    mapping(bytes32 => mapping(address => bool)) public delegatedAccess;

    // Statistics
    uint256 public totalProofs;
    uint256 public totalVerifiedProofs;

    // Events
    event DataProofStored(
        bytes32 indexed dataCID,
        address indexed owner,
        bytes32 dataHash,
        uint256 timestamp
    );

    event DataProofVerified(
        bytes32 indexed dataCID,
        address indexed verifier,
        uint256 timestamp
    );

    event AccessDelegated(
        bytes32 indexed dataCID,
        address indexed owner,
        address indexed delegate
    );

    event AccessRevoked(
        bytes32 indexed dataCID,
        address indexed owner,
        address indexed delegate
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract
     * @param _owner Initial owner address
     */
    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert InvalidAddress();

        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    /**
     * @notice Store proof of data on Filecoin/IPFS
     * @dev Creates immutable proof of data existence with verification hash
     * @param dataCID IPFS/Filecoin Content Identifier (as bytes32)
     * @param dataHash Keccak256 hash of the encrypted data
     * @param metadata Additional metadata (optional, can be empty string)
     */
    function storeDataProof(
        bytes32 dataCID,
        bytes32 dataHash,
        string calldata metadata
    ) external whenNotPaused nonReentrant {
        if (dataCID == bytes32(0)) revert InvalidCID();
        if (dataHash == bytes32(0)) revert InvalidHash();
        if (dataProofs[dataCID].owner != address(0)) revert ProofAlreadyExists();

        dataProofs[dataCID] = DataProof({
            dataCID: dataCID,
            owner: msg.sender,
            isVerified: false,
            timestamp: block.timestamp,
            dataHash: dataHash,
            metadata: metadata
        });

        userDataCIDs[msg.sender].push(dataCID);
        totalProofs++;

        emit DataProofStored(dataCID, msg.sender, dataHash, block.timestamp);
    }

    /**
     * @notice Verify data proof by comparing hash
     * @dev Anyone can verify if the hash matches, but only owner can mark as verified
     * @param dataCID IPFS/Filecoin Content Identifier
     * @param dataHash Hash to verify against stored hash
     * @return matches Boolean indicating if hashes match
     */
    function verifyDataProof(
        bytes32 dataCID,
        bytes32 dataHash
    ) external view returns (bool matches) {
        DataProof memory proof = dataProofs[dataCID];
        if (proof.owner == address(0)) revert ProofNotFound();

        return proof.dataHash == dataHash;
    }

    /**
     * @notice Mark proof as verified (owner only)
     * @dev Updates verification status after external verification
     * @param dataCID IPFS/Filecoin Content Identifier
     */
    function markAsVerified(bytes32 dataCID) external nonReentrant {
        DataProof storage proof = dataProofs[dataCID];
        if (proof.owner == address(0)) revert ProofNotFound();
        if (proof.owner != msg.sender && owner() != msg.sender) revert UnauthorizedAccess();
        if (proof.isVerified) return; // Already verified

        proof.isVerified = true;
        totalVerifiedProofs++;

        emit DataProofVerified(dataCID, msg.sender, block.timestamp);
    }

    /**
     * @notice Delegate access to data proof
     * @dev Allows owner to grant read access to other addresses
     * @param dataCID IPFS/Filecoin Content Identifier
     * @param delegate Address to delegate access to
     */
    function delegateAccess(
        bytes32 dataCID,
        address delegate
    ) external whenNotPaused nonReentrant {
        if (delegate == address(0)) revert InvalidAddress();

        DataProof memory proof = dataProofs[dataCID];
        if (proof.owner != msg.sender) revert UnauthorizedAccess();

        delegatedAccess[dataCID][delegate] = true;

        emit AccessDelegated(dataCID, msg.sender, delegate);
    }

    /**
     * @notice Revoke delegated access
     * @param dataCID IPFS/Filecoin Content Identifier
     * @param delegate Address to revoke access from
     */
    function revokeAccess(
        bytes32 dataCID,
        address delegate
    ) external nonReentrant {
        DataProof memory proof = dataProofs[dataCID];
        if (proof.owner != msg.sender) revert UnauthorizedAccess();

        delegatedAccess[dataCID][delegate] = false;

        emit AccessRevoked(dataCID, msg.sender, delegate);
    }

    /**
     * @notice Check if address has access to data proof
     * @param dataCID IPFS/Filecoin Content Identifier
     * @param accessor Address to check
     * @return result Boolean indicating access rights
     */
    function hasAccess(
        bytes32 dataCID,
        address accessor
    ) external view returns (bool result) {
        DataProof memory proof = dataProofs[dataCID];
        if (proof.owner == address(0)) return false;

        // Owner always has access
        if (proof.owner == accessor) return true;

        // Check delegated access
        return delegatedAccess[dataCID][accessor];
    }

    /**
     * @notice Get all data CIDs for a user
     * @param user Address of the user
     * @return cids Array of data CIDs owned by user
     */
    function getUserDataCIDs(address user) external view returns (bytes32[] memory cids) {
        return userDataCIDs[user];
    }

    /**
     * @notice Get data proof details
     * @param dataCID IPFS/Filecoin Content Identifier
     * @return proof Complete data proof structure
     */
    function getDataProof(bytes32 dataCID) external view returns (DataProof memory proof) {
        return dataProofs[dataCID];
    }

    /**
     * @notice Get total number of proofs stored
     * @return count Total proof count
     */
    function getTotalProofs() external view returns (uint256 count) {
        return totalProofs;
    }

    /**
     * @notice Get total number of verified proofs
     * @return count Verified proof count
     */
    function getTotalVerifiedProofs() external view returns (uint256 count) {
        return totalVerifiedProofs;
    }

    /**
     * @notice Batch store multiple data proofs
     * @dev Gas-optimized batch operation for multiple proofs
     * @param dataCIDs Array of IPFS/Filecoin Content Identifiers
     * @param dataHashes Array of corresponding data hashes
     * @param metadatas Array of metadata strings
     */
    function batchStoreDataProofs(
        bytes32[] calldata dataCIDs,
        bytes32[] calldata dataHashes,
        string[] calldata metadatas
    ) external whenNotPaused nonReentrant {
        uint256 length = dataCIDs.length;
        if (length != dataHashes.length || length != metadatas.length) {
            revert InvalidCID();
        }

        for (uint256 i = 0; i < length; i++) {
            if (dataCIDs[i] == bytes32(0)) revert InvalidCID();
            if (dataHashes[i] == bytes32(0)) revert InvalidHash();
            if (dataProofs[dataCIDs[i]].owner != address(0)) continue; // Skip existing

            dataProofs[dataCIDs[i]] = DataProof({
                dataCID: dataCIDs[i],
                owner: msg.sender,
                isVerified: false,
                timestamp: block.timestamp,
                dataHash: dataHashes[i],
                metadata: metadatas[i]
            });

            userDataCIDs[msg.sender].push(dataCIDs[i]);
            totalProofs++;

            emit DataProofStored(dataCIDs[i], msg.sender, dataHashes[i], block.timestamp);
        }
    }

    /**
     * @notice Pause contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Required override for UUPS pattern
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Storage gap for future upgrades
     * Reserves 50 storage slots for safe contract upgrades
     */
    uint256[50] private __gap;
}
