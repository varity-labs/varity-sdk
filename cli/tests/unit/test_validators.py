"""
Unit tests for validators
"""

import pytest
from varietykit.utils.validators import ConfigValidator, ValidationResult


class TestConfigValidator:
    """Test configuration validators"""

    def test_validate_project_name_valid(self):
        """Test valid project names"""
        valid_names = [
            "my-project",
            "finance-dashboard",
            "acme-bank-portal",
            "healthcare123",
        ]

        for name in valid_names:
            result = ConfigValidator.validate_project_name(name)
            assert result.passed, f"'{name}' should be valid"

    def test_validate_project_name_invalid(self):
        """Test invalid project names"""
        invalid_names = [
            "My-Project",  # Uppercase
            "-my-project",  # Starts with hyphen
            "my-project-",  # Ends with hyphen
            "my_project",  # Underscore
            "my project",  # Space
            "ab",  # Too short
            "a" * 51,  # Too long
        ]

        for name in invalid_names:
            result = ConfigValidator.validate_project_name(name)
            assert not result.passed, f"'{name}' should be invalid"

    def test_validate_api_key(self):
        """Test API key validation"""
        # Valid key (at least 32 characters)
        valid_key = "a" * 32
        result = ConfigValidator.validate_api_key(valid_key)
        assert result.passed

        # Invalid keys
        invalid_keys = ["", "short", "a" * 31]
        for key in invalid_keys:
            result = ConfigValidator.validate_api_key(key)
            assert not result.passed

    def test_validate_wallet_address(self):
        """Test wallet address validation"""
        # Valid Ethereum address
        valid_address = "0x" + "a" * 40
        result = ConfigValidator.validate_wallet_address(valid_address)
        assert result.passed

        # Invalid addresses
        invalid_addresses = [
            "",
            "0x123",  # Too short
            "0x" + "a" * 39,  # One char short
            "0x" + "g" * 40,  # Invalid hex
            "1x" + "a" * 40,  # Wrong prefix
        ]
        for address in invalid_addresses:
            result = ConfigValidator.validate_wallet_address(address)
            assert not result.passed


class TestValidationResult:
    """Test ValidationResult dataclass"""

    def test_validation_result_passed(self):
        """Test ValidationResult for passed validation"""
        result = ValidationResult(passed=True, message="All good")
        assert result.passed
        assert result.message == "All good"
        assert result.details is None

    def test_validation_result_failed(self):
        """Test ValidationResult for failed validation"""
        result = ValidationResult(
            passed=False,
            message="Validation failed",
            details="Missing required field"
        )
        assert not result.passed
        assert result.message == "Validation failed"
        assert result.details == "Missing required field"
