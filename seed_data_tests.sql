-- ============================================================
-- ARTHA LIFE OS — SEED DATA VERIFICATION TESTS
-- Run AFTER seed_data_6months.sql to validate all scenarios
-- ============================================================

-- ══════════════════════════════════════
-- TEST 1: LIQUIDITY — 7 accounts, all types
-- ══════════════════════════════════════
SELECT 'TEST 1: Liquidity Accounts' as test;
SELECT
  COUNT(*) as total_accounts,
  COUNT(DISTINCT type) as distinct_types,
  SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) as positive_balance_count,
  SUM(CASE WHEN balance < 0 THEN 1 ELSE 0 END) as negative_balance_count,
  SUM(balance) as net_cash_position
FROM public.liquidity;

-- Expected: 7 accounts, 4+ distinct types, 6 positive, 1 negative (credit card)

-- ══════════════════════════════════════
-- TEST 2: ASSETS — 10 assets, various types, gains/losses
-- ══════════════════════════════════════
SELECT 'TEST 2: Asset Portfolio' as test;
SELECT
  COUNT(*) as total_assets,
  COUNT(DISTINCT asset_type) as distinct_asset_types,
  SUM(current_value) as total_current_value,
  SUM(purchase_price) as total_purchase_price,
  SUM(current_value - purchase_price) as unrealized_gain_loss,
  COUNT(CASE WHEN current_value > purchase_price THEN 1 END) as assets_in_gain,
  COUNT(CASE WHEN current_value < purchase_price THEN 1 END) as assets_in_loss
FROM public.assets;
-- Expected: 10 assets, 9+ asset_types, most in gain, 1 in loss (MacBook depreciated)

-- ══════════════════════════════════════
-- TEST 3: LIABILITIES — 4 parties, all types
-- ══════════════════════════════════════
SELECT 'TEST 3: Liabilities' as test;
SELECT
  COUNT(*) as total_parties,
  COUNT(DISTINCT party_type) as distinct_types,
  SUM(total_amount) as total_borrowed,
  SUM(remaining) as total_outstanding,
  SUM(total_amount - remaining) as total_repaid
FROM public.liabilities;
-- Expected: 4 parties, 3 types (Bank, Credit Card, Personal), total_repaid > 0

-- ══════════════════════════════════════
-- TEST 4: EXPENSE HISTORY — 70+ transactions, 6 months
-- ══════════════════════════════════════
SELECT 'TEST 4: Expense History Volume' as test;
SELECT
  DATE_TRUNC('month', date) as month,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT type) as types_used,
  SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'Transfer' THEN amount ELSE 0 END) as total_transfers
FROM public.history_expenses
GROUP BY 1 ORDER BY 1;
-- Expected: 6 months, each with 10+ transactions, mix of all 3 types

-- ══════════════════════════════════════
-- TEST 5: BUDGET vs ACTUAL — Over and Under budget scenarios
-- ══════════════════════════════════════
SELECT 'TEST 5: Budget vs Actual (June 2026)' as test;
SELECT
  bp.category,
  bp.subcategory,
  bp.planned_amount as budget,
  COALESCE(SUM(CASE WHEN he.type = 'Expense' THEN he.amount ELSE 0 END), 0) as actual,
  bp.planned_amount - COALESCE(SUM(CASE WHEN he.type = 'Expense' THEN he.amount ELSE 0 END), 0) as variance,
  CASE
    WHEN COALESCE(SUM(CASE WHEN he.type = 'Expense' THEN he.amount ELSE 0 END), 0) > bp.planned_amount THEN '🔴 OVER'
    WHEN COALESCE(SUM(CASE WHEN he.type = 'Expense' THEN he.amount ELSE 0 END), 0) = 0 THEN '⚪ NO SPEND'
    WHEN COALESCE(SUM(CASE WHEN he.type = 'Expense' THEN he.amount ELSE 0 END), 0) > bp.planned_amount * 0.8 THEN '🟡 CLOSE'
    ELSE '🟢 OK'
  END as status
FROM public.budget_plans bp
LEFT JOIN public.history_expenses he
  ON he.category = bp.category
  AND he.subcategory = bp.subcategory
  AND he.date >= '2026-06-01'
  AND he.date < '2026-07-01'
WHERE bp.month = '2026-06-01'
GROUP BY bp.category, bp.subcategory, bp.planned_amount
ORDER BY variance;
-- Expected: mix of 🔴/🟡/🟢 statuses across categories

-- ══════════════════════════════════════
-- TEST 6: TASKS — All flags and states represented
-- ══════════════════════════════════════
SELECT 'TEST 6: Task Distribution' as test;
SELECT
  CASE
    WHEN parent_id IS NOT NULL THEN 'Subtask'
    WHEN is_today THEN 'Today'
    WHEN is_week THEN 'This Week'
    WHEN is_inbox THEN 'Inbox'
    ELSE 'Someday'
  END as list,
  status,
  SUM(CASE WHEN is_high_priority THEN 1 ELSE 0 END) as high_priority_count,
  COUNT(*) as count
FROM public.tasks
GROUP BY 1, 2
ORDER BY 1, 2;
-- Expected: Today/Week/Inbox/Someday + Subtasks, both Pending and Completed

-- ══════════════════════════════════════
-- TEST 7: HABITS — Config and 6-month data coverage
-- ══════════════════════════════════════
SELECT 'TEST 7: Habit Config Coverage' as test;
SELECT
  frequency,
  COUNT(*) as habit_count,
  COUNT(DISTINCT group_name) as groups,
  SUM(CASE WHEN unlogged_is_success THEN 1 ELSE 0 END) as avoid_habits,
  COUNT(DISTINCT input_type) as input_types_used,
  COUNT(DISTINCT condition_type) as condition_types_used
FROM public.habit_config
GROUP BY frequency;
-- Expected: daily (11) and event (2) habits, multiple types

SELECT 'TEST 7b: Habit Data 6-Month Coverage' as test;
SELECT
  DATE_TRUNC('month', date) as month,
  COUNT(*) as log_entries,
  COUNT(DISTINCT habit) as unique_habits,
  SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successes,
  SUM(CASE WHEN status = 'Failure' THEN 1 ELSE 0 END) as failures,
  ROUND(SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as success_pct
FROM public.habit_data
GROUP BY 1 ORDER BY 1;
-- Expected: 6 months, each with 100+ entries, ~60-70% success rate

-- ══════════════════════════════════════
-- TEST 8: WORKOUT — Progress over 6 months, break in April
-- ══════════════════════════════════════
SELECT 'TEST 8: Workout Volume Progress' as test;
SELECT
  DATE_TRUNC('month', date) as month,
  COUNT(DISTINCT date) as workout_days,
  COUNT(*) as total_sets,
  SUM(weight * reps) as total_volume_kg,
  MAX(weight) as max_weight_lifted,
  COUNT(DISTINCT workout_day) as workout_types
FROM public.workout_log
GROUP BY 1 ORDER BY 1;
-- Expected: Apr should show fewer workout days (hospitalization break), Jun should show highest volume (PR)

-- ══════════════════════════════════════
-- TEST 9: VEHICLES — Insurance and service status
-- ══════════════════════════════════════
SELECT 'TEST 9: Vehicle Compliance Status' as test;
SELECT
  vehicle_name,
  vehicle_type,
  fuel_type,
  insurance_expiry,
  (insurance_expiry - CURRENT_DATE) as ins_days_remaining,
  next_service_date,
  (next_service_date - CURRENT_DATE) as svc_days_remaining,
  CASE
    WHEN insurance_expiry IS NULL THEN '⚪ No Data'
    WHEN insurance_expiry < CURRENT_DATE THEN '🔴 EXPIRED'
    WHEN insurance_expiry < CURRENT_DATE + INTERVAL '30 days' THEN '🟡 WARN (<30d)'
    ELSE '🟢 OK'
  END as insurance_status,
  CASE
    WHEN next_service_date IS NULL THEN '⚪ Not Set'
    WHEN next_service_date < CURRENT_DATE THEN '🔴 OVERDUE'
    WHEN next_service_date < CURRENT_DATE + INTERVAL '14 days' THEN '🟡 SOON (<14d)'
    ELSE '🟢 OK'
  END as service_status
FROM public.vehicle_config;
-- Expected: Honda City = EXPIRED insurance (Dec 2025), RE = WARN (<30d), Swift = OK

-- ══════════════════════════════════════
-- TEST 10: VEHICLE FUEL EFFICIENCY
-- ══════════════════════════════════════
SELECT 'TEST 10: Fuel Efficiency by Vehicle' as test;
SELECT
  v.vehicle_name,
  COUNT(fl.id) as fuel_entries,
  SUM(fl.liters) as total_liters,
  SUM(fl.amount) as total_fuel_cost,
  ROUND(AVG(fl.full_tank_mileage)::numeric, 2) as avg_full_tank_mileage,
  ROUND(AVG(fl.mileage)::numeric, 2) as avg_trip_mileage,
  MIN(fl.date) as first_fill,
  MAX(fl.date) as last_fill
FROM public.vehicle_fuel_logs fl
JOIN public.vehicle_config v ON v.id = fl.vehicle_id
GROUP BY v.vehicle_name
ORDER BY total_fuel_cost DESC;
-- Expected: Honda City > Swift > RE in cost; RE > others in km/L

-- ══════════════════════════════════════
-- TEST 11: INVENTORY — All statuses and origins
-- ══════════════════════════════════════
SELECT 'TEST 11: Inventory Status Summary' as test;
SELECT
  status,
  condition,
  origin_type,
  COUNT(*) as item_count,
  SUM(COALESCE(purchase_price, 0)) as total_purchase_value
FROM public.inventory_items
GROUP BY status, condition, origin_type
ORDER BY status, condition;
-- Expected: active/lent_out/retired x new/good/fair/poor x bought/gifted_in/borrowed

SELECT 'TEST 11b: Inventory Location Tree Depth' as test;
WITH RECURSIVE loc_tree AS (
  SELECT id, name, type, parent_id, 1 as depth
  FROM public.inventory_locations
  WHERE parent_id IS NULL
  UNION ALL
  SELECT l.id, l.name, l.type, l.parent_id, lt.depth + 1
  FROM public.inventory_locations l
  JOIN loc_tree lt ON l.parent_id = lt.id
)
SELECT MAX(depth) as max_depth, COUNT(*) as total_locations,
  COUNT(DISTINCT type) as location_types
FROM loc_tree;
-- Expected: max_depth = 5 (city→building→room→furniture→compartment), 20 locations

-- ══════════════════════════════════════
-- TEST 12: SQUARESHIFT — Projects and task states
-- ══════════════════════════════════════
SELECT 'TEST 12: SquareShift Project Task Summary' as test;
SELECT
  COALESCE(ap.name, '📝 Quick Notes') as project,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN at.completed = FALSE THEN 1 ELSE 0 END) as open_tasks,
  SUM(CASE WHEN at.completed = TRUE THEN 1 ELSE 0 END) as done_tasks,
  SUM(CASE WHEN at.due < CURRENT_DATE AND at.completed = FALSE THEN 1 ELSE 0 END) as overdue_tasks,
  SUM(CASE WHEN at.due = CURRENT_DATE AND at.completed = FALSE THEN 1 ELSE 0 END) as due_today_tasks
FROM public.action_tasks at
LEFT JOIN public.action_projects ap ON ap.id = at.project_id
GROUP BY ap.name
ORDER BY open_tasks DESC;
-- Expected: 6 projects including Quick Notes, all with open and done tasks, some overdue

-- ══════════════════════════════════════
-- TEST 13: EVENTS LOG — Workout gap detection (April surgery break)
-- ══════════════════════════════════════
SELECT 'TEST 13: Event Log — Workout Gap Analysis' as test;
SELECT
  DATE_TRUNC('month', date) as month,
  COUNT(*) as workout_events,
  MIN(date) as first_workout,
  MAX(date) as last_workout
FROM public.event_log
WHERE event = 'Workout'
GROUP BY 1 ORDER BY 1;
-- Expected: April should have fewer events (surgery break Apr 8-21)

-- ══════════════════════════════════════
-- TEST 14: NET WORTH CALCULATION
-- ══════════════════════════════════════
SELECT 'TEST 14: Net Worth Summary' as test;
SELECT
  (SELECT SUM(balance) FROM public.liquidity) as total_liquidity,
  (SELECT SUM(current_value) FROM public.assets) as total_assets,
  (SELECT SUM(remaining) FROM public.liabilities) as total_liabilities,
  (SELECT SUM(balance) FROM public.liquidity)
    + (SELECT SUM(current_value) FROM public.assets)
    - (SELECT SUM(remaining) FROM public.liabilities) as net_worth;
-- Expected: Positive net worth driven by real estate and investments

-- ══════════════════════════════════════
-- TEST 15: HISTORY LIABILITIES — Payment consistency
-- ══════════════════════════════════════
SELECT 'TEST 15: Liability Payment History' as test;
SELECT
  party,
  COUNT(*) as payment_entries,
  SUM(CASE WHEN type = 'Principal' THEN amount ELSE 0 END) as total_principal,
  SUM(CASE WHEN type = 'Interest' THEN amount ELSE 0 END) as total_interest,
  SUM(CASE WHEN type = 'Borrowed' THEN amount ELSE 0 END) as total_borrowed
FROM public.history_liabilities
GROUP BY party ORDER BY total_principal DESC;
-- Expected: SBI Home Loan and HDFC Personal Loan with 6 months each, Raj (friend) with 1 borrowed entry

-- ══════════════════════════════════════
-- SUMMARY DASHBOARD
-- ══════════════════════════════════════
SELECT 'FINAL SUMMARY: All Sections Coverage' as test;
SELECT 'Liquidity' as section, COUNT(*) as records FROM public.liquidity
UNION ALL SELECT 'Assets', COUNT(*) FROM public.assets
UNION ALL SELECT 'Liabilities', COUNT(*) FROM public.liabilities
UNION ALL SELECT 'Expense History', COUNT(*) FROM public.history_expenses
UNION ALL SELECT 'Liability History', COUNT(*) FROM public.history_liabilities
UNION ALL SELECT 'Budget Plans', COUNT(*) FROM public.budget_plans
UNION ALL SELECT 'Tasks', COUNT(*) FROM public.tasks
UNION ALL SELECT 'Habit Configs', COUNT(*) FROM public.habit_config
UNION ALL SELECT 'Habit Data', COUNT(*) FROM public.habit_data
UNION ALL SELECT 'Event Log', COUNT(*) FROM public.event_log
UNION ALL SELECT 'Workout Log', COUNT(*) FROM public.workout_log
UNION ALL SELECT 'Vehicles', COUNT(*) FROM public.vehicle_config
UNION ALL SELECT 'Fuel Logs', COUNT(*) FROM public.vehicle_fuel_logs
UNION ALL SELECT 'Service Logs', COUNT(*) FROM public.vehicle_service_logs
UNION ALL SELECT 'Mileage Logs', COUNT(*) FROM public.vehicle_mileage_logs
UNION ALL SELECT 'Inventory Locations', COUNT(*) FROM public.inventory_locations
UNION ALL SELECT 'Inventory Items', COUNT(*) FROM public.inventory_items
UNION ALL SELECT 'Action Projects', COUNT(*) FROM public.action_projects
UNION ALL SELECT 'Action Tasks', COUNT(*) FROM public.action_tasks
ORDER BY section;
