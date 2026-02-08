#!/usr/bin/env python3
"""
Test script for Phase 3: CLI Database Integration

Tests credential generation and database feature detection.
"""
import sys
import os
from pathlib import Path

# Add varietykit to path
sys.path.insert(0, str(Path(__file__).parent))

def test_credential_generation():
    """Test app ID and JWT generation"""
    print("="*60)
    print("Testing Credential Generation")
    print("="*60)

    from varietykit.services.credentials import (
        generate_app_id,
        generate_jwt_token,
        generate_app_credentials,
        verify_jwt_token
    )

    # Test app ID generation
    print("\n1. Testing App ID Generation...")
    app_id = generate_app_id()
    print(f"   Generated: {app_id}")
    assert app_id.startswith("app_"), "App ID should start with 'app_'"
    assert len(app_id) == 20, f"App ID should be 20 chars, got {len(app_id)}"
    print("   ✅ PASS")

    # Test JWT generation
    print("\n2. Testing JWT Token Generation...")
    token = generate_jwt_token(app_id)
    print(f"   Generated token (truncated): {token[:50]}...")
    assert len(token) > 50, "Token should be reasonably long"
    print("   ✅ PASS")

    # Test JWT verification
    print("\n3. Testing JWT Verification...")
    payload = verify_jwt_token(token)
    assert payload is not None, "Token should be valid"
    assert payload['appId'] == app_id, "Token should contain correct appId"
    assert payload['iss'] == 'varity.so', "Token should have correct issuer"
    print(f"   Decoded appId: {payload['appId']}")
    print(f"   Issuer: {payload['iss']}")
    print("   ✅ PASS")

    # Test full credentials generation
    print("\n4. Testing Full Credentials Generation...")
    creds = generate_app_credentials()
    print(f"   App ID: {creds['app_id']}")
    print(f"   Token: {creds['jwt_token'][:50]}...")
    print(f"   Proxy URL: {creds['db_proxy_url']}")
    print(f"   Expires: {creds['expires_days']} days")
    assert 'app_id' in creds, "Should have app_id"
    assert 'jwt_token' in creds, "Should have jwt_token"
    assert 'db_proxy_url' in creds, "Should have db_proxy_url"
    print("   ✅ PASS")

    print("\n" + "="*60)
    print("✅ All credential tests PASSED!")
    print("="*60)


def test_database_detection():
    """Test database usage detection"""
    print("\n" + "="*60)
    print("Testing Database Detection")
    print("="*60)

    from varietykit.utils.code_analyzer import detect_database_usage, detect_features
    import tempfile
    import shutil

    # Create temporary test project
    with tempfile.TemporaryDirectory() as tmpdir:
        print(f"\n1. Testing detection in temp project: {tmpdir}")

        # Test file WITH database import
        test_file_with_db = Path(tmpdir) / "App.tsx"
        test_file_with_db.write_text("""
import React from 'react';
import { db } from '@varity/sdk';

export default function App() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        db.collection('products').get().then(setProducts);
    }, []);

    return <div>{products.length} products</div>;
}
""")

        # Test detection
        uses_db = detect_database_usage(tmpdir)
        print(f"   Database usage detected: {uses_db}")
        assert uses_db == True, "Should detect database usage"
        print("   ✅ PASS: Detected db import")

        # Test file WITHOUT database import
        test_file_with_db.write_text("""
import React from 'react';

export default function App() {
    return <div>Hello World</div>;
}
""")

        uses_db = detect_database_usage(tmpdir)
        print(f"\n2. Testing detection without db import...")
        print(f"   Database usage detected: {uses_db}")
        assert uses_db == False, "Should NOT detect database usage"
        print("   ✅ PASS: No db import detected")

        # Test features detection
        print("\n3. Testing full features detection...")
        test_file_with_db.write_text("""
import { db, auth } from '@varity/sdk';
""")

        features = detect_features(tmpdir)
        print(f"   Features detected: {features}")
        assert features['database'] == True, "Should detect database"
        print("   ✅ PASS: Features detection working")

    print("\n" + "="*60)
    print("✅ All detection tests PASSED!")
    print("="*60)


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("PHASE 3: CLI Database Integration - Test Suite")
    print("="*60 + "\n")

    try:
        # Test 1: Credential Generation
        test_credential_generation()

        # Test 2: Database Detection
        test_database_detection()

        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED! Phase 3 Implementation Complete!")
        print("="*60 + "\n")

        print("✅ Credential generation: WORKING")
        print("✅ JWT token generation: WORKING")
        print("✅ Database detection: WORKING")
        print("✅ Feature detection: WORKING")

        print("\nNext Steps:")
        print("  1. Test with real app deployment")
        print("  2. Deploy database proxy to production")
        print("  3. Run end-to-end integration test")

        return 0

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
