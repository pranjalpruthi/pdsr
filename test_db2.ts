import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('sadhna_report').select('*').limit(1);
  if (error) {
    console.error("DB Error:", error);
  } else if (data && data.length > 0) {
    console.log("COLUMNS:", Object.keys(data[0]));
  } else {
    console.log("No data found.");
  }
}
run();
