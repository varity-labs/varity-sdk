"""
Varity Client Type Definitions

Type hints and dataclasses for the Varity client library.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union
from enum import Enum


class ContractType(str, Enum):
    """Smart contract types supported by Varity"""

    ERC20 = "ERC20"
    ERC721 = "ERC721"
    ERC1155 = "ERC1155"
    CUSTOM = "CUSTOM"


class TransactionStatus(str, Enum):
    """Transaction status"""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"


@dataclass
class ContractDeployment:
    """
    Result of contract deployment.

    Attributes:
        address: Deployed contract address
        transaction_hash: Deployment transaction hash
        contract_type: Type of contract deployed
        block_number: Block number where contract was deployed
        deployer: Address that deployed the contract
    """

    address: str
    transaction_hash: str
    contract_type: ContractType
    block_number: int
    deployer: str


@dataclass
class Transaction:
    """
    Transaction data.

    Attributes:
        hash: Transaction hash
        from_address: Sender address
        to_address: Recipient address
        value: Transaction value in Wei (for ETH) or smallest unit
        gas: Gas limit
        gas_price: Gas price in Wei
        nonce: Transaction nonce
        data: Transaction data (hex string)
        status: Transaction status
        block_number: Block number (None if pending)
    """

    hash: str
    from_address: str
    to_address: str
    value: int
    gas: int
    gas_price: int
    nonce: int
    data: str
    status: TransactionStatus
    block_number: Optional[int] = None


@dataclass
class Balance:
    """
    Account balance information.

    Attributes:
        address: Account address
        balance: Balance as Decimal (with proper decimals)
        balance_wei: Balance in Wei (smallest unit)
        symbol: Token symbol (USDC, ETH, etc.)
        decimals: Number of decimals
    """

    address: str
    balance: Decimal
    balance_wei: int
    symbol: str
    decimals: int


@dataclass
class ContractFunction:
    """
    Smart contract function information.

    Attributes:
        name: Function name
        inputs: List of input parameters
        outputs: List of output parameters
        stateMutability: State mutability (view, pure, nonpayable, payable)
    """

    name: str
    inputs: List[Dict[str, Any]]
    outputs: List[Dict[str, Any]]
    stateMutability: str


@dataclass
class IPFSUploadResult:
    """
    Result of IPFS upload.

    Attributes:
        cid: Content identifier (CID)
        size: File size in bytes
        gateway_url: Gateway URL for accessing content
        pinned: Whether content is pinned
    """

    cid: str
    size: int
    gateway_url: str
    pinned: bool = True


@dataclass
class SIWEMessage:
    """
    Sign-In with Ethereum message.

    Attributes:
        domain: Domain requesting the signature
        address: Ethereum address signing
        statement: Human-readable statement
        uri: URI of the requesting service
        version: SIWE version
        chain_id: Chain ID
        nonce: Random nonce
        issued_at: ISO 8601 timestamp
        expiration_time: Optional expiration time
        not_before: Optional not-before time
    """

    domain: str
    address: str
    statement: str
    uri: str
    version: str
    chain_id: int
    nonce: str
    issued_at: str
    expiration_time: Optional[str] = None
    not_before: Optional[str] = None


@dataclass
class SIWESession:
    """
    SIWE authentication session.

    Attributes:
        address: Authenticated Ethereum address
        chain_id: Chain ID
        token: JWT token for API authentication
        expires_at: Token expiration timestamp
    """

    address: str
    chain_id: int
    token: str
    expires_at: int


# Type aliases
Address = str
TransactionHash = str
BlockNumber = int
Wei = int
Gwei = int
