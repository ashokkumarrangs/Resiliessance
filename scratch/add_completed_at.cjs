const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mfkzyryotmsmevnweuws.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ma3p5cnlvdG1zbWV2bndldXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjM4MTksImV4cCI6MjA5Nzk5OTgxOX0.er7t42Dh7UkAN-Udda1dOMiXvpbylv8-RWyqXBDy6cA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Running SQL to add completed_at to action_tasks...");
  const { error } = await supabase.rpc("exec_sql", {
    sql_query: "ALTER TABLE public.action_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;"
  });
  if (error) {
    // If exec_sql RPC doesn't exist, we can log it. Let's write the query to a file so the user can run it, or check if we can run it.
    console.error("Error executing SQL via RPC:", error.message);
  } else {
    console.log("Successfully added completed_at column to action_tasks!");
  }
}
run();
