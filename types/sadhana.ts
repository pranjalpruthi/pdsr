export interface Devotee {
  devotee_id: number;
  devotee_name: string;
}

export interface SadhanaFormData {
  date: Date;
  devotee_id: number;
  before_7_am_japa_session: number;
  before_7_am: number;
  from_7_to_9_am: number;
  after_9_am: number;
  book_name: string;
  book_reading_time_min: number;
  lecture_speaker: string;
  lecture_time_min: number;
  seva_name: string;
  seva_time_min: number;
} 