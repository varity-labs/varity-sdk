"""
SIWE Authentication Example

Demonstrates Sign-In with Ethereum authentication flow.
"""

import asyncio
import os
from varity_client import VarityClient


async def main():
    """SIWE authentication examples."""
    print("=== Varity Client - SIWE Authentication ===\n")

    # Initialize client with wallet
    private_key = os.getenv("PRIVATE_KEY") or "0x" + "0" * 64

    client = VarityClient(
        chain_id=33529,
        private_key=private_key,
        thirdweb_client_id="a35636133eb5ec6f30eb9f4c15fce2f3",
    )

    print(f"Connected address: {client.address}\n")

    # 1. Generate SIWE message
    print("1. Generating SIWE message...")
    try:
        message = await client.auth.generate_siwe_message(
            domain="app.varity.io",
            uri="https://app.varity.io",
            statement="Sign in to Varity L3 Dashboard",
            expiration_minutes=60,  # 1 hour
        )

        print(f"   Domain: {message.domain}")
        print(f"   Address: {message.address}")
        print(f"   Statement: {message.statement}")
        print(f"   Chain ID: {message.chain_id}")
        print(f"   Nonce: {message.nonce}")
        print(f"   Issued at: {message.issued_at}")
        print(f"   Expires at: {message.expiration_time}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
        return

    # 2. Sign SIWE message
    print("2. Signing SIWE message...")
    try:
        signature = await client.auth.sign_siwe_message(message)
        print(f"   Signature: {signature[:20]}...{signature[-10:]}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
        return

    # 3. Verify SIWE signature
    print("3. Verifying SIWE signature...")
    try:
        is_valid = await client.auth.verify_siwe_signature(message, signature)
        print(f"   Signature valid: {is_valid}\n")

        if not is_valid:
            print("   ❌ Signature verification failed!")
            return
        else:
            print("   ✅ Signature verified successfully!")
    except Exception as e:
        print(f"   Error: {e}\n")
        return

    # 4. Create session
    print("\n4. Creating authenticated session...")
    try:
        session = await client.auth.create_session(
            message=message,
            signature=signature,
            session_duration_minutes=1440,  # 24 hours
        )

        print(f"   Address: {session.address}")
        print(f"   Chain ID: {session.chain_id}")
        print(f"   Token: {session.token[:20]}...{session.token[-10:]}")
        print(f"   Expires at: {session.expires_at}")
        print(f"   (Timestamp: {session.expires_at})\n")
    except Exception as e:
        print(f"   Error: {e}\n")
        return

    # 5. Complete authentication flow (all-in-one)
    print("5. Complete authentication flow (all-in-one)...")
    try:
        session = await client.auth.authenticate(
            domain="app.varity.io",
            uri="https://app.varity.io",
            statement="Sign in to Varity L3 Dashboard",
            session_duration_minutes=1440,
        )

        print(f"   ✅ Authentication successful!")
        print(f"   Address: {session.address}")
        print(f"   Token: {session.token[:20]}...{session.token[-10:]}")
        print(f"   Use this token for API authentication\n")

        # Example: Using token in API requests
        print("   Example API request with token:")
        print(f"   curl -H 'Authorization: Bearer {session.token}' \\")
        print(f"        https://api.varity.io/v1/user/profile\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 6. SIWE best practices
    print("6. SIWE Best Practices:")
    print("   ✅ Always verify signature server-side")
    print("   ✅ Check message expiration time")
    print("   ✅ Validate domain and URI match your app")
    print("   ✅ Store nonce to prevent replay attacks")
    print("   ✅ Use HTTPS for all authentication endpoints")
    print("   ✅ Set appropriate session expiration times")
    print("   ✅ Implement refresh token mechanism for long sessions\n")

    # 7. Integration with backend
    print("7. Backend Integration Example:")
    print("   ")
    print("   # FastAPI endpoint example")
    print("   @app.post('/auth/siwe')")
    print("   async def siwe_auth(message: SIWEMessage, signature: str):")
    print("       # Verify signature")
    print("       client = VarityClient()")
    print("       is_valid = await client.auth.verify_siwe_signature(")
    print("           message, signature")
    print("       )")
    print("       ")
    print("       if not is_valid:")
    print("           raise HTTPException(401, 'Invalid signature')")
    print("       ")
    print("       # Create session")
    print("       session = await client.auth.create_session(")
    print("           message, signature")
    print("       )")
    print("       ")
    print("       return {'token': session.token}")
    print()

    print("=== SIWE Authentication Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
