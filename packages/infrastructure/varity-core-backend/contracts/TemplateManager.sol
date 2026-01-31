// SPDX-License-Identifier: PROPRIETARY
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TemplateManager
 * @notice Manages industry template versions and metadata
 * @dev PROPRIETARY - DO NOT DISTRIBUTE
 */
contract TemplateManager is Ownable, ReentrancyGuard {
    enum Industry {
        Finance,
        Healthcare,
        Retail,
        ISO
    }

    struct Template {
        Industry industry;
        string version;
        string storageCID;
        uint256 totalDocuments;
        bool encrypted;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
    }

    // Mapping: industry => version => Template
    mapping(Industry => mapping(string => Template)) public templates;

    // Mapping: industry => version array for enumeration
    mapping(Industry => string[]) public templateVersions;

    // Events
    event TemplatePublished(
        Industry indexed industry,
        string version,
        string storageCID,
        uint256 totalDocuments,
        uint256 timestamp
    );

    event TemplateUpdated(
        Industry indexed industry,
        string version,
        string storageCID,
        uint256 timestamp
    );

    event TemplateDeactivated(
        Industry indexed industry,
        string version,
        uint256 timestamp
    );

    // Custom errors
    error TemplateAlreadyExists(Industry industry, string version);
    error TemplateNotFound(Industry industry, string version);
    error InvalidVersion();
    error InvalidStorageCID();
    error TemplateNotActive(Industry industry, string version);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Publish a new template version
     * @param industry Industry type
     * @param version Template version (e.g., "v1.0.0")
     * @param storageCID Filecoin CID for template storage
     * @param totalDocuments Number of RAG documents in template
     * @param encrypted Whether template is encrypted with Lit Protocol
     */
    function publishTemplate(
        Industry industry,
        string calldata version,
        string calldata storageCID,
        uint256 totalDocuments,
        bool encrypted
    ) external onlyOwner nonReentrant {
        if (bytes(version).length == 0) revert InvalidVersion();
        if (bytes(storageCID).length == 0) revert InvalidStorageCID();
        if (templates[industry][version].createdAt != 0) {
            revert TemplateAlreadyExists(industry, version);
        }

        Template memory newTemplate = Template({
            industry: industry,
            version: version,
            storageCID: storageCID,
            totalDocuments: totalDocuments,
            encrypted: encrypted,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true
        });

        templates[industry][version] = newTemplate;
        templateVersions[industry].push(version);

        emit TemplatePublished(
            industry,
            version,
            storageCID,
            totalDocuments,
            block.timestamp
        );
    }

    /**
     * @notice Update an existing template
     * @param industry Industry type
     * @param version Template version
     * @param storageCID New storage CID
     * @param totalDocuments Updated document count
     */
    function updateTemplate(
        Industry industry,
        string calldata version,
        string calldata storageCID,
        uint256 totalDocuments
    ) external onlyOwner {
        Template storage template = templates[industry][version];
        if (template.createdAt == 0) {
            revert TemplateNotFound(industry, version);
        }

        template.storageCID = storageCID;
        template.totalDocuments = totalDocuments;
        template.updatedAt = block.timestamp;

        emit TemplateUpdated(
            industry,
            version,
            storageCID,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a template version
     * @param industry Industry type
     * @param version Template version
     */
    function deactivateTemplate(
        Industry industry,
        string calldata version
    ) external onlyOwner {
        Template storage template = templates[industry][version];
        if (template.createdAt == 0) {
            revert TemplateNotFound(industry, version);
        }

        template.active = false;

        emit TemplateDeactivated(industry, version, block.timestamp);
    }

    /**
     * @notice Get template details
     * @param industry Industry type
     * @param version Template version
     * @return Template struct
     */
    function getTemplate(Industry industry, string calldata version)
        external
        view
        returns (Template memory)
    {
        Template memory template = templates[industry][version];
        if (template.createdAt == 0) {
            revert TemplateNotFound(industry, version);
        }
        return template;
    }

    /**
     * @notice Get latest active template for an industry
     * @param industry Industry type
     * @return Template struct
     */
    function getLatestTemplate(Industry industry)
        external
        view
        returns (Template memory)
    {
        string[] memory versions = templateVersions[industry];
        require(versions.length > 0, "No templates found for industry");

        // Return the last published active template
        for (uint256 i = versions.length; i > 0; i--) {
            Template memory template = templates[industry][versions[i - 1]];
            if (template.active) {
                return template;
            }
        }

        revert("No active template found");
    }

    /**
     * @notice Get all versions for an industry
     * @param industry Industry type
     * @return Array of version strings
     */
    function getTemplateVersions(Industry industry)
        external
        view
        returns (string[] memory)
    {
        return templateVersions[industry];
    }

    /**
     * @notice Get template count for an industry
     * @param industry Industry type
     * @return Count of versions
     */
    function getTemplateCount(Industry industry)
        external
        view
        returns (uint256)
    {
        return templateVersions[industry].length;
    }

    /**
     * @notice Check if template is active
     * @param industry Industry type
     * @param version Template version
     * @return Boolean indicating active status
     */
    function isTemplateActive(Industry industry, string calldata version)
        external
        view
        returns (bool)
    {
        Template memory template = templates[industry][version];
        return template.active && template.createdAt != 0;
    }

    /**
     * @notice Verify template exists and is active (revert if not)
     * @param industry Industry type
     * @param version Template version
     */
    function requireActiveTemplate(Industry industry, string calldata version)
        external
        view
    {
        Template memory template = templates[industry][version];
        if (template.createdAt == 0) {
            revert TemplateNotFound(industry, version);
        }
        if (!template.active) {
            revert TemplateNotActive(industry, version);
        }
    }
}
