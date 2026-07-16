import { createClient } from '@supabase/supabase-js';
import { format, subDays, startOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import fs from 'fs';
import path from 'path';

// 1. Read environment variables
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
  console.log('🧹 Clearing existing data in correct dependency order...');
  
  // Dependent log and transaction tables first
  const logTables = [
    'history_expenses',
    'history_liabilities',
    'event_log',
    'habit_data',
    'workout_log',
    'vehicle_fuel_logs',
    'vehicle_service_logs',
    'vehicle_mileage_logs',
    'pet_logs',
    'pet_medical_logs',
    'skill_logs',
    'action_tasks',
    'inventory_items'
  ];
  for (const table of logTables) {
    const { error } = await supabase.from(table).delete().neq('created_at', '1970-01-01T00:00:00Z');
    if (error) console.warn(`Warn/Error clearing ${table}:`, error.message);
  }

  // Parent configuration and category tables second
  const parentTables = [
    'tasks',
    'budget_plans',
    'assets',
    'liabilities',
    'liquidity',
    'habit_config',
    'vehicle_config',
    'pet_profile',
    'skill_items',
    'action_projects',
    'inventory_locations'
  ];
  for (const table of parentTables) {
    const { error } = await supabase.from(table).delete().neq('created_at', '1970-01-01T00:00:00Z');
    if (error) console.warn(`Warn/Error clearing ${table}:`, error.message);
  }
  
  console.log('✅ Database cleanup completed successfully.');

  // 2. LIQUIDITY (Multi-Account Setup)
  console.log('⚙️ Seeding core configurations...');
  const accounts = [
    { account_name: 'HDFC Savings', balance: 550000, type: 'Savings', notes: 'Primary Salary Account' },
    { account_name: 'ICICI Savings', balance: 275000, type: 'Savings' },
    { account_name: 'Cash Wallet', balance: 15000, type: 'Cash' },
    { account_name: 'Amex Credit Card', balance: -45000, type: 'Credit Card' },
    { account_name: 'Zerodha Funds', balance: 1200000, type: 'Investment' },
    { account_name: 'Petty Cash', balance: 2500, type: 'Cash' }
  ];
  await supabase.from('liquidity').upsert(accounts);

  // 3. HABIT CONFIG
  const habitConfigs = [
    { habit_name: 'Morning Workout', group_name: 'Health', input_type: 'boolean', emoji: '🏋️', habit_color: '#ef4444' },
    { habit_name: 'Read Books', group_name: 'Growth', input_type: 'number', unit: 'pages', target_value: 20, emoji: '📚', habit_color: '#3b82f6' },
    { habit_name: 'Drink Water', group_name: 'Health', input_type: 'number', unit: 'L', target_value: 3, emoji: '💧', habit_color: '#0ea5e9' },
    { habit_name: 'Meditation', group_name: 'Mind', input_type: 'boolean', emoji: '🧘', habit_color: '#8b5cf6' },
    { habit_name: 'No Sugar', group_name: 'Diet', input_type: 'boolean', emoji: '🍩', habit_color: '#f59e0b' },
    { habit_name: 'Sleep 8h', group_name: 'Health', input_type: 'number', unit: 'h', target_value: 8, emoji: '😴', habit_color: '#6366f1' },
    { habit_name: 'Smoking', group_name: 'Health', input_type: 'number', unit: 'count', target_value: 0, emoji: '🚬', habit_color: '#64748b' }
  ];
  await supabase.from('habit_config').upsert(habitConfigs);

  // 4. VEHICLES
  const { data: vehicles } = await supabase.from('vehicle_config').upsert([
    { vehicle_name: 'Skoda Slavia', registration_number: 'MH12 AB 1234', vehicle_type: 'Car', fuel_type: 'Petrol' },
    { vehicle_name: 'RE Himalayan', registration_number: 'MH14 CD 5678', vehicle_type: 'Bike', fuel_type: 'Petrol' },
    { vehicle_name: 'Tesla Model 3', registration_number: 'MH12 EF 9012', vehicle_type: 'Car', fuel_type: 'Electric' }
  ]).select();

  // 5. PETS
  const { data: pets } = await supabase.from('pet_profile').insert([
    { name: 'Roscoe', breed: 'Golden Retriever', dob: '2022-04-12' }
  ]).select();
  const roscoeId = pets && pets[0] ? pets[0].id : null;

  // 6. SKILLS
  const { data: skills } = await supabase.from('skill_items').insert([
    { id: 'a1000000-0000-0000-0000-000000000001', name: 'Reading Books',  icon: '📚', color: '#10b981', description: 'Non-fiction books', status: 'archived', focus_month: '2026-01-01', queue_order: 0, target_sessions_per_month: 20 },
    { id: 'a1000000-0000-0000-0000-000000000002', name: 'Meditation',     icon: '🧘', color: '#6366f1', description: 'Mindfulness breathing', status: 'archived', focus_month: '2026-02-01', queue_order: 0, target_sessions_per_month: 24 },
    { id: 'a1000000-0000-0000-0000-000000000003', name: 'Guitar',         icon: '🎸', color: '#f59e0b', description: 'Chord practice', status: 'archived', focus_month: '2026-03-01', queue_order: 0, target_sessions_per_month: 16 },
    { id: 'a1000000-0000-0000-0000-000000000004', name: 'Swimming',       icon: '🏊', color: '#3b82f6', description: 'Endurance swim laps', status: 'archived', focus_month: '2026-04-01', queue_order: 0, target_sessions_per_month: 12 },
    { id: 'a1000000-0000-0000-0000-000000000005', name: 'Spanish',        icon: '🇪🇸', color: '#ec4899', description: 'Grammar and convo', status: 'archived', focus_month: '2026-05-01', queue_order: 0, target_sessions_per_month: 30 },
    { id: 'a1000000-0000-0000-0000-000000000006', name: 'Boxing',         icon: '🥊', color: '#7c3aed', description: 'Sparring and bag drills', status: 'focus',    focus_month: '2026-06-01', queue_order: 0, target_sessions_per_month: 20 },
    { id: 'a1000000-0000-0000-0000-000000000007', name: 'Digital Art',    icon: '🎨', color: '#06b6d4', description: 'Digital painting', status: 'queued', focus_month: null, queue_order: 1, target_sessions_per_month: 16 },
    { id: 'a1000000-0000-0000-0000-000000000008', name: 'Jiu Jitsu',      icon: '🥋', color: '#ef4444', description: 'Ground grappling', status: 'queued', focus_month: null, queue_order: 2, target_sessions_per_month: 12 }
  ]).select();

  // 7. INVENTORY LOCATIONS
  const { data: locs } = await supabase.from('inventory_locations').insert([
    { name: 'Home', type: 'building', icon: '🏠' }
  ]).select();
  const homeLocId = locs && locs[0] ? locs[0].id : null;

  let bedroomLocId = null;
  let kitchenLocId = null;
  if (homeLocId) {
    const { data: subLocs } = await supabase.from('inventory_locations').insert([
      { name: 'Bedroom', parent_id: homeLocId, type: 'room', icon: '🛏️' },
      { name: 'Kitchen', parent_id: homeLocId, type: 'room', icon: '🍳' }
    ]).select();
    if (subLocs) {
      bedroomLocId = subLocs.find(l => l.name === 'Bedroom')?.id;
      kitchenLocId = subLocs.find(l => l.name === 'Kitchen')?.id;
    }
  }

  // 8. SQUARESHIFT (Action Items Configurations)
  const { data: projects } = await supabase.from('action_projects').insert([
    { id: 'proj-life-os', name: 'Life OS Platform', sort_order: 1 },
    { id: 'proj-health', name: 'Health Kickstart', sort_order: 2 }
  ]).select();

  // 9. STATIC ASSETS & LIABILITIES
  await supabase.from('assets').upsert([
    { asset_name: 'Residential Apartment', asset_type: 'Real Estate', current_value: 8500000, purchase_price: 6500000, category: 'Property' },
    { asset_name: 'HDFC Bank Stocks', asset_type: 'Stocks', current_value: 450000, purchase_price: 320000, category: 'Investment' },
    { asset_name: 'Physical Gold', asset_type: 'Commodity', current_value: 1200000, purchase_price: 800000, category: 'Investment' },
    { asset_name: 'Macbook Pro', asset_type: 'Luxury', current_value: 220000, purchase_price: 220000, category: 'Personal' }
  ]);
  await supabase.from('liabilities').upsert([
    { party: 'HDFC Home Loan', party_type: 'Bank', total_amount: 5000000, remaining: 4200000, interest_paid: 800000 },
    { party: 'ICICI Car Loan', party_type: 'Bank', total_amount: 1200000, remaining: 650000, interest_paid: 120000 }
  ]);

  // 10. BUDGET PLANS (Defined ONLY for the current month to avoid repeating/duplicating)
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Subscription', 'Travel', 'Investment'];
  const currentMonthStr = format(startOfMonth(new Date()), 'yyyy-MM-01');
  const budgetPlans = categories.map(cat => ({
    category: cat,
    subcategory: 'General',
    month: currentMonthStr,
    planned_amount: cat === 'Food' ? 25000 : cat === 'Transport' ? 12000 : 8000
  }));
  await supabase.from('budget_plans').insert(budgetPlans);

  // 11. GENERAL TASKS
  const taskIds = ['t1', 't2', 't3', 't4'];
  await supabase.from('tasks').insert([
    { id: 't1', task: 'Deploy Life OS V1', status: 'Completed', is_today: true, is_high_priority: true, created_at: subDays(new Date(), 90).toISOString() },
    { id: 't2', task: 'Get Health Assessment', status: 'Completed', is_today: true, is_high_priority: false, created_at: subDays(new Date(), 60).toISOString() },
    { id: 't3', task: 'Setup Emergency Fund', status: 'Completed', is_week: true, created_at: subDays(new Date(), 45).toISOString() },
    { id: 't4', task: 'Purchase Tesla Car charger', status: 'Pending', is_today: true, is_high_priority: true, created_at: subDays(new Date(), 5).toISOString() },
    { id: 't5', task: 'Review weekly budget spending', status: 'Pending', is_today: true, is_high_priority: false, created_at: subDays(new Date(), 2).toISOString() },
    { id: 't6', task: 'Prepare monthly net worth report', status: 'Pending', is_week: true, created_at: subDays(new Date(), 3).toISOString() }
  ]);

  // 12. GENERATING DENSE HISTORICAL LOGS CHRONOLOGICALLY
  console.log('📈 Constructing historical timeline entries...');
  const expensesList = [];
  const liabilityHistory = [];
  const habitDataList = [];
  const eventLogList = [];
  const workoutLogs = [];
  const skillLogsList = [];
  const fuelLogs = [];
  const serviceLogs = [];
  const mileageLogs = [];
  const actionTasksList = [];
  const inventoryItemsList = [];
  const petLogsList = [];
  
  const subcats = {
    'Food': ['Groceries', 'Dining Out', 'Coffee', 'Snacks'],
    'Transport': ['Petrol', 'Toll', 'Parking', 'Electric Charging'],
    'Shopping': ['Amazon', 'Fashion', 'Gadgets'],
    'Bills': ['Electricity', 'Wifi', 'Rent', 'Mobile'],
    'Entertainment': ['Netflix', 'Movies', 'Concert Tickets'],
    'Health': ['Medicine', 'Gym Membership', 'Therapy'],
    'Travel': ['Flights', 'Hotels', 'Uber']
  };
  const vendors = ['Amazon', 'Shell Petrol', 'Zomato', 'Apple Store', 'Starbucks', 'Netflix', 'Decathlon', 'Supermarket'];
  const places = ['Home', 'Office', 'Mall', 'Gym', 'Market', 'Highway'];

  days.forEach((day, dayIdx) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayStr = day.toISOString();

    // A. Expenses & Income
    // Salary on the 1st of every month
    if (day.getDate() === 1) {
      expensesList.push({
        date: dateStr,
        amount: 220000,
        type: 'Income',
        account: 'HDFC Savings',
        category: 'Salary',
        subcategory: 'Main',
        particular: 'Monthly Professional Payout',
        vendor: 'Company Inc',
        place: 'Office',
        created_at: dayStr
      });
    }

    // Occasional Transfer on the 10th
    if (day.getDate() === 10) {
      expensesList.push({
        date: dateStr,
        amount: 15000,
        type: 'Transfer',
        account: 'HDFC Savings',
        category: 'Transfer',
        subcategory: 'Internal',
        particular: 'Fund Cash Wallet',
        vendor: 'Atm',
        place: 'Bank',
        created_at: dayStr
      });
    }

    // Everyday expenses (1 to 3 items)
    const numExp = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numExp; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const sublist = subcats[cat] || ['General'];
      expensesList.push({
        date: dateStr,
        amount: Math.floor(Math.random() * 1500) + 150,
        type: 'Expense',
        account: dayIdx % 3 === 0 ? 'Cash Wallet' : dayIdx % 3 === 1 ? 'ICICI Savings' : 'HDFC Savings',
        category: cat,
        subcategory: sublist[Math.floor(Math.random() * sublist.length)],
        particular: `Bought ${cat.toLowerCase()} particulars`,
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        place: places[Math.floor(Math.random() * places.length)],
        created_at: dayStr
      });
    }

    // B. Liabilities Principal EMIs on the 5th
    if (day.getDate() === 5) {
      liabilityHistory.push({
        date: dateStr,
        amount: 45000,
        type: 'Principal',
        account: 'HDFC Savings',
        party: 'HDFC Home Loan',
        created_at: dayStr
      });
      liabilityHistory.push({
        date: dateStr,
        amount: 12500,
        type: 'Principal',
        account: 'HDFC Savings',
        party: 'ICICI Car Loan',
        created_at: dayStr
      });
    }

    // C. Habits & Event Logs
    // We log habits with varying completion statuses (85% consistency)
    const completedWorkout = Math.random() < 0.85;
    habitDataList.push({
      date: dateStr,
      habit: 'Morning Workout',
      value: completedWorkout ? 'true' : 'false',
      status: completedWorkout ? 'Completed' : 'Missed',
      group_name: 'Health',
      created_at: dayStr
    });

    const waterLiters = (Math.random() * 2 + 1.5).toFixed(1); // 1.5 to 3.5 Liters
    habitDataList.push({
      date: dateStr,
      habit: 'Drink Water',
      value: waterLiters,
      status: parseFloat(waterLiters) >= 3.0 ? 'Completed' : 'Missed',
      group_name: 'Health',
      created_at: dayStr
    });

    // Custom wake-up event logs
    const hours = 6;
    const minutes = String(Math.floor(Math.random() * 40) + 10); // 6:10 AM - 6:50 AM
    eventLogList.push({
      date: dateStr,
      time: `${hours}:${minutes}:00`,
      event: 'Morning Workout',
      value: `${hours}:${minutes} AM`,
      note: 'Woke up naturally',
      created_at: dayStr
    });

    // Cigarettes tally logs (smoking habit - value counts)
    const cigaretteCounts = Math.floor(Math.random() * 3); // 0 to 2 cigarettes
    if (cigaretteCounts > 0) {
      habitDataList.push({
        date: dateStr,
        habit: 'Smoking',
        value: `${cigaretteCounts} counts`,
        status: 'Missed',
        group_name: 'Health',
        created_at: dayStr
      });
      eventLogList.push({
        date: dateStr,
        time: '18:30:00',
        event: 'Smoking',
        value: `${cigaretteCounts} count(s)`,
        note: 'After office break',
        created_at: dayStr
      });
    }

    // D. Workouts on Mon, Wed, Fri
    const dow = day.getDay();
    if (dow === 1 || dow === 3 || dow === 5) {
      const routine = dow === 1 ? 'Push' : dow === 3 ? 'Pull' : 'Legs';
      workoutLogs.push({
        date: dateStr,
        workout_day: `${routine} Day`,
        workout_name: routine === 'Push' ? 'Bench Press' : routine === 'Pull' ? 'Pullups' : 'Squats',
        set_no: 1,
        weight: routine === 'Legs' ? 80 : 60,
        reps: 10,
        created_at: dayStr
      });
      workoutLogs.push({
        date: dateStr,
        workout_day: `${routine} Day`,
        workout_name: routine === 'Push' ? 'Overhead Press' : routine === 'Pull' ? 'Bicep Curls' : 'Leg Press',
        set_no: 2,
        weight: routine === 'Legs' ? 120 : 40,
        reps: 12,
        created_at: dayStr
      });
    }

    // E. Skills Logs (Focus month-by-month logic)
    // Jan: Reading, Feb: Meditation, Mar: Guitar, Apr: Swimming, May: Spanish, Jun: Boxing, Jul: Boxing
    const monthIndex = day.getMonth(); // 0 = Jan, 1 = Feb ... 6 = Jul
    let activeSkillId = 'a1000000-0000-0000-0000-000000000006'; // default boxing
    if (monthIndex === 0) activeSkillId = 'a1000000-0000-0000-0000-000000000001';
    else if (monthIndex === 1) activeSkillId = 'a1000000-0000-0000-0000-000000000002';
    else if (monthIndex === 2) activeSkillId = 'a1000000-0000-0000-0000-000000000003';
    else if (monthIndex === 3) activeSkillId = 'a1000000-0000-0000-0000-000000000004';
    else if (monthIndex === 4) activeSkillId = 'a1000000-0000-0000-0000-000000000005';
    
    // Log practice 3x a week
    if (dow === 2 || dow === 4 || dow === 6) {
      skillLogsList.push({
        skill_id: activeSkillId,
        date: dateStr,
        duration_minutes: Math.floor(Math.random() * 45) + 30, // 30 to 75 mins
        notes: 'Focused training session completed.',
        mood: ['great', 'good', 'okay'][dayIdx % 3],
        created_at: dayStr
      });
    }

    // F. Vehicles Logs
    if (vehicles && vehicles.length > 0) {
      // Petrol Skoda refuels every 12 days
      if (dayIdx % 12 === 0) {
        const skoda = vehicles.find(v => v.vehicle_name === 'Skoda Slavia');
        if (skoda) {
          fuelLogs.push({
            vehicle_id: skoda.id,
            date: dateStr,
            odometer: 14000 + (dayIdx * 35),
            liters: 38,
            amount: 3950,
            station: 'Shell Station',
            full_tank: true,
            created_at: dayStr
          });
        }
      }
      // Tesla electric charge every 6 days
      if (dayIdx % 6 === 0) {
        const tesla = vehicles.find(v => v.vehicle_name === 'Tesla Model 3');
        if (tesla) {
          fuelLogs.push({
            vehicle_id: tesla.id,
            date: dateStr,
            odometer: 8000 + (dayIdx * 50),
            liters: 0, // Electric
            amount: 450,
            station: 'Supercharger Mall',
            full_tank: true,
            created_at: dayStr
          });
        }
      }
      if (dayIdx === 90) {
        const skoda = vehicles.find(v => v.vehicle_name === 'Skoda Slavia');
        if (skoda) {
          serviceLogs.push({
            vehicle_id: skoda.id,
            date: dateStr,
            odometer: 14000 + (dayIdx * 35),
            amount: 8500,
            service_center: 'Skoda Authorised Workshop',
            details: 'General Maintenance: Oil filter replacement, wheel balancing',
            created_at: dayStr
          });
        }
      }
      // Record odometer monthly
      if (day.getDate() === 28) {
        vehicles.forEach(v => {
          mileageLogs.push({
            vehicle_id: v.id,
            date: dateStr,
            odometer: v.vehicle_name === 'Skoda Slavia' ? 14000 + (dayIdx * 35) : v.vehicle_name === 'RE Himalayan' ? 5000 + (dayIdx * 15) : 8000 + (dayIdx * 50),
            created_at: dayStr
          });
        });
      }
    }

    // G. SquareShift Action Tasks (completed tasks logged across history)
    if (dayIdx % 15 === 0) {
      actionTasksList.push({
        id: `t-shift-${dayIdx}`,
        project_id: 'proj-life-os',
        text: `Accomplish milestone module ${dayIdx / 15}`,
        due: dateStr,
        completed: true,
        sort_order: dayIdx,
        created_at: dayStr
      });
    }

    // H. Inventory Items
    if (bedroomLocId && kitchenLocId) {
      if (dayIdx === 10) {
        inventoryItemsList.push({
          name: 'Noise Cancelling Headphones',
          location_id: bedroomLocId,
          category: 'Electronics',
          quantity: 1,
          origin_type: 'bought',
          purchase_price: 18000,
          acquired_date: dateStr,
          status: 'active',
          created_at: dayStr
        });
      }
      if (dayIdx === 50) {
        inventoryItemsList.push({
          name: 'Kindle Paperwhite',
          location_id: bedroomLocId,
          category: 'Electronics',
          quantity: 1,
          origin_type: 'gifted_in',
          purchase_price: 0,
          acquired_date: dateStr,
          status: 'lent_out',
          lent_to_person: 'Ramesh',
          lent_date: dateStr,
          created_at: dayStr
        });
      }
      if (dayIdx === 100) {
        inventoryItemsList.push({
          name: 'Smart Coffee Maker',
          location_id: kitchenLocId,
          category: 'Appliances',
          quantity: 1,
          origin_type: 'bought',
          purchase_price: 12000,
          acquired_date: dateStr,
          status: 'retired',
          retired_reason: 'worn_out',
          retired_at: dayStr,
          created_at: dayStr
        });
      }
    }

    // I. Pets activities (walk to beach, feeding, medical checkups)
    if (roscoeId) {
      // Feed Roscoe twice daily (logged as daily pet profile updates)
      if (dayIdx % 2 === 0) {
        petLogsList.push({
          pet_id: roscoeId,
          log_type: 'Activity',
          date: dateStr,
          notes: 'Morning walk to the park + beach with Roscoe',
          created_at: dayStr
        });
      }
      // Medical logs every 90 days
      if (dayIdx === 30 || dayIdx === 120) {
        petLogsList.push({
          pet_id: roscoeId,
          log_type: 'Medical',
          date: dateStr,
          notes: dayIdx === 30 ? 'Rabies vaccination booster' : 'General checkup at Vet clinic',
          created_at: dayStr
        });
      }
    }
  });

  // Add some pending action tasks for today to test completion
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayISO = new Date().toISOString();
  actionTasksList.push(
    { id: 't-shift-pending-1', project_id: 'proj-life-os', text: 'Design database index structures', due: todayStr, completed: false, sort_order: 100, created_at: todayISO },
    { id: 't-shift-pending-2', project_id: 'proj-life-os', text: 'Configure Supabase replication rules', due: todayStr, completed: false, sort_order: 101, created_at: todayISO },
    { id: 't-shift-pending-3', project_id: 'proj-health', text: 'Schedule fitness coach check-in', due: todayStr, completed: false, sort_order: 102, created_at: todayISO }
  );

  console.log('📦 Bulk inserting generated records to Supabase...');
  
  // Batched insertions to prevent Supabase payload limits
  const insertInBatches = async (table, data) => {
    if (!data || data.length === 0) return;
    for (let i = 0; i < data.length; i += 400) {
      const batch = data.slice(i, i + 400);
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        console.error(`Error inserting into ${table} batch:`, error.message);
        throw error;
      }
    }
  };

  await insertInBatches('history_expenses', expensesList);
  await insertInBatches('history_liabilities', liabilityHistory);
  await insertInBatches('habit_data', habitDataList);
  await insertInBatches('event_log', eventLogList);
  await insertInBatches('workout_log', workoutLogs);
  await insertInBatches('skill_logs', skillLogsList);
  await insertInBatches('vehicle_fuel_logs', fuelLogs);
  await insertInBatches('vehicle_service_logs', serviceLogs);
  await insertInBatches('vehicle_mileage_logs', mileageLogs);
  await insertInBatches('action_tasks', actionTasksList);
  await insertInBatches('inventory_items', inventoryItemsList);
  await insertInBatches('pet_logs', petLogsList);

  console.log('🎉 Database comprehensively seeded for 6 months! All combinations populated.');
}

seed().catch(console.error);
