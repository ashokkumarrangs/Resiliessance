const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl, supabaseKey;
env.split('\n').forEach(line => {
  if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if(line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = [{
    date: '2026-04-26',
    workout_name: 'Bench Press',
    set_no: 1,
    weight: 60,
    reps: 10,
    notes: ""
  }];
  const { data, error } = await supabase.from('workout_log').insert(payload);
  console.log("Error:", JSON.stringify(error, null, 2));
}
test();
