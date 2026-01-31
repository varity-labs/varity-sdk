// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TemplateRegistry
 * @dev On-chain registry for VarityKit template metadata
 *
 * Features:
 * - Store template metadata IPFS hashes on-chain
 * - Version tracking for template updates
 * - Immutable audit trail of template changes
 * - Integration with TemplateMarketplace
 *
 * Use Case:
 * - Template metadata (features, docs, screenshots) stored on IPFS
 * - IPFS hash stored on-chain for verification
 * - Users can verify template authenticity
 */
contract TemplateRegistry is Ownable {
    // ========== STRUCTS ==========
    struct TemplateMetadata {
        string ipfsHash;        // IPFS hash of metadata JSON
        string version;         // Semantic version (e.g., "1.0.0")
        uint256 timestamp;      // When metadata was registered
        address registeredBy;   // Who registered this metadata
        bool active;            // Whether this version is active
    }

    struct TemplateInfo {
        bytes32 templateId;
        address creator;
        uint256 versionCount;
        string latestVersion;
        string latestIpfsHash;
        bool exists;
    }

    // ========== STATE VARIABLES ==========
    // templateId => version => metadata
    mapping(bytes32 => mapping(string => TemplateMetadata)) public templateMetadata;

    // templateId => all versions
    mapping(bytes32 => string[]) public templateVersions;

    // templateId => template info
    mapping(bytes32 => TemplateInfo) public templates;

    // Array of all template IDs
    bytes32[] public allTemplateIds;

    // Total templates registered
    uint256 public totalTemplates;

    // ========== EVENTS ==========
    event MetadataRegistered(
        bytes32 indexed templateId,
        string version,
        string ipfsHash,
        address indexed registeredBy,
        uint256 timestamp
    );

    event MetadataUpdated(
        bytes32 indexed templateId,
        string oldVersion,
        string newVersion,
        string ipfsHash,
        uint256 timestamp
    );

    event TemplateActivated(
        bytes32 indexed templateId,
        string version,
        uint256 timestamp
    );

    event TemplateDeactivated(
        bytes32 indexed templateId,
        string version,
        uint256 timestamp
    );

    // ========== MODIFIERS ==========
    modifier templateExists(bytes32 templateId) {
        require(templates[templateId].exists, "Template does not exist");
        _;
    }

    modifier onlyCreatorOrOwner(bytes32 templateId) {
        require(
            msg.sender == templates[templateId].creator || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    // ========== PUBLIC FUNCTIONS ==========

    /**
     * @notice Register template metadata
     * @param templateId Unique template identifier (from TemplateMarketplace)
     * @param ipfsHash IPFS hash of metadata JSON file
     * @param version Semantic version string (e.g., "1.0.0")
     * @param creator Template creator address
     */
    function registerMetadata(
        bytes32 templateId,
        string memory ipfsHash,
        string memory version,
        address creator
    ) external returns (bool) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(version).length > 0, "Version required");
        require(creator != address(0), "Valid creator address required");

        // If template doesn't exist, create it
        if (!templates[templateId].exists) {
            templates[templateId] = TemplateInfo({
                templateId: templateId,
                creator: creator,
                versionCount: 0,
                latestVersion: version,
                latestIpfsHash: ipfsHash,
                exists: true
            });

            allTemplateIds.push(templateId);
            totalTemplates++;
        }

        // Ensure version doesn't already exist
        require(
            bytes(templateMetadata[templateId][version].ipfsHash).length == 0,
            "Version already exists"
        );

        // Store metadata
        templateMetadata[templateId][version] = TemplateMetadata({
            ipfsHash: ipfsHash,
            version: version,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            active: true
        });

        // Update version tracking
        templateVersions[templateId].push(version);
        templates[templateId].versionCount++;
        templates[templateId].latestVersion = version;
        templates[templateId].latestIpfsHash = ipfsHash;

        emit MetadataRegistered(
            templateId,
            version,
            ipfsHash,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Update template metadata (register new version)
     * @param templateId Template identifier
     * @param newIpfsHash New IPFS hash
     * @param newVersion New semantic version
     */
    function updateMetadata(
        bytes32 templateId,
        string memory newIpfsHash,
        string memory newVersion
    ) external templateExists(templateId) onlyCreatorOrOwner(templateId) {
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");
        require(bytes(newVersion).length > 0, "Version required");

        string memory oldVersion = templates[templateId].latestVersion;

        // Register new version
        templateMetadata[templateId][newVersion] = TemplateMetadata({
            ipfsHash: newIpfsHash,
            version: newVersion,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            active: true
        });

        // Update version tracking
        templateVersions[templateId].push(newVersion);
        templates[templateId].versionCount++;
        templates[templateId].latestVersion = newVersion;
        templates[templateId].latestIpfsHash = newIpfsHash;

        // Deactivate old version
        templateMetadata[templateId][oldVersion].active = false;

        emit MetadataUpdated(
            templateId,
            oldVersion,
            newVersion,
            newIpfsHash,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a specific version
     * @param templateId Template identifier
     * @param version Version to deactivate
     */
    function deactivateVersion(bytes32 templateId, string memory version)
        external
        onlyCreatorOrOwner(templateId)
    {
        require(
            bytes(templateMetadata[templateId][version].ipfsHash).length > 0,
            "Version does not exist"
        );

        templateMetadata[templateId][version].active = false;

        emit TemplateDeactivated(templateId, version, block.timestamp);
    }

    /**
     * @notice Reactivate a specific version
     * @param templateId Template identifier
     * @param version Version to reactivate
     */
    function activateVersion(bytes32 templateId, string memory version)
        external
        onlyCreatorOrOwner(templateId)
    {
        require(
            bytes(templateMetadata[templateId][version].ipfsHash).length > 0,
            "Version does not exist"
        );

        templateMetadata[templateId][version].active = true;

        emit TemplateActivated(templateId, version, block.timestamp);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Get metadata for specific version
     * @param templateId Template identifier
     * @param version Version string
     * @return Metadata for specified version
     */
    function getMetadata(bytes32 templateId, string memory version)
        external
        view
        returns (TemplateMetadata memory)
    {
        return templateMetadata[templateId][version];
    }

    /**
     * @notice Get latest metadata
     * @param templateId Template identifier
     * @return Latest metadata
     */
    function getLatestMetadata(bytes32 templateId)
        external
        view
        templateExists(templateId)
        returns (TemplateMetadata memory)
    {
        string memory latestVersion = templates[templateId].latestVersion;
        return templateMetadata[templateId][latestVersion];
    }

    /**
     * @notice Get all versions for a template
     * @param templateId Template identifier
     * @return Array of version strings
     */
    function getVersions(bytes32 templateId)
        external
        view
        returns (string[] memory)
    {
        return templateVersions[templateId];
    }

    /**
     * @notice Get template info
     * @param templateId Template identifier
     * @return Template information
     */
    function getTemplateInfo(bytes32 templateId)
        external
        view
        returns (TemplateInfo memory)
    {
        return templates[templateId];
    }

    /**
     * @notice Get all template IDs
     * @return Array of all template IDs
     */
    function getAllTemplates() external view returns (bytes32[] memory) {
        return allTemplateIds;
    }

    /**
     * @notice Check if version exists
     * @param templateId Template identifier
     * @param version Version string
     * @return True if version exists
     */
    function versionExists(bytes32 templateId, string memory version)
        external
        view
        returns (bool)
    {
        return bytes(templateMetadata[templateId][version].ipfsHash).length > 0;
    }

    /**
     * @notice Check if version is active
     * @param templateId Template identifier
     * @param version Version string
     * @return True if version is active
     */
    function isVersionActive(bytes32 templateId, string memory version)
        external
        view
        returns (bool)
    {
        return templateMetadata[templateId][version].active;
    }

    /**
     * @notice Get registry statistics
     * @return Total templates, total versions
     */
    function getRegistryStats()
        external
        view
        returns (uint256 totalTemplates_, uint256 totalVersions_)
    {
        totalTemplates_ = totalTemplates;

        // Calculate total versions across all templates
        for (uint256 i = 0; i < allTemplateIds.length; i++) {
            totalVersions_ += templates[allTemplateIds[i]].versionCount;
        }
    }
}
