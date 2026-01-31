"""
Varity Python Client Setup
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="varity-client",
    version="1.0.0",
    author="Varity",
    author_email="support@varity.io",
    description="Python client library for Varity's decentralized storage infrastructure",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/varity/client-python",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "boto3>=1.28.0",
        "botocore>=1.31.0",
        "requests>=2.31.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
            "types-requests>=2.31.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "varity=varity.cli:main",
        ],
    },
)
