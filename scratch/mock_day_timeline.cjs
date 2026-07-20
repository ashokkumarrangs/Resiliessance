// Scratch script to generate a full mock timeline day with all event types.
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfkzyryotmsmevnweuws.supabase.co';
const supabaseAnonKey = 'sb_publishable_L8D6NdhFuOrztKy-_zzylw_cuIdp8ZW';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testDate = '2026-07-18';

async function run() {
  console.log(`🚀 Starting timeline mock injection for date: ${testDate}...`);

  try {
    // 1. Fetch prerequisite entities or create placeholders
    
    // A. Vehicle
    let { data: vehicles } = await supabase.from('vehicle_config').select('*').limit(1);
    let vehicleId;
    if (!vehicles || vehicles.length === 0) {
      console.log('🚙 Creating placeholder vehicle...');
      const { data, error } = await supabase.from('vehicle_config').insert({
        vehicle_name: 'Mock Test Car',
        registration_number: 'MOCK-123',
        initial_odometer: 10000
      }).select().single();
      if (error) throw error;
      vehicleId = data.id;
    } else {
      vehicleId = vehicles[0].id;
    }
    console.log(`🚙 Vehicle ID: ${vehicleId}`);

    // B. Pet
    let { data: pets } = await supabase.from('pet_profile').select('*').limit(1);
    let petId;
    if (!pets || pets.length === 0) {
      console.log('🐶 Creating placeholder pet...');
      const { data, error } = await supabase.from('pet_profile').insert({
        name: 'Mock Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        dob: '2022-01-01'
      }).select().single();
      if (error) throw error;
      petId = data.id;
    } else {
      petId = pets[0].id;
    }
    console.log(`🐶 Pet ID: ${petId}`);

    // C. Skill Focus
    let { data: skills } = await supabase.from('skill_items').select('*').limit(1);
    let skillId;
    if (!skills || skills.length === 0) {
      console.log('🎯 Creating placeholder skill item...');
      const { data, error } = await supabase.from('skill_items').insert({
        name: 'Mock Guitar practice',
        icon: '🎸',
        color: '#7c3aed',
        status: 'focus',
        target_sessions_per_month: 10
      }).select().single();
      if (error) throw error;
      skillId = data.id;
    } else {
      skillId = skills[0].id;
    }
    console.log(`🎯 Skill ID: ${skillId}`);

    // D. Daily Habit (input_type = 'time')
    let { data: timeHabits } = await supabase.from('habit_config').select('habit_name').eq('input_type', 'time').limit(1);
    let habitName;
    if (!timeHabits || timeHabits.length === 0) {
      console.log('⏰ Creating placeholder time-entry habit configuration...');
      const name = 'Wake Up Time';
      const { error } = await supabase.from('habit_config').insert({
        habit_name: name,
        input_type: 'time',
        group_name: 'Routine'
      });
      if (error) console.warn('Warning creating habit_config:', error.message);
      habitName = name;
    } else {
      habitName = timeHabits[0].habit_name;
    }
    console.log(`⏰ Daily Habit Name: ${habitName}`);

    // E. Event Habit config
    let { data: eventHabits } = await supabase.from('habit_config').select('habit_name').eq('input_type', 'boolean').limit(1);
    let eventHabitName;
    if (!eventHabits || eventHabits.length === 0) {
      console.log('⚡ Creating placeholder event habit configuration...');
      const name = 'Drink Water';
      const { error } = await supabase.from('habit_config').insert({
        habit_name: name,
        input_type: 'boolean',
        group_name: 'Wellness'
      });
      if (error) console.warn('Warning creating event habit_config:', error.message);
      eventHabitName = name;
    } else {
      eventHabitName = eventHabits[0].habit_name;
    }
    console.log(`⚡ Event Habit Name: ${eventHabitName}`);

    // F. Location
    let { data: locations } = await supabase.from('inventory_locations').select('*').limit(1);
    let locationId;
    if (!locations || locations.length === 0) {
      console.log('📦 Creating placeholder location...');
      const { data, error } = await supabase.from('inventory_locations').insert({
        name: 'Bedroom Drawer',
        icon: '🛏️',
        type: 'furniture'
      }).select().single();
      if (error) throw error;
      locationId = data.id;
    } else {
      locationId = locations[0].id;
    }
    console.log(`📦 Location ID: ${locationId}`);

    // 2. Cleanup existing records for testDate
    console.log('🧹 Cleaning up any existing records for test date...');
    await Promise.all([
      supabase.from('history_expenses').delete().eq('date', testDate),
      supabase.from('habit_data').delete().eq('date', testDate),
      supabase.from('event_log').delete().eq('date', testDate),
      supabase.from('skill_logs').delete().eq('date', testDate),
      supabase.from('workout_log').delete().eq('date', testDate),
      supabase.from('vehicle_fuel_logs').delete().eq('date', testDate),
      supabase.from('vehicle_service_logs').delete().eq('date', testDate),
      supabase.from('vehicle_mileage_logs').delete().eq('date', testDate),
      supabase.from('pet_logs').delete().eq('date', testDate),
      supabase.from('tasks').delete().eq('completed_at', `${testDate}T16:10:00.000Z`),
      supabase.from('action_tasks').delete().eq('completed_at', `${testDate}T16:30:00.000Z`),
      supabase.from('inventory_items').delete().in('name', ['Mock Book', 'Mock Charger', 'Mock Broken Headphones'])
    ]);

    // 3. Sequential Mock Insertions
    console.log('📝 Injecting timeline records sequentially...');

    // 1. 06:30 AM – Habit (Daily, Time Entry)
    await supabase.from('habit_data').insert({
      date: testDate,
      habit: habitName,
      value: '06:30',
      status: 'Completed',
      source: 'daily'
    });

    // 2. 07:15 AM – Habit (Event)
    await supabase.from('event_log').insert({
      date: testDate,
      time: '07:15:00',
      event: eventHabitName,
      value: '1'
    });

    // 3. 08:00 AM – Workout Log
    await supabase.from('workout_log').insert({
      date: testDate,
      workout_day: 'Pull Day',
      workout_name: 'Lat Pulldowns',
      set_no: 1,
      weight: 60,
      reps: 10,
      time: '08:00',
      duration_minutes: 45
    });

    // 4. 09:30 AM – Expense
    await supabase.from('history_expenses').insert({
      date: testDate,
      time: '09:30',
      amount: 25,
      particular: 'Bought Breakfast',
      category: 'Food',
      account: 'Cash'
    });

    // 5. 10:15 AM – Vehicle (Fuel)
    await supabase.from('vehicle_fuel_logs').insert({
      vehicle_id: vehicleId,
      date: testDate,
      time: '10:15',
      odometer: 12045,
      liters: 12,
      amount: 1200,
      station: 'Shell',
      full_tank: true,
      mileage: 15
    });

    // 6. 11:00 AM – Skill Focus Practicing
    await supabase.from('skill_logs').insert({
      skill_id: skillId,
      date: testDate,
      time: '11:00',
      duration_minutes: 45,
      notes: 'Timeline verification practicing session',
      mood: 'good'
    });

    // 7. 12:45 PM – Vehicle (Service)
    await supabase.from('vehicle_service_logs').insert({
      vehicle_id: vehicleId,
      date: testDate,
      time: '12:45',
      odometer: 12150,
      amount: 2500,
      service_center: 'Express Car Wash',
      work_details: 'General wash done',
      notes: 'Quick clean'
    });

    // 8. 01:00 PM – Inventory (Acquired)
    await supabase.from('inventory_items').insert({
      name: 'Mock Book',
      location_id: locationId,
      status: 'active',
      origin_type: 'bought',
      acquired_date: testDate,
      acquired_time: '13:00',
      quantity: 1,
      condition: 'new'
    });

    // 9. 02:00 PM – Inventory (Lent)
    await supabase.from('inventory_items').insert({
      name: 'Mock Charger',
      location_id: locationId,
      status: 'lent_out',
      origin_type: 'bought',
      lent_date: testDate,
      lent_time: '14:00',
      lent_to_person: 'Friend',
      quantity: 1,
      condition: 'good'
    });

    // 10. 03:20 PM – Vehicle (Mileage)
    await supabase.from('vehicle_mileage_logs').insert({
      vehicle_id: vehicleId,
      date: testDate,
      time: '15:20',
      odometer: 12210,
      notes: 'Recorded timeline odometer check'
    });

    // 11. 04:10 PM – General Task
    await supabase.from('tasks').insert({
      task: 'Finished slide deck',
      status: 'Completed',
      completed_at: `${testDate}T16:10:00.000Z`,
      is_today: true
    });

    // 12. 04:30 PM – SquareShift Task
    await supabase.from('action_tasks').insert({
      text: 'Deployed landing page',
      completed: true,
      completed_at: `${testDate}T16:30:00.000Z`,
      project_id: null
    });

    // 13. 05:15 PM – Pet Log
    await supabase.from('pet_logs').insert({
      pet_id: petId,
      category: 'Grooming',
      log_type: 'Brushed Coat',
      date: testDate,
      time: '17:15',
      notes: 'Coat brushed and cleaned'
    });

    // 14. 08:30 PM – Inventory (Retired)
    await supabase.from('inventory_items').insert({
      name: 'Mock Broken Headphones',
      location_id: locationId,
      status: 'retired',
      origin_type: 'bought',
      retired_at: `${testDate}T20:30:00.000Z`,
      retired_reason: 'worn_out',
      quantity: 1,
      condition: 'poor'
    });

    console.log('✅ Mock data successfully inserted! Check your Resiliessance timeline page for 2026-07-18.');

  } catch (err) {
    console.error('❌ Injected timelines failed:', err.message);
  }
}

run();
