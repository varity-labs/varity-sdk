// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

/**
 * @title VarityWalletFactory
 * @notice Factory contract for creating deterministic smart wallets for social login users
 * @dev Uses CREATE2 for predictable wallet addresses based on user's email/social ID
 */
contract VarityWalletFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    // Events
    event WalletCreated(
        address indexed wallet,
        address indexed owner,
        bytes32 indexed salt,
        uint256 timestamp
    );

    event WalletSponsored(
        address indexed wallet,
        address indexed paymaster,
        uint256 gasBudget
    );

    // State variables
    address public paymasterAddress;
    uint256 public defaultGasBudget;

    mapping(address => address) public walletToOwner;
    mapping(address => address) public ownerToWallet;
    mapping(address => bool) public isSponsoredWallet;

    // Storage gap for future upgrades
    uint256[45] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the factory contract
     * @param _paymasterAddress Address of the SimplifiedPaymaster
     * @param _defaultGasBudget Default gas budget for new wallets (in wei)
     */
    function initialize(
        address _paymasterAddress,
        uint256 _defaultGasBudget
    ) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        require(_paymasterAddress != address(0), "Invalid paymaster");
        paymasterAddress = _paymasterAddress;
        defaultGasBudget = _defaultGasBudget;
    }

    /**
     * @notice Create a new smart wallet for a user
     * @param owner Address of the wallet owner (from Web3Auth EOA)
     * @param salt Unique salt (hash of email or social ID)
     * @return walletAddress Address of the created wallet
     */
    function createWallet(
        address owner,
        bytes32 salt
    ) external returns (address walletAddress) {
        require(owner != address(0), "Invalid owner");
        require(ownerToWallet[owner] == address(0), "Wallet already exists");

        // For MVP: Deploy a minimal proxy/wallet contract
        // In production: Deploy ERC-4337 SimpleAccount
        bytes memory bytecode = type(MinimalWallet).creationCode;
        bytes memory deployCode = abi.encodePacked(
            bytecode,
            abi.encode(owner, paymasterAddress)
        );

        walletAddress = Create2.deploy(0, salt, deployCode);

        // Register wallet
        walletToOwner[walletAddress] = owner;
        ownerToWallet[owner] = walletAddress;
        isSponsoredWallet[walletAddress] = true;

        // Sponsor the wallet in the paymaster
        ISimplifiedPaymaster(paymasterAddress).sponsorWallet(walletAddress, defaultGasBudget);

        emit WalletCreated(walletAddress, owner, salt, block.timestamp);
        emit WalletSponsored(walletAddress, paymasterAddress, defaultGasBudget);

        return walletAddress;
    }

    /**
     * @notice Predict wallet address before deployment
     * @param owner Address of the wallet owner
     * @param salt Unique salt
     * @return predicted address
     */
    function getWalletAddress(
        address owner,
        bytes32 salt
    ) external view returns (address) {
        bytes memory bytecode = type(MinimalWallet).creationCode;
        bytes memory deployCode = abi.encodePacked(
            bytecode,
            abi.encode(owner, paymasterAddress)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(deployCode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Update paymaster address
     * @param newPaymaster New paymaster contract address
     */
    function updatePaymaster(address newPaymaster) external onlyOwner {
        require(newPaymaster != address(0), "Invalid paymaster");
        paymasterAddress = newPaymaster;
    }

    /**
     * @notice Update default gas budget
     * @param newBudget New gas budget in wei
     */
    function updateGasBudget(uint256 newBudget) external onlyOwner {
        defaultGasBudget = newBudget;
    }

    /**
     * @notice Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

/**
 * @title MinimalWallet
 * @notice Minimal smart wallet contract for MVP
 * @dev In production, replace with full ERC-4337 SimpleAccount
 */
contract MinimalWallet {
    address public owner;
    address public paymaster;
    uint256 public nonce;

    event TransactionExecuted(address indexed to, uint256 value, bytes data, uint256 nonce);
    event Received(address indexed from, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner, address _paymaster) {
        owner = _owner;
        paymaster = _paymaster;
    }

    /**
     * @notice Execute a transaction from the wallet
     * @param to Destination address
     * @param value Amount of ETH to send
     * @param data Transaction data
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory) {
        require(to != address(0), "Invalid target");

        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Transaction failed");

        emit TransactionExecuted(to, value, data, nonce++);
        return result;
    }

    /**
     * @notice Execute batch transactions
     * @param targets Array of destination addresses
     * @param values Array of ETH amounts
     * @param datas Array of transaction data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwner {
        require(
            targets.length == values.length &&
            values.length == datas.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "Batch transaction failed");
            emit TransactionExecuted(targets[i], values[i], datas[i], nonce++);
        }
    }

    /**
     * @notice Transfer ownership of the wallet
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    /**
     * @notice Get current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}

/**
 * @title ISimplifiedPaymaster
 * @notice Interface for SimplifiedPaymaster
 */
interface ISimplifiedPaymaster {
    function sponsorWallet(address wallet, uint256 gasBudget) external;
}