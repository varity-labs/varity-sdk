"""
Storage Operations Example

Demonstrates IPFS file upload, download, and pinning operations.
"""

import asyncio
import json
from pathlib import Path
from varity_client import VarityClient


async def main():
    """Storage operations examples."""
    print("=== Varity Client - Storage Operations ===\n")

    # Initialize client
    client = VarityClient(
        chain_id=33529,
        thirdweb_client_id="a35636133eb5ec6f30eb9f4c15fce2f3",
        ipfs_gateway="https://gateway.ipfscdn.io/ipfs/",
    )

    # 1. Upload string to IPFS
    print("1. Uploading string to IPFS...")
    try:
        content = "Hello, Varity IPFS Storage!"
        result = await client.storage.upload_to_ipfs(
            content=content, filename="hello.txt", pin=True
        )

        print(f"   Content: {content}")
        print(f"   CID: {result.cid}")
        print(f"   Size: {result.size} bytes")
        print(f"   Gateway URL: {result.gateway_url}")
        print(f"   Pinned: {result.pinned}\n")

        text_cid = result.cid
    except Exception as e:
        print(f"   Error: {e}\n")
        text_cid = None

    # 2. Upload bytes to IPFS
    print("2. Uploading bytes to IPFS...")
    try:
        content_bytes = b"Binary data content"
        result = await client.storage.upload_to_ipfs(
            content=content_bytes, filename="data.bin"
        )

        print(f"   Size: {result.size} bytes")
        print(f"   CID: {result.cid}")
        print(f"   URL: {result.gateway_url}\n")

        bytes_cid = result.cid
    except Exception as e:
        print(f"   Error: {e}\n")
        bytes_cid = None

    # 3. Upload JSON to IPFS
    print("3. Uploading JSON metadata to IPFS...")
    try:
        metadata = {
            "name": "Varity NFT",
            "description": "Example NFT metadata on Varity L3",
            "image": "ipfs://QmExample123...",
            "attributes": [
                {"trait_type": "Network", "value": "Varity L3"},
                {"trait_type": "Chain ID", "value": "33529"},
            ],
        }

        result = await client.storage.upload_json(metadata, pin=True)

        print(f"   Metadata: {json.dumps(metadata, indent=2)}")
        print(f"   CID: {result.cid}")
        print(f"   URL: {result.gateway_url}\n")

        json_cid = result.cid
    except Exception as e:
        print(f"   Error: {e}\n")
        json_cid = None

    # 4. Upload file from filesystem
    print("4. Uploading file from filesystem...")
    try:
        # Create temporary file
        temp_file = Path("/tmp/varity_test.txt")
        temp_file.write_text("Test file content for Varity IPFS")

        result = await client.storage.upload_file(str(temp_file), pin=True)

        print(f"   File: {temp_file}")
        print(f"   CID: {result.cid}")
        print(f"   Size: {result.size} bytes")
        print(f"   URL: {result.gateway_url}\n")

        file_cid = result.cid

        # Clean up
        temp_file.unlink()
    except Exception as e:
        print(f"   Error: {e}\n")
        file_cid = None

    # 5. Download from IPFS
    if text_cid:
        print("5. Downloading from IPFS...")
        try:
            content = await client.storage.download_from_ipfs(text_cid)
            print(f"   CID: {text_cid}")
            print(f"   Content: {content.decode('utf-8')}")
            print(f"   Size: {len(content)} bytes\n")
        except Exception as e:
            print(f"   Error: {e}\n")

    # 6. Download JSON from IPFS
    if json_cid:
        print("6. Downloading JSON from IPFS...")
        try:
            data = await client.storage.download_json(json_cid)
            print(f"   CID: {json_cid}")
            print(f"   Data: {json.dumps(data, indent=2)}\n")
        except Exception as e:
            print(f"   Error: {e}\n")

    # 7. Download to file
    if file_cid:
        print("7. Downloading to file...")
        try:
            output_path = "/tmp/varity_download.txt"
            await client.storage.download_from_ipfs(file_cid, output_path)

            downloaded_content = Path(output_path).read_text()
            print(f"   CID: {file_cid}")
            print(f"   Saved to: {output_path}")
            print(f"   Content: {downloaded_content}\n")

            # Clean up
            Path(output_path).unlink()
        except Exception as e:
            print(f"   Error: {e}\n")

    # 8. Get gateway URL
    print("8. Generating gateway URLs...")
    example_cid = "QmExample123456789"
    gateway_url = client.storage.get_gateway_url(example_cid)
    print(f"   CID: {example_cid}")
    print(f"   Gateway URL: {gateway_url}\n")

    # 9. Pin content
    print("9. Pinning content...")
    try:
        if text_cid:
            pinned = await client.storage.pin_content(text_cid)
            print(f"   CID: {text_cid}")
            print(f"   Pinned: {pinned}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 10. NFT metadata example
    print("10. Complete NFT metadata upload example...")
    try:
        # Upload image first (simulated)
        image_cid = "QmExampleImageCID123"

        # Create NFT metadata
        nft_metadata = {
            "name": "Varity Genesis NFT #1",
            "description": "First NFT on Varity L3 Testnet",
            "image": f"ipfs://{image_cid}",
            "external_url": "https://varity.io",
            "attributes": [
                {"trait_type": "Generation", "value": "Genesis"},
                {"trait_type": "Rarity", "value": "Legendary"},
                {"trait_type": "Network", "value": "Varity L3"},
            ],
        }

        # Upload metadata
        metadata_result = await client.storage.upload_json(nft_metadata)

        print(f"   NFT Metadata uploaded!")
        print(f"   Metadata CID: {metadata_result.cid}")
        print(f"   Metadata URI: ipfs://{metadata_result.cid}")
        print(f"   Gateway URL: {metadata_result.gateway_url}")
        print(f"   ")
        print(f"   Use this URI when minting NFT:")
        print(f"   tokenURI = 'ipfs://{metadata_result.cid}'\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 11. Storage best practices
    print("11. Storage Best Practices:")
    print("   ✅ Always pin important content")
    print("   ✅ Use IPFS for immutable content (images, metadata)")
    print("   ✅ Store large files directly on IPFS")
    print("   ✅ Use gateways with CDN for fast access")
    print("   ✅ Include Content-Type in metadata")
    print("   ✅ Verify CIDs before using in smart contracts")
    print("   ✅ Keep backup of important CIDs")
    print("   ✅ Use pinning services for production (Pinata, web3.storage)\n")

    # 12. Integration with smart contracts
    print("12. Smart Contract Integration:")
    print("   ")
    print("   # Upload NFT metadata")
    print("   metadata = await client.storage.upload_json(nft_data)")
    print("   ")
    print("   # Mint NFT with metadata URI")
    print("   tx_hash = await client.contracts.write_contract(")
    print("       contract_address,")
    print("       'mint',")
    print("       recipient_address,")
    print("       f'ipfs://{metadata.cid}'  # Token URI")
    print("   )")
    print()

    print("=== Storage Operations Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
