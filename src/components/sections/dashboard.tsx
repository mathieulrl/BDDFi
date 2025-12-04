"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { CardContent, CardHeader, CardTitle, GlassCard, StatsCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { HealthFactorGauge } from "@/components/ui/progress";
import { useAccount, useBalance, useChainId, useSendTransaction, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { 
  ConnectWallet, 
  Wallet,
} from "@coinbase/onchainkit/wallet";
import {
  Address as OnchainAddress,
  Avatar,
  Name,
  Identity,
} from "@coinbase/onchainkit/identity";
import {
  Wallet as WalletIcon,
  TrendingUp,
  ArrowDownUp,
  Landmark,
  DollarSign,
  Coins,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, calculateHealthFactor, shortenAddress } from "@/lib/utils";
import { useUserAccountData, useApprove, useSupply } from "@/hooks/useAave";
import { useOnchainKitSwap } from "@/hooks/useOnchainKitSwap";
import { usePrices } from "@/hooks/usePrices";
import { getContracts } from "@/lib/contracts";

// cryptoAssets is now defined inside DashboardSection component based on network

const dcaFrequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
];

// Shared Asset Allocation Component
interface AssetAllocationProps {
  allocations: number[];
  onAllocationsChange: (allocations: number[]) => void;
  prices: { BTC: number; ETH: number };
  editable?: boolean;
  depositAmount?: string;
  cryptoAssets: Array<{ symbol: string; name: string; icon: string; color: string; allocation: number; apy: number }>;
}

function AssetAllocation({ 
  allocations, 
  onAllocationsChange, 
  prices, 
  editable = true,
  depositAmount,
  cryptoAssets
}: AssetAllocationProps) {
  const total = allocations.reduce((a, b) => a + b, 0);
  const isValid = total === 100;

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">
        Asset Allocation
      </label>
      {cryptoAssets.map((asset, index) => {
        const allocation = allocations[index];
        const amount = depositAmount ? (parseFloat(depositAmount) * allocation) / 100 : 0;
        const price = prices[asset.symbol as keyof typeof prices] || 1;
        const cryptoAmount = amount / price;

        return (
          <div key={asset.symbol} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${asset.color}20`, color: asset.color }}
                >
                  {asset.icon}
                </div>
                <span className="font-medium">{asset.symbol}</span>
                {editable && (
                  <span className="text-xs text-muted-foreground">
                    ${formatNumber(price)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-medium">{allocation}%</span>
                {depositAmount && amount > 0 && (
                  <>
                    <div className="font-medium text-xs mt-0.5">
                      {cryptoAmount.toFixed(6)} {asset.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ ${amount.toFixed(2)}
                    </div>
                  </>
                )}
              </div>
            </div>
            {editable ? (
              <Slider
                value={[allocation]}
                max={100}
                step={5}
                onValueChange={(value) => {
                  const newAllocations = [...allocations];
                  newAllocations[index] = value[0];
                  onAllocationsChange(newAllocations);
                }}
                className="[&_[role=slider]]:bg-white"
              />
            ) : (
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${allocation}%`,
                    backgroundColor: asset.color,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      {editable && (
        <div className={cn(
          "flex items-center gap-2 text-sm p-2 rounded-lg",
          isValid
            ? "bg-green-500/10 text-green-400" 
            : "bg-yellow-500/10 text-yellow-400"
        )}>
          {isValid ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
          Total: {total}%
          {!isValid && " (should equal 100%)"}
        </div>
      )}
    </div>
  );
}

export function DashboardSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [mounted, setMounted] = useState(false);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { getPrice } = usePrices();
  const isMainnet = chainId === 8453; // Base Mainnet
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Update crypto assets based on network
  const cryptoAssets = [
    { 
      symbol: "BTC", 
      name: isMainnet ? "Coinbase Wrapped BTC (cbBTC)" : "Wrapped Bitcoin (WBTC)", 
      icon: "₿",
      color: "#F7931A",
      allocation: 50,
      apy: 0.5,
    },
    { 
      symbol: "ETH", 
      name: "Coinbase Wrapped ETH (cbETH)", 
      icon: "Ξ",
      color: "#627EEA",
      allocation: 50,
      apy: 2.1,
    },
  ];
  
  // Get contracts for current chain (default to baseSepolia for SSR)
  const contracts = getContracts(mounted ? chainId : 84532);
  
  // AAVE data
  const { data: aaveData, isLoading: aaveLoading } = useUserAccountData();
  
  // USDC Balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: contracts.USDC,
  });
  // OnchainKit swap + Aave deposit helpers
  const { getSwapTransaction } = useOnchainKitSwap();
  const { sendTransactionAsync, isPending: isSendingTx } = useSendTransaction();
  const { approve } = useApprove();
  const { supply } = useSupply();
  
  // Local state
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [dcaAmount, setDcaAmount] = useState("500");
  const [dcaFrequency, setDcaFrequency] = useState("weekly");
  const [ltv, setLtv] = useState([50]);
  const [dcaAllocations, setDcaAllocations] = useState([50, 50]);
  const [quickDepositAllocations, setQuickDepositAllocations] = useState([50, 50]);
  const [copied, setCopied] = useState(false);
  const [isDCAActive, setIsDCAActive] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // Read cbBTC / WBTC and cbETH balances for deposit step (uses current chain)
  const tokenAddressesForBalances = [
    isMainnet ? (contracts as any).cbBTC : (contracts as any).WBTC,
    (contracts as any).cbETH,
  ].filter(Boolean) as `0x${string}`[];

  const { data: tokenBalances } = useReadContracts({
    contracts: tokenAddressesForBalances.map((addr) => ({
      address: addr,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "balance", type: "uint256" }],
        },
      ] as const,
      functionName: "balanceOf",
      args: [address || "0x0000000000000000000000000000000000000000"],
    })),
    query: {
      enabled: !!address,
    },
  });

  // Get prices
  const btcPrice = getPrice("BTC") || 67500;
  const ethPrice = getPrice("ETH") || 3450;
  const prices = { BTC: btcPrice, ETH: ethPrice };

  // Calculate values from AAVE data or use mock
  const totalDeposited = aaveData?.totalCollateralUSD || 0;
  const totalBorrowed = aaveData?.totalDebtUSD || 0;
  const availableToBorrow = aaveData?.availableBorrowsUSD || 0;
  const healthFactor = aaveData?.healthFactor || (totalBorrowed > 0 ? calculateHealthFactor(totalDeposited, totalBorrowed) : Infinity);
  const portfolioValue = totalDeposited + (Number(usdcBalance?.formatted || 0));

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format USDC balance
  const usdcBalanceFormatted = usdcBalance ? Number(usdcBalance.formatted).toFixed(2) : "0.00";

  // STEP 1: Swaps only (OnchainKit, 1 tx par swap)
  const handleSwapOnly = async () => {
    if (!address || !depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    const totalAllocation = quickDepositAllocations.reduce((a, b) => a + b, 0);
    if (totalAllocation !== 100) {
      alert("Total allocation must equal 100%");
      return;
    }

    setIsSwapping(true);
    try {
      const usdcAmount = parseFloat(depositAmount);
      
      // Check USDC balance
      if (usdcAmount > Number(usdcBalanceFormatted)) {
        alert(`Insufficient USDC balance. You have $${usdcBalanceFormatted}`);
        setIsSwapping(false);
        return;
      }

      console.log("Executing swaps only with OnchainKit...");

      // For chaque asset (BTC / ETH), on exécute un swap OnchainKit séquentiel
      const allocations = quickDepositAllocations;
      const assets = ["BTC", "ETH"] as const;

      for (let i = 0; i < assets.length; i++) {
        const symbol = assets[i];
        const allocation = allocations[i];
        if (allocation === 0) continue;

        const usdcForAsset = (usdcAmount * allocation) / 100;
        const usdcForAssetWei = BigInt(Math.round(usdcForAsset * 1000000)); // USDC 6 décimales

        const tokenOut =
          symbol === "BTC"
            ? (isMainnet ? (contracts as any).cbBTC : (contracts as any).WBTC)
            : (contracts as any).cbETH;

        if (!tokenOut) continue;

        const swapTx = await getSwapTransaction(
          address,
          contracts.USDC,
          tokenOut,
          usdcForAssetWei,
          "USDC",
          symbol === "BTC" ? (isMainnet ? "cbBTC" : "WBTC") : "cbETH"
        );
        
        // If OnchainKit returns an approveTransaction for USDC, send it first
        const approveTx: any = swapTx.approveTransaction;
        if (approveTx && approveTx.to && approveTx.data) {
          console.log("Sending approve transaction from OnchainKit swap quote...", {
            to: approveTx.to,
            value: approveTx.value,
          });
          await sendTransactionAsync({
            to: approveTx.to as `0x${string}`,
            data: approveTx.data as `0x${string}`,
            value: BigInt(approveTx.value || 0),
          });
        }

        // Then send the actual swap transaction
        await sendTransactionAsync({
          to: swapTx.to,
          data: swapTx.data,
          value: swapTx.value,
        });
      }

      alert(
        `✅ Swaps submitted!\n\nÉtape 1/2 terminée :\n- USDC → cbBTC\n- USDC → cbETH\n\nPasse ensuite à l'étape 2 : Deposit to Aave.`
      );
    } catch (error: any) {
      console.error("Error in swaps:", error);
      alert(`Error: ${error.message || "Transaction failed. Please try again."}`);
    } finally {
      setIsSwapping(false);
    }
  };

  // STEP 2: Deposit only (Aave, lit les soldes réels)
  const handleDepositOnly = async () => {
    if (!address) {
      alert("Connect your wallet first");
      return;
    }

    // tokenBalances suit l'ordre tokenAddressesForBalances: [cbBTC/WBTC, cbETH]
    const balances = (tokenBalances || []).map((r) =>
      r && r.status === "success" ? (r.result as bigint) : BigInt(0)
    );

    const tokensForDeposit: { symbol: "BTC" | "ETH"; address: `0x${string}`; balance: bigint }[] = [];

    if (balances[0] && balances[0] > BigInt(0)) {
      tokensForDeposit.push({
        symbol: "BTC",
        address: tokenAddressesForBalances[0],
        balance: balances[0],
      });
    }
    if (balances[1] && balances[1] > BigInt(0)) {
      tokensForDeposit.push({
        symbol: "ETH",
        address: tokenAddressesForBalances[1],
        balance: balances[1],
      });
    }

    if (tokensForDeposit.length === 0) {
      alert("No cbBTC / cbETH balance found to deposit. Run the swaps first.");
      return;
    }

    setIsSwapping(true);
    try {
      for (const token of tokensForDeposit) {
        // Use 95% of the on-chain balance to avoid dust/rounding issues
        const conservativeBalance = (token.balance * BigInt(95)) / BigInt(100);
        if (conservativeBalance <= BigInt(0)) continue;

        console.log("Depositing to Aave with conservative balance", {
          symbol: token.symbol,
          fullBalance: token.balance.toString(),
          conservativeBalance: conservativeBalance.toString(),
        });

        // 1) Approve Aave Pool for the conservative amount
        await approve(token.address, conservativeBalance);
        // 2) Supply conservative amount
        await supply(token.address, conservativeBalance);
      }

      alert(
        `✅ Deposits submitted!\n\nÉtape 2/2 : toutes les positions cbBTC / cbETH détectées ont été déposées sur Aave.`
      );
    } catch (error: any) {
      console.error("Error in deposits:", error);
      alert(`Error: ${error.message || "Deposit transaction failed. Please try again."}`);
    } finally {
      setIsSwapping(false);
    }
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <section id="dashboard" className="relative py-32 px-6" ref={ref}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <span className="text-sm font-medium text-bitcoin mb-4 block">
              DASHBOARD
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Loading...
            </h2>
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-bitcoin" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!isConnected) {
    return (
      <section id="dashboard" className="relative py-32 px-6" ref={ref}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="text-sm font-medium text-bitcoin mb-4 block">
              DASHBOARD
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Connect to Get Started
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12">
              Connect your wallet to access the Buy, Borrow, Die dashboard.
              Start building your crypto-backed financial strategy today.
            </p>

            <GlassCard className="max-w-md mx-auto p-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-bitcoin/20 to-ethereum/20 flex items-center justify-center mx-auto mb-6">
                <WalletIcon className="w-10 h-10 text-bitcoin" />
              </div>
              <h3 className="font-display font-bold text-xl mb-4">
                Welcome to BBDFi
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Connect with Coinbase Smart Wallet for the best experience.
                Gasless transactions, easy onboarding.
              </p>
              <Wallet>
                <ConnectWallet className="!w-full !rounded-xl !py-3" />
              </Wallet>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section header with wallet info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-bitcoin mb-4 block">
            DASHBOARD
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Your <span className="gradient-text">BBD</span> Strategy
          </h2>
          
          {/* Connected wallet info */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="glass rounded-full px-4 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin to-ethereum flex items-center justify-center">
                <Identity address={address} className="!bg-transparent">
                  <Avatar className="w-8 h-8" />
                </Identity>
              </div>
              <div className="text-left">
                <Identity address={address} className="!bg-transparent">
                  <Name className="text-sm font-medium" />
                </Identity>
                <button 
                  onClick={copyAddress}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {shortenAddress(address || "")}
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <a
              href={`https://${chainId === 84532 ? 'sepolia.' : ''}basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-full p-2 hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatsCard
            label="USDC Balance"
            value={`$${usdcBalanceFormatted}`}
            icon={<DollarSign className="w-5 h-5 text-usdc" />}
            subValue="Available to invest"
          />
          <StatsCard
            label="Total Deposited"
            value={formatCurrency(totalDeposited)}
            icon={<Shield className="w-5 h-5 text-ethereum" />}
            subValue="in AAVE V3"
          />
          <StatsCard
            label="Total Borrowed"
            value={formatCurrency(totalBorrowed)}
            icon={<Landmark className="w-5 h-5 text-bitcoin" />}
            subValue="USDC"
          />
          <StatsCard
            label="Available to Borrow"
            value={formatCurrency(availableToBorrow)}
            icon={<BarChart3 className="w-5 h-5 text-ethereum" />}
            subValue="at current LTV"
          />
        </motion.div>

        {/* Health Factor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <HealthFactorGauge value={healthFactor} />
            {totalBorrowed === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                No active borrows. Deposit crypto and borrow USDC to start your BBD strategy!
              </p>
            )}
          </GlassCard>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="buy" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="buy" className="gap-2">
                <Coins className="w-4 h-4" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="borrow" className="gap-2">
                <Landmark className="w-4 h-4" />
                Borrow
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Portfolio
              </TabsTrigger>
            </TabsList>

            {/* BUY TAB */}
            <TabsContent value="buy">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* DCA Setup */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-bitcoin" />
                      DCA Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* DCA Status */}
                    {isDCAActive && (
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          <span className="text-sm text-green-400 font-medium">DCA Active</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsDCAActive(false)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Stop
                        </Button>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount per period (USDC)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={dcaAmount}
                          onChange={(e) => setDcaAmount(e.target.value)}
                          className="pl-9"
                          placeholder="500"
                        />
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency</label>
                      <div className="grid grid-cols-4 gap-2">
                        {dcaFrequencies.map((freq) => (
                          <button
                            key={freq.value}
                            onClick={() => setDcaFrequency(freq.value)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                              dcaFrequency === freq.value
                                ? "bg-bitcoin text-white"
                                : "bg-white/5 hover:bg-white/10"
                            )}
                          >
                            {freq.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Allocation */}
                    <AssetAllocation
                      allocations={dcaAllocations}
                      onAllocationsChange={setDcaAllocations}
                      prices={prices}
                      editable={true}
                      cryptoAssets={cryptoAssets}
                    />

                    <Button 
                      variant="gradient" 
                      className="w-full"
                      onClick={() => setIsDCAActive(true)}
                      disabled={isDCAActive || dcaAllocations.reduce((a, b) => a + b, 0) !== 100}
                    >
                      <RefreshCw className="w-4 h-4" />
                      {isDCAActive ? "DCA Running" : "Start DCA Strategy"}
                    </Button>
                  </CardContent>
                </GlassCard>

                {/* Quick Deposit */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowDownUp className="w-5 h-5 text-ethereum" />
                      Quick Deposit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/5 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">From</span>
                        <span className="font-medium">USDC Balance: ${usdcBalanceFormatted}</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="text-2xl font-bold h-14 pr-20"
                          placeholder="0.00"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-usdc flex items-center justify-center text-xs font-bold text-white">
                            $
                          </div>
                          <span className="font-medium">USDC</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setDepositAmount(String((Number(usdcBalanceFormatted) * pct / 100).toFixed(2)))}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="p-2 rounded-full bg-white/5">
                        <ArrowDownUp className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5">
                      <AssetAllocation
                        allocations={quickDepositAllocations}
                        onAllocationsChange={setQuickDepositAllocations}
                        prices={prices}
                        editable={true}
                        depositAmount={depositAmount}
                        cryptoAssets={cryptoAssets}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        variant="gradient" 
                        className="w-full" 
                        disabled={
                          !depositAmount || 
                          parseFloat(depositAmount) <= 0 || 
                          quickDepositAllocations.reduce((a, b) => a + b, 0) !== 100 ||
                          isSwapping ||
                          isSendingTx
                        }
                        onClick={handleSwapOnly}
                      >
                        {isSwapping && isSendingTx ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Swapping...
                          </>
                        ) : (
                          <>
                            <ArrowDownUp className="w-4 h-4" />
                            1. Swap USDC → cbBTC / cbETH
                          </>
                        )}
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled={isSwapping || !address}
                        onClick={handleDepositOnly}
                      >
                        {isSwapping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Depositing...
                          </>
                        ) : (
                          <>
                            <Landmark className="w-4 h-4" />
                            2. Deposit to Aave
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {Number(usdcBalanceFormatted) === 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        You need USDC to deposit. Get USDC on Base via{" "}
                        <a 
                          href="https://www.coinbase.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-bitcoin hover:underline"
                        >
                          Coinbase
                        </a>
                      </p>
                    )}
                  </CardContent>
                </GlassCard>
              </div>
            </TabsContent>

            {/* BORROW TAB */}
            <TabsContent value="borrow">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Borrow Form */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-usdc" />
                      Borrow USDC
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {totalDeposited === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <Shield className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-display font-semibold mb-2">No Collateral</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Deposit crypto first to use as collateral for borrowing USDC.
                        </p>
                        <Button variant="outline" onClick={() => {
                          const buyTab = document.querySelector('[data-state="inactive"][value="buy"]') as HTMLElement;
                          buyTab?.click();
                        }}>
                          Go to Deposit
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Collateral Info */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-ethereum/10 to-bitcoin/10 border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">Your Collateral</span>
                            <span className="font-display font-bold">{formatCurrency(totalDeposited)}</span>
                          </div>
                          <div className="space-y-2">
                            {cryptoAssets.map((asset) => (
                              <div key={asset.symbol} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: `${asset.color}20`, color: asset.color }}
                                  >
                                    {asset.icon}
                                  </div>
                                  <span>{asset.symbol}</span>
                                </div>
                                <span>${(totalDeposited * asset.allocation / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* LTV Slider */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Loan-to-Value Ratio</label>
                            <span className="font-display font-bold text-lg">{ltv[0]}%</span>
                          </div>
                          <Slider
                            value={ltv}
                            max={80}
                            min={10}
                            step={5}
                            onValueChange={setLtv}
                            className="[&_[role=slider]]:bg-white"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Conservative (10%)</span>
                            <span>Max (80%)</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 p-3 rounded-lg text-sm",
                            ltv[0] <= 50 ? "bg-green-500/10 text-green-400" :
                            ltv[0] <= 70 ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-red-500/10 text-red-400"
                          )}>
                            {ltv[0] <= 50 ? <CheckCircle2 className="w-4 h-4" /> :
                             ltv[0] <= 70 ? <Info className="w-4 h-4" /> :
                             <AlertTriangle className="w-4 h-4" />}
                            {ltv[0] <= 50 ? "Safe zone - Low liquidation risk" :
                             ltv[0] <= 70 ? "Moderate risk - Monitor regularly" :
                             "High risk - Close to liquidation threshold"}
                          </div>
                        </div>

                        {/* Borrow Amount */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Borrow Amount</label>
                            <span className="text-sm text-muted-foreground">
                              Max: {formatCurrency(totalDeposited * 0.8)}
                            </span>
                          </div>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={borrowAmount || String((totalDeposited * ltv[0] / 100).toFixed(2))}
                              onChange={(e) => setBorrowAmount(e.target.value)}
                              className="pl-9 text-xl font-bold"
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              USDC
                            </span>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2 p-4 rounded-xl bg-white/5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Interest Rate (APY)</span>
                            <span className="text-green-400">4.2%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Cost</span>
                            <span>~${((parseFloat(borrowAmount || String(totalDeposited * ltv[0] / 100))) * 0.042 / 12).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">New Health Factor</span>
                            <span className={cn(
                              "font-medium",
                              calculateHealthFactor(totalDeposited, totalBorrowed + parseFloat(borrowAmount || String(totalDeposited * ltv[0] / 100))) > 1.5 ? "text-green-400" : "text-yellow-400"
                            )}>
                              {calculateHealthFactor(totalDeposited, totalBorrowed + parseFloat(borrowAmount || String(totalDeposited * ltv[0] / 100))).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <Button variant="gradient" className="w-full">
                          <Landmark className="w-4 h-4" />
                          Borrow USDC
                        </Button>
                      </>
                    )}
                  </CardContent>
                </GlassCard>

                {/* Active Position */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-ethereum" />
                      Active Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {totalBorrowed === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <Landmark className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-display font-semibold mb-2">No Active Loans</h4>
                        <p className="text-sm text-muted-foreground">
                          Borrow USDC against your crypto to start living the BBD lifestyle!
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Current Loan */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-usdc/10 to-ethereum/10 border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">Currently Borrowed</span>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-usdc flex items-center justify-center text-xs font-bold text-white">
                                $
                              </div>
                              <span className="font-display font-bold text-2xl">{formatNumber(totalBorrowed)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Interest Accrued</p>
                              <p className="font-medium">${(totalBorrowed * 0.042 / 12).toFixed(2)}/mo</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">APY</p>
                              <p className="font-medium text-green-400">4.2%</p>
                            </div>
                          </div>
                        </div>

                        {/* Liquidation Info */}
                        <div className="p-4 rounded-xl bg-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">Liquidation Thresholds</span>
                          </div>
                          <div className="space-y-2">
                            {cryptoAssets.map((asset) => {
                              const price = prices[asset.symbol as keyof typeof prices] || 1;
                              return (
                                <div key={asset.symbol} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: `${asset.color}20`, color: asset.color }}
                                    >
                                      {asset.icon}
                                    </div>
                                    <span>{asset.symbol}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    ${(price * 0.65).toFixed(0)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="w-full">
                            <ArrowUpRight className="w-4 h-4" />
                            Repay
                          </Button>
                          <Button variant="outline" className="w-full">
                            <TrendingUp className="w-4 h-4" />
                            Add Collateral
                          </Button>
                        </div>
                      </>
                    )}

                    {/* AAVE Link */}
                    <a
                      href={`https://app.aave.com/?marketName=${chainId === 84532 ? 'proto_base_sepolia_v3' : 'proto_base_v3'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-muted-foreground"
                    >
                      Manage on AAVE
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </CardContent>
                </GlassCard>
              </div>
            </TabsContent>

            {/* PORTFOLIO TAB */}
            <TabsContent value="portfolio">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Holdings */}
                <GlassCard className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-bitcoin" />
                      Holdings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Wallet balances: USDC, cbBTC/WBTC, cbETH
                      const usdcWallet = usdcBalance ? Number(usdcBalance.formatted) : 0;
                      const cbBtcBalance =
                        tokenBalances && tokenBalances[0] && tokenBalances[0].status === "success"
                          ? (tokenBalances[0].result as bigint)
                          : BigInt(0);
                      const cbEthBalance =
                        tokenBalances && tokenBalances[1] && tokenBalances[1].status === "success"
                          ? (tokenBalances[1].result as bigint)
                          : BigInt(0);

                      const hasAnyHolding =
                        usdcWallet > 0 || cbBtcBalance > BigInt(0) || cbEthBalance > BigInt(0) || totalDeposited > 0;

                      if (!hasAnyHolding) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                              <BarChart3 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-display font-semibold mb-2">No Holdings Yet</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Swap USDC to cbBTC / cbETH or deposit to Aave to see your portfolio here.
                            </p>
                          </div>
                        );
                      }

                      const rows: Array<{
                        key: string;
                        name: string;
                        symbol: string;
                        icon: string;
                        color: string;
                        amount: number;
                        value: number;
                      }> = [];

                      // USDC (wallet)
                      if (usdcWallet > 0) {
                        rows.push({
                          key: "USDC",
                          name: "USDC",
                          symbol: "USDC",
                          icon: "$",
                          color: "#2775CA",
                          amount: usdcWallet,
                          value: usdcWallet,
                        });
                      }

                      // cbBTC / WBTC (wallet)
                      if (cbBtcBalance > BigInt(0)) {
                        const btcDecimals = isMainnet ? 8 : 8;
                        const btcAmount = Number(formatUnits(cbBtcBalance, btcDecimals));
                        const btcPriceNow = prices.BTC || 0;
                        rows.push({
                          key: "BTC",
                          name: isMainnet ? "Coinbase Wrapped BTC (cbBTC)" : "Wrapped Bitcoin (WBTC)",
                          symbol: "BTC",
                          icon: "₿",
                          color: "#F7931A",
                          amount: btcAmount,
                          value: btcAmount * btcPriceNow,
                        });
                      }

                      // cbETH (wallet)
                      if (cbEthBalance > BigInt(0)) {
                        const ethAmount = Number(formatUnits(cbEthBalance, 18));
                        const ethPriceNow = prices.ETH || 0;
                        rows.push({
                          key: "ETH",
                          name: "Coinbase Wrapped ETH (cbETH)",
                          symbol: "ETH",
                          icon: "Ξ",
                          color: "#627EEA",
                          amount: ethAmount,
                          value: ethAmount * ethPriceNow,
                        });
                      }

                      // Aave total deposited as a synthetic "Aave Collateral" row
                      if (totalDeposited > 0) {
                        rows.push({
                          key: "AAVE_COLLATERAL",
                          name: "Aave Collateral (all markets)",
                          symbol: "AAVE V3",
                          icon: "ⓐ",
                          color: "#B6509E",
                          amount: totalDeposited,
                          value: totalDeposited,
                        });
                      }

                      return (
                        <div className="space-y-4">
                          {rows.map((row) => (
                            <div
                              key={row.key}
                              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                                  style={{ backgroundColor: `${row.color}20`, color: row.color }}
                                >
                                  {row.icon}
                                </div>
                                <div>
                                  <h4 className="font-display font-semibold">{row.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {row.amount.toFixed(6)} {row.symbol}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-display font-semibold">
                                  {formatCurrency(row.value)}
                                </p>
                                {(row.symbol === "BTC" || row.symbol === "ETH") && (
                                  <p className="text-sm text-muted-foreground">
                                    @ $
                                    {formatNumber(
                                      row.symbol === "BTC" ? prices.BTC || 0 : prices.ETH || 0
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </GlassCard>

                {/* Strategy Summary */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-ethereum" />
                      Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">DCA Status</p>
                      <div className="flex items-center gap-2">
                        {isDCAActive ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            <span className="font-medium text-green-400">Active</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground" />
                            </span>
                            <span className="font-medium text-muted-foreground">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">DCA Amount</p>
                      <p className="font-medium">${dcaAmount}/{dcaFrequency}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Total Deposited</p>
                      <p className="font-medium">{formatCurrency(totalDeposited)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Total Borrowed</p>
                      <p className="font-medium">{formatCurrency(totalBorrowed)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Net Position</p>
                      <p className={cn(
                        "font-display font-bold text-lg",
                        totalDeposited - totalBorrowed >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {formatCurrency(totalDeposited - totalBorrowed)}
                      </p>
                    </div>
                  </CardContent>
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
