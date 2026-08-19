import { useState, useEffect, useCallback } from "react";
import { financeService } from "@/lib/services/finance";
import { LiquidityAccount, ExpenseTransaction, FinanceAsset, FinanceLiability } from "@/lib/types";

export function useFinance() {
  const [accounts, setAccounts] = useState<LiquidityAccount[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [assets, setAssets] = useState<FinanceAsset[]>([]);
  const [liabilities, setLiabilities] = useState<FinanceLiability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accData, expData, assetData, liabData] = await Promise.all([
        financeService.getAccounts(),
        financeService.getExpenses(50),
        financeService.getAssets(),
        financeService.getLiabilities()
      ]);
      setAccounts(accData);
      setExpenses(expData);
      setAssets(assetData);
      setLiabilities(liabData);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch financial data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    accounts,
    expenses,
    assets,
    liabilities,
    isLoading,
    error,
    refetch: fetchAll
  };
}
