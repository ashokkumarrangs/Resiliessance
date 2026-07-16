-- ============================================================
-- ARTHA LIFE OS — COMPREHENSIVE SEED DATA SCRIPT
-- Coverage: Last 6 months (Jan 2026 – Jun 2026)
-- Scenarios: All sections, all edge cases, all UI states
-- Date generated: 2026-06-27
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- SECTION 0: CLEANUP (Optional — comment out if you want to keep existing data)
-- ============================================================
-- DELETE FROM public.action_tasks;
-- DELETE FROM public.action_projects;
-- DELETE FROM public.inventory_items;
-- DELETE FROM public.inventory_locations;
-- DELETE FROM public.vehicle_mileage_logs;
-- DELETE FROM public.vehicle_service_logs;
-- DELETE FROM public.vehicle_fuel_logs;
-- DELETE FROM public.vehicle_config;
-- DELETE FROM public.workout_log;
-- DELETE FROM public.event_log;
-- DELETE FROM public.habit_data;
-- DELETE FROM public.habit_config;
-- DELETE FROM public.budget_plans;
-- DELETE FROM public.history_liabilities;
-- DELETE FROM public.history_expenses;
-- DELETE FROM public.tasks;
-- DELETE FROM public.liabilities;
-- DELETE FROM public.assets;
-- DELETE FROM public.liquidity;

-- ============================================================
-- SECTION 1: LIQUIDITY (Bank Accounts & Wallets)
-- Scenarios: Savings, Current, Wallet, Credit Card, Fixed Deposit
-- ============================================================
INSERT INTO public.liquidity (account_name, balance, account_no, type, notes, last_confirmed_at) VALUES
  ('HDFC Savings', 125000.00, 'XXXX-XXXX-1234', 'Savings', 'Primary salary account', NOW()),
  ('SBI Savings', 48500.00, 'XXXX-XXXX-5678', 'Savings', 'Secondary savings account', NOW()),
  ('ICICI Current', 82000.00, 'XXXX-XXXX-9012', 'Current', 'Freelance income account', NOW()),
  ('Axis Wallet', 5200.00, NULL, 'Wallet', 'UPI wallet for quick payments', NOW()),
  ('Paytm Wallet', 1850.00, NULL, 'Wallet', 'Online shopping wallet', NOW()),
  ('HDFC Credit Card', -38000.00, 'XXXX-XXXX-3456', 'Credit', 'Main credit card — pay by 5th', NOW()),
  ('Cash in Hand', 12500.00, NULL, 'Cash', 'Physical cash on hand', NOW())
ON CONFLICT (account_name) DO UPDATE SET
  balance = EXCLUDED.balance,
  notes = EXCLUDED.notes;

-- ============================================================
-- SECTION 2: ASSETS
-- Scenarios: Real Estate, Mutual Funds, Stocks, Gold, Electronics, Vehicle, Fixed Deposit
-- Multiple owners, categories, and purchase price vs current value differences
-- ============================================================
INSERT INTO public.assets (id, asset_name, asset_type, current_value, purchase_price, purchase_date, category, subcategory, owner, place, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Home — Apartment', 'Real Estate', 4500000.00, 3200000.00, '2019-03-15', 'Real Estate', 'Residential', 'Joint', 'Chennai', 'Primary residence — loan ongoing'),
  ('a1000000-0000-0000-0000-000000000002', 'Plot — Hometown', 'Real Estate', 1800000.00, 900000.00, '2015-06-10', 'Real Estate', 'Land', 'Me', 'Madurai', 'Agriculture land, appreciated'),
  ('a1000000-0000-0000-0000-000000000003', 'HDFC Top 100 Fund', 'Mutual Fund', 285000.00, 200000.00, '2021-01-05', 'Investments', 'Mutual Fund', 'Me', NULL, 'Large cap growth fund'),
  ('a1000000-0000-0000-0000-000000000004', 'Axis Bluechip Fund', 'Mutual Fund', 145000.00, 120000.00, '2022-04-20', 'Investments', 'Mutual Fund', 'Me', NULL, 'Long term equity fund'),
  ('a1000000-0000-0000-0000-000000000005', 'TATA Motors Shares', 'Stocks', 62000.00, 45000.00, '2023-07-12', 'Investments', 'Stocks', 'Me', NULL, '200 shares @310 avg'),
  ('a1000000-0000-0000-0000-000000000006', 'Gold Coins (50g)', 'Gold', 385000.00, 280000.00, '2020-11-02', 'Physical Assets', 'Gold', 'Joint', 'Home Locker', '50g 24k gold coins'),
  ('a1000000-0000-0000-0000-000000000007', 'Gold Jewellery', 'Gold', 220000.00, 180000.00, '2018-05-14', 'Physical Assets', 'Gold', 'Spouse', 'Home Locker', 'Wedding jewellery set'),
  ('a1000000-0000-0000-0000-000000000008', 'MacBook Pro M3', 'Electronics', 185000.00, 225000.00, '2024-01-10', 'Electronics', 'Computer', 'Me', 'Home Office', 'Depreciated - 3yr warranty'),
  ('a1000000-0000-0000-0000-000000000009', 'SBI FD - 5yr', 'Fixed Deposit', 250000.00, 200000.00, '2022-09-01', 'Investments', 'Fixed Deposit', 'Me', NULL, 'Maturity: Sep 2027 @7.5%'),
  ('a1000000-0000-0000-0000-000000000010', 'PPF Account', 'PPF', 420000.00, 350000.00, '2018-04-01', 'Investments', 'PPF', 'Me', NULL, 'Matures Apr 2033')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 3: LIABILITIES
-- Scenarios: Home Loan, Personal Loan, Credit Card Debt, Borrowed from Friend
-- ============================================================
INSERT INTO public.liabilities (party, party_type, total_amount, remaining, interest_paid, notes) VALUES
  ('SBI Home Loan', 'Bank', 2800000.00, 2100000.00, 450000.00, 'EMI ₹24,500/mo — 10yr remaining'),
  ('HDFC Personal Loan', 'Bank', 300000.00, 175000.00, 42000.00, 'EMI ₹9,800/mo — 18mo remaining'),
  ('HDFC Credit Card Dues', 'Credit Card', 38000.00, 38000.00, 0.00, 'Pay by 5th of every month'),
  ('Raj (Friend)', 'Personal', 25000.00, 25000.00, 0.00, 'Borrowed for emergency in Jan 2026')
ON CONFLICT (party) DO UPDATE SET
  remaining = EXCLUDED.remaining,
  notes = EXCLUDED.notes;

-- ============================================================
-- SECTION 4: HISTORY EXPENSES (6 months of transactions)
-- Scenarios: Expense, Income, Transfer
-- Categories: Food, Transport, Groceries, Entertainment, Medical, Utilities, Rent, Salary, Freelance, Investment SIP
-- ============================================================

-- JANUARY 2026
INSERT INTO public.history_expenses (date, amount, type, account, category, subcategory, particular, vendor, place, notes) VALUES
  ('2026-01-01', 850.00, 'Expense', 'HDFC Savings', 'Food & Dining', 'Restaurant', 'New Year dinner', 'Spice Garden', 'Chennai', 'Family celebration'),
  ('2026-01-02', 3200.00, 'Expense', 'HDFC Savings', 'Groceries', 'Supermarket', 'Monthly groceries', 'Big Basket', 'Online', NULL),
  ('2026-01-03', 500.00, 'Expense', 'Axis Wallet', 'Transport', 'Cab', 'Office commute', 'Ola', 'Chennai', NULL),
  ('2026-01-05', 90000.00, 'Income', 'HDFC Savings', 'Income', 'Salary', 'January salary', 'Employer Inc', NULL, 'Net salary credited'),
  ('2026-01-06', 24500.00, 'Expense', 'HDFC Savings', 'Loans', 'Home Loan EMI', 'SBI EMI Jan', 'SBI Bank', NULL, NULL),
  ('2026-01-06', 9800.00, 'Expense', 'HDFC Savings', 'Loans', 'Personal Loan EMI', 'HDFC PL EMI Jan', 'HDFC Bank', NULL, NULL),
  ('2026-01-08', 1200.00, 'Expense', 'HDFC Savings', 'Utilities', 'Electricity', 'EB bill January', 'TNEB', 'Chennai', NULL),
  ('2026-01-10', 450.00, 'Expense', 'Axis Wallet', 'Food & Dining', 'Swiggy', 'Lunch delivery', 'Swiggy', 'Chennai', NULL),
  ('2026-01-12', 15000.00, 'Expense', 'HDFC Savings', 'Investments', 'SIP', 'Mutual Fund SIP', 'HDFC AMC', NULL, 'Auto-debit SIP'),
  ('2026-01-14', 2500.00, 'Expense', 'HDFC Credit Card', 'Shopping', 'Clothing', 'Winter clothes', 'Myntra', 'Online', NULL),
  ('2026-01-15', 800.00, 'Expense', 'HDFC Savings', 'Utilities', 'Mobile Recharge', 'Jio postpaid', 'Jio', NULL, NULL),
  ('2026-01-18', 25000.00, 'Income', 'ICICI Current', 'Income', 'Freelance', 'Website project payment', 'Client A', NULL, 'Balance payment'),
  ('2026-01-20', 3500.00, 'Expense', 'HDFC Credit Card', 'Entertainment', 'OTT + Subscriptions', 'Netflix, Spotify, Notion', 'Various', 'Online', 'Annual plans'),
  ('2026-01-22', 750.00, 'Expense', 'Axis Wallet', 'Food & Dining', 'Cafe', 'Team lunch', 'Starbucks', 'Chennai', NULL),
  ('2026-01-25', 5000.00, 'Expense', 'HDFC Savings', 'Medical', 'Doctor Visit', 'Health checkup', 'Apollo Clinic', 'Chennai', 'Annual checkup'),
  ('2026-01-28', 1800.00, 'Expense', 'HDFC Savings', 'Transport', 'Fuel', 'Car petrol', 'Indian Oil', 'Chennai', NULL),
  ('2026-01-30', 38000.00, 'Expense', 'HDFC Savings', 'Loans', 'Credit Card Payment', 'HDFC CC bill payment', 'HDFC Bank', NULL, 'Full bill payment'),
  ('2026-01-31', 20000.00, 'Transfer', 'HDFC Savings', 'Transfer', 'Internal Transfer', 'Transfer to SBI', 'SBI Bank', NULL, 'Monthly savings transfer');

-- FEBRUARY 2026
INSERT INTO public.history_expenses (date, amount, type, account, category, subcategory, particular, vendor, place, notes) VALUES
  ('2026-02-01', 3100.00, 'Expense', 'HDFC Savings', 'Groceries', 'Supermarket', 'Monthly groceries', 'Big Basket', 'Online', NULL),
  ('2026-02-03', 1400.00, 'Expense', 'HDFC Credit Card', 'Entertainment', 'Movie', 'Valentine movie date', 'PVR Cinemas', 'Chennai', NULL),
  ('2026-02-05', 90000.00, 'Income', 'HDFC Savings', 'Income', 'Salary', 'February salary', 'Employer Inc', NULL, NULL),
  ('2026-02-06', 24500.00, 'Expense', 'HDFC Savings', 'Loans', 'Home Loan EMI', 'SBI EMI Feb', 'SBI Bank', NULL, NULL),
  ('2026-02-06', 9800.00, 'Expense', 'HDFC Savings', 'Loans', 'Personal Loan EMI', 'HDFC PL EMI Feb', 'HDFC Bank', NULL, NULL),
  ('2026-02-10', 1100.00, 'Expense', 'HDFC Savings', 'Utilities', 'Electricity', 'EB bill February', 'TNEB', 'Chennai', NULL),
  ('2026-02-12', 12000.00, 'Expense', 'HDFC Savings', 'Investments', 'SIP', 'Mutual Fund SIP', 'HDFC AMC', NULL, NULL),
  ('2026-02-14', 4500.00, 'Expense', 'HDFC Credit Card', 'Food & Dining', 'Restaurant', 'Valentines Day dinner', 'The Park Hotel', 'Chennai', 'Special occasion'),
  ('2026-02-16', 2800.00, 'Expense', 'HDFC Credit Card', 'Shopping', 'Electronics', 'Bluetooth earphones', 'Amazon', 'Online', NULL),
  ('2026-02-18', 600.00, 'Expense', 'Axis Wallet', 'Transport', 'Cab', 'Weekend outing', 'Uber', 'Chennai', NULL),
  ('2026-02-20', 50000.00, 'Income', 'ICICI Current', 'Income', 'Freelance', 'App development milestone', 'Client B', NULL, NULL),
  ('2026-02-22', 3000.00, 'Expense', 'HDFC Savings', 'Medical', 'Pharmacy', 'Medicines', 'Apollo Pharmacy', 'Chennai', NULL),
  ('2026-02-25', 800.00, 'Expense', 'HDFC Savings', 'Utilities', 'Mobile Recharge', 'Jio postpaid', 'Jio', NULL, NULL),
  ('2026-02-28', 35000.00, 'Expense', 'HDFC Savings', 'Loans', 'Credit Card Payment', 'HDFC CC bill payment', 'HDFC Bank', NULL, 'Partial payment');

-- MARCH 2026
INSERT INTO public.history_expenses (date, amount, type, account, category, subcategory, particular, vendor, place, notes) VALUES
  ('2026-03-01', 2900.00, 'Expense', 'HDFC Savings', 'Groceries', 'Supermarket', 'Monthly groceries', 'Zepto', 'Online', NULL),
  ('2026-03-01', 1500.00, 'Expense', 'HDFC Savings', 'Groceries', 'Vegetables', 'Weekly vegetables', 'Local Market', 'Chennai', NULL),
  ('2026-03-05', 90000.00, 'Income', 'HDFC Savings', 'Income', 'Salary', 'March salary', 'Employer Inc', NULL, NULL),
  ('2026-03-05', 5000.00, 'Income', 'HDFC Savings', 'Income', 'Bonus', 'Performance bonus Q4', 'Employer Inc', NULL, 'Quarterly bonus'),
  ('2026-03-06', 24500.00, 'Expense', 'HDFC Savings', 'Loans', 'Home Loan EMI', 'SBI EMI Mar', 'SBI Bank', NULL, NULL),
  ('2026-03-06', 9800.00, 'Expense', 'HDFC Savings', 'Loans', 'Personal Loan EMI', 'HDFC PL EMI Mar', 'HDFC Bank', NULL, NULL),
  ('2026-03-10', 8500.00, 'Expense', 'HDFC Credit Card', 'Shopping', 'Clothing', 'Holi shopping', 'Myntra', 'Online', NULL),
  ('2026-03-12', 15000.00, 'Expense', 'HDFC Savings', 'Investments', 'SIP', 'Mutual Fund SIP', 'HDFC AMC', NULL, NULL),
  ('2026-03-15', 12000.00, 'Expense', 'HDFC Credit Card', 'Travel', 'Flight', 'Madurai trip tickets', 'IndiGo', 'Online', 'Return tickets for 2'),
  ('2026-03-16', 3500.00, 'Expense', 'HDFC Credit Card', 'Travel', 'Hotel', 'Hotel stay 2 nights', 'OYO Rooms', 'Madurai', NULL),
  ('2026-03-18', 2200.00, 'Expense', 'Axis Wallet', 'Food & Dining', 'Restaurant', 'Family lunch Madurai', 'Murugan Idli Shop', 'Madurai', NULL),
  ('2026-03-20', 1800.00, 'Expense', 'HDFC Savings', 'Transport', 'Fuel', 'Car petrol', 'HP Petrol Pump', 'Chennai', NULL),
  ('2026-03-22', 1300.00, 'Expense', 'HDFC Savings', 'Utilities', 'Electricity', 'EB bill March', 'TNEB', 'Chennai', NULL),
  ('2026-03-25', 800.00, 'Expense', 'HDFC Savings', 'Utilities', 'Mobile Recharge', 'Jio postpaid', 'Jio', NULL, NULL),
  ('2026-03-28', 42000.00, 'Expense', 'HDFC Savings', 'Loans', 'Credit Card Payment', 'HDFC CC bill payment', 'HDFC Bank', NULL, 'Full payment'),
  ('2026-03-30', 25000.00, 'Transfer', 'HDFC Savings', 'Transfer', 'Internal Transfer', 'SBI savings', 'SBI Bank', NULL, NULL);

-- APRIL 2026
INSERT INTO public.history_expenses (date, amount, type, account, category, subcategory, particular, vendor, place, notes) VALUES
  ('2026-04-01', 3300.00, 'Expense', 'HDFC Savings', 'Groceries', 'Supermarket', 'Monthly groceries', 'Big Basket', 'Online', NULL),
  ('2026-04-05', 90000.00, 'Income', 'HDFC Savings', 'Income', 'Salary', 'April salary', 'Employer Inc', NULL, NULL),
  ('2026-04-05', 22000.00, 'Income', 'ICICI Current', 'Income', 'Freelance', 'Consulting fee April', 'Client C', NULL, NULL),
  ('2026-04-06', 24500.00, 'Expense', 'HDFC Savings', 'Loans', 'Home Loan EMI', 'SBI EMI Apr', 'SBI Bank', NULL, NULL),
  ('2026-04-06', 9800.00, 'Expense', 'HDFC Savings', 'Loans', 'Personal Loan EMI', 'HDFC PL EMI Apr', 'HDFC Bank', NULL, NULL),
  ('2026-04-08', 45000.00, 'Expense', 'HDFC Savings', 'Medical', 'Hospital', 'Surgery hospitalization', 'Apollo Hospital', 'Chennai', 'Emergency appendix surgery'),
  ('2026-04-10', 15000.00, 'Expense', 'HDFC Savings', 'Investments', 'SIP', 'Mutual Fund SIP', 'HDFC AMC', NULL, NULL),
  ('2026-04-12', 8000.00, 'Expense', 'HDFC Credit Card', 'Medical', 'Pharmacy', 'Post-surgery medications', 'MedPlus', 'Chennai', NULL),
  ('2026-04-15', 1400.00, 'Expense', 'HDFC Savings', 'Utilities', 'Electricity', 'EB bill April', 'TNEB', 'Chennai', 'High due to AC usage'),
  ('2026-04-18', 4500.00, 'Expense', 'HDFC Credit Card', 'Shopping', 'Electronics', 'Smart watch purchase', 'Amazon', 'Online', NULL),
  ('2026-04-20', 800.00, 'Expense', 'HDFC Savings', 'Utilities', 'Mobile Recharge', 'Jio postpaid', 'Jio', NULL, NULL),
  ('2026-04-22', 1200.00, 'Expense', 'Axis Wallet', 'Transport', 'Cab', 'Hospital visits', 'Ola', 'Chennai', 'Multiple post-op visits'),
  ('2026-04-28', 32000.00, 'Expense', 'HDFC Savings', 'Loans', 'Credit Card Payment', 'HDFC CC bill payment', 'HDFC Bank', NULL, 'Partial payment'),
  ('2026-04-30', 1500.00, 'Expense', 'HDFC Savings', 'Groceries', 'Vegetables', 'Monthly veg shopping', 'Local Market', 'Chennai', NULL);

-- MAY 2026
INSERT INTO public.history_expenses (date, amount, type, account, category, subcategory, particular, vendor, place, notes) VALUES
  ('2026-05-01', 3000.00, 'Expense', 'HDFC Savings', 'Groceries', 'Supermarket', 'Monthly groceries', 'Zepto', 'Online', NULL),
  ('2026-05-05', 90000.00, 'Income', 'HDFC Savings', 'Income', 'Salary', 'May salary', 'Employer Inc', NULL, NULL),
  ('2026-05-06', 24500.00, 'Expense', 'HDFC Savings', 'Loans', 'Home Loan EMI', 'SBI EMI May', 'SBI Bank', NULL, NULL),
  ('2026-05-06', 9800.00, 'Expense', 'HDFC Savings', 'Loans', 'Personal Loan EMI', 'HDFC PL EMI May', 'HDFC Bank', NULL, NULL),
  ('2026-05-08', 6500.00, 'Expense', 'HDFC Credit Card', 'Shopping', 'Clothing', 'Summer wardrobe', 'H&M', 'Chennai', NULL),
  ('2026-05-10', 15000.00, 'Expense', 'HDFC Savings', 'Investments', 'SIP', 'Mutual Fund SIP', 'HDFC AMC', NULL, NULL),
  ('2026-05-12', 900.00, 'Expense', 'HDFC Savings', 'Utilities', 'Internet', 'Broadband bill', 'Airtel Fiber', 'Chennai', NULL),
  ('2026-05-14', 1600.00, 'Expense', 'HDFC Savings', 'Utilities', 'Electricity', 'EB bill May', 'TNEB', 'Chennai', 'Summer peak usage'),
  ('2026-05-16', 2200.00, 'Expense', 'HDFC Credit Card', 'Entertainment', 'Weekend Trip', 'Pondicherry day trip', 'Various', 'Pondicherry', NULL),
  ('2026-05-18', 35000.00, 'Income', 'ICICI Current', 'Income', 'Freelance', 'UI/UX design project', 'Client D', NULL, NULL),
  ('2026-05-20', 800.00, 'Expense', 'HDFC Savings', 'Utilities', 'Mobile Recharge', 'Jio postpaid', 'Jio', NULL, NULL),
  ('2026-05-22', 1900.00, 'Expense', 'HDFC Savings', 'Transport', 'Fuel', 'Car petrol', 'Indian Oil', 'Chennai', NULL),
  ('2026-05-24', 650.00, 'Expense', 'Axis Wallet', 'Food & Dining', 'Swiggy', 'Dinner delivery', 'Swiggy', 'Chennai', NULL),
  ('2026-05-27', 12000.00, 'Expense', 'HDFC Credit Card', 'Education', 'Online Course', 'AWS certification course', 'Udemy', 'Online', NULL),
  ('2026-05-28', 36000.00, 'Expense', 'HDFC Savings', 'Loans', 'Credit Card Payment', 'HDFC CC bill payment', 'HDFC Bank', NULL, NULL),
  ('2026-05-30', 5000.00, 'Expense', 'HDFC Savings', 'Gifts', 'Birthday Gift', 'Sister birthday gift', 'Tanishq', 'Chennai', NULL);

-- JUNE 2026
INSERT INTO public.history_expenses (date, amount, type, account, category, subcategory, particular, vendor, place, notes) VALUES
  ('2026-06-01', 3500.00, 'Expense', 'HDFC Savings', 'Groceries', 'Supermarket', 'Monthly groceries', 'Big Basket', 'Online', NULL),
  ('2026-06-03', 1600.00, 'Expense', 'HDFC Savings', 'Groceries', 'Vegetables', 'Weekly vegetables', 'Local Market', 'Chennai', NULL),
  ('2026-06-05', 90000.00, 'Income', 'HDFC Savings', 'Income', 'Salary', 'June salary', 'Employer Inc', NULL, NULL),
  ('2026-06-06', 24500.00, 'Expense', 'HDFC Savings', 'Loans', 'Home Loan EMI', 'SBI EMI Jun', 'SBI Bank', NULL, NULL),
  ('2026-06-06', 9800.00, 'Expense', 'HDFC Savings', 'Loans', 'Personal Loan EMI', 'HDFC PL EMI Jun', 'HDFC Bank', NULL, NULL),
  ('2026-06-08', 15000.00, 'Expense', 'HDFC Savings', 'Investments', 'SIP', 'Mutual Fund SIP', 'HDFC AMC', NULL, NULL),
  ('2026-06-10', 1850.00, 'Expense', 'HDFC Savings', 'Utilities', 'Electricity', 'EB bill June', 'TNEB', 'Chennai', 'Peak summer'),
  ('2026-06-12', 45000.00, 'Income', 'ICICI Current', 'Income', 'Freelance', 'Mobile app project final payment', 'Client B', NULL, NULL),
  ('2026-06-14', 3200.00, 'Expense', 'HDFC Credit Card', 'Entertainment', 'Movie + Dining', 'Movie & dinner', 'PVR + Barbeque Nation', 'Chennai', NULL),
  ('2026-06-16', 800.00, 'Expense', 'HDFC Savings', 'Utilities', 'Mobile Recharge', 'Jio postpaid', 'Jio', NULL, NULL),
  ('2026-06-18', 22000.00, 'Expense', 'HDFC Credit Card', 'Shopping', 'Electronics', 'iPad purchase for work', 'Apple Store', 'Chennai', NULL),
  ('2026-06-20', 1700.00, 'Expense', 'HDFC Savings', 'Transport', 'Fuel', 'Car petrol', 'HP Petrol Pump', 'Chennai', NULL),
  ('2026-06-22', 2800.00, 'Expense', 'HDFC Credit Card', 'Food & Dining', 'Restaurant', 'Dinner with clients', 'ITC Grand Chola', 'Chennai', 'Business expense'),
  ('2026-06-24', 5500.00, 'Expense', 'HDFC Savings', 'Medical', 'Health Insurance', 'Annual health insurance premium', 'Star Health', NULL, NULL),
  ('2026-06-26', 38000.00, 'Expense', 'HDFC Savings', 'Loans', 'Credit Card Payment', 'HDFC CC bill Jun', 'HDFC Bank', NULL, NULL);

-- ============================================================
-- SECTION 5: HISTORY LIABILITIES
-- Scenarios: Principal payment, Interest payment, Borrowed
-- ============================================================
INSERT INTO public.history_liabilities (date, amount, type, account, party, party_type, notes) VALUES
  ('2026-01-06', 18000.00, 'Principal', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI principal component Jan'),
  ('2026-01-06', 6500.00, 'Interest', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI interest component Jan'),
  ('2026-01-06', 7200.00, 'Principal', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL principal component Jan'),
  ('2026-01-06', 2600.00, 'Interest', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL interest component Jan'),
  ('2026-01-15', 25000.00, 'Borrowed', 'Cash in Hand', 'Raj (Friend)', 'Personal', 'Emergency medical advance'),
  ('2026-02-06', 18200.00, 'Principal', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI principal component Feb'),
  ('2026-02-06', 6300.00, 'Interest', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI interest component Feb'),
  ('2026-02-06', 7400.00, 'Principal', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL principal component Feb'),
  ('2026-02-06', 2400.00, 'Interest', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL interest component Feb'),
  ('2026-03-06', 18400.00, 'Principal', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI principal component Mar'),
  ('2026-03-06', 6100.00, 'Interest', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI interest component Mar'),
  ('2026-03-06', 7600.00, 'Principal', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL principal component Mar'),
  ('2026-03-06', 2200.00, 'Interest', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL interest component Mar'),
  ('2026-04-06', 18600.00, 'Principal', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI principal component Apr'),
  ('2026-04-06', 5900.00, 'Interest', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI interest component Apr'),
  ('2026-04-06', 7800.00, 'Principal', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL principal component Apr'),
  ('2026-04-06', 2000.00, 'Interest', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL interest component Apr'),
  ('2026-05-06', 18800.00, 'Principal', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI principal component May'),
  ('2026-05-06', 5700.00, 'Interest', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI interest component May'),
  ('2026-05-06', 8000.00, 'Principal', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL principal component May'),
  ('2026-05-06', 1800.00, 'Interest', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL interest component May'),
  ('2026-06-06', 19000.00, 'Principal', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI principal component Jun'),
  ('2026-06-06', 5500.00, 'Interest', 'HDFC Savings', 'SBI Home Loan', 'Bank', 'EMI interest component Jun'),
  ('2026-06-06', 8200.00, 'Principal', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL principal component Jun'),
  ('2026-06-06', 1600.00, 'Interest', 'HDFC Savings', 'HDFC Personal Loan', 'Bank', 'PL interest component Jun');

-- ============================================================
-- SECTION 6: TASKS
-- Scenarios: Pending, Completed, Today tasks, Week tasks, Inbox tasks, High priority, Sub-tasks
-- ============================================================
INSERT INTO public.tasks (id, task, status, is_today, is_week, is_inbox, is_high_priority, notes, completed_at) VALUES
  -- Today + High Priority
  ('t001', 'Review Q2 financial report', 'Pending', TRUE, TRUE, FALSE, TRUE, 'Share with CFO by EOD', NULL),
  ('t002', 'Call SBI for home loan statement', 'Pending', TRUE, FALSE, FALSE, TRUE, 'Request e-statement for tax filing', NULL),
  ('t003', 'Pay credit card bill', 'Pending', TRUE, FALSE, FALSE, TRUE, 'Due today — HDFC ₹38,000', NULL),
  
  -- Today normal
  ('t004', 'Morning workout session', 'Completed', TRUE, TRUE, FALSE, FALSE, NULL, '2026-06-27 07:30:00+05:30'),
  ('t005', 'Buy groceries from Big Basket', 'Pending', TRUE, FALSE, FALSE, FALSE, 'Milk, eggs, vegetables', NULL),
  ('t006', 'Schedule car service appointment', 'Pending', TRUE, FALSE, FALSE, FALSE, 'Check Maruti service center availability', NULL),
  
  -- Week tasks
  ('t007', 'Complete AWS certification module 5', 'Pending', FALSE, TRUE, FALSE, FALSE, 'Due by Friday', NULL),
  ('t008', 'Send project proposal to Client E', 'Pending', FALSE, TRUE, FALSE, TRUE, 'New ₹1.5L project', NULL),
  ('t009', 'Review insurance renewal options', 'Pending', FALSE, TRUE, FALSE, FALSE, 'Star Health premium due Jun 24', NULL),
  ('t010', 'Update household inventory list', 'Pending', FALSE, TRUE, FALSE, FALSE, NULL, NULL),
  
  -- Inbox (captured, not classified yet)
  ('t011', 'Research electric vehicle options', 'Pending', FALSE, FALSE, TRUE, FALSE, 'Tata Nexon EV vs Ola S1', NULL),
  ('t012', 'Look into PPF additional contribution', 'Pending', FALSE, FALSE, TRUE, FALSE, 'Max ₹1.5L per year', NULL),
  ('t013', 'Dentist appointment', 'Pending', FALSE, FALSE, TRUE, FALSE, NULL, NULL),
  ('t014', 'Fix leaking bathroom tap', 'Pending', FALSE, FALSE, TRUE, FALSE, 'Call plumber', NULL),
  
  -- Completed tasks
  ('t015', 'File ITR for FY 2024-25', 'Completed', FALSE, FALSE, FALSE, TRUE, 'Submitted on Jul 31 deadline', '2025-07-31 16:00:00+05:30'),
  ('t016', 'Open PPF account', 'Completed', FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-01 10:00:00+05:30'),
  ('t017', 'Setup SIP for HDFC fund', 'Completed', FALSE, FALSE, FALSE, FALSE, '₹15,000/mo auto-debit', '2025-06-15 11:00:00+05:30'),
  ('t018', 'Renew car insurance', 'Completed', FALSE, FALSE, FALSE, TRUE, 'Renewed for 2026-2027', '2025-11-15 15:00:00+05:30'),
  ('t019', 'Buy home UPS/inverter', 'Completed', FALSE, FALSE, FALSE, FALSE, 'Luminous 1KVA purchased', '2026-02-10 12:00:00+05:30'),
  ('t020', 'Plan Madurai family trip', 'Completed', FALSE, FALSE, FALSE, FALSE, 'Trip completed March 15-18', '2026-03-10 09:00:00+05:30');

-- Sub-tasks
INSERT INTO public.tasks (id, parent_id, task, status, is_today, is_week, is_inbox, is_high_priority) VALUES
  ('t002a', 't002', 'Find loan account number', 'Completed', TRUE, FALSE, FALSE, FALSE),
  ('t002b', 't002', 'Download last 6 months statement', 'Pending', TRUE, FALSE, FALSE, FALSE),
  ('t007a', 't007', 'Watch module 5 video lectures', 'Pending', FALSE, TRUE, FALSE, FALSE),
  ('t007b', 't007', 'Complete practice labs', 'Pending', FALSE, TRUE, FALSE, FALSE),
  ('t007c', 't007', 'Take mock exam', 'Pending', FALSE, TRUE, FALSE, FALSE);

-- ============================================================
-- SECTION 7: BUDGET PLANS (6 months)
-- Scenarios: Under budget, Over budget, No entries for some subcategories
-- ============================================================
DO $$
DECLARE
  months DATE[] := ARRAY[
    '2026-01-01', '2026-02-01', '2026-03-01',
    '2026-04-01', '2026-05-01', '2026-06-01'
  ];
  m DATE;
BEGIN
  FOREACH m IN ARRAY months LOOP
    INSERT INTO public.budget_plans (category, subcategory, month, planned_amount) VALUES
      ('Food & Dining', 'Restaurant', m, 2000.00),
      ('Food & Dining', 'Swiggy', m, 1000.00),
      ('Food & Dining', 'Cafe', m, 500.00),
      ('Groceries', 'Supermarket', m, 3500.00),
      ('Groceries', 'Vegetables', m, 1500.00),
      ('Transport', 'Fuel', m, 2000.00),
      ('Transport', 'Cab', m, 800.00),
      ('Utilities', 'Electricity', m, 1500.00),
      ('Utilities', 'Mobile Recharge', m, 900.00),
      ('Utilities', 'Internet', m, 900.00),
      ('Shopping', 'Clothing', m, 3000.00),
      ('Shopping', 'Electronics', m, 2000.00),
      ('Entertainment', 'Movie', m, 500.00),
      ('Entertainment', 'OTT + Subscriptions', m, 400.00),
      ('Medical', 'Doctor Visit', m, 1000.00),
      ('Medical', 'Pharmacy', m, 500.00),
      ('Investments', 'SIP', m, 15000.00),
      ('Loans', 'Home Loan EMI', m, 24500.00),
      ('Loans', 'Personal Loan EMI', m, 9800.00),
      ('Loans', 'Credit Card Payment', m, 40000.00),
      ('Education', 'Online Course', m, 0.00),
      ('Travel', 'Flight', m, 0.00),
      ('Gifts', 'Birthday Gift', m, 0.00)
    ON CONFLICT (category, subcategory, month) DO NOTHING;
  END LOOP;
END $$;

-- March has higher travel budget
UPDATE public.budget_plans SET planned_amount = 15000.00 WHERE category = 'Travel' AND subcategory = 'Flight' AND month = '2026-03-01';
UPDATE public.budget_plans SET planned_amount = 5000.00 WHERE category = 'Travel' AND subcategory = 'Hotel' AND month = '2026-03-01';
-- Add missing hotel row for march
INSERT INTO public.budget_plans (category, subcategory, month, planned_amount) VALUES ('Travel', 'Hotel', '2026-03-01', 5000.00) ON CONFLICT DO NOTHING;
-- May has education budget
UPDATE public.budget_plans SET planned_amount = 15000.00 WHERE category = 'Education' AND subcategory = 'Online Course' AND month = '2026-05-01';
-- May has medical spike (hospitalization in April bleeds into May pharmacy)
UPDATE public.budget_plans SET planned_amount = 10000.00 WHERE category = 'Medical' AND subcategory = 'Pharmacy' AND month = '2026-04-01';
UPDATE public.budget_plans SET planned_amount = 50000.00 WHERE category = 'Medical' AND subcategory = 'Hospital' AND month = '2026-04-01';
INSERT INTO public.budget_plans (category, subcategory, month, planned_amount) VALUES ('Medical', 'Hospital', '2026-04-01', 50000.00) ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 8: HABIT CONFIG
-- Scenarios: boolean habits, numeric habits, daily vs event frequency
-- Conditions: at_least_n, at_most_n, boolean; directions: more, less
-- unlogged_is_success: TRUE for "avoid" habits
-- ============================================================
INSERT INTO public.habit_config (
  id, habit_name, group_name, input_type, unit, frequency, emoji,
  group_order, daily_habit_order, habit_color, unlogged_is_success,
  condition_type, direction, target_value, suc_min, suc_max
) VALUES
  -- Health Group
  ('ac000001-0000-0000-0000-000000000001', 'Morning Run', 'Health', 'boolean', NULL, 'daily', '🏃', 1, 1, '#10b981', FALSE, 'at_least_n', 'more', 1, NULL, NULL),
  ('ac000001-0000-0000-0000-000000000002', 'Steps', 'Health', 'numeric', 'steps', 'daily', '👟', 1, 2, '#3b82f6', FALSE, 'at_least_n', 'more', 8000, 8000, NULL),
  ('ac000001-0000-0000-0000-000000000003', 'Water Intake', 'Health', 'numeric', 'glasses', 'daily', '💧', 1, 3, '#06b6d4', FALSE, 'at_least_n', 'more', 8, 8, NULL),
  ('ac000001-0000-0000-0000-000000000004', 'Sleep Hours', 'Health', 'numeric', 'hours', 'daily', '😴', 1, 4, '#8b5cf6', FALSE, 'between', 'more', 7.5, 7, 9),
  ('ac000001-0000-0000-0000-000000000005', 'Meditation', 'Health', 'boolean', NULL, 'daily', '🧘', 1, 5, '#f59e0b', FALSE, 'at_least_n', 'more', 1, NULL, NULL),

  -- Avoid Group
  ('ac000001-0000-0000-0000-000000000006', 'Junk Food', 'Avoid', 'boolean', NULL, 'daily', '🍔', 2, 1, '#ef4444', TRUE, 'at_least_n', 'less', 0, NULL, NULL),
  ('ac000001-0000-0000-0000-000000000007', 'Social Media (mins)', 'Avoid', 'numeric', 'mins', 'daily', '📱', 2, 2, '#f97316', FALSE, 'at_most_n', 'less', 30, NULL, 30),
  ('ac000001-0000-0000-0000-000000000008', 'Alcohol', 'Avoid', 'boolean', NULL, 'daily', '🍺', 2, 3, '#dc2626', TRUE, 'at_least_n', 'less', 0, NULL, NULL),

  -- Productivity Group
  ('ac000001-0000-0000-0000-000000000009', 'Deep Work', 'Productivity', 'numeric', 'hours', 'daily', '💻', 3, 1, '#6366f1', FALSE, 'at_least_n', 'more', 4, 4, NULL),
  ('ac000001-0000-0000-0000-000000000010', 'Read', 'Productivity', 'numeric', 'pages', 'daily', '📚', 3, 2, '#14b8a6', FALSE, 'at_least_n', 'more', 20, 20, NULL),
  ('ac000001-0000-0000-0000-000000000011', 'Journaling', 'Productivity', 'boolean', NULL, 'daily', '✍️', 3, 3, '#a855f7', FALSE, 'at_least_n', 'more', 1, NULL, NULL),

  -- Events (non-daily)
  ('ac000001-0000-0000-0000-000000000012', 'Workout', 'Health', 'boolean', NULL, 'event', '💪', 1, 6, '#22c55e', FALSE, 'at_least_n', 'more', 1, NULL, NULL),
  ('ac000001-0000-0000-0000-000000000013', 'Cold Shower', 'Health', 'boolean', NULL, 'daily', '🚿', 1, 7, '#38bdf8', FALSE, 'at_least_n', 'more', 1, NULL, NULL)

ON CONFLICT (habit_name) DO NOTHING;

-- ============================================================
-- SECTION 9: HABIT DATA (6 months of daily logs)
-- Scenarios: Success, Failure, Not Entered, various numeric values
-- ============================================================
DO $$
DECLARE
  d DATE;
  day_num INTEGER;
BEGIN
  d := '2026-01-01';
  WHILE d <= '2026-06-27' LOOP
    day_num := EXTRACT(DOW FROM d); -- 0=Sun, 1=Mon... 6=Sat
    
    -- Morning Run: Success on weekdays, sometimes miss on weekends
    IF day_num BETWEEN 1 AND 5 THEN
      INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
      VALUES (d, 'Morning Run', '1', CASE WHEN EXTRACT(DAY FROM d) % 7 = 0 THEN 'Failure' ELSE 'Success' END, 'Health', NULL, 'daily')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Steps (random 6000-14000)
    INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
    VALUES (d, 'Steps', ((6000 + (EXTRACT(DAY FROM d)::int * 271 + EXTRACT(MONTH FROM d)::int * 43) % 8000))::text,
      CASE WHEN (6000 + (EXTRACT(DAY FROM d)::int * 271 + EXTRACT(MONTH FROM d)::int * 43) % 8000) >= 8000 THEN 'Success' ELSE 'Failure' END,
      'Health', 'steps', 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Water (4-10 glasses, generally success)
    INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
    VALUES (d, 'Water Intake', ((4 + (EXTRACT(DAY FROM d)::int * 3 + EXTRACT(MONTH FROM d)::int) % 7))::text,
      CASE WHEN (4 + (EXTRACT(DAY FROM d)::int * 3 + EXTRACT(MONTH FROM d)::int) % 7) >= 8 THEN 'Success' ELSE 'Failure' END,
      'Health', 'glasses', 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Sleep (6-9 hours)
    INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
    VALUES (d, 'Sleep Hours', ((5 + (EXTRACT(DAY FROM d)::int + EXTRACT(MONTH FROM d)::int) % 5))::text,
      CASE WHEN (5 + (EXTRACT(DAY FROM d)::int + EXTRACT(MONTH FROM d)::int) % 5) BETWEEN 7 AND 9 THEN 'Success' ELSE 'Failure' END,
      'Health', 'hours', 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Meditation: 70% success rate
    IF (EXTRACT(DAY FROM d)::int + EXTRACT(MONTH FROM d)::int) % 10 > 3 THEN
      INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
      VALUES (d, 'Meditation', '1', 'Success', 'Health', NULL, 'daily')
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
      VALUES (d, 'Meditation', '0', 'Failure', 'Health', NULL, 'daily')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Junk Food: unlogged_is_success=TRUE, so only log failures (when ate junk food)
    IF EXTRACT(DAY FROM d)::int % 5 = 0 THEN
      INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
      VALUES (d, 'Junk Food', '1', 'Failure', 'Avoid', NULL, 'daily')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Social Media (minutes): often over limit
    INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
    VALUES (d, 'Social Media (mins)', ((15 + (EXTRACT(DAY FROM d)::int * 7) % 90))::text,
      CASE WHEN (15 + (EXTRACT(DAY FROM d)::int * 7) % 90) <= 30 THEN 'Success' ELSE 'Failure' END,
      'Avoid', 'mins', 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Deep Work hours: 2-6 hours
    INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
    VALUES (d, 'Deep Work', ((2 + (EXTRACT(DAY FROM d)::int * 2 + EXTRACT(MONTH FROM d)::int) % 5))::text,
      CASE WHEN (2 + (EXTRACT(DAY FROM d)::int * 2 + EXTRACT(MONTH FROM d)::int) % 5) >= 4 THEN 'Success' ELSE 'Failure' END,
      'Productivity', 'hours', 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Read: 0-40 pages
    INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
    VALUES (d, 'Read', ((EXTRACT(DAY FROM d)::int * 11 % 45))::text,
      CASE WHEN (EXTRACT(DAY FROM d)::int * 11 % 45) >= 20 THEN 'Success' ELSE 'Failure' END,
      'Productivity', 'pages', 'daily')
    ON CONFLICT DO NOTHING;
    
    -- Cold Shower: 80% success
    IF EXTRACT(DAY FROM d)::int % 5 != 2 THEN
      INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
      VALUES (d, 'Cold Shower', '1', 'Success', 'Health', NULL, 'daily')
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.habit_data (date, habit, value, status, group_name, unit, source)
      VALUES (d, 'Cold Shower', '0', 'Failure', 'Health', NULL, 'daily')
      ON CONFLICT DO NOTHING;
    END IF;
    
    d := d + INTERVAL '1 day';
  END LOOP;
END $$;

-- ============================================================
-- SECTION 10: EVENT LOG (Habit event entries)
-- Scenarios: Workout sessions logged as events throughout 6 months
-- ============================================================
INSERT INTO public.event_log (date, time, event, value, note) VALUES
  ('2026-01-03', '07:15:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-01-06', '07:30:00', 'Workout', '1', 'Back & Biceps — 50 min'),
  ('2026-01-08', '07:00:00', 'Workout', '1', 'Legs — 40 min'),
  ('2026-01-10', '08:00:00', 'Workout', '1', 'Shoulders — 45 min'),
  ('2026-01-13', '07:15:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-01-17', '07:30:00', 'Workout', '1', 'Back & Biceps — 55 min'),
  ('2026-01-20', '07:00:00', 'Workout', '1', 'Legs — 40 min'),
  ('2026-01-24', '07:00:00', 'Workout', '1', 'Full Body — 60 min'),
  ('2026-01-27', '07:15:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-01-31', '07:30:00', 'Workout', '1', 'Back & Biceps — 50 min'),
  ('2026-02-03', '07:00:00', 'Workout', '1', 'Legs — 40 min'),
  ('2026-02-07', '07:15:00', 'Workout', '1', 'Shoulders — 45 min'),
  ('2026-02-11', '07:30:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-02-14', '08:00:00', 'Workout', '1', 'Arms special — 50 min'),
  ('2026-02-18', '07:00:00', 'Workout', '1', 'Legs — 40 min'),
  ('2026-02-21', '07:15:00', 'Workout', '1', 'Back & Biceps — 55 min'),
  ('2026-02-24', '07:30:00', 'Workout', '1', 'Full Body — 60 min'),
  ('2026-02-28', '07:00:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-03-04', '07:15:00', 'Workout', '1', 'Back & Biceps — 50 min'),
  ('2026-03-08', '07:00:00', 'Workout', '1', 'Legs — 45 min'),
  ('2026-03-11', '07:30:00', 'Workout', '1', 'Shoulders — 40 min'),
  ('2026-03-15', '08:00:00', 'Workout', '1', 'Travel day — skipped'),
  ('2026-03-19', '07:15:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-03-22', '07:30:00', 'Workout', '1', 'Back & Biceps — 50 min'),
  ('2026-03-26', '07:00:00', 'Workout', '1', 'Legs — 40 min'),
  ('2026-03-29', '07:15:00', 'Workout', '1', 'Full Body — 60 min'),
  ('2026-04-02', '07:30:00', 'Workout', '1', 'Chest — pre surgery last'),
  -- April 8-18: hospitalization break (no workout entries)
  ('2026-04-22', '07:00:00', 'Workout', '1', 'Light recovery walk — 20 min'),
  ('2026-04-25', '07:15:00', 'Workout', '1', 'Light upper body — 30 min'),
  ('2026-04-29', '07:30:00', 'Workout', '1', 'Back to routine — 40 min'),
  ('2026-05-02', '07:00:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-05-06', '07:15:00', 'Workout', '1', 'Back & Biceps — 50 min'),
  ('2026-05-09', '07:30:00', 'Workout', '1', 'Legs — 45 min'),
  ('2026-05-13', '07:00:00', 'Workout', '1', 'Shoulders — 40 min'),
  ('2026-05-16', '07:15:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-05-20', '07:30:00', 'Workout', '1', 'Back & Biceps — 55 min'),
  ('2026-05-23', '07:00:00', 'Workout', '1', 'Legs — 45 min'),
  ('2026-05-27', '07:15:00', 'Workout', '1', 'Full Body — 60 min'),
  ('2026-05-30', '07:30:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-06-03', '07:00:00', 'Workout', '1', 'Back & Biceps — 50 min'),
  ('2026-06-06', '07:15:00', 'Workout', '1', 'Legs — 45 min'),
  ('2026-06-10', '07:30:00', 'Workout', '1', 'Shoulders — 40 min'),
  ('2026-06-13', '07:00:00', 'Workout', '1', 'Chest & Triceps — 45 min'),
  ('2026-06-17', '07:15:00', 'Workout', '1', 'Back & Biceps — 55 min'),
  ('2026-06-20', '07:30:00', 'Workout', '1', 'Legs — 45 min'),
  ('2026-06-24', '07:00:00', 'Workout', '1', 'Shoulders — 40 min'),
  ('2026-06-27', '07:15:00', 'Workout', '1', 'Chest & Triceps — 45 min');

-- ============================================================
-- SECTION 11: WORKOUT LOG (Detailed set-by-set gym tracking)
-- Scenarios: Multiple workout days, exercises, weights, reps
-- ============================================================
INSERT INTO public.workout_log (date, workout_day, workout_name, set_no, weight, reps, notes) VALUES
  -- Jan 3 — Chest & Triceps
  ('2026-01-03', 'Chest & Triceps', 'Bench Press', 1, 60, 12, NULL),
  ('2026-01-03', 'Chest & Triceps', 'Bench Press', 2, 70, 10, NULL),
  ('2026-01-03', 'Chest & Triceps', 'Bench Press', 3, 75, 8, 'PR attempt'),
  ('2026-01-03', 'Chest & Triceps', 'Incline Dumbbell Press', 1, 22, 12, NULL),
  ('2026-01-03', 'Chest & Triceps', 'Incline Dumbbell Press', 2, 24, 10, NULL),
  ('2026-01-03', 'Chest & Triceps', 'Tricep Pushdown', 1, 30, 15, NULL),
  ('2026-01-03', 'Chest & Triceps', 'Tricep Pushdown', 2, 35, 12, NULL),
  
  -- Jan 6 — Back & Biceps
  ('2026-01-06', 'Back & Biceps', 'Deadlift', 1, 80, 8, NULL),
  ('2026-01-06', 'Back & Biceps', 'Deadlift', 2, 90, 6, NULL),
  ('2026-01-06', 'Back & Biceps', 'Deadlift', 3, 100, 4, 'Heavy set'),
  ('2026-01-06', 'Back & Biceps', 'Pull Ups', 1, 0, 10, 'Body weight'),
  ('2026-01-06', 'Back & Biceps', 'Pull Ups', 2, 0, 8, NULL),
  ('2026-01-06', 'Back & Biceps', 'Barbell Curl', 1, 30, 12, NULL),
  ('2026-01-06', 'Back & Biceps', 'Barbell Curl', 2, 35, 10, NULL),
  
  -- Jan 8 — Legs
  ('2026-01-08', 'Legs', 'Squat', 1, 70, 12, NULL),
  ('2026-01-08', 'Legs', 'Squat', 2, 80, 10, NULL),
  ('2026-01-08', 'Legs', 'Squat', 3, 85, 8, NULL),
  ('2026-01-08', 'Legs', 'Leg Press', 1, 120, 15, NULL),
  ('2026-01-08', 'Legs', 'Leg Press', 2, 140, 12, NULL),
  ('2026-01-08', 'Legs', 'Calf Raises', 1, 50, 20, NULL),
  
  -- Recent sessions — June 2026
  ('2026-06-03', 'Back & Biceps', 'Deadlift', 1, 100, 8, NULL),
  ('2026-06-03', 'Back & Biceps', 'Deadlift', 2, 110, 6, NULL),
  ('2026-06-03', 'Back & Biceps', 'Deadlift', 3, 120, 4, 'New PR!'),
  ('2026-06-03', 'Back & Biceps', 'Pull Ups', 1, 10, 10, 'Weighted +10kg'),
  ('2026-06-03', 'Back & Biceps', 'Pull Ups', 2, 10, 8, NULL),
  ('2026-06-03', 'Back & Biceps', 'Barbell Curl', 1, 40, 12, 'Progress!'),
  ('2026-06-03', 'Back & Biceps', 'Barbell Curl', 2, 45, 10, NULL),
  
  ('2026-06-06', 'Legs', 'Squat', 1, 90, 12, NULL),
  ('2026-06-06', 'Legs', 'Squat', 2, 100, 10, 'New PR!'),
  ('2026-06-06', 'Legs', 'Squat', 3, 105, 8, NULL),
  ('2026-06-06', 'Legs', 'Leg Press', 1, 160, 15, NULL),
  ('2026-06-06', 'Legs', 'Calf Raises', 1, 60, 20, NULL),
  
  ('2026-06-10', 'Shoulders', 'Overhead Press', 1, 50, 12, NULL),
  ('2026-06-10', 'Shoulders', 'Overhead Press', 2, 55, 10, NULL),
  ('2026-06-10', 'Shoulders', 'Lateral Raises', 1, 14, 15, NULL),
  ('2026-06-10', 'Shoulders', 'Lateral Raises', 2, 16, 12, NULL),
  ('2026-06-10', 'Shoulders', 'Front Raises', 1, 12, 15, NULL),
  
  ('2026-06-13', 'Chest & Triceps', 'Bench Press', 1, 80, 12, NULL),
  ('2026-06-13', 'Chest & Triceps', 'Bench Press', 2, 85, 10, NULL),
  ('2026-06-13', 'Chest & Triceps', 'Bench Press', 3, 90, 8, 'New PR!'),
  ('2026-06-13', 'Chest & Triceps', 'Incline Dumbbell Press', 1, 30, 12, NULL),
  ('2026-06-13', 'Chest & Triceps', 'Incline Dumbbell Press', 2, 32, 10, NULL),
  ('2026-06-13', 'Chest & Triceps', 'Tricep Pushdown', 1, 40, 15, NULL),
  
  ('2026-06-27', 'Chest & Triceps', 'Bench Press', 1, 80, 12, 'Today'),
  ('2026-06-27', 'Chest & Triceps', 'Bench Press', 2, 85, 10, NULL),
  ('2026-06-27', 'Chest & Triceps', 'Incline Dumbbell Press', 1, 30, 12, NULL),
  ('2026-06-27', 'Chest & Triceps', 'Tricep Pushdown', 1, 40, 15, NULL);

-- ============================================================
-- SECTION 12: VEHICLES
-- Scenarios: Car + Bike, Petrol + Diesel, insurance ok/warn/expired, service ok/overdue
-- ============================================================
INSERT INTO public.vehicle_config (id, vehicle_name, registration_number, vehicle_type, fuel_type, initial_odometer, insurance_expiry, next_service_date) VALUES
  ('bc100000-0000-0000-0000-000000000001', 'Maruti Swift Dzire', 'TN09AB1234', 'Car', 'Petrol', 62000, '2027-03-15', '2026-09-01'),
  ('bc100000-0000-0000-0000-000000000002', 'Royal Enfield Classic 350', 'TN09CD5678', 'Bike', 'Petrol', 18000, '2026-07-20', '2026-08-15'),
  ('bc100000-0000-0000-0000-000000000003', 'Honda City', 'TN11EF9012', 'Car', 'Petrol', 35000, '2025-12-31', '2026-06-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 13: VEHICLE FUEL LOGS (6 months across all 3 vehicles)
-- Scenarios: Full tank, partial fill, different stations, mileage variation
-- ============================================================
DO $$
DECLARE
  swift_id UUID := 'bc100000-0000-0000-0000-000000000001';
  re_id UUID := 'bc100000-0000-0000-0000-000000000002';
  honda_id UUID := 'bc100000-0000-0000-0000-000000000003';
BEGIN

-- Swift Dzire Fuel Logs (6 months)
INSERT INTO public.vehicle_fuel_logs (vehicle_id, date, odometer, liters, amount, station, full_tank, mileage, full_tank_mileage) VALUES
  (swift_id, '2026-01-05', 62000, 35.2, 3099, 'Indian Oil - Anna Nagar', TRUE, NULL, NULL),
  (swift_id, '2026-01-20', 62490, 38.5, 3388, 'HP - Velachery', TRUE, 13.9, 13.9),
  (swift_id, '2026-02-04', 62980, 37.8, 3326, 'Indian Oil - Anna Nagar', TRUE, 13.0, 13.0),
  (swift_id, '2026-02-19', 63450, 36.2, 3186, 'Shell - Guindy', TRUE, 13.0, 13.0),
  (swift_id, '2026-03-05', 63920, 39.1, 3441, 'HP - Velachery', TRUE, 12.0, 12.0),
  (swift_id, '2026-03-20', 64380, 37.5, 3300, 'Indian Oil - Anna Nagar', TRUE, 12.3, 12.3),
  (swift_id, '2026-03-28', 64680, 20.0, 1760, 'HP - Madurai', FALSE, NULL, NULL),  -- Partial fill for trip
  (swift_id, '2026-04-04', 65150, 38.0, 3344, 'Indian Oil - Anna Nagar', TRUE, 12.3, 12.3),
  (swift_id, '2026-04-19', 65620, 37.2, 3274, 'Shell - Guindy', TRUE, 12.6, 12.6),
  (swift_id, '2026-05-04', 66100, 36.8, 3238, 'HP - Velachery', TRUE, 12.9, 12.9),
  (swift_id, '2026-05-19', 66580, 38.5, 3388, 'Indian Oil - Anna Nagar', TRUE, 12.5, 12.5),
  (swift_id, '2026-06-03', 67050, 37.0, 3256, 'Shell - Guindy', TRUE, 12.7, 12.7),
  (swift_id, '2026-06-18', 67530, 39.2, 3450, 'HP - Velachery', TRUE, 12.2, 12.2);

-- Royal Enfield Fuel Logs
INSERT INTO public.vehicle_fuel_logs (vehicle_id, date, odometer, liters, amount, station, full_tank, mileage, full_tank_mileage) VALUES
  (re_id, '2026-01-10', 18000, 13.5, 1188, 'Indian Oil - T Nagar', TRUE, NULL, NULL),
  (re_id, '2026-01-28', 18330, 13.8, 1214, 'HP - Adyar', TRUE, 23.9, 23.9),
  (re_id, '2026-02-14', 18660, 13.2, 1162, 'Indian Oil - T Nagar', TRUE, 25.0, 25.0),
  (re_id, '2026-03-02', 18990, 13.5, 1188, 'Shell - Velachery', TRUE, 24.4, 24.4),
  (re_id, '2026-03-22', 19320, 14.0, 1232, 'HP - Adyar', TRUE, 23.6, 23.6),
  (re_id, '2026-04-08', 19650, 13.8, 1214, 'Indian Oil - T Nagar', TRUE, 23.9, 23.9),
  (re_id, '2026-04-25', 19980, 13.5, 1188, 'Shell - Velachery', TRUE, 24.4, 24.4),
  (re_id, '2026-05-12', 20310, 14.2, 1250, 'HP - Adyar', TRUE, 23.2, 23.2),
  (re_id, '2026-05-28', 20640, 13.8, 1214, 'Indian Oil - T Nagar', TRUE, 23.9, 23.9),
  (re_id, '2026-06-15', 20970, 14.0, 1232, 'Shell - Velachery', TRUE, 23.6, 23.6);

-- Honda City Fuel Logs
INSERT INTO public.vehicle_fuel_logs (vehicle_id, date, odometer, liters, amount, station, full_tank, mileage, full_tank_mileage) VALUES
  (honda_id, '2026-01-08', 35000, 40.5, 3564, 'Shell - Mount Road', TRUE, NULL, NULL),
  (honda_id, '2026-01-25', 35530, 41.2, 3626, 'HP - OMR', TRUE, 12.9, 12.9),
  (honda_id, '2026-02-10', 36060, 40.8, 3590, 'Indian Oil - Tambaram', TRUE, 13.0, 13.0),
  (honda_id, '2026-02-25', 36590, 40.5, 3564, 'Shell - Mount Road', TRUE, 13.1, 13.1),
  (honda_id, '2026-03-12', 37120, 41.8, 3678, 'HP - OMR', TRUE, 12.7, 12.7),
  (honda_id, '2026-03-27', 37650, 40.5, 3564, 'Indian Oil - Tambaram', TRUE, 13.1, 13.1),
  (honda_id, '2026-04-14', 38180, 42.0, 3696, 'Shell - Mount Road', TRUE, 12.6, 12.6),
  (honda_id, '2026-04-30', 38710, 41.2, 3626, 'HP - OMR', TRUE, 12.9, 12.9),
  (honda_id, '2026-05-16', 39240, 40.8, 3590, 'Indian Oil - Tambaram', TRUE, 13.0, 13.0),
  (honda_id, '2026-06-01', 39770, 42.5, 3740, 'Shell - Mount Road', TRUE, 12.5, 12.5),
  (honda_id, '2026-06-20', 40300, 41.0, 3608, 'HP - OMR', TRUE, 12.9, 12.9);

END $$;

-- ============================================================
-- SECTION 14: VEHICLE SERVICE LOGS
-- Scenarios: Regular service, major repair, insurance renewal
-- ============================================================
DO $$
DECLARE
  swift_id UUID := 'bc100000-0000-0000-0000-000000000001';
  re_id UUID := 'bc100000-0000-0000-0000-000000000002';
  honda_id UUID := 'bc100000-0000-0000-0000-000000000003';
BEGIN

INSERT INTO public.vehicle_service_logs (vehicle_id, date, odometer, amount, service_center, details) VALUES
  -- Swift Dzire Services
  (swift_id, '2025-12-15', 61800, 4500, 'Maruti Authorized - Anna Nagar', 'Regular 60k service: oil change, filter, check-up'),
  (swift_id, '2026-03-22', 64200, 2800, 'Maruti Authorized - Anna Nagar', 'Tyre rotation + wheel balancing'),
  (swift_id, '2026-06-10', 67200, 12000, 'Maruti Authorized - Anna Nagar', 'AC servicing + coolant top up + brake pad replacement'),
  
  -- Royal Enfield Services
  (re_id, '2025-11-20', 17500, 3200, 'Royal Enfield Service - Adyar', 'Regular 17.5k service: oil, air filter'),
  (re_id, '2026-04-15', 19800, 5500, 'Royal Enfield Service - Adyar', '20k service: chain kit, oil, filters, spark plug'),
  
  -- Honda City Services (note: insurance expired Dec 2025 — unserviced)
  (honda_id, '2025-09-10', 33500, 8500, 'Honda Authorized - Guindy', '35k service: oil, filters, spark plugs, alignment'),
  (honda_id, '2026-02-20', 36200, 6000, 'Honda Authorized - Guindy', 'Battery replacement + AC gas top-up');

END $$;

-- ============================================================
-- SECTION 15: VEHICLE MILEAGE LOGS (Odometer-only readings)
-- ============================================================
DO $$
DECLARE
  swift_id UUID := 'bc100000-0000-0000-0000-000000000001';
  re_id UUID := 'bc100000-0000-0000-0000-000000000002';
BEGIN
INSERT INTO public.vehicle_mileage_logs (vehicle_id, date, odometer, notes) VALUES
  (swift_id, '2026-01-15', 62250, 'Mid-month reading'),
  (swift_id, '2026-02-15', 63220, 'Mid-month reading'),
  (swift_id, '2026-03-15', 64000, 'Madurai trip start'),
  (swift_id, '2026-03-18', 64450, 'Madurai trip end — 450km round trip'),
  (swift_id, '2026-04-15', 65400, 'Mid-month reading'),
  (swift_id, '2026-05-15', 66340, 'Mid-month reading'),
  (swift_id, '2026-06-15', 67290, 'Mid-month reading'),
  (re_id, '2026-01-20', 18165, 'Weekend ride'),
  (re_id, '2026-03-10', 18900, 'Before service'),
  (re_id, '2026-06-10', 20810, 'Before upcoming service');
END $$;

-- ============================================================
-- SECTION 16: INVENTORY LOCATIONS (Hierarchical: City > Building > Room > Furniture > Compartment)
-- ============================================================
INSERT INTO public.inventory_locations (id, name, parent_id, icon, type) VALUES
  -- Top level: City
  ('a0c00001-0000-0000-0000-000000000001', 'Chennai', NULL, '🏙️', 'city'),
  ('a0c00001-0000-0000-0000-000000000002', 'Madurai (Hometown)', NULL, '🏘️', 'city'),
  
  -- Buildings under Chennai
  ('a0c00001-0000-0000-0000-000000000003', 'Home Apartment', 'a0c00001-0000-0000-0000-000000000001', '🏠', 'building'),
  ('a0c00001-0000-0000-0000-000000000004', 'Office', 'a0c00001-0000-0000-0000-000000000001', '🏢', 'building'),
  
  -- Rooms under Home
  ('a0c00001-0000-0000-0000-000000000005', 'Master Bedroom', 'a0c00001-0000-0000-0000-000000000003', '🛏️', 'room'),
  ('a0c00001-0000-0000-0000-000000000006', 'Living Room', 'a0c00001-0000-0000-0000-000000000003', '🛋️', 'room'),
  ('a0c00001-0000-0000-0000-000000000007', 'Kitchen', 'a0c00001-0000-0000-0000-000000000003', '🍳', 'room'),
  ('a0c00001-0000-0000-0000-000000000008', 'Home Office', 'a0c00001-0000-0000-0000-000000000003', '💻', 'room'),
  ('a0c00001-0000-0000-0000-000000000009', 'Store Room', 'a0c00001-0000-0000-0000-000000000003', '📦', 'room'),
  
  -- Furniture under rooms
  ('a0c00001-0000-0000-0000-000000000010', 'Wardrobe', 'a0c00001-0000-0000-0000-000000000005', '👔', 'furniture'),
  ('a0c00001-0000-0000-0000-000000000011', 'Bedside Table', 'a0c00001-0000-0000-0000-000000000005', '🗄️', 'furniture'),
  ('a0c00001-0000-0000-0000-000000000012', 'TV Unit', 'a0c00001-0000-0000-0000-000000000006', '📺', 'furniture'),
  ('a0c00001-0000-0000-0000-000000000013', 'Desk', 'a0c00001-0000-0000-0000-000000000008', '🖥️', 'furniture'),
  ('a0c00001-0000-0000-0000-000000000014', 'Kitchen Cabinet', 'a0c00001-0000-0000-0000-000000000007', '🗄️', 'furniture'),

  -- Compartments
  ('a0c00001-0000-0000-0000-000000000015', 'Top Shelf', 'a0c00001-0000-0000-0000-000000000010', '📁', 'compartment'),
  ('a0c00001-0000-0000-0000-000000000016', 'Middle Shelf', 'a0c00001-0000-0000-0000-000000000010', '📁', 'compartment'),
  ('a0c00001-0000-0000-0000-000000000017', 'Bottom Drawer', 'a0c00001-0000-0000-0000-000000000010', '📁', 'compartment'),
  ('a0c00001-0000-0000-0000-000000000018', 'Locker (Valuables)', 'a0c00001-0000-0000-0000-000000000005', '🔒', 'furniture'),
  
  -- Madurai home rooms
  ('a0c00001-0000-0000-0000-000000000019', 'Hometown House', 'a0c00001-0000-0000-0000-000000000002', '🏡', 'building'),
  ('a0c00001-0000-0000-0000-000000000020', 'Parents Room', 'a0c00001-0000-0000-0000-000000000019', '🛏️', 'room')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 17: INVENTORY ITEMS
-- Scenarios: active, lent_out, retired; bought/gifted_in/borrowed; all conditions
-- ============================================================
INSERT INTO public.inventory_items (id, name, location_id, quantity, category, tags, notes, origin_type, origin_person, acquired_date, purchase_price, condition, status, lent_to_person, lent_date, return_due_date, retired_reason, retired_at) VALUES
  -- Electronics (active)
  ('a1b00001-0000-0000-0000-000000000001', 'MacBook Pro M3', 'a0c00001-0000-0000-0000-000000000013', 1, 'Electronics', ARRAY['laptop', 'work', 'apple'], '16" M3 Pro 18GB RAM', 'bought', NULL, '2024-01-10', 225000, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000002', 'iPad Air (M2)', 'a0c00001-0000-0000-0000-000000000013', 1, 'Electronics', ARRAY['tablet', 'apple', 'work'], 'Bought for work June 2026', 'bought', NULL, '2026-06-18', 70000, 'new', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000003', 'Samsung 65" QLED TV', 'a0c00001-0000-0000-0000-000000000012', 1, 'Electronics', ARRAY['tv', 'samsung', 'living-room'], '65 inch 4K QLED', 'bought', NULL, '2023-09-15', 85000, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000004', 'Sony WH-1000XM5 Headphones', 'a0c00001-0000-0000-0000-000000000013', 1, 'Electronics', ARRAY['headphones', 'sony', 'audio'], 'ANC headphones for work calls', 'bought', NULL, '2025-03-20', 32000, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000005', 'Samsung Galaxy S24', 'a0c00001-0000-0000-0000-000000000011', 1, 'Electronics', ARRAY['phone', 'samsung'], 'Primary phone', 'bought', NULL, '2024-04-01', 75000, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000006', 'Apple Watch SE', 'a0c00001-0000-0000-0000-000000000011', 1, 'Electronics', ARRAY['smartwatch', 'apple', 'fitness'], NULL, 'bought', NULL, '2026-04-18', 22000, 'new', 'active', NULL, NULL, NULL, NULL, NULL),
  
  -- Lent out items
  ('a1b00001-0000-0000-0000-000000000007', 'Canon EOS R50 Camera', 'a0c00001-0000-0000-0000-000000000008', 1, 'Electronics', ARRAY['camera', 'canon', 'photography'], 'Lent to cousin for wedding shoot', 'bought', NULL, '2023-06-10', 65000, 'good', 'lent_out', 'Cousin Kartik', '2026-06-01', '2026-07-15', NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000008', 'Tripod - Benro', 'a0c00001-0000-0000-0000-000000000008', 1, 'Electronics', ARRAY['tripod', 'photography'], 'Lent with camera', 'bought', NULL, '2023-07-01', 4500, 'good', 'lent_out', 'Cousin Kartik', '2026-06-01', '2026-07-15', NULL, NULL),

  -- Gifted items (gifted_in)
  ('a1b00001-0000-0000-0000-000000000009', 'Titan Watch', 'a0c00001-0000-0000-0000-000000000011', 1, 'Accessories', ARRAY['watch', 'titan', 'gifted'], 'Birthday gift from parents', 'gifted_in', 'Parents', '2025-08-15', NULL, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000010', 'Bone China Dinner Set', 'a0c00001-0000-0000-0000-000000000014', 1, 'Kitchen', ARRAY['crockery', 'gifted', 'wedding'], 'Wedding gift from uncle', 'gifted_in', 'Uncle Mohan', '2022-11-20', NULL, 'good', 'active', NULL, NULL, NULL, NULL, NULL),

  -- Borrowed items
  ('a1b00001-0000-0000-0000-000000000011', 'Electric Drill', 'a0c00001-0000-0000-0000-000000000009', 1, 'Tools', ARRAY['tools', 'borrowed'], 'Borrowed for home renovation, to return', 'borrowed', 'Neighbour Ravi', '2026-05-10', NULL, 'good', 'active', NULL, NULL, NULL, NULL, NULL),

  -- Retired items
  ('a1b00001-0000-0000-0000-000000000012', 'HP Laptop (2018)', 'a0c00001-0000-0000-0000-000000000009', 1, 'Electronics', ARRAY['laptop', 'old', 'hp'], 'Replaced by MacBook', 'bought', NULL, '2018-03-01', 55000, 'poor', 'retired', NULL, NULL, NULL, 'sold', '2024-01-01 00:00:00+05:30'),
  ('a1b00001-0000-0000-0000-000000000013', 'iPhone 12', 'a0c00001-0000-0000-0000-000000000009', 1, 'Electronics', ARRAY['phone', 'apple', 'old'], 'Replaced by Samsung S24', 'bought', NULL, '2021-02-10', 70000, 'fair', 'retired', NULL, NULL, NULL, 'sold', '2024-03-15 00:00:00+05:30'),
  ('a1b00001-0000-0000-0000-000000000014', 'Old Ceiling Fan', 'a0c00001-0000-0000-0000-000000000009', 1, 'Appliances', ARRAY['fan', 'old'], 'Replaced during renovation', 'bought', NULL, '2015-06-01', 2500, 'poor', 'retired', NULL, NULL, NULL, 'worn_out', '2025-12-01 00:00:00+05:30'),
  
  -- Clothing and misc items
  ('a1b00001-0000-0000-0000-000000000015', 'Business Suit (Navy)', 'a0c00001-0000-0000-0000-000000000016', 1, 'Clothing', ARRAY['suit', 'formal', 'navy'], 'For client meetings', 'bought', NULL, '2024-09-10', 12000, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000016', 'Gym Equipment Set', 'a0c00001-0000-0000-0000-000000000008', 1, 'Sports', ARRAY['gym', 'fitness', 'equipment'], 'Dumbbells 5-20kg + resistance bands', 'bought', NULL, '2023-01-05', 15000, 'good', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000017', 'Gold Coins (50g)', 'a0c00001-0000-0000-0000-000000000018', 2, 'Valuables', ARRAY['gold', 'investment', 'valuables'], '25g each, stored in locker', 'bought', NULL, '2020-11-02', 280000, 'new', 'active', NULL, NULL, NULL, NULL, NULL),
  ('a1b00001-0000-0000-0000-000000000018', 'Pressure Cooker 5L', 'a0c00001-0000-0000-0000-000000000014', 1, 'Kitchen', ARRAY['kitchen', 'cooker', 'appliance'], 'Prestige brand', 'bought', NULL, '2021-08-15', 2800, 'good', 'active', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 18: SQUARESHIFT — ACTION PROJECTS & TASKS
-- Scenarios: Quick Notes, multiple projects, completed + pending tasks, with/without due dates
-- Due dates: overdue, today, future
-- ============================================================
INSERT INTO public.action_projects (id, name, sort_order) VALUES
  ('proj001', 'Home Renovation', 0),
  ('proj002', 'Freelance - Client B App', 1),
  ('proj003', 'AWS Certification', 2),
  ('proj004', 'Financial Planning 2026', 3),
  ('proj005', 'Health & Recovery', 4)
ON CONFLICT (id) DO NOTHING;

-- Quick Notes tasks (no project_id = null)
INSERT INTO public.action_tasks (id, project_id, text, due, completed, sort_order) VALUES
  ('qn001', NULL, 'Call plumber about bathroom tap leak', NULL, FALSE, 0),
  ('qn002', NULL, 'Buy birthday card for Amma', NULL, FALSE, 1),
  ('qn003', NULL, 'Check if PPF nomination is updated', NULL, FALSE, 2),
  ('qn004', NULL, 'Research NPS vs PPF for tax savings', NULL, FALSE, 3),
  ('qn005', NULL, 'Dentist appointment — overdue 3 months', NULL, FALSE, 4),
  ('qn006', NULL, 'Return electric drill to neighbour Ravi', NULL, TRUE, 5),
  ('qn007', NULL, 'Check vehicle insurance renewal for Honda City', NULL, FALSE, 6)
ON CONFLICT (id) DO NOTHING;

-- Home Renovation tasks
INSERT INTO public.action_tasks (id, project_id, text, due, completed, sort_order) VALUES
  ('hr001', 'proj001', 'Get painting quotes from 3 vendors', '2026-07-05', FALSE, 0),
  ('hr002', 'proj001', 'Choose wall paint colors', '2026-07-10', FALSE, 1),
  ('hr003', 'proj001', 'Order modular kitchen units', '2026-07-15', FALSE, 2),
  ('hr004', 'proj001', 'Fix bathroom waterproofing issue', '2026-06-30', FALSE, 3),  -- Overdue!
  ('hr005', 'proj001', 'Buy new curtains for living room', '2026-08-01', FALSE, 4),
  ('hr006', 'proj001', 'Replace old ceiling fan in store room', '2026-06-25', TRUE, 5),  -- Done + overdue
  ('hr007', 'proj001', 'Get electrical wiring inspection', '2026-07-20', FALSE, 6)
ON CONFLICT (id) DO NOTHING;

-- Freelance - Client B App tasks
INSERT INTO public.action_tasks (id, project_id, text, due, completed, sort_order) VALUES
  ('cl001', 'proj002', 'Complete user authentication module', '2026-06-20', TRUE, 0),  -- Done
  ('cl002', 'proj002', 'Build dashboard API integration', '2026-06-30', TRUE, 1),   -- Done
  ('cl003', 'proj002', 'Implement push notifications', '2026-07-10', FALSE, 2),
  ('cl004', 'proj002', 'UAT testing with client', '2026-07-15', FALSE, 3),
  ('cl005', 'proj002', 'Bug fixes from client review', '2026-07-18', FALSE, 4),
  ('cl006', 'proj002', 'Final deployment to production', '2026-07-25', FALSE, 5),
  ('cl007', 'proj002', 'Handover documentation', '2026-07-28', FALSE, 6)
ON CONFLICT (id) DO NOTHING;

-- AWS Certification tasks
INSERT INTO public.action_tasks (id, project_id, text, due, completed, sort_order) VALUES
  ('aws001', 'proj003', 'Complete Module 1: Cloud Fundamentals', '2026-05-15', TRUE, 0),
  ('aws002', 'proj003', 'Complete Module 2: IAM & Security', '2026-05-30', TRUE, 1),
  ('aws003', 'proj003', 'Complete Module 3: EC2 & Networking', '2026-06-10', TRUE, 2),
  ('aws004', 'proj003', 'Complete Module 4: S3 & Storage', '2026-06-20', TRUE, 3),
  ('aws005', 'proj003', 'Complete Module 5: Lambda & Serverless', '2026-07-01', FALSE, 4),  -- Today due
  ('aws006', 'proj003', 'Complete Module 6: Databases on AWS', '2026-07-10', FALSE, 5),
  ('aws007', 'proj003', 'Take 2 full practice exams', '2026-07-20', FALSE, 6),
  ('aws008', 'proj003', 'Schedule and appear for actual exam', '2026-07-31', FALSE, 7)
ON CONFLICT (id) DO NOTHING;

-- Financial Planning tasks
INSERT INTO public.action_tasks (id, project_id, text, due, completed, sort_order) VALUES
  ('fp001', 'proj004', 'Review and rebalance mutual fund portfolio', '2026-07-01', FALSE, 0),
  ('fp002', 'proj004', 'Open ELSS fund for tax saving', '2026-07-15', FALSE, 1),
  ('fp003', 'proj004', 'Increase SIP by ₹5,000/month', '2026-07-05', FALSE, 2),
  ('fp004', 'proj004', 'Review home loan prepayment options', '2026-08-01', FALSE, 3),
  ('fp005', 'proj004', 'File quarterly advance tax', '2026-06-15', TRUE, 4),  -- Overdue done
  ('fp006', 'proj004', 'Compare term insurance plans', '2026-07-10', FALSE, 5),
  ('fp007', 'proj004', 'Close personal loan early if possible', '2026-09-01', FALSE, 6)
ON CONFLICT (id) DO NOTHING;

-- Health & Recovery tasks
INSERT INTO public.action_tasks (id, project_id, text, due, completed, sort_order) VALUES
  ('hr_h001', 'proj005', 'Post-surgery follow up with doctor', '2026-05-08', TRUE, 0),
  ('hr_h002', 'proj005', 'Get blood test done', '2026-06-15', TRUE, 1),
  ('hr_h003', 'proj005', 'Resume full workout routine', '2026-05-01', TRUE, 2),
  ('hr_h004', 'proj005', 'Buy protein supplements', '2026-06-01', TRUE, 3),
  ('hr_h005', 'proj005', 'Schedule annual full body health checkup', '2026-08-01', FALSE, 4),
  ('hr_h006', 'proj005', 'Consult nutritionist for diet plan', '2026-07-15', FALSE, 5),
  ('hr_h007', 'proj005', 'Research and buy good sleep tracker', '2026-07-20', FALSE, 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 19: VERIFICATION QUERIES
-- Run these after seeding to verify all scenarios are covered
-- ============================================================

-- Uncomment and run these queries to validate coverage:

/*
-- 1. Liquidity accounts: should see 7 accounts with different types
SELECT account_name, type, balance FROM public.liquidity ORDER BY type;

-- 2. Assets: should see 10 assets across different types
SELECT asset_name, asset_type, current_value, purchase_price,
  ROUND(((current_value - purchase_price) / purchase_price * 100)::numeric, 1) as gain_pct
FROM public.assets ORDER BY asset_type;

-- 3. Liabilities: check remaining vs total
SELECT party, party_type, total_amount, remaining,
  ROUND((remaining / total_amount * 100)::numeric, 1) as pct_remaining
FROM public.liabilities;

-- 4. Expense history: monthly totals by type
SELECT DATE_TRUNC('month', date) as month, type, SUM(amount) as total
FROM public.history_expenses
GROUP BY 1, 2 ORDER BY 1, 2;

-- 5. Budget vs Actual for current month (June 2026)
SELECT bp.category, bp.subcategory,
  bp.planned_amount as budget,
  COALESCE(SUM(he.amount), 0) as actual,
  bp.planned_amount - COALESCE(SUM(he.amount), 0) as variance
FROM public.budget_plans bp
LEFT JOIN public.history_expenses he
  ON he.category = bp.category
  AND he.subcategory = bp.subcategory
  AND DATE_TRUNC('month', he.date) = '2026-06-01'
  AND he.type = 'Expense'
WHERE bp.month = '2026-06-01'
GROUP BY bp.category, bp.subcategory, bp.planned_amount
ORDER BY variance;

-- 6. Habits: success rate by habit (last 30 days)
SELECT habit, COUNT(*) as total_days,
  SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successes,
  ROUND(SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as success_rate
FROM public.habit_data
WHERE date >= '2026-05-28'
GROUP BY habit
ORDER BY success_rate DESC;

-- 7. Workout volume progress (monthly)
SELECT DATE_TRUNC('month', date) as month,
  COUNT(DISTINCT date) as workout_days,
  SUM(weight * reps) as total_volume
FROM public.workout_log
GROUP BY 1 ORDER BY 1;

-- 8. Vehicle fuel efficiency trend
SELECT v.vehicle_name, fl.date, fl.odometer, fl.liters,
  fl.amount, fl.mileage, fl.full_tank_mileage
FROM public.vehicle_fuel_logs fl
JOIN public.vehicle_config v ON v.id = fl.vehicle_id
ORDER BY fl.date, v.vehicle_name;

-- 9. Inventory by status
SELECT status, condition, COUNT(*) as item_count
FROM public.inventory_items
GROUP BY status, condition ORDER BY status, condition;

-- 10. SquareShift: open tasks per project
SELECT
  COALESCE(ap.name, 'Quick Notes') as project,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN at.completed = FALSE THEN 1 ELSE 0 END) as open_tasks,
  SUM(CASE WHEN at.completed = TRUE THEN 1 ELSE 0 END) as done_tasks
FROM public.action_tasks at
LEFT JOIN public.action_projects ap ON ap.id = at.project_id
GROUP BY ap.name
ORDER BY open_tasks DESC;

-- 11. Tasks: count by status and type
SELECT
  CASE WHEN is_today THEN 'Today'
       WHEN is_week THEN 'This Week'
       WHEN is_inbox THEN 'Inbox'
       ELSE 'Someday' END as list,
  status,
  COUNT(*) as count
FROM public.tasks
WHERE parent_id IS NULL
GROUP BY 1, 2 ORDER BY 1, 2;

-- 12. Vehicle insurance and service status
SELECT vehicle_name,
  insurance_expiry,
  (insurance_expiry - CURRENT_DATE) as ins_days_left,
  next_service_date,
  (next_service_date - CURRENT_DATE) as svc_days_left,
  CASE
    WHEN insurance_expiry < CURRENT_DATE THEN 'EXPIRED'
    WHEN insurance_expiry < CURRENT_DATE + 30 THEN 'WARN'
    ELSE 'OK'
  END as insurance_status
FROM public.vehicle_config;
*/

-- ============================================================
-- SUMMARY OF SCENARIOS COVERED
-- ============================================================
-- ✅ Liquidity: 7 accounts (Savings, Current, Wallet x2, Credit, Cash, Credit Card with negative balance)
-- ✅ Assets: 10 assets (Real Estate, Mutual Fund, Stocks, Gold x2, Electronics, FD, PPF) — gains & losses
-- ✅ Liabilities: 4 (Bank Loan, Personal Loan, CC Dues, Personal borrow)
-- ✅ Expenses: 6 months, 70+ transactions — Expense, Income, Transfer across all categories
-- ✅ Budget: 6 months, 20+ categories — over budget, under budget, zero budget
-- ✅ Tasks: 20 tasks + 5 subtasks — Pending/Completed, Today/Week/Inbox/Someday, High priority/Normal
-- ✅ Habits: 13 habit configs — boolean, numeric; daily, event; success/failure/unlogged
-- ✅ Habit Data: 6 months of daily logs with realistic variation
-- ✅ Events: 47 workout events across 6 months, including a break in April (hospitalization)
-- ✅ Workout Log: 48 detailed set-level entries across 5 workout days
-- ✅ Vehicles: 3 vehicles — Car x2, Bike; insurance OK/warn/expired; service upcoming/overdue
-- ✅ Fuel Logs: 34 entries across 3 vehicles — full tank, partial fills, 6 months
-- ✅ Service Logs: 7 service records including regular, major repair, battery
-- ✅ Mileage Logs: 10 odometer readings including trip tracking
-- ✅ Inventory Locations: 20 locations across 5 levels (city→building→room→furniture→compartment)
-- ✅ Inventory Items: 18 items — active, lent_out, retired; bought/gifted_in/borrowed; all conditions
-- ✅ SquareShift Projects: 5 projects + Quick Notes
-- ✅ SquareShift Tasks: 40 tasks — overdue, today, future; completed, pending; across all projects
