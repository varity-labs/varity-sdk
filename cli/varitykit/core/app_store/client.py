"""
App Store Client for smart contract interaction.

This module handles submission of apps to the Varity App Store smart contract
using thirdweb SDK for transaction signing and submission.
"""

import json
import os
import subprocess
import tempfile
from typing import Any, Dict, Optional

from .types import (
    AppMetadata,
    AppStatus,
    AppStatusEnum,
    ContractInteractionError,
    SubmissionResult,
    TransactionError,
)


class AppStoreClient:
    """
    Client for interacting with the Varity App Store smart contract.

    Handles app submission, status checking, and contract queries using
    thirdweb SDK for reliable transaction management.

    Usage:
        client = AppStoreClient(
            contract_address="0x...",
            signer_key="0x...",
            network="varity"
        )

        result = client.submit_app(metadata)
        print(f"App ID: {result.app_id}")
    """

    # Network configurations
    NETWORKS = {
        "varity": {
            "chain_id": 33529,
            "rpc_url": "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz",
            "explorer_url": "https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz",
        },
        "arbitrum-sepolia": {
            "chain_id": 421614,
            "rpc_url": "https://sepolia-rollup.arbitrum.io/rpc",
            "explorer_url": "https://sepolia.arbiscan.io",
        },
    }

    # App Store base URL
    APP_STORE_BASE_URL = "https://store.varity.so"

    def __init__(
        self,
        contract_address: Optional[str] = None,
        signer_key: Optional[str] = None,
        network: str = "varity",
        thirdweb_client_id: Optional[str] = None,
    ):
        """
        Initialize App Store client.

        Args:
            contract_address: App Store contract address (or use env var VARITY_APP_STORE_ADDRESS)
            signer_key: Developer wallet private key (or use env var DEVELOPER_WALLET_KEY)
            network: Network to deploy on ('varity' or 'arbitrum-sepolia')
            thirdweb_client_id: thirdweb client ID (or use env var THIRDWEB_CLIENT_ID)

        Raises:
            ContractInteractionError: If required configuration is missing
        """
        # Load contract address
        self.contract_address = contract_address or os.getenv("VARITY_APP_STORE_ADDRESS")
        if not self.contract_address:
            raise ContractInteractionError(
                "App Store contract address not provided. "
                "Set VARITY_APP_STORE_ADDRESS environment variable or pass contract_address parameter."
            )

        # Load signer key
        self.signer_key = signer_key or os.getenv("DEVELOPER_WALLET_KEY")
        if not self.signer_key:
            raise ContractInteractionError(
                "Developer wallet key not provided. "
                "Set DEVELOPER_WALLET_KEY environment variable or pass signer_key parameter."
            )

        # Load thirdweb client ID
        self.thirdweb_client_id = thirdweb_client_id or os.getenv("THIRDWEB_CLIENT_ID")
        if not self.thirdweb_client_id:
            raise ContractInteractionError(
                "thirdweb client ID not provided. "
                "Set THIRDWEB_CLIENT_ID environment variable or pass thirdweb_client_id parameter."
            )

        # Validate network
        if network not in self.NETWORKS:
            raise ContractInteractionError(
                f"Invalid network: {network}. " f"Supported networks: {list(self.NETWORKS.keys())}"
            )

        self.network = network
        self.network_config = self.NETWORKS[network]

    def submit_app(self, metadata: AppMetadata) -> SubmissionResult:
        """
        Submit an app to the Varity App Store smart contract.

        This method:
        1. Validates metadata
        2. Prepares contract call parameters
        3. Signs and submits transaction using thirdweb SDK
        4. Waits for confirmation
        5. Returns app ID and store URL

        Args:
            metadata: App metadata to submit

        Returns:
            SubmissionResult with app ID, transaction hash, and store URL

        Raises:
            TransactionError: If transaction fails
            ContractInteractionError: If contract interaction fails
        """
        try:
            # Validate metadata before submission
            metadata.validate()

            print(f"📝 Submitting app to Varity App Store...")
            print(f"   Name: {metadata.name}")
            print(f"   Category: {metadata.category}")
            print(f"   Tier: {metadata.tier}")
            print(f"   Services: {metadata.services if metadata.services else 'none'}")
            print(f"   Chain ID: {metadata.chain_id}")

            # Submit transaction via Node.js bridge (uses thirdweb SDK)
            result = self._submit_transaction(metadata)

            if not result.get("success"):
                error_message = result.get("error", "Unknown error")
                return SubmissionResult(success=False, error_message=error_message)

            app_id = result.get("appId", 0)
            tx_hash = result.get("transactionHash", "")

            # Construct App Store URL
            app_store_url = f"{self.APP_STORE_BASE_URL}/apps/{app_id}"

            print(f"✅ App submitted successfully!")
            print(f"   App ID: {app_id}")
            print(f"   Transaction: {tx_hash}")
            print(f"   View at: {app_store_url}")

            return SubmissionResult(success=True, app_id=app_id, tx_hash=tx_hash, url=app_store_url)

        except Exception as e:
            error_message = f"App submission failed: {str(e)}"
            print(f"❌ {error_message}")
            return SubmissionResult(success=False, error_message=error_message)

    def get_app_status(self, app_id: int) -> Optional[AppStatus]:
        """
        Get the status of a submitted app.

        Args:
            app_id: Unique app identifier

        Returns:
            AppStatus object or None if app not found

        Raises:
            ContractInteractionError: If contract query fails
        """
        try:
            # Query contract via Node.js bridge
            result = self._query_contract("getApp", {"appId": app_id})

            if not result.get("success"):
                return None

            app_data = result.get("app", {})

            # Determine status
            is_approved = app_data.get("isApproved", False)
            is_active = app_data.get("isActive", False)

            if is_approved and is_active:
                status = AppStatusEnum.APPROVED
            elif not is_approved:
                status = AppStatusEnum.PENDING
            elif not is_active:
                status = AppStatusEnum.INACTIVE
            else:
                status = AppStatusEnum.PENDING

            return AppStatus(
                app_id=app_data.get("id", app_id),
                developer=app_data.get("developer", ""),
                name=app_data.get("name", ""),
                is_approved=is_approved,
                is_active=is_active,
                built_with_varity=app_data.get("builtWithVarity", True),
                published_at=app_data.get("publishedAt", 0),
                status=status,
            )

        except Exception as e:
            raise ContractInteractionError(f"Failed to get app status: {e}")

    def _submit_transaction(self, metadata: AppMetadata) -> Dict[str, Any]:
        """
        Submit transaction to smart contract via Node.js bridge.

        This uses a Node.js script with thirdweb SDK for reliable
        transaction signing and submission.

        Args:
            metadata: App metadata to submit

        Returns:
            Result dictionary with success status, app ID, and tx hash
        """
        # Create Node.js script for contract interaction
        script_content = self._generate_submission_script(metadata)

        # Write script to temp file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".js", delete=False, encoding="utf-8"
        ) as f:
            f.write(script_content)
            script_path = f.name

        try:
            # Execute Node.js script
            result = subprocess.run(
                ["node", script_path],
                capture_output=True,
                text=True,
                timeout=60,  # 60 second timeout
            )

            if result.returncode != 0:
                raise TransactionError(f"Transaction failed: {result.stderr}")

            # Parse JSON response
            response: Dict[str, Any] = json.loads(result.stdout)
            return response

        except subprocess.TimeoutExpired:
            raise TransactionError("Transaction timed out after 60 seconds")
        except json.JSONDecodeError as e:
            raise TransactionError(f"Invalid response from contract: {e}")
        except Exception as e:
            raise TransactionError(f"Transaction submission failed: {e}")
        finally:
            # Clean up temp file
            try:
                os.unlink(script_path)
            except Exception:
                pass

    def _query_contract(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Query smart contract (read-only operation).

        Args:
            method: Contract method name
            params: Method parameters

        Returns:
            Query result dictionary
        """
        # Create Node.js script for contract query
        script_content = self._generate_query_script(method, params)

        # Write script to temp file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".js", delete=False, encoding="utf-8"
        ) as f:
            f.write(script_content)
            script_path = f.name

        try:
            # Execute Node.js script
            result = subprocess.run(
                ["node", script_path],
                capture_output=True,
                text=True,
                timeout=30,  # 30 second timeout
            )

            if result.returncode != 0:
                raise ContractInteractionError(f"Contract query failed: {result.stderr}")

            # Parse JSON response
            response: Dict[str, Any] = json.loads(result.stdout)
            return response

        except subprocess.TimeoutExpired:
            raise ContractInteractionError("Contract query timed out")
        except json.JSONDecodeError as e:
            raise ContractInteractionError(f"Invalid response from contract: {e}")
        except Exception as e:
            raise ContractInteractionError(f"Contract query failed: {e}")
        finally:
            # Clean up temp file
            try:
                os.unlink(script_path)
            except Exception:
                pass

    def _generate_submission_script(self, metadata: AppMetadata) -> str:
        """
        Generate Node.js script for submitting app to contract.

        Args:
            metadata: App metadata to submit

        Returns:
            Node.js script content as string
        """
        contract_params = metadata.to_contract_params()

        return f"""
const {{ createThirdwebClient, getContract, prepareContractCall, sendTransaction }} = require('thirdweb');
const {{ privateKeyToAccount }} = require('thirdweb/wallets');

async function submitApp() {{
    try {{
        // Create thirdweb client
        const client = createThirdwebClient({{
            clientId: '{self.thirdweb_client_id}'
        }});

        // Create account from private key
        const account = privateKeyToAccount({{
            client,
            privateKey: '{self.signer_key}'
        }});

        // Get contract instance
        const contract = getContract({{
            client,
            chain: {{
                id: {self.network_config['chain_id']},
                rpc: '{self.network_config['rpc_url']}'
            }},
            address: '{self.contract_address}'
        }});

        // Prepare contract call - matches register_app in VarityAppRegistry Stylus contract
        const transaction = prepareContractCall({{
            contract,
            method: 'function register_app(string name, string description, string app_url, string logo_url, string category, uint64 chain_id, bool built_with_varity, string github_url, string[] screenshot_urls, string tier, string services) returns (uint64)',
            params: [
                {json.dumps(contract_params['name'])},
                {json.dumps(contract_params['description'])},
                {json.dumps(contract_params['appUrl'])},
                {json.dumps(contract_params['logoUrl'])},
                {json.dumps(contract_params['category'])},
                BigInt({contract_params['chainId']}),
                true,
                {json.dumps(contract_params['githubUrl'])},
                {json.dumps(contract_params['screenshots'])},
                {json.dumps(contract_params['tier'])},
                {json.dumps(contract_params['services'])}
            ]
        }});

        // Send transaction
        const receipt = await sendTransaction({{
            transaction,
            account
        }});

        // Parse app ID from transaction receipt
        // Note: This assumes the contract emits an event with the app ID
        const appId = receipt.logs && receipt.logs.length > 0
            ? parseInt(receipt.logs[0].topics[1] || '0', 16)
            : 0;

        console.log(JSON.stringify({{
            success: true,
            appId: appId,
            transactionHash: receipt.transactionHash
        }}));

    }} catch (error) {{
        console.log(JSON.stringify({{
            success: false,
            error: error.message
        }}));
        process.exit(1);
    }}
}}

submitApp();
"""

    def _generate_query_script(self, method: str, params: Dict[str, Any]) -> str:
        """
        Generate Node.js script for querying contract.

        Args:
            method: Contract method name
            params: Method parameters

        Returns:
            Node.js script content as string
        """
        return f"""
const {{ createThirdwebClient, getContract, readContract }} = require('thirdweb');

async function queryContract() {{
    try {{
        // Create thirdweb client
        const client = createThirdwebClient({{
            clientId: '{self.thirdweb_client_id}'
        }});

        // Get contract instance
        const contract = getContract({{
            client,
            chain: {{
                id: {self.network_config['chain_id']},
                rpc: '{self.network_config['rpc_url']}'
            }},
            address: '{self.contract_address}'
        }});

        // Read from contract
        const result = await readContract({{
            contract,
            method: 'function {method}(uint64 appId) view returns (tuple(uint64 id, address developer, string name, string description, string appUrl, string logoUrl, string githubUrl, string category, uint64 chainId, uint64 screenshotCount, bool isApproved, bool isActive, bool builtWithVarity, uint64 publishedAt))',
            params: [{params.get('appId', 0)}]
        }});

        console.log(JSON.stringify({{
            success: true,
            app: {{
                id: result.id,
                developer: result.developer,
                name: result.name,
                description: result.description,
                appUrl: result.appUrl,
                logoUrl: result.logoUrl,
                githubUrl: result.githubUrl,
                category: result.category,
                chainId: result.chainId,
                screenshotCount: result.screenshotCount,
                isApproved: result.isApproved,
                isActive: result.isActive,
                builtWithVarity: result.builtWithVarity,
                publishedAt: result.publishedAt
            }}
        }}));

    }} catch (error) {{
        console.log(JSON.stringify({{
            success: false,
            error: error.message
        }}));
        process.exit(1);
    }}
}}

queryContract();
"""

    def check_dependencies(self) -> Dict[str, bool]:
        """
        Check if all required dependencies are available.

        Returns:
            Dictionary with dependency status:
            {
                'node_installed': bool,
                'contract_address_set': bool,
                'signer_key_set': bool,
                'thirdweb_client_id_set': bool
            }
        """
        # Check Node.js installation
        node_installed = False
        try:
            result = subprocess.run(
                ["node", "--version"], capture_output=True, text=True, timeout=5
            )
            node_installed = result.returncode == 0
        except Exception:
            pass

        return {
            "node_installed": node_installed,
            "contract_address_set": bool(self.contract_address),
            "signer_key_set": bool(self.signer_key),
            "thirdweb_client_id_set": bool(self.thirdweb_client_id),
        }
