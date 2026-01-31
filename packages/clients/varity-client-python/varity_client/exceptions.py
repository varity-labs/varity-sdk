"""
Varity Client Exceptions

Custom exception classes for the Varity client library.
"""


class VarityClientError(Exception):
    """Base exception for all Varity client errors"""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ContractError(VarityClientError):
    """Exception for contract-related errors"""

    pass


class WalletError(VarityClientError):
    """Exception for wallet-related errors"""

    pass


class AuthenticationError(VarityClientError):
    """Exception for authentication-related errors"""

    pass


class StorageError(VarityClientError):
    """Exception for storage-related errors"""

    pass


class NetworkError(VarityClientError):
    """Exception for network-related errors"""

    pass


class TransactionError(VarityClientError):
    """Exception for transaction-related errors"""

    pass
