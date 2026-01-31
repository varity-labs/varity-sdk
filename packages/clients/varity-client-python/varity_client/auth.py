"""
SIWE Authentication Module

Sign-In with Ethereum (SIWE) authentication functionality.
"""

import asyncio
import secrets
import time
from datetime import datetime, timedelta
from typing import Optional
from siwe import SiweMessage

from .types import SIWEMessage as SIWEMessageType, SIWESession
from .exceptions import AuthenticationError
from .utils import validate_address, to_checksum


class AuthManager:
    """
    Manager for SIWE authentication.

    Handles Sign-In with Ethereum message generation, signing, and verification.
    """

    def __init__(self, client):
        """
        Initialize auth manager.

        Args:
            client: VarityClient instance
        """
        self.client = client
        self.w3 = client.w3

    async def generate_siwe_message(
        self,
        domain: str,
        uri: str,
        statement: str = "Sign in to Varity",
        address: Optional[str] = None,
        expiration_minutes: int = 60,
        not_before: Optional[datetime] = None,
    ) -> SIWEMessageType:
        """
        Generate SIWE message for signing.

        Args:
            domain: Domain requesting the signature (e.g., "app.varity.io")
            uri: URI of the requesting service (e.g., "https://app.varity.io")
            statement: Human-readable statement (default: "Sign in to Varity")
            address: Ethereum address (uses connected account if None)
            expiration_minutes: Minutes until message expires (default: 60)
            not_before: Optional not-before timestamp

        Returns:
            SIWEMessage object ready for signing

        Example:
            >>> message = await client.auth.generate_siwe_message(
            ...     domain="app.varity.io",
            ...     uri="https://app.varity.io"
            ... )
        """
        if address is None:
            if not self.client.account:
                raise AuthenticationError("No address provided and no account connected")
            address = self.client.account.address

        if not validate_address(address):
            raise AuthenticationError(f"Invalid address: {address}")

        address = to_checksum(address)

        # Generate nonce
        nonce = secrets.token_hex(16)

        # Generate timestamps
        issued_at = datetime.utcnow()
        expiration_time = issued_at + timedelta(minutes=expiration_minutes)

        return SIWEMessageType(
            domain=domain,
            address=address,
            statement=statement,
            uri=uri,
            version="1",
            chain_id=self.client.chain_id,
            nonce=nonce,
            issued_at=issued_at.isoformat() + "Z",
            expiration_time=expiration_time.isoformat() + "Z",
            not_before=not_before.isoformat() + "Z" if not_before else None,
        )

    async def sign_siwe_message(self, message: SIWEMessageType) -> str:
        """
        Sign SIWE message with connected wallet.

        Args:
            message: SIWEMessage to sign

        Returns:
            Signature (hex string)

        Example:
            >>> message = await client.auth.generate_siwe_message(...)
            >>> signature = await client.auth.sign_siwe_message(message)
        """
        if not self.client.account:
            raise AuthenticationError("No account connected. Provide private_key to client.")

        try:
            # Create SIWE message
            siwe_message = SiweMessage(
                message={
                    "domain": message.domain,
                    "address": message.address,
                    "statement": message.statement,
                    "uri": message.uri,
                    "version": message.version,
                    "chain_id": message.chain_id,
                    "nonce": message.nonce,
                    "issued_at": message.issued_at,
                    "expiration_time": message.expiration_time,
                    "not_before": message.not_before,
                }
            )

            # Prepare message for signing
            prepared_message = siwe_message.prepare_message()

            # Sign message using wallet
            signature = await self.client.wallet.sign_message(prepared_message)

            return signature
        except Exception as e:
            raise AuthenticationError(f"Failed to sign SIWE message: {str(e)}") from e

    async def verify_siwe_signature(
        self, message: SIWEMessageType, signature: str
    ) -> bool:
        """
        Verify SIWE signature.

        Args:
            message: Original SIWE message
            signature: Signature to verify

        Returns:
            True if signature is valid, False otherwise

        Example:
            >>> valid = await client.auth.verify_siwe_signature(message, signature)
            >>> print(f"Signature valid: {valid}")
        """
        try:
            # Create SIWE message
            siwe_message = SiweMessage(
                message={
                    "domain": message.domain,
                    "address": message.address,
                    "statement": message.statement,
                    "uri": message.uri,
                    "version": message.version,
                    "chain_id": message.chain_id,
                    "nonce": message.nonce,
                    "issued_at": message.issued_at,
                    "expiration_time": message.expiration_time,
                    "not_before": message.not_before,
                }
            )

            # Verify signature
            siwe_message.verify(signature)

            return True
        except Exception:
            return False

    async def create_session(
        self,
        message: SIWEMessageType,
        signature: str,
        session_duration_minutes: int = 1440,  # 24 hours
    ) -> SIWESession:
        """
        Create authenticated session from SIWE signature.

        Args:
            message: Original SIWE message
            signature: Verified signature
            session_duration_minutes: Session duration in minutes (default: 24 hours)

        Returns:
            SIWESession with JWT token

        Example:
            >>> message = await client.auth.generate_siwe_message(...)
            >>> signature = await client.auth.sign_siwe_message(message)
            >>> session = await client.auth.create_session(message, signature)
            >>> print(f"Session token: {session.token}")
        """
        # Verify signature first
        is_valid = await self.verify_siwe_signature(message, signature)
        if not is_valid:
            raise AuthenticationError("Invalid SIWE signature")

        # Create session token (simplified - in production use JWT library)
        token = f"varity_{secrets.token_urlsafe(32)}"

        # Calculate expiration
        expires_at = int(time.time()) + (session_duration_minutes * 60)

        return SIWESession(
            address=message.address,
            chain_id=message.chain_id,
            token=token,
            expires_at=expires_at,
        )

    async def authenticate(
        self,
        domain: str,
        uri: str,
        statement: str = "Sign in to Varity",
        session_duration_minutes: int = 1440,
    ) -> SIWESession:
        """
        Complete SIWE authentication flow in one call.

        This is a convenience method that:
        1. Generates SIWE message
        2. Signs message
        3. Verifies signature
        4. Creates session

        Args:
            domain: Domain requesting the signature
            uri: URI of the requesting service
            statement: Human-readable statement
            session_duration_minutes: Session duration in minutes

        Returns:
            SIWESession with JWT token

        Example:
            >>> session = await client.auth.authenticate(
            ...     domain="app.varity.io",
            ...     uri="https://app.varity.io"
            ... )
            >>> print(f"Authenticated: {session.address}")
            >>> print(f"Token: {session.token}")
        """
        if not self.client.account:
            raise AuthenticationError("No account connected. Provide private_key to client.")

        # Generate message
        message = await self.generate_siwe_message(domain, uri, statement)

        # Sign message
        signature = await self.sign_siwe_message(message)

        # Create session
        session = await self.create_session(message, signature, session_duration_minutes)

        return session
