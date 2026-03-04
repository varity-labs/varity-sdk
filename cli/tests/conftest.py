"""
pytest configuration and shared fixtures for VarityKit tests
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, MagicMock
from click.testing import CliRunner
import tempfile
import shutil


@pytest.fixture
def cli_runner():
    """Click CLI test runner"""
    return CliRunner()


@pytest.fixture
def temp_dir():
    """Temporary directory for test isolation"""
    temp_path = tempfile.mkdtemp()
    yield Path(temp_path)
    shutil.rmtree(temp_path)


@pytest.fixture
def mock_ai_engine():
    """Mock AI configuration engine for testing"""
    engine = Mock()

    # Mock analyze_requirements response
    engine.analyze_requirements.return_value = {
        'recommended_components': [
            'Dashboard',
            'DataTable',
            'ChartWidget',
            'FilterPanel'
        ],
        'recommended_pages': [
            'HomePage',
            'AnalyticsPage',
            'SettingsPage'
        ],
        'tech_stack': {
            'framework': 'React 18',
            'styling': 'Tailwind CSS',
            'state': 'Context API',
            'testing': 'Jest + RTL'
        },
        'integrations': ['Varity API', 'Web3', 'Analytics'],
        'estimated_complexity': 'medium'
    }

    # Mock component generation
    engine.generate_component_code.return_value = {
        'tsx': 'export default function Component() { return <div>Component</div>; }',
        'test': 'describe("Component", () => { test("renders", () => {}); });',
        'types': 'export interface Props { id: string; }'
    }

    return engine


@pytest.fixture
def mock_varity_api():
    """Mock Varity API responses"""
    api = Mock()

    # Mock marketplace API
    api.publish_template.return_value = {
        'success': True,
        'template_id': 'tmpl_12345',
        'contract_address': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        'marketplace_url': 'https://marketplace.varity.ai/templates/tmpl_12345'
    }

    api.search_templates.return_value = {
        'templates': [
            {
                'id': 'tmpl_001',
                'name': 'finance-dashboard',
                'price': 299,
                'quality_score': 94,
                'downloads': 142
            },
            {
                'id': 'tmpl_002',
                'name': 'healthcare-portal',
                'price': 449,
                'quality_score': 96,
                'downloads': 87
            }
        ],
        'total': 2
    }

    api.install_template.return_value = {
        'success': True,
        'repository': 'https://github.com/varity-templates/finance-dashboard',
        'tx_hash': '0xabc123...'
    }

    return api


@pytest.fixture
def mock_web3():
    """Mock Web3 provider for blockchain operations"""
    web3 = Mock()

    # Mock contract deployment
    web3.eth.contract.return_value.constructor.return_value.build_transaction.return_value = {
        'from': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        'nonce': 0,
        'gas': 2000000,
        'gasPrice': 20000000000
    }

    web3.eth.account.sign_transaction.return_value.rawTransaction = b'0x...'
    web3.eth.send_raw_transaction.return_value = b'0xabc123...'
    web3.eth.wait_for_transaction_receipt.return_value = MagicMock(
        contractAddress='0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        status=1
    )

    return web3


@pytest.fixture
def sample_template_config():
    """Sample template configuration for testing"""
    return {
        'name': 'test-legal-template',
        'industry': 'legal',
        'features_description': 'case management, billing, document vault',
        'company_size': 'medium',
        'ai_features': ['chatbot', 'document-analysis'],
        'integrations': ['payment-gateway', 'calendar'],
        'compliance': ['GDPR', 'attorney-client-privilege']
    }


@pytest.fixture
def sample_template_structure():
    """Sample generated template structure"""
    return {
        'name': 'test-legal-template',
        'components': [
            {
                'name': 'CaseManager',
                'type': 'container',
                'path': 'src/components/CaseManager',
                'dependencies': ['DataTable', 'FilterPanel']
            },
            {
                'name': 'ClientBilling',
                'type': 'page',
                'path': 'src/pages/ClientBilling',
                'dependencies': ['PaymentForm', 'InvoiceTable']
            },
            {
                'name': 'DocumentVault',
                'type': 'feature',
                'path': 'src/components/DocumentVault',
                'dependencies': ['FileUpload', 'DocumentList']
            }
        ],
        'pages': [
            'HomePage',
            'CasesPage',
            'BillingPage',
            'DocumentsPage',
            'SettingsPage'
        ],
        'routes': [
            {'path': '/', 'component': 'HomePage'},
            {'path': '/cases', 'component': 'CasesPage'},
            {'path': '/billing', 'component': 'BillingPage'},
            {'path': '/documents', 'component': 'DocumentsPage'}
        ]
    }


@pytest.fixture
def sample_marketplace_listing():
    """Sample marketplace template listing"""
    return {
        'name': 'finance-dashboard-pro',
        'description': 'Professional finance dashboard with real-time analytics',
        'price': 299,
        'license': 'commercial',
        'category': 'finance',
        'quality_score': 94,
        'test_coverage': 89,
        'repository': 'https://github.com/user/finance-dashboard-pro',
        'demo_url': 'https://demo.varity.ai/finance-dashboard-pro',
        'tags': ['finance', 'analytics', 'dashboard', 'real-time'],
        'features': [
            'Real-time transaction monitoring',
            'Fraud detection',
            'AML compliance',
            'Risk analytics'
        ]
    }


@pytest.fixture
def mock_github_api():
    """Mock GitHub API for repository operations"""
    github = Mock()

    # Mock repo creation
    github.create_repo.return_value = {
        'success': True,
        'url': 'https://github.com/user/test-template',
        'clone_url': 'https://github.com/user/test-template.git'
    }

    # Mock repo validation
    github.check_repo_exists.return_value = True

    return github


@pytest.fixture
def mock_logger():
    """Mock logger for testing"""
    logger = Mock()
    logger.info = Mock()
    logger.debug = Mock()
    logger.warning = Mock()
    logger.error = Mock()
    return logger


@pytest.fixture
def mock_console():
    """Mock Rich console for testing"""
    console = Mock()
    console.print = Mock()
    return console


# Pytest markers for test categorization
def pytest_configure(config):
    """Register custom pytest markers"""
    config.addinivalue_line(
        "markers", "unit: Unit tests for individual components"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests for workflows"
    )
    config.addinivalue_line(
        "markers", "e2e: End-to-end tests for complete user journeys"
    )
    config.addinivalue_line(
        "markers", "slow: Tests that take longer than 1 second"
    )
    config.addinivalue_line(
        "markers", "requires_network: Tests that require network access"
    )
    config.addinivalue_line(
        "markers", "requires_blockchain: Tests that require blockchain connection"
    )
