import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export function calculateScores(
  before_7_am_japa_session: number,
  before_7_am: number,
  from_7_to_9_am: number,
  after_9_am: number,
  book_reading_time_min: number,
  lecture_time_min: number,
  seva_time_min: number
) {
  // Calculate total rounds
  const total_rounds = before_7_am_japa_session + before_7_am + from_7_to_9_am + after_9_am;

  // Calculate score_a (max 25) - matches Python implementation
  const score_a = Math.min(
    before_7_am_japa_session * 2.5 + 
    before_7_am * 2 + 
    from_7_to_9_am * 1.5 + 
    after_9_am * 1,
    25
  );

  // Calculate score_b (book reading) - matches Python pd.cut implementation
  let score_b = 0;
  if (book_reading_time_min > 60) score_b = 30;
  else if (book_reading_time_min > 45) score_b = 30;
  else if (book_reading_time_min > 30) score_b = 20;
  else if (book_reading_time_min > 15) score_b = 15;
  else if (book_reading_time_min > 1) score_b = 7;
  else score_b = 0;

  // Calculate score_c (lecture) - matches Python pd.cut implementation
  let score_c = 0;
  if (lecture_time_min > 45) score_c = 30;
  else if (lecture_time_min > 30) score_c = 20;
  else if (lecture_time_min > 15) score_c = 15;
  else if (lecture_time_min > 0) score_c = 7;
  else score_c = 0;

  // Calculate score_d (seva) - matches Python pd.cut implementation
  let score_d = 0;
  if (seva_time_min > 60) score_d = 15;
  else if (seva_time_min > 45) score_d = 15;
  else if (seva_time_min > 30) score_d = 12;
  else if (seva_time_min > 15) score_d = 8;
  else if (seva_time_min > 1) score_d = 5;
  else score_d = 0;

  // Calculate total score
  const total_score = Math.round(score_a) + score_b + score_c + score_d;

  return {
    total_rounds,
    score_a: Math.round(score_a),
    score_b,
    score_c,
    score_d,
    total_score
  };
}