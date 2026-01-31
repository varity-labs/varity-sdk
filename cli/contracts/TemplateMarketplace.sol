// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TemplateMarketplace
 * @dev Marketplace for VarityKit templates with 30/70 revenue sharing
 *
 * Features:
 * - Template publishing with quality score validation (>= 85)
 * - Automatic 30/70 revenue split (30% creator, 70% platform)
 * - Template purchase tracking
 * - Creator earnings management
 * - Platform fee collection
 *
 * Security:
 * - ReentrancyGuard for safe ETH transfers
 * - Pausable for emergency stops
 * - Ownable for platform management
 */
contract TemplateMarketplace is Ownable, ReentrancyGuard, Pausable {
    // ========== CONSTANTS ==========
    uint256 public constant CREATOR_SHARE_PERCENT = 30;
    uint256 public constant PLATFORM_SHARE_PERCENT = 70;
    uint256 public constant MIN_QUALITY_SCORE = 85;
    uint256 public constant MAX_QUALITY_SCORE = 100;

    // ========== STRUCTS ==========
    struct Template {
        string name;
        address creator;
        uint256 price;
        string repositoryUrl;
        string ipfsHash;  // Template metadata on IPFS
        uint256 qualityScore;
        uint256 downloads;
        uint256 totalRevenue;
        bool active;
        uint256 publishedAt;
    }

    struct CreatorStats {
        uint256 totalTemplates;
        uint256 totalDownloads;
        uint256 totalRevenue;
        uint256 pendingWithdrawal;
    }

    // ========== STATE VARIABLES ==========
    mapping(bytes32 => Template) public templates;
    mapping(address => CreatorStats) public creatorStats;
    mapping(address => bytes32[]) public creatorTemplates;
    mapping(bytes32 => mapping(address => bool)) public hasPurchased;

    bytes32[] public allTemplateIds;
    uint256 public totalPlatformRevenue;
    uint256 public totalTemplates;
    uint256 public totalPurchases;

    // ========== EVENTS ==========
    event TemplatePublished(
        bytes32 indexed templateId,
        string name,
        address indexed creator,
        uint256 price,
        uint256 qualityScore,
        uint256 timestamp
    );

    event TemplatePurchased(
        bytes32 indexed templateId,
        address indexed buyer,
        address indexed creator,
        uint256 amount,
        uint256 creatorShare,
        uint256 platformShare,
        uint256 timestamp
    );

    event TemplateUpdated(
        bytes32 indexed templateId,
        uint256 newPrice,
        bool active,
        uint256 timestamp
    );

    event CreatorWithdrawal(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event PlatformWithdrawal(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    // ========== MODIFIERS ==========
    modifier onlyTemplateCreator(bytes32 templateId) {
        require(templates[templateId].creator == msg.sender, "Not template creator");
        _;
    }

    modifier templateExists(bytes32 templateId) {
        require(templates[templateId].creator != address(0), "Template does not exist");
        _;
    }

    modifier validQualityScore(uint256 score) {
        require(score >= MIN_QUALITY_SCORE && score <= MAX_QUALITY_SCORE, "Invalid quality score");
        _;
    }

    // ========== CONSTRUCTOR ==========
    constructor() {
        // Constructor implementation
    }

    // ========== PUBLIC FUNCTIONS ==========

    /**
     * @notice Publish a new template to the marketplace
     * @param name Template name
     * @param price Template price in wei
     * @param repositoryUrl GitHub repository URL
     * @param ipfsHash IPFS hash of template metadata
     * @param qualityScore Quality validation score (85-100)
     * @return templateId Unique identifier for the template
     */
    function publishTemplate(
        string memory name,
        uint256 price,
        string memory repositoryUrl,
        string memory ipfsHash,
        uint256 qualityScore
    ) external whenNotPaused validQualityScore(qualityScore) returns (bytes32) {
        require(bytes(name).length > 0, "Template name required");
        require(bytes(repositoryUrl).length > 0, "Repository URL required");
        require(price > 0, "Price must be greater than 0");

        // Generate unique template ID
        bytes32 templateId = keccak256(
            abi.encodePacked(name, msg.sender, block.timestamp)
        );

        // Ensure template doesn't already exist
        require(templates[templateId].creator == address(0), "Template already exists");

        // Create template
        templates[templateId] = Template({
            name: name,
            creator: msg.sender,
            price: price,
            repositoryUrl: repositoryUrl,
            ipfsHash: ipfsHash,
            qualityScore: qualityScore,
            downloads: 0,
            totalRevenue: 0,
            active: true,
            publishedAt: block.timestamp
        });

        // Update creator stats
        creatorStats[msg.sender].totalTemplates++;
        creatorTemplates[msg.sender].push(templateId);
        allTemplateIds.push(templateId);
        totalTemplates++;

        emit TemplatePublished(
            templateId,
            name,
            msg.sender,
            price,
            qualityScore,
            block.timestamp
        );

        return templateId;
    }

    /**
     * @notice Purchase a template
     * @param templateId Template identifier
     */
    function purchaseTemplate(bytes32 templateId)
        external
        payable
        whenNotPaused
        nonReentrant
        templateExists(templateId)
    {
        Template storage template = templates[templateId];

        require(template.active, "Template is not active");
        require(msg.value == template.price, "Incorrect payment amount");
        require(!hasPurchased[templateId][msg.sender], "Already purchased");

        // Calculate revenue shares
        uint256 creatorShare = (msg.value * CREATOR_SHARE_PERCENT) / 100;
        uint256 platformShare = msg.value - creatorShare;

        // Update template stats
        template.downloads++;
        template.totalRevenue += msg.value;

        // Update creator stats
        creatorStats[template.creator].totalDownloads++;
        creatorStats[template.creator].totalRevenue += creatorShare;
        creatorStats[template.creator].pendingWithdrawal += creatorShare;

        // Update platform stats
        totalPlatformRevenue += platformShare;
        totalPurchases++;

        // Mark as purchased
        hasPurchased[templateId][msg.sender] = true;

        emit TemplatePurchased(
            templateId,
            msg.sender,
            template.creator,
            msg.value,
            creatorShare,
            platformShare,
            block.timestamp
        );
    }

    /**
     * @notice Update template price and status
     * @param templateId Template identifier
     * @param newPrice New price in wei
     * @param active Active status
     */
    function updateTemplate(
        bytes32 templateId,
        uint256 newPrice,
        bool active
    ) external whenNotPaused onlyTemplateCreator(templateId) {
        require(newPrice > 0, "Price must be greater than 0");

        Template storage template = templates[templateId];
        template.price = newPrice;
        template.active = active;

        emit TemplateUpdated(templateId, newPrice, active, block.timestamp);
    }

    /**
     * @notice Withdraw creator earnings
     */
    function withdrawCreatorEarnings() external nonReentrant {
        uint256 amount = creatorStats[msg.sender].pendingWithdrawal;
        require(amount > 0, "No earnings to withdraw");

        creatorStats[msg.sender].pendingWithdrawal = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit CreatorWithdrawal(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Withdraw platform fees (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawPlatformFees(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= totalPlatformRevenue, "Insufficient balance");

        totalPlatformRevenue -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit PlatformWithdrawal(msg.sender, amount, block.timestamp);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Get template details
     * @param templateId Template identifier
     * @return Template details
     */
    function getTemplate(bytes32 templateId)
        external
        view
        templateExists(templateId)
        returns (Template memory)
    {
        return templates[templateId];
    }

    /**
     * @notice Get creator statistics
     * @param creator Creator address
     * @return Creator stats
     */
    function getCreatorStats(address creator)
        external
        view
        returns (CreatorStats memory)
    {
        return creatorStats[creator];
    }

    /**
     * @notice Get all templates by creator
     * @param creator Creator address
     * @return Array of template IDs
     */
    function getCreatorTemplates(address creator)
        external
        view
        returns (bytes32[] memory)
    {
        return creatorTemplates[creator];
    }

    /**
     * @notice Get all template IDs
     * @return Array of all template IDs
     */
    function getAllTemplates()
        external
        view
        returns (bytes32[] memory)
    {
        return allTemplateIds;
    }

    /**
     * @notice Check if user has purchased a template
     * @param templateId Template identifier
     * @param user User address
     * @return True if purchased
     */
    function checkPurchase(bytes32 templateId, address user)
        external
        view
        returns (bool)
    {
        return hasPurchased[templateId][user];
    }

    /**
     * @notice Get marketplace statistics
     * @return totalTemplates_ Total templates
     * @return totalPurchases_ Total purchases
     * @return totalRevenue_ Total revenue
     */
    function getMarketplaceStats()
        external
        view
        returns (
            uint256 totalTemplates_,
            uint256 totalPurchases_,
            uint256 totalRevenue_
        )
    {
        totalTemplates_ = totalTemplates;
        totalPurchases_ = totalPurchases;

        // Calculate total revenue (platform + all pending creator withdrawals)
        uint256 creatorPending = 0;
        for (uint256 i = 0; i < allTemplateIds.length; i++) {
            creatorPending += templates[allTemplateIds[i]].totalRevenue;
        }
        totalRevenue_ = creatorPending;
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Pause contract (emergency)
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
     * @notice Remove template from marketplace (admin only, for policy violations)
     * @param templateId Template identifier
     */
    function removeTemplate(bytes32 templateId)
        external
        onlyOwner
        templateExists(templateId)
    {
        templates[templateId].active = false;
        emit TemplateUpdated(templateId, templates[templateId].price, false, block.timestamp);
    }
}
