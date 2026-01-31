"""
Varity Thirdweb Python Client Setup

Comprehensive blockchain client for Varity L3 with Thirdweb SDK integration.
"""

from setuptools import setup, find_packages

with open("README_THIRDWEB.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="varity-thirdweb-client",
    version="1.0.0",
    author="Varity",
    author_email="support@varity.io",
    description="Comprehensive Python client for Varity L3 blockchain with Thirdweb SDK",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/varity/client-python",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        # Web3 and blockchain libraries
        "web3>=6.0.0,<7.0.0",
        "eth-account>=0.8.0,<1.0.0",
        "eth-utils>=2.0.0,<3.0.0",
        "eth-typing>=3.0.0,<4.0.0",

        # Async support
        "aiohttp>=3.8.0,<4.0.0",
        "asyncio>=3.4.3",

        # SIWE authentication
        "siwe>=3.0.0,<4.0.0",

        # IPFS and storage
        "ipfshttpclient>=0.8.0a2",

        # Utilities
        "python-dotenv>=1.0.0",
        "requests>=2.31.0",
        "pydantic>=2.0.0,<3.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "pytest-asyncio>=0.21.0",
            "pytest-mock>=3.11.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
            "types-requests>=2.31.0",
            "sphinx>=7.0.0",
            "sphinx-rtd-theme>=1.3.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "varity-thirdweb=varity_client.cli:main",
        ],
    },
)
