// Contract addresses on Base
export const CONTRACTS = {
  // Base Mainnet
  base: {
    // AAVE V3 on Base
    AAVE_POOL: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as const,
    AAVE_POOL_DATA_PROVIDER: "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac" as const,
    AAVE_ORACLE: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156" as const,
    
    // Tokens
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
    WETH: "0x4200000000000000000000000000000000000006" as const,
    cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" as const,
    cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22" as const,
    WBTC: "0x29f2D40B0605204364c54D4cEE5132adD012B9C2" as const, // WBTC on Base (not used on mainnet, we use cbBTC)
    
    // Uniswap V3 Router (SwapRouter02 on Base)
    UNISWAP_ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481" as const, // Uniswap V3 SwapRouter02 on Base
    
    // Multicall3 for batching transactions
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11" as const, // Multicall3 (same address on all chains)
    
    // AAVE aTokens (supply receipts)
    aUSDC: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB" as const,
    aWETH: "0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7" as const,
    
    // AAVE debt tokens
    variableDebtUSDC: "0x59dca05b6c26dbd64b5381374aAaC5CD05644C28" as const,
  },
  
  // Base Sepolia (Testnet)
  baseSepolia: {
    // AAVE V3 on Base Sepolia
    AAVE_POOL: "0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b" as const,
    AAVE_POOL_DATA_PROVIDER: "0x80437f5E6332a669d3B7B2D874A9A9C1a5b85126" as const,
    AAVE_ORACLE: "0x2Da88497588bF89281816106C7259e31AF45a663" as const,
    
    // Tokens (Testnet versions)
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const,
    WETH: "0x4200000000000000000000000000000000000006" as const,
    WBTC: "0x54114591963CF60EF3aA63bEfD6eC263D98145a4" as const, // WBTC on Base Sepolia (from Aave)
    cbETH: "0xD171b9694f7A2597Ed006D41f7509aaD4B485c4B" as const, // cbETH on Base Sepolia (from Aave)
    
    // Uniswap V3 Router (SwapRouter02 on Base Sepolia)
    UNISWAP_ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481" as const, // Uniswap V3 SwapRouter02 on Base Sepolia
    
    // Multicall3 for batching transactions
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11" as const, // Multicall3 (same address on all chains)
    
    // AAVE aTokens
    aUSDC: "0x460b97BD498E1157530AEb3086301d5225b91216" as const,
    aWETH: "0x96e32dD09Ff875E27AB1C7aF3D8a28D5c58aFe0e" as const,
    
    // AAVE debt tokens  
    variableDebtUSDC: "0xCa5C1417B5cdD75A001BA67A5bC1f6Dcb82E1Dd5" as const,
  },
} as const;

// Token metadata
export const TOKENS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    icon: "$",
    color: "#2775CA",
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    icon: "Ξ",
    color: "#627EEA",
  },
  cbBTC: {
    symbol: "cbBTC",
    name: "Coinbase Wrapped BTC",
    decimals: 8,
    icon: "₿",
    color: "#F7931A",
  },
  cbETH: {
    symbol: "cbETH",
    name: "Coinbase Wrapped Staked ETH",
    decimals: 18,
    icon: "Ξ",
    color: "#627EEA",
  },
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    icon: "₿",
    color: "#F7931A",
  },
} as const;

// ABIs (minimal for the functions we need)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

export const AAVE_POOL_ABI = [
  // Supply
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Withdraw
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Borrow
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "referralCode", type: "uint16" },
      { name: "onBehalfOf", type: "address" },
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Repay
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
    ],
    name: "repay",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Get user account data
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const AAVE_DATA_PROVIDER_ABI = [
  // Get user reserve data
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "user", type: "address" },
    ],
    name: "getUserReserveData",
    outputs: [
      { name: "currentATokenBalance", type: "uint256" },
      { name: "currentStableDebt", type: "uint256" },
      { name: "currentVariableDebt", type: "uint256" },
      { name: "principalStableDebt", type: "uint256" },
      { name: "scaledVariableDebt", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "stableRateLastUpdated", type: "uint40" },
      { name: "usageAsCollateralEnabled", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Get reserve data
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      { name: "unbacked", type: "uint256" },
      { name: "accruedToTreasuryScaled", type: "uint256" },
      { name: "totalAToken", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Helper to get contracts for a specific chain
export function getContracts(chainId: number) {
  switch (chainId) {
    case 8453: // Base Mainnet
      return CONTRACTS.base;
    case 84532: // Base Sepolia
      return CONTRACTS.baseSepolia;
    default:
      return CONTRACTS.baseSepolia; // Default to testnet
  }
}

