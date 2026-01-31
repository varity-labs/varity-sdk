"""
App Store Integration Module

This module provides automatic submission to the Varity App Store smart contract.
It extracts metadata from deployed applications and submits them on-chain.

Components:
    - AppStoreClient: Smart contract interaction and transaction signing
    - MetadataBuilder: Extracts and validates app metadata
    - Types: Data structures for App Store integration

Usage:
    from varietykit.core.app_store import AppStoreClient, MetadataBuilder

    client = AppStoreClient(
        contract_address="0x...",
        signer_key="0x...",
        network="varity"
    )

    metadata = MetadataBuilder().build_from_deployment(
        project_info=project_info,
        deployment_result=deployment_result,
        package_json_path="./package.json"
    )

    result = client.submit_app(metadata)
    print(f"App submitted! ID: {result.app_id}, URL: {result.url}")
"""

from .client import AppStoreClient
from .metadata_builder import MetadataBuilder
from .types import (
    AppMetadata,
    AppStatus,
    AppStoreError,
    ContractInteractionError,
    MetadataValidationError,
    SubmissionResult,
)

__all__ = [
    "AppStoreClient",
    "MetadataBuilder",
    "AppMetadata",
    "SubmissionResult",
    "AppStatus",
    "AppStoreError",
    "ContractInteractionError",
    "MetadataValidationError",
]
