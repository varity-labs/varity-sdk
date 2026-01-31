// SPDX-License-Identifier: PROPRIETARY
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DashboardRegistry
 * @notice Registry for all deployed customer dashboards on Varity L3
 * @dev PROPRIETARY - DO NOT DISTRIBUTE
 */
contract DashboardRegistry is Ownable, ReentrancyGuard {
    struct Dashboard {
        string customerId;
        address dashboardAddress;
        string industry;
        string templateVersion;
        string storageCID;
        uint256 deployedAt;
        bool active;
    }

    // Mapping: customerId => Dashboard
    mapping(string => Dashboard) public dashboards;

    // Mapping: dashboardAddress => customerId
    mapping(address => string) public addressToCustomerId;

    // Array of all customer IDs for enumeration
    string[] public customerIds;

    // Events
    event DashboardRegistered(
        string indexed customerId,
        address indexed dashboardAddress,
        string industry,
        string templateVersion,
        uint256 timestamp
    );

    event DashboardDeactivated(
        string indexed customerId,
        uint256 timestamp
    );

    event DashboardUpdated(
        string indexed customerId,
        string templateVersion,
        string storageCID,
        uint256 timestamp
    );

    // Custom errors
    error DashboardAlreadyExists(string customerId);
    error DashboardNotFound(string customerId);
    error InvalidCustomerId();
    error InvalidAddress();
    error InvalidStorageCID();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new dashboard deployment
     * @param customerId Unique customer identifier
     * @param dashboardAddress Deployed dashboard contract address
     * @param industry Industry type (finance, healthcare, retail, iso)
     * @param templateVersion Version of template used
     * @param storageCID Filecoin CID for customer configuration
     */
    function registerDashboard(
        string calldata customerId,
        address dashboardAddress,
        string calldata industry,
        string calldata templateVersion,
        string calldata storageCID
    ) external onlyOwner nonReentrant {
        if (bytes(customerId).length == 0) revert InvalidCustomerId();
        if (dashboardAddress == address(0)) revert InvalidAddress();
        if (bytes(storageCID).length == 0) revert InvalidStorageCID();
        if (dashboards[customerId].deployedAt != 0) {
            revert DashboardAlreadyExists(customerId);
        }

        Dashboard memory newDashboard = Dashboard({
            customerId: customerId,
            dashboardAddress: dashboardAddress,
            industry: industry,
            templateVersion: templateVersion,
            storageCID: storageCID,
            deployedAt: block.timestamp,
            active: true
        });

        dashboards[customerId] = newDashboard;
        addressToCustomerId[dashboardAddress] = customerId;
        customerIds.push(customerId);

        emit DashboardRegistered(
            customerId,
            dashboardAddress,
            industry,
            templateVersion,
            block.timestamp
        );
    }

    /**
     * @notice Update dashboard configuration
     * @param customerId Customer identifier
     * @param templateVersion New template version
     * @param storageCID New storage CID
     */
    function updateDashboard(
        string calldata customerId,
        string calldata templateVersion,
        string calldata storageCID
    ) external onlyOwner {
        Dashboard storage dashboard = dashboards[customerId];
        if (dashboard.deployedAt == 0) revert DashboardNotFound(customerId);

        dashboard.templateVersion = templateVersion;
        dashboard.storageCID = storageCID;

        emit DashboardUpdated(
            customerId,
            templateVersion,
            storageCID,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a dashboard
     * @param customerId Customer identifier
     */
    function deactivateDashboard(string calldata customerId) external onlyOwner {
        Dashboard storage dashboard = dashboards[customerId];
        if (dashboard.deployedAt == 0) revert DashboardNotFound(customerId);

        dashboard.active = false;

        emit DashboardDeactivated(customerId, block.timestamp);
    }

    /**
     * @notice Get dashboard details by customer ID
     * @param customerId Customer identifier
     * @return Dashboard struct
     */
    function getDashboard(string calldata customerId)
        external
        view
        returns (Dashboard memory)
    {
        Dashboard memory dashboard = dashboards[customerId];
        if (dashboard.deployedAt == 0) revert DashboardNotFound(customerId);
        return dashboard;
    }

    /**
     * @notice Get customer ID by dashboard address
     * @param dashboardAddress Dashboard contract address
     * @return Customer ID
     */
    function getCustomerIdByAddress(address dashboardAddress)
        external
        view
        returns (string memory)
    {
        string memory customerId = addressToCustomerId[dashboardAddress];
        if (bytes(customerId).length == 0) revert DashboardNotFound("");
        return customerId;
    }

    /**
     * @notice Get total number of registered dashboards
     * @return Total count
     */
    function getTotalDashboards() external view returns (uint256) {
        return customerIds.length;
    }

    /**
     * @notice Get customer ID at index (for enumeration)
     * @param index Index in customerIds array
     * @return Customer ID
     */
    function getCustomerIdAtIndex(uint256 index)
        external
        view
        returns (string memory)
    {
        require(index < customerIds.length, "Index out of bounds");
        return customerIds[index];
    }

    /**
     * @notice Check if dashboard is active
     * @param customerId Customer identifier
     * @return Boolean indicating active status
     */
    function isDashboardActive(string calldata customerId)
        external
        view
        returns (bool)
    {
        return dashboards[customerId].active;
    }
}
