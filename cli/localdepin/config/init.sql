-- LocalDePin PostgreSQL Initialization Script
-- Creates necessary schemas and tables for Varity L3 indexer

-- Create schemas
CREATE SCHEMA IF NOT EXISTS varity;
CREATE SCHEMA IF NOT EXISTS indexer;

-- Set default schema
SET search_path TO varity, public;

-- Create deployments table
CREATE TABLE IF NOT EXISTS varity.deployments (
    id SERIAL PRIMARY KEY,
    deployment_id VARCHAR(255) UNIQUE NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    template_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP,
    contract_address VARCHAR(66),
    ipfs_cid VARCHAR(255),
    celestia_blob_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create storage table (3-layer architecture tracking)
CREATE TABLE IF NOT EXISTS varity.storage (
    id SERIAL PRIMARY KEY,
    storage_layer VARCHAR(50) NOT NULL, -- 'layer1', 'layer2', 'layer3'
    namespace VARCHAR(255) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    encrypted BOOLEAN DEFAULT true,
    lit_protocol_conditions JSONB,
    celestia_blob_id VARCHAR(255),
    celestia_height BIGINT,
    company_id VARCHAR(255),
    industry VARCHAR(100),
    uploaded_by VARCHAR(66), -- Ethereum address
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS indexer.transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    from_address VARCHAR(66) NOT NULL,
    to_address VARCHAR(66),
    value NUMERIC(78, 0) NOT NULL,
    gas_used BIGINT,
    gas_price NUMERIC(78, 0),
    input_data TEXT,
    status BOOLEAN,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS indexer.blocks (
    id SERIAL PRIMARY KEY,
    block_number BIGINT UNIQUE NOT NULL,
    block_hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    gas_used BIGINT,
    gas_limit BIGINT,
    miner VARCHAR(66),
    difficulty NUMERIC(78, 0),
    total_difficulty NUMERIC(78, 0),
    size BIGINT,
    tx_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS indexer.contracts (
    id SERIAL PRIMARY KEY,
    address VARCHAR(66) UNIQUE NOT NULL,
    creator VARCHAR(66) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    bytecode TEXT,
    abi JSONB,
    verified BOOLEAN DEFAULT false,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS indexer.events (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(66) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_signature VARCHAR(66) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployments_company_id ON varity.deployments(company_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON varity.deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_industry ON varity.deployments(industry);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON varity.deployments(created_at);

CREATE INDEX IF NOT EXISTS idx_storage_layer ON varity.storage(storage_layer);
CREATE INDEX IF NOT EXISTS idx_storage_namespace ON varity.storage(namespace);
CREATE INDEX IF NOT EXISTS idx_storage_company_id ON varity.storage(company_id);
CREATE INDEX IF NOT EXISTS idx_storage_industry ON varity.storage(industry);
CREATE INDEX IF NOT EXISTS idx_storage_ipfs_cid ON varity.storage(ipfs_cid);
CREATE INDEX IF NOT EXISTS idx_storage_created_at ON varity.storage(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON indexer.transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON indexer.transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON indexer.transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON indexer.transactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_blocks_block_number ON indexer.blocks(block_number);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON indexer.blocks(timestamp);

CREATE INDEX IF NOT EXISTS idx_contracts_address ON indexer.contracts(address);
CREATE INDEX IF NOT EXISTS idx_contracts_creator ON indexer.contracts(creator);

CREATE INDEX IF NOT EXISTS idx_events_contract_address ON indexer.events(contract_address);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON indexer.events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_block_number ON indexer.events(block_number);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON indexer.events(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for deployments
CREATE TRIGGER update_deployments_updated_at
    BEFORE UPDATE ON varity.deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO varity.deployments (deployment_id, company_id, company_name, industry, status, template_version)
VALUES
    ('deploy-001', 'merchant-001', 'Acme Payments', 'iso-merchant', 'completed', '1.0.0'),
    ('deploy-002', 'merchant-002', 'Global Finance', 'finance', 'running', '1.0.0'),
    ('deploy-003', 'merchant-003', 'HealthCare Plus', 'healthcare', 'pending', '1.0.0')
ON CONFLICT (deployment_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA varity TO varity;
GRANT ALL PRIVILEGES ON SCHEMA indexer TO varity;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA varity TO varity;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA indexer TO varity;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA varity TO varity;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA indexer TO varity;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'LocalDePin database initialized successfully!';
    RAISE NOTICE 'Schemas created: varity, indexer';
    RAISE NOTICE 'Tables created: deployments, storage, transactions, blocks, contracts, events';
END $$;
