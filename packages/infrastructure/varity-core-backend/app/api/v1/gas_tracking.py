"""
Gas Tracking API

Tracks gas usage for per-app billing in Varity SDK.
Each app's gas consumption is monitored and stored for monthly billing.

Routes:
- POST /v1/gas-tracking - Track gas usage event
- GET /v1/gas-tracking/{app_id}/usage - Get app gas usage
- GET /v1/billing/{developer_wallet}/summary - Get developer billing summary
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import asyncio

router = APIRouter()


# =====================================================================
# Request/Response Models
# =====================================================================

class GasUsageEvent(BaseModel):
    """Gas usage event from frontend"""
    app_id: str = Field(..., description="Unique app identifier from App Store")
    developer_wallet: str = Field(..., description="Developer's wallet address for billing")
    transaction_hash: str = Field(..., description="Transaction hash on-chain")
    gas_sponsored: str = Field(..., description="Gas cost in USDC (6 decimal precision)")
    timestamp: int = Field(..., description="Unix timestamp (milliseconds)")
    chain_id: int = Field(..., description="Chain ID (33529 for Varity L3)")
    user_wallet: str = Field(..., description="End user's wallet address")

    class Config:
        json_schema_extra = {
            "example": {
                "app_id": "app_abc123",
                "developer_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                "gas_sponsored": "0.025000",
                "timestamp": 1737321600000,
                "chain_id": 33529,
                "user_wallet": "0x9876543210fedcba9876543210fedcba98765432",
            }
        }


class GasUsageResponse(BaseModel):
    """Response after tracking gas usage"""
    status: str = Field(..., description="Status of tracking request")
    app_id: str = Field(..., description="App ID that was tracked")
    message: Optional[str] = Field(None, description="Additional message")


class AppGasUsageResponse(BaseModel):
    """Response for app gas usage query"""
    app_id: str = Field(..., description="App identifier")
    total_gas_usdc: str = Field(..., description="Total gas used in USDC")
    transaction_count: int = Field(..., description="Number of transactions")
    month: Optional[str] = Field(None, description="Billing month (YYYY-MM)")


class AppUsageSummary(BaseModel):
    """Summary of gas usage for a single app"""
    app_id: str
    app_name: Optional[str] = None
    gas_used_usdc: str
    transactions: int


class DeveloperBillingSummary(BaseModel):
    """Billing summary for a developer"""
    developer: str = Field(..., description="Developer wallet address")
    month: str = Field(..., description="Billing month")
    apps: List[AppUsageSummary] = Field(..., description="List of apps and their usage")
    total_gas_usdc: str = Field(..., description="Total gas across all apps")
    billing_status: str = Field(..., description="pending | billed | paid")


# =====================================================================
# Database Mock (Replace with actual MongoDB/PostgreSQL)
# =====================================================================

# In production, replace this with actual database
gas_usage_db = []


async def store_gas_usage(event: GasUsageEvent) -> dict:
    """
    Store gas usage in database

    In production, this would:
    1. Connect to MongoDB/PostgreSQL
    2. Insert gas usage record
    3. Update monthly aggregates
    4. Check for billing thresholds
    """
    # Extract billing month from timestamp
    event_date = datetime.fromtimestamp(event.timestamp / 1000)
    billing_month = event_date.strftime("%Y-%m")

    record = {
        "app_id": event.app_id,
        "developer_wallet": event.developer_wallet,
        "transaction_hash": event.transaction_hash,
        "gas_sponsored_usdc": event.gas_sponsored,
        "timestamp": event.timestamp,
        "chain_id": event.chain_id,
        "user_wallet": event.user_wallet,
        "billing_status": "pending",
        "billing_month": billing_month,
        "created_at": datetime.utcnow().isoformat(),
    }

    # Mock database insert
    gas_usage_db.append(record)

    # TODO: In production, use actual database:
    # await db.gas_usage.insert_one(record)

    return record


async def get_app_usage(app_id: str, month: Optional[str] = None) -> dict:
    """
    Get gas usage for an app

    Args:
        app_id: App identifier
        month: Billing month (YYYY-MM format), or None for all time

    Returns:
        Dictionary with total_gas_usdc and transaction_count
    """
    # Filter records
    filtered = [r for r in gas_usage_db if r["app_id"] == app_id]

    if month:
        filtered = [r for r in filtered if r["billing_month"] == month]

    if not filtered:
        return {
            "app_id": app_id,
            "total_gas_usdc": "0.000000",
            "transaction_count": 0,
        }

    # Calculate totals
    total_gas = sum(Decimal(r["gas_sponsored_usdc"]) for r in filtered)

    return {
        "app_id": app_id,
        "total_gas_usdc": f"{total_gas:.6f}",
        "transaction_count": len(filtered),
    }


async def get_developer_summary(
    developer_wallet: str,
    month: Optional[str] = None
) -> dict:
    """
    Get billing summary for a developer

    Args:
        developer_wallet: Developer's wallet address
        month: Billing month (YYYY-MM format), or current month if None

    Returns:
        Dictionary with apps list and total gas usage
    """
    # Filter records
    filtered = [r for r in gas_usage_db if r["developer_wallet"] == developer_wallet]

    if month:
        filtered = [r for r in filtered if r["billing_month"] == month]

    if not filtered:
        return {
            "developer": developer_wallet,
            "month": month or datetime.now().strftime("%Y-%m"),
            "apps": [],
            "total_gas_usdc": "0.000000",
            "billing_status": "pending",
        }

    # Group by app_id
    apps_map = {}
    for record in filtered:
        app_id = record["app_id"]
        if app_id not in apps_map:
            apps_map[app_id] = {
                "app_id": app_id,
                "gas_used_usdc": Decimal(0),
                "transactions": 0,
            }

        apps_map[app_id]["gas_used_usdc"] += Decimal(record["gas_sponsored_usdc"])
        apps_map[app_id]["transactions"] += 1

    # Convert to list
    apps = [
        {
            "app_id": app_id,
            "gas_used_usdc": f"{data['gas_used_usdc']:.6f}",
            "transactions": data["transactions"],
        }
        for app_id, data in apps_map.items()
    ]

    # Calculate total
    total_gas = sum(Decimal(app["gas_used_usdc"]) for app in apps)

    return {
        "developer": developer_wallet,
        "month": month or datetime.now().strftime("%Y-%m"),
        "apps": apps,
        "total_gas_usdc": f"{total_gas:.6f}",
        "billing_status": "pending",
    }


# =====================================================================
# API Endpoints
# =====================================================================

@router.post("/gas-tracking", response_model=GasUsageResponse)
async def track_gas_usage(event: GasUsageEvent):
    """
    Track gas usage for billing purposes

    Stores gas usage per app for monthly billing cycle.
    Called automatically by SmartWalletProvider after each transaction.

    **Request Body:**
    ```json
    {
        "app_id": "app_abc123",
        "developer_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "transaction_hash": "0x...",
        "gas_sponsored": "0.025000",
        "timestamp": 1737321600000,
        "chain_id": 33529,
        "user_wallet": "0x..."
    }
    ```

    **Response:**
    ```json
    {
        "status": "tracked",
        "app_id": "app_abc123",
        "message": "Gas usage tracked successfully"
    }
    ```
    """
    try:
        # Validate USDC precision (6 decimals)
        gas_decimal = Decimal(event.gas_sponsored)
        if gas_decimal < 0:
            raise HTTPException(status_code=400, detail="Gas sponsored cannot be negative")

        # Store in database
        await store_gas_usage(event)

        return GasUsageResponse(
            status="tracked",
            app_id=event.app_id,
            message=f"Tracked {event.gas_sponsored} USDC for transaction {event.transaction_hash[:10]}..."
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid gas_sponsored format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track gas usage: {e}")


@router.get("/gas-tracking/{app_id}/usage", response_model=AppGasUsageResponse)
async def get_app_gas_usage(
    app_id: str,
    month: Optional[str] = Query(None, description="Billing month (YYYY-MM format)")
):
    """
    Get gas usage for an app

    Returns total gas used and transaction count for the specified app.
    Used by developers to monitor their app's gas consumption.

    **Query Parameters:**
    - `month` (optional): Billing month in YYYY-MM format (e.g., "2026-01")
      - If not provided, returns all-time usage

    **Example:**
    ```
    GET /v1/gas-tracking/app_abc123/usage?month=2026-01
    ```

    **Response:**
    ```json
    {
        "app_id": "app_abc123",
        "total_gas_usdc": "2.450000",
        "transaction_count": 98,
        "month": "2026-01"
    }
    ```
    """
    try:
        usage = await get_app_usage(app_id, month)

        return AppGasUsageResponse(
            app_id=usage["app_id"],
            total_gas_usdc=usage["total_gas_usdc"],
            transaction_count=usage["transaction_count"],
            month=month,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get app usage: {e}")


@router.get("/billing/{developer_wallet}/summary", response_model=DeveloperBillingSummary)
async def get_developer_billing_summary(
    developer_wallet: str,
    month: Optional[str] = Query(None, description="Billing month (YYYY-MM format)")
):
    """
    Get billing summary for a developer

    Returns all apps' gas usage for the specified developer.
    Used in App Store dashboard for billing visualization.

    **Query Parameters:**
    - `month` (optional): Billing month in YYYY-MM format (e.g., "2026-01")
      - If not provided, returns current month

    **Example:**
    ```
    GET /v1/billing/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/summary?month=2026-01
    ```

    **Response:**
    ```json
    {
        "developer": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "month": "2026-01",
        "apps": [
            {
                "app_id": "app_abc123",
                "gas_used_usdc": "2.450000",
                "transactions": 98
            },
            {
                "app_id": "app_def456",
                "gas_used_usdc": "1.230000",
                "transactions": 45
            }
        ],
        "total_gas_usdc": "3.680000",
        "billing_status": "pending"
    }
    ```
    """
    try:
        summary = await get_developer_summary(developer_wallet, month)

        return DeveloperBillingSummary(**summary)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get developer summary: {e}")


# =====================================================================
# Health Check
# =====================================================================

@router.get("/gas-tracking/health")
async def health_check():
    """
    Health check endpoint

    Returns service status and basic metrics.
    """
    return {
        "status": "healthy",
        "service": "gas-tracking-api",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "total_records": len(gas_usage_db),
    }
