import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "Missing");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
supabase.from('sadhna_report').select('*').limit(1).then(({ data, error }) => {
  if (error) console.error("Error:", error);
  else console.log("Columns:", data && data.length ? Object.keys(data[0]) : "No rows");
}).catch(console.error);
