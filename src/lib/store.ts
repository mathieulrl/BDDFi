import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface CryptoAsset {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  allocation: number;
  price: number;
  amount: number;
  valueUSD: number;
}

export interface DCAConfig {
  amount: number;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  allocations: { [symbol: string]: number };
  isActive: boolean;
  nextPurchaseDate: Date | null;
}

export interface BorrowPosition {
  collateralValueUSD: number;
  borrowedValueUSD: number;
  healthFactor: number;
  ltv: number;
  interestRate: number;
  interestAccrued: number;
}

export interface Transaction {
  id: string;
  type: "deposit" | "borrow" | "repay" | "withdraw" | "dca";
  amount: number;
  asset: string;
  timestamp: Date;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
}

interface AppState {
  // Portfolio
  portfolio: CryptoAsset[];
  totalPortfolioValue: number;
  
  // DCA
  dcaConfig: DCAConfig;
  
  // Borrowing
  borrowPosition: BorrowPosition;
  
  // Transactions
  transactions: Transaction[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPortfolio: (assets: CryptoAsset[]) => void;
  updateAssetPrice: (symbol: string, price: number) => void;
  setDCAConfig: (config: Partial<DCAConfig>) => void;
  setBorrowPosition: (position: Partial<BorrowPosition>) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransactionStatus: (id: string, status: Transaction["status"], txHash?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const defaultCryptoAssets: CryptoAsset[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "₿",
    color: "#F7931A",
    allocation: 40,
    price: 67500,
    amount: 0,
    valueUSD: 0,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "Ξ",
    color: "#627EEA",
    allocation: 40,
    price: 3450,
    amount: 0,
    valueUSD: 0,
  },
  {
    symbol: "SOL",
    name: "Solana",
    icon: "◎",
    color: "#14F195",
    allocation: 20,
    price: 185,
    amount: 0,
    valueUSD: 0,
  },
];

const defaultDCAConfig: DCAConfig = {
  amount: 500,
  frequency: "weekly",
  allocations: {
    BTC: 40,
    ETH: 40,
    SOL: 20,
  },
  isActive: false,
  nextPurchaseDate: null,
};

const defaultBorrowPosition: BorrowPosition = {
  collateralValueUSD: 0,
  borrowedValueUSD: 0,
  healthFactor: Infinity,
  ltv: 50,
  interestRate: 4.2,
  interestAccrued: 0,
};

const initialState = {
  portfolio: defaultCryptoAssets,
  totalPortfolioValue: 0,
  dcaConfig: defaultDCAConfig,
  borrowPosition: defaultBorrowPosition,
  transactions: [],
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPortfolio: (assets) => {
        const totalValue = assets.reduce((sum, asset) => sum + asset.valueUSD, 0);
        set({ portfolio: assets, totalPortfolioValue: totalValue });
      },

      updateAssetPrice: (symbol, price) => {
        const portfolio = get().portfolio.map((asset) => {
          if (asset.symbol === symbol) {
            return {
              ...asset,
              price,
              valueUSD: asset.amount * price,
            };
          }
          return asset;
        });
        const totalValue = portfolio.reduce((sum, asset) => sum + asset.valueUSD, 0);
        set({ portfolio, totalPortfolioValue: totalValue });
      },

      setDCAConfig: (config) => {
        set({ dcaConfig: { ...get().dcaConfig, ...config } });
      },

      setBorrowPosition: (position) => {
        const currentPosition = get().borrowPosition;
        const newPosition = { ...currentPosition, ...position };
        
        // Calculate health factor
        if (newPosition.borrowedValueUSD > 0) {
          newPosition.healthFactor = 
            (newPosition.collateralValueUSD * 0.8) / newPosition.borrowedValueUSD;
        } else {
          newPosition.healthFactor = Infinity;
        }
        
        set({ borrowPosition: newPosition });
      },

      addTransaction: (tx) => {
        set({ transactions: [tx, ...get().transactions] });
      },

      updateTransactionStatus: (id, status, txHash) => {
        const transactions = get().transactions.map((tx) => {
          if (tx.id === id) {
            return { ...tx, status, txHash: txHash || tx.txHash };
          }
          return tx;
        });
        set({ transactions });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      resetState: () => set(initialState),
    }),
    {
      name: "bbdfi-storage",
      partialize: (state) => ({
        dcaConfig: state.dcaConfig,
        borrowPosition: state.borrowPosition,
      }),
    }
  )
);

// Selectors
export const selectTotalCollateral = (state: AppState) => 
  state.borrowPosition.collateralValueUSD;

export const selectAvailableToBorrow = (state: AppState) => 
  state.borrowPosition.collateralValueUSD * 0.8 - state.borrowPosition.borrowedValueUSD;

export const selectHealthFactor = (state: AppState) => 
  state.borrowPosition.healthFactor;

export const selectIsPositionSafe = (state: AppState) => 
  state.borrowPosition.healthFactor > 1.5;

