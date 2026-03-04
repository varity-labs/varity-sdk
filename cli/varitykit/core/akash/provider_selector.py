"""
Akash Provider Selection

Selects optimal Akash provider from available bids based on:
- Price (lowest cost)
- Reputation (provider track record)
- Location (geographic proximity)
- Uptime (reliability)
"""

from typing import Any, Dict, List, Optional

from .types import AkashProviderBid, AkashProviderError


class ProviderSelector:
    """
    Selects optimal Akash provider from available bids.

    Uses weighted scoring algorithm to balance price, reputation, and reliability.
    """

    def __init__(
        self,
        price_weight: float = 0.5,
        reputation_weight: float = 0.3,
        uptime_weight: float = 0.2,
        preferred_location: Optional[str] = None,
    ):
        """
        Initialize provider selector.

        Args:
            price_weight: Weight for price factor (0-1, default: 0.5)
            reputation_weight: Weight for reputation factor (0-1, default: 0.3)
            uptime_weight: Weight for uptime factor (0-1, default: 0.2)
            preferred_location: Preferred provider location (e.g., "us-east")

        Raises:
            ValueError: If weights don't sum to 1.0
        """
        total_weight = price_weight + reputation_weight + uptime_weight
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError(
                f"Weights must sum to 1.0 (got {total_weight}). "
                f"Adjust price_weight, reputation_weight, uptime_weight."
            )

        self.price_weight = price_weight
        self.reputation_weight = reputation_weight
        self.uptime_weight = uptime_weight
        self.preferred_location = preferred_location

    def select_best_provider(
        self, bids: List[AkashProviderBid], max_price: Optional[int] = None
    ) -> AkashProviderBid:
        """
        Select best provider from list of bids.

        Args:
            bids: List of provider bids
            max_price: Maximum acceptable price in uakt per block (optional)

        Returns:
            Best provider bid

        Raises:
            AkashProviderError: If no bids available or all filtered out

        Example:
            selector = ProviderSelector(price_weight=0.6, reputation_weight=0.4)
            best_bid = selector.select_best_provider(bids, max_price=5000)
        """
        if not bids:
            raise AkashProviderError("No provider bids available")

        # Filter bids by max price if specified
        if max_price is not None:
            bids = [bid for bid in bids if bid.price <= max_price]

            if not bids:
                raise AkashProviderError(
                    f"No providers within budget (max_price: {max_price} uakt/block)"
                )

        # Calculate scores for each bid
        scored_bids = []
        for bid in bids:
            score = self._calculate_score(bid, bids)
            scored_bids.append((score, bid))

        # Sort by score (highest first)
        scored_bids.sort(key=lambda x: x[0], reverse=True)

        # Return best bid
        best_score, best_bid = scored_bids[0]

        return best_bid

    def select_fastest_response(self, bids: List[AkashProviderBid]) -> AkashProviderBid:
        """
        Select first available provider (fastest response).

        Useful when speed is more important than cost optimization.

        Args:
            bids: List of provider bids

        Returns:
            First available provider bid

        Raises:
            AkashProviderError: If no bids available
        """
        if not bids:
            raise AkashProviderError("No provider bids available")

        return bids[0]

    def filter_by_location(
        self, bids: List[AkashProviderBid], location: str
    ) -> List[AkashProviderBid]:
        """
        Filter bids by geographic location.

        Args:
            bids: List of provider bids
            location: Desired location (e.g., "us-east", "eu-west")

        Returns:
            Filtered list of bids matching location
        """
        return [bid for bid in bids if bid.location and bid.location.lower() == location.lower()]

    def filter_by_attributes(
        self, bids: List[AkashProviderBid], required_attributes: Dict[str, str]
    ) -> List[AkashProviderBid]:
        """
        Filter bids by provider attributes.

        Args:
            bids: List of provider bids
            required_attributes: Dictionary of required attributes

        Returns:
            Filtered list of bids matching all required attributes

        Example:
            filtered = selector.filter_by_attributes(
                bids,
                {'gpu': 'nvidia', 'region': 'us'}
            )
        """
        filtered_bids = []

        for bid in bids:
            matches = True
            for key, value in required_attributes.items():
                if key not in bid.attributes or bid.attributes[key] != value:
                    matches = False
                    break

            if matches:
                filtered_bids.append(bid)

        return filtered_bids

    def _calculate_score(self, bid: AkashProviderBid, all_bids: List[AkashProviderBid]) -> float:
        """
        Calculate weighted score for a provider bid.

        Args:
            bid: Bid to score
            all_bids: All available bids (for normalization)

        Returns:
            Weighted score (0-100)
        """
        # Normalize price (lower is better, so invert)
        prices = [b.price for b in all_bids if b.price > 0]
        if prices:
            max_price = max(prices)
            min_price = min(prices)
            if max_price > min_price:
                # Invert: lower price = higher score
                price_score = 100 * (1 - (bid.price - min_price) / (max_price - min_price))
            else:
                price_score = 100
        else:
            price_score = 50  # Default if no price data

        # Reputation score (higher is better)
        reputation_score = bid.reputation_score

        # Uptime score (higher is better)
        uptime_score = bid.uptime

        # Location bonus
        location_bonus = 0
        if self.preferred_location and bid.location:
            if bid.location.lower() == self.preferred_location.lower():
                location_bonus = 10  # 10 point bonus for preferred location

        # Calculate weighted score
        total_score = (
            price_score * self.price_weight
            + reputation_score * self.reputation_weight
            + uptime_score * self.uptime_weight
            + location_bonus
        )

        return total_score

    def estimate_monthly_cost(self, price_per_block: int) -> float:
        """
        Estimate monthly cost from price per block.

        Akash blocks are approximately 6 seconds each.
        Monthly blocks = (30 days * 24 hours * 60 minutes * 60 seconds) / 6 seconds

        Args:
            price_per_block: Price in uakt per block

        Returns:
            Estimated monthly cost in AKT
        """
        # Blocks per month (assuming 6 second blocks)
        blocks_per_month = (30 * 24 * 60 * 60) / 6  # ~432,000 blocks/month

        # Total cost in uakt
        total_uakt = price_per_block * blocks_per_month

        # Convert to AKT (1 AKT = 1,000,000 uakt)
        total_akt = total_uakt / 1_000_000

        return total_akt

    def compare_providers(self, bids: List[AkashProviderBid]) -> List[Dict[str, Any]]:
        """
        Compare all providers with detailed scoring breakdown.

        Args:
            bids: List of provider bids

        Returns:
            List of dictionaries with provider comparisons

        Example:
            comparisons = selector.compare_providers(bids)
            for comp in comparisons:
                print(f"{comp['provider']}: Score {comp['score']:.2f}")
        """
        comparisons = []

        for bid in bids:
            score = self._calculate_score(bid, bids)
            monthly_cost = self.estimate_monthly_cost(bid.price)

            comparisons.append(
                {
                    "provider": bid.provider,
                    "score": score,
                    "price_per_block": bid.price,
                    "monthly_cost_akt": monthly_cost,
                    "reputation": bid.reputation_score,
                    "uptime": bid.uptime,
                    "location": bid.location,
                    "attributes": bid.attributes,
                }
            )

        # Sort by score
        comparisons.sort(key=lambda x: float(x["score"]), reverse=True)

        return comparisons
