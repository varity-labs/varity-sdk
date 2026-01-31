package thirdweb

// Predefined chain configurations

// VarityL3Testnet is the Varity L3 Testnet configuration
var VarityL3Testnet = ChainConfig{
	ChainID: 33529,
	Name:    "Varity L3 Testnet",
	NativeCurrency: Currency{
		Name:     "USDC",
		Symbol:   "USDC",
		Decimals: 6,
	},
	RPCUrls: []string{
		"https://rpc-varity-l3-testnet-33529-czcj67dz6a.t.conduit.xyz",
	},
	BlockExplorerUrls: []string{
		"https://explorerl2new-varity-l3-testnet-33529-czcj67dz6a.t.conduit.xyz",
	},
	Testnet: true,
}

// ArbitrumSepolia is the Arbitrum Sepolia testnet configuration
var ArbitrumSepolia = ChainConfig{
	ChainID: 421614,
	Name:    "Arbitrum Sepolia",
	NativeCurrency: Currency{
		Name:     "Ethereum",
		Symbol:   "ETH",
		Decimals: 18,
	},
	RPCUrls: []string{
		"https://sepolia-rollup.arbitrum.io/rpc",
	},
	BlockExplorerUrls: []string{
		"https://sepolia.arbiscan.io",
	},
	Testnet: true,
}

// GetChainByID returns a chain configuration by chain ID
func GetChainByID(chainID int64) *ChainConfig {
	switch chainID {
	case 33529:
		return &VarityL3Testnet
	case 421614:
		return &ArbitrumSepolia
	default:
		return nil
	}
}

// GetChainByName returns a chain configuration by name
func GetChainByName(name string) *ChainConfig {
	switch name {
	case "varity-l3-testnet", "varity", "varity-testnet":
		return &VarityL3Testnet
	case "arbitrum-sepolia", "arb-sepolia":
		return &ArbitrumSepolia
	default:
		return nil
	}
}

// SupportedChains returns all supported chain configurations
func SupportedChains() []ChainConfig {
	return []ChainConfig{
		VarityL3Testnet,
		ArbitrumSepolia,
	}
}
