import { createClient } from '@supabase/supabase-js';
import { addDays, format, subDays, startOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

import fs from 'fs';
import path from 'path';

let supabaseUrl = '';
let supabaseKey = '';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = fs.readFileSync(envPath, 'utf8');
  env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
} catch (e) {
  console.error("Failed to read .env.local:", e.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_DAYS = 180;
const endDate = new Date();
const startDate = subDays(endDate, SEED_DAYS);
const days = eachDayOfInterval({ start: startDate, end: endDate });
const months = eachMonthOfInterval({ start: startDate, end: endDate });

async function seed() {
  console.log('🧹 Cleaning up database for a complete test setup...');
  const tables = [
    'history_expenses', 'history_liabilities', 'habit_data', 'workout_log',
    'vehicle_fuel_logs', 'vehicle_service_logs', 'habit_config', 'vehicle_config',
    'liquidity', 'tasks', 'assets', 'liabilities', 'budget_plans',
    'inventory_items', 'inventory_locations'
  ];
  for (const table of tables) {
    await supabase.from(table).delete().neq('created_at', '1970-01-01');
  }
  console.log('✅ Cleanup complete.');

  // 1. LIQUIDITY (Multi-Account Setup)
  const accounts = [
    { account_name: 'HDFC Savings', balance: 550000, type: 'Savings', notes: 'Primary Salary Account' },
    { account_name: 'ICICI Savings', balance: 275000, type: 'Savings' },
    { account_name: 'Cash Wallet', balance: 15000, type: 'Cash' },
    { account_name: 'Amex Credit Card', balance: -45000, type: 'Credit Card' },
    { account_name: 'Zerodha Funds', balance: 1200000, type: 'Investment' },
    { account_name: 'Petty Cash', balance: 2500, type: 'Cash' }
  ];
  await supabase.from('liquidity').upsert(accounts);

  // 2. HABIT CONFIG (Diverse Logic)
  const habitConfigs = [
    { habit_name: 'Morning Workout', group_name: 'Health', input_type: 'boolean', emoji: '🏋️', habit_color: '#ef4444' },
    { habit_name: 'Read 20 Pages', group_name: 'Growth', input_type: 'number', unit: 'pages', target_value: 20, emoji: '📚', habit_color: '#3b82f6' },
    { habit_name: 'Drink Water', group_name: 'Health', input_type: 'number', unit: 'L', target_value: 3, emoji: '💧', habit_color: '#0ea5e9' },
    { habit_name: 'Meditation', group_name: 'Mind', input_type: 'boolean', emoji: '🧘', habit_color: '#8b5cf6' },
    { habit_name: 'No Sugar', group_name: 'Diet', input_type: 'boolean', emoji: '🍩', habit_color: '#f59e0b' },
    { habit_name: 'Sleep 8h', group_name: 'Health', input_type: 'number', unit: 'h', target_value: 8, emoji: '😴', habit_color: '#6366f1' }
  ];
  await supabase.from('habit_config').upsert(habitConfigs);

  // 3. VEHICLES (Multi-Type)
  const { data: vehicles } = await supabase.from('vehicle_config').upsert([
    { vehicle_name: 'Skoda Slavia', registration_number: 'MH12 AB 1234', vehicle_type: 'Car', fuel_type: 'Petrol' },
    { vehicle_name: 'RE Himalayan', registration_number: 'MH14 CD 5678', vehicle_type: 'Bike', fuel_type: 'Petrol' },
    { vehicle_name: 'Tesla Model 3', registration_number: 'MH12 EF 9012', vehicle_type: 'Car', fuel_type: 'Electric' }
  ]).select();

  // 4. ASSETS & LIABILITIES (Diverse)
  await supabase.from('assets').upsert([
    { asset_name: 'Residential Apartment', asset_type: 'Real Estate', current_value: 8500000, purchase_price: 6500000, category: 'Property' },
    { asset_name: 'HDFC Bank Stocks', asset_type: 'Stocks', current_value: 450000, purchase_price: 320000, category: 'Investment' },
    { asset_name: 'Physical Gold', asset_type: 'Commodity', current_value: 1200000, purchase_price: 800000, category: 'Investment' },
    { asset_name: 'Rolex Watch', asset_type: 'Luxury', current_value: 950000, purchase_price: 750000, category: 'Personal' }
  ]);
  await supabase.from('liabilities').upsert([
    { party: 'HDFC Home Loan', party_type: 'Bank', total_amount: 5000000, remaining: 4200000, interest_paid: 800000 },
    { party: 'ICICI Car Loan', party_type: 'Bank', total_amount: 1200000, remaining: 650000, interest_paid: 120000 },
    { party: 'Amit (Friend)', party_type: 'Personal', total_amount: 50000, remaining: 10000, interest_paid: 0 }
  ]);

  // 5. TASKS (Deep Hierarchy)
  await supabase.from('tasks').insert([
    { id: 'p1', task: 'Build Life OS', status: 'Pending' },
    { id: 'p2', task: 'Health Transformation', status: 'Completed' }
  ]);
  await supabase.from('tasks').insert([
    { id: 'p1_s1', parent_id: 'p1', task: 'Frontend Design', status: 'Completed' },
    { id: 'p1_s2', parent_id: 'p1', task: 'Supabase Integration', status: 'Pending' },
    { id: 'p2_s1', parent_id: 'p2', task: 'Lose 5kg', status: 'Completed' }
  ]);
  await supabase.from('tasks').insert([
    { id: 'p1_s2_t1', parent_id: 'p1_s2', task: 'Seeding Data Script', status: 'Completed' }
  ]);

  // 6. INVENTORY (Exhaustive Hierarchy & Edge Cases)
  const { data: home } = await supabase.from('inventory_locations').insert([
    { name: 'Home', type: 'building', icon: '🏠' }
  ]).select().single();
  if (home) {
    const { data: bedroom } = await supabase.from('inventory_locations').insert([
      { name: 'Bedroom', parent_id: home.id, type: 'room', icon: '🛏️' }
    ]).select().single();
    const { data: kitchen } = await supabase.from('inventory_locations').insert([
      { name: 'Kitchen', parent_id: home.id, type: 'room', icon: '🍳' }
    ]).select().single();
    
    if (bedroom) {
      await supabase.from('inventory_items').insert([
        { name: 'MacBook Pro', location_id: bedroom.id, category: 'Electronics', quantity: 1, origin_type: 'bought', purchase_price: 220000 },
        { name: 'Kindle', location_id: bedroom.id, category: 'Gadget', quantity: 1, status: 'lent_out', lent_to_person: 'Rahul', lent_date: '2025-12-01' }
      ]);
    }
    if (kitchen) {
      await supabase.from('inventory_items').insert([
        { name: 'Air Fryer', location_id: kitchen.id, category: 'Appliance', quantity: 1, condition: 'good' },
        { name: 'Juicer', location_id: kitchen.id, category: 'Appliance', quantity: 1, status: 'retired', retired_reason: 'worn_out', retired_at: new Date().toISOString() }
      ]);
    }
  }

  // 7. BUDGET PLANS (All Categories)
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Subscription', 'Travel', 'Investment'];
  const subcats = {
    'Food': ['Groceries', 'Dining Out', 'Coffee', 'Alcohol'],
    'Transport': ['Petrol', 'Toll', 'Parking', 'Service'],
    'Shopping': ['Amazon', 'Fashion', 'Home Decor', 'Gifts'],
    'Bills': ['Electricity', 'Wifi', 'Rent', 'Mobile'],
    'Entertainment': ['Netflix', 'Movies', 'Concert'],
    'Health': ['Medicine', 'Gym', 'Dentist'],
    'Travel': ['Flights', 'Hotels', 'Visa']
  };
  const vendors = ['Amazon', 'Shell', 'Zomato', 'Apple', 'Reliance', 'Starbucks', 'Netflix', 'Nike'];
  const places = ['Pune', 'Mumbai', 'Office', 'Home', 'Mall'];

  const budgetData = [];
  months.forEach(m => {
    const monthStr = format(startOfMonth(m), 'yyyy-MM-01');
    categories.forEach(cat => {
      budgetData.push({ category: cat, subcategory: 'General', month: monthStr, planned_amount: cat === 'Food' ? 20000 : 10000 });
    });
  });
  await supabase.from('budget_plans').insert(budgetData);

  // 8. HISTORICAL DATA (Dense & Realistic)
  const expenses = [];
  const liabilityHistory = [];
  const habitData = [];
  const workouts = [];
  const fuelLogs = [];
  const serviceLogs = [];

  days.forEach((day, index) => {
    const dateStr = format(day, 'yyyy-MM-dd');

    // Expenses (8-12 per day)
    const numExp = Math.floor(Math.random() * 5) + 8;
    for (let i = 0; i < numExp; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const sl = subcats[cat] || ['General'];
      expenses.push({
        date: dateStr,
        amount: Math.floor(Math.random() * 1500) + 100,
        type: 'Expense',
        account: accounts[Math.floor(Math.random() * accounts.length)].account_name,
        category: cat,
        subcategory: sl[Math.floor(Math.random() * sl.length)],
        particular: `Buying ${cat} item ${i+1}`,
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        place: places[index % places.length],
        created_at: day.toISOString()
      });
    }

    // Salary & Transfers
    if (day.getDate() === 1) {
      expenses.push({ date: dateStr, amount: 180000, type: 'Income', account: 'HDFC Savings', category: 'Salary', subcategory: 'Main', particular: 'Monthly Salary' });
    }
    if (day.getDate() === 10) {
      // Transfer from HDFC to ICICI
      expenses.push({ date: dateStr, amount: 50000, type: 'Transfer', account: 'HDFC Savings', category: 'Transfer', subcategory: 'To ICICI', particular: 'Internal Transfer' });
    }

    // Liability EMI
    if (day.getDate() === 5) {
      liabilityHistory.push({ date: dateStr, amount: 48500, type: 'Principal', account: 'HDFC Savings', party: 'HDFC Home Loan' });
      liabilityHistory.push({ date: dateStr, amount: 12400, type: 'Principal', account: 'HDFC Savings', party: 'ICICI Car Loan' });
    }

    // Habits (High completion)
    habitConfigs.forEach(h => {
      if (Math.random() > 0.15) {
        habitData.push({ date: dateStr, habit: h.habit_name, value: h.input_type === 'boolean' ? 'true' : '30', status: 'Completed', group_name: h.group_name });
      }
    });

    // Workouts (Mon, Wed, Fri)
    const dow = day.getDay();
    if (dow === 1 || dow === 3 || dow === 5) {
      ['Pushups', 'Squats', 'Plank'].forEach(ex => {
        workouts.push({ date: dateStr, workout_name: ex, set_no: 1, weight: 0, reps: 20, created_at: day.toISOString() });
      });
    }

    // Fuel (Every 10 days)
    vehicles.forEach(v => {
      if (index % 10 === 0 && v.fuel_type !== 'Electric') {
        fuelLogs.push({ vehicle_id: v.id, date: dateStr, odometer: 12000 + (index * 40), liters: 32, amount: 3200, station: 'Shell', full_tank: true });
      }
    });
  });

  console.log('📦 Final Batch Insertion...');
  for (let i = 0; i < expenses.length; i += 500) await supabase.from('history_expenses').insert(expenses.slice(i, i + 500));
  await supabase.from('history_liabilities').insert(liabilityHistory);
  for (let i = 0; i < habitData.length; i += 500) await supabase.from('habit_data').insert(habitData.slice(i, i + 500));
  for (let i = 0; i < workouts.length; i += 500) await supabase.from('workout_log').insert(workouts.slice(i, i + 500));
  await supabase.from('vehicle_fuel_logs').insert(fuelLogs);

  console.log('✨ Exhaustive Test Data Ready!');
}

seed().catch(console.error);
