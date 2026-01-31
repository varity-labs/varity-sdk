"""
Gas Usage Database Models

MongoDB schema for gas tracking and billing.

Collections:
- gas_usage: Individual gas usage events
- billing_cycles: Monthly billing aggregates
"""

from datetime import datetime
from typing import Optional
from enum import Enum


class BillingStatus(str, Enum):
    """Billing status for gas usage"""
    PENDING = "pending"      # Not yet billed
    BILLED = "billed"        # Invoice generated
    PAID = "paid"            # Payment received


class GasUsageRecord:
    """
    MongoDB document schema for gas_usage collection

    Stores individual gas usage events for billing.
    """

    @staticmethod
    def get_schema():
        """Get MongoDB schema definition"""
        return {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": [
                        "app_id",
                        "developer_wallet",
                        "transaction_hash",
                        "gas_sponsored_usdc",
                        "timestamp",
                        "chain_id",
                        "user_wallet",
                        "billing_status",
                        "billing_month",
                    ],
                    "properties": {
                        "app_id": {
                            "bsonType": "string",
                            "description": "Unique app identifier from App Store"
                        },
                        "developer_wallet": {
                            "bsonType": "string",
                            "pattern": "^0x[a-fA-F0-9]{40}$",
                            "description": "Developer's wallet address (Ethereum format)"
                        },
                        "transaction_hash": {
                            "bsonType": "string",
                            "pattern": "^0x[a-fA-F0-9]{64}$",
                            "description": "Transaction hash on-chain"
                        },
                        "gas_sponsored_usdc": {
                            "bsonType": "string",
                            "description": "Gas cost in USDC (6 decimal precision)"
                        },
                        "timestamp": {
                            "bsonType": "long",
                            "description": "Unix timestamp in milliseconds"
                        },
                        "chain_id": {
                            "bsonType": "int",
                            "description": "Chain ID (33529 for Varity L3)"
                        },
                        "user_wallet": {
                            "bsonType": "string",
                            "pattern": "^0x[a-fA-F0-9]{40}$",
                            "description": "End user's wallet address"
                        },
                        "billing_status": {
                            "enum": ["pending", "billed", "paid"],
                            "description": "Billing status"
                        },
                        "billing_month": {
                            "bsonType": "string",
                            "pattern": "^\\d{4}-\\d{2}$",
                            "description": "Billing month (YYYY-MM format)"
                        },
                        "created_at": {
                            "bsonType": "date",
                            "description": "Record creation timestamp"
                        },
                        "billed_at": {
                            "bsonType": ["date", "null"],
                            "description": "When invoice was generated"
                        },
                        "paid_at": {
                            "bsonType": ["date", "null"],
                            "description": "When payment was received"
                        },
                    }
                }
            }
        }

    @staticmethod
    def get_indexes():
        """Get MongoDB indexes for gas_usage collection"""
        return [
            # Query by app and month (most common query)
            {
                "keys": [("app_id", 1), ("billing_month", 1)],
                "name": "app_month_idx",
            },
            # Query by developer and billing status
            {
                "keys": [("developer_wallet", 1), ("billing_status", 1)],
                "name": "developer_status_idx",
            },
            # Query by transaction hash (for deduplication)
            {
                "keys": [("transaction_hash", 1)],
                "name": "tx_hash_idx",
                "unique": True,
            },
            # Query by timestamp (for analytics)
            {
                "keys": [("timestamp", -1)],
                "name": "timestamp_idx",
            },
            # Query by chain_id (multi-chain support)
            {
                "keys": [("chain_id", 1)],
                "name": "chain_idx",
            },
            # Composite index for billing queries
            {
                "keys": [
                    ("developer_wallet", 1),
                    ("billing_month", 1),
                    ("billing_status", 1),
                ],
                "name": "billing_composite_idx",
            },
        ]


class BillingCycle:
    """
    MongoDB document schema for billing_cycles collection

    Stores monthly aggregates for efficient billing queries.
    Updated daily or when billing status changes.
    """

    @staticmethod
    def get_schema():
        """Get MongoDB schema definition"""
        return {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": [
                        "developer_wallet",
                        "billing_month",
                        "apps",
                        "total_gas_usdc",
                        "total_transactions",
                        "billing_status",
                    ],
                    "properties": {
                        "developer_wallet": {
                            "bsonType": "string",
                            "pattern": "^0x[a-fA-F0-9]{40}$",
                            "description": "Developer's wallet address"
                        },
                        "billing_month": {
                            "bsonType": "string",
                            "pattern": "^\\d{4}-\\d{2}$",
                            "description": "Billing month (YYYY-MM format)"
                        },
                        "apps": {
                            "bsonType": "array",
                            "description": "List of apps and their usage",
                            "items": {
                                "bsonType": "object",
                                "required": ["app_id", "gas_used_usdc", "transactions"],
                                "properties": {
                                    "app_id": {
                                        "bsonType": "string",
                                        "description": "App identifier"
                                    },
                                    "app_name": {
                                        "bsonType": ["string", "null"],
                                        "description": "App name (optional)"
                                    },
                                    "gas_used_usdc": {
                                        "bsonType": "string",
                                        "description": "Total gas used in USDC"
                                    },
                                    "transactions": {
                                        "bsonType": "int",
                                        "description": "Number of transactions"
                                    },
                                }
                            }
                        },
                        "total_gas_usdc": {
                            "bsonType": "string",
                            "description": "Total gas across all apps"
                        },
                        "total_transactions": {
                            "bsonType": "int",
                            "description": "Total transaction count"
                        },
                        "billing_status": {
                            "enum": ["pending", "billed", "paid"],
                            "description": "Billing status"
                        },
                        "invoice_id": {
                            "bsonType": ["string", "null"],
                            "description": "Invoice ID when billed"
                        },
                        "invoice_amount_usd": {
                            "bsonType": ["string", "null"],
                            "description": "Invoice amount in USD (may differ from gas cost)"
                        },
                        "payment_tx_hash": {
                            "bsonType": ["string", "null"],
                            "description": "Payment transaction hash"
                        },
                        "created_at": {
                            "bsonType": "date",
                            "description": "Cycle creation timestamp"
                        },
                        "updated_at": {
                            "bsonType": "date",
                            "description": "Last update timestamp"
                        },
                        "billed_at": {
                            "bsonType": ["date", "null"],
                            "description": "When invoice was generated"
                        },
                        "paid_at": {
                            "bsonType": ["date", "null"],
                            "description": "When payment was received"
                        },
                        "due_date": {
                            "bsonType": ["date", "null"],
                            "description": "Payment due date"
                        },
                    }
                }
            }
        }

    @staticmethod
    def get_indexes():
        """Get MongoDB indexes for billing_cycles collection"""
        return [
            # Unique index on developer + month
            {
                "keys": [("developer_wallet", 1), ("billing_month", 1)],
                "name": "developer_month_unique_idx",
                "unique": True,
            },
            # Query by billing status
            {
                "keys": [("billing_status", 1)],
                "name": "status_idx",
            },
            # Query unpaid invoices
            {
                "keys": [("billing_status", 1), ("due_date", 1)],
                "name": "unpaid_overdue_idx",
            },
        ]


# =====================================================================
# Database Setup Script
# =====================================================================

async def setup_database(db):
    """
    Setup MongoDB collections and indexes

    Run this once when deploying the backend.

    Args:
        db: MongoDB database instance

    Example:
        ```python
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client.varity_production
        await setup_database(db)
        ```
    """
    # Create gas_usage collection
    try:
        await db.create_collection("gas_usage", **GasUsageRecord.get_schema())
        print("✓ Created gas_usage collection")
    except Exception as e:
        print(f"gas_usage collection exists or error: {e}")

    # Create indexes for gas_usage
    for index in GasUsageRecord.get_indexes():
        await db.gas_usage.create_index(
            index["keys"],
            name=index["name"],
            unique=index.get("unique", False),
        )
        print(f"✓ Created index: {index['name']}")

    # Create billing_cycles collection
    try:
        await db.create_collection("billing_cycles", **BillingCycle.get_schema())
        print("✓ Created billing_cycles collection")
    except Exception as e:
        print(f"billing_cycles collection exists or error: {e}")

    # Create indexes for billing_cycles
    for index in BillingCycle.get_indexes():
        await db.billing_cycles.create_index(
            index["keys"],
            name=index["name"],
            unique=index.get("unique", False),
        )
        print(f"✓ Created index: {index['name']}")

    print("\n✅ Database setup complete!")


# =====================================================================
# Sample Data
# =====================================================================

SAMPLE_GAS_USAGE = {
    "app_id": "app_abc123",
    "developer_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "gas_sponsored_usdc": "0.025000",
    "timestamp": 1737321600000,
    "chain_id": 33529,
    "user_wallet": "0x9876543210fedcba9876543210fedcba98765432",
    "billing_status": "pending",
    "billing_month": "2026-01",
    "created_at": datetime.utcnow(),
}

SAMPLE_BILLING_CYCLE = {
    "developer_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "billing_month": "2026-01",
    "apps": [
        {
            "app_id": "app_abc123",
            "app_name": "My Awesome DApp",
            "gas_used_usdc": "2.450000",
            "transactions": 98,
        },
        {
            "app_id": "app_def456",
            "app_name": "NFT Marketplace",
            "gas_used_usdc": "1.230000",
            "transactions": 45,
        },
    ],
    "total_gas_usdc": "3.680000",
    "total_transactions": 143,
    "billing_status": "pending",
    "invoice_id": None,
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
}
