import { supabase } from "@/lib/supabase";
import { LiquidityAccount, ExpenseTransaction, FinanceAsset, FinanceLiability, BudgetPlan } from "@/lib/types";

export const financeService = {
  // Accounts / Liquidity
  async getAccounts(): Promise<LiquidityAccount[]> {
    const { data, error } = await supabase.from("liquidity").select("*").order("account_name");
    if (error || !data) return [];
    return data;
  },

  async getAccountByName(name: string): Promise<LiquidityAccount | null> {
    const { data, error } = await supabase.from("liquidity").select("*").eq("account_name", name).single();
    if (error || !data) return null;
    return data;
  },

  async saveAccount(accountData: Partial<LiquidityAccount>, originalName?: string | null): Promise<boolean> {
    if (originalName) {
      const { error } = await supabase.from("liquidity").update(accountData).eq("account_name", originalName);
      return !error;
    } else {
      const { error } = await supabase.from("liquidity").insert([accountData]);
      return !error;
    }
  },

  async deleteAccount(accountName: string): Promise<boolean> {
    const { error } = await supabase.from("liquidity").delete().eq("account_name", accountName);
    return !error;
  },

  // Transactions / Expenses
  async getExpenses(limit: number = 100): Promise<ExpenseTransaction[]> {
    const { data, error } = await supabase
      .from("history_expenses")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  },

  async getExpensesForDate(dateStr: string): Promise<ExpenseTransaction[]> {
    const { data, error } = await supabase
      .from("history_expenses")
      .select("*")
      .eq("date", dateStr)
      .order("created_at");
    if (error || !data) return [];
    return data;
  },

  async addExpense(expense: Omit<ExpenseTransaction, "id">): Promise<ExpenseTransaction | null> {
    const { data, error } = await supabase.from("history_expenses").insert([expense]).select().single();
    if (error || !data) return null;
    return data;
  },

  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await supabase.from("history_expenses").delete().eq("id", id);
    return !error;
  },

  // Assets
  async getAssets(): Promise<FinanceAsset[]> {
    const { data, error } = await supabase.from("assets").select("*").order("asset_name");
    if (error || !data) return [];
    return data;
  },

  async saveAsset(asset: Partial<FinanceAsset>): Promise<boolean> {
    if (asset.id) {
      const { error } = await supabase.from("assets").update(asset).eq("id", asset.id);
      return !error;
    } else {
      const { error } = await supabase.from("assets").insert([asset]);
      return !error;
    }
  },

  async deleteAsset(id: string): Promise<boolean> {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    return !error;
  },

  // Liabilities
  async getLiabilities(): Promise<FinanceLiability[]> {
    const { data, error } = await supabase.from("liabilities").select("*").order("name");
    if (error || !data) return [];
    return data;
  },

  async saveLiability(liability: Partial<FinanceLiability>): Promise<boolean> {
    if (liability.id) {
      const { error } = await supabase.from("liabilities").update(liability).eq("id", liability.id);
      return !error;
    } else {
      const { error } = await supabase.from("liabilities").insert([liability]);
      return !error;
    }
  },

  async deleteLiability(id: string): Promise<boolean> {
    const { error } = await supabase.from("liabilities").delete().eq("id", id);
    return !error;
  },

  // Budget Plans
  async getBudgetPlans(month: string): Promise<BudgetPlan[]> {
    const { data, error } = await supabase.from("budget_plans").select("*").eq("month", month);
    if (error || !data) return [];
    return data;
  },

  async saveBudgetPlans(plans: Partial<BudgetPlan>[]): Promise<boolean> {
    const { error } = await supabase.from("budget_plans").upsert(plans, { onConflict: "category, subcategory, month" });
    return !error;
  }
};
