
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAggregation() {
  const selectedDate = '2026-04-27'; // Use today's date in timeline
  
  // 1. Fetch configs
  const { data: configs } = await supabase.from('habit_config').select('*');
  
  // 2. Fetch events
  const { data: events } = await supabase.from('event_log')
    .select('*')
    .eq('date', selectedDate)
    .order('created_at', { ascending: true });

  console.log("Found Events:", events.length);

  const aggs = {};
  (events || []).forEach(e => {
    if (!aggs[e.event]) {
      aggs[e.event] = { count: 0, valueDisplay: '' };
    }
    aggs[e.event].count++;
    
    const config = configs.find(c => c.habit_name === e.event);
    if (config) {
      if (config.input_type === 'duration') {
        // Mock duration sum
        aggs[e.event].valueDisplay = "00:00 + " + e.value;
      } else if (config.input_type === 'number') {
        const current = parseFloat(aggs[e.event].valueDisplay) || 0;
        aggs[e.event].valueDisplay = String(current + (parseFloat(e.value) || 0));
      } else {
        // Time, Text, Boolean
        aggs[e.event].valueDisplay = e.value || '';
      }
    }
  });

  console.log("Aggregates:", JSON.stringify(aggs, null, 2));
}

testAggregation();
