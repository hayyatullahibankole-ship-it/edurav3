export interface SyncRequest {
  provider: 'aloc' | 'sdashapi';
  exam_body: string; // JAMB, WAEC, NECO, POST_UTME
  subject_id?: string; // Edura subject UUID
  year?: number;
  limit?: number;
  dry_run?: boolean;
}

export interface NormalizedQuestion {
  external_id: string;
  question_text: string;
  options: string[];
  correct_answer: number; // 0-based index
  explanation: string | null;
  exam_body: string;
  exam_year: number | null;
  difficulty_level: number;
  tags: string[];
  media_urls: string[];
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ProviderAdapter {
  name: 'aloc' | 'sdashapi';
  fetchQuestions(params: SyncRequest, config: ProviderConfig): Promise<NormalizedQuestion[]>;
}

export interface SyncResult {
  log_id: string;
  provider: string;
  exam_body: string;
  requested_count: number;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  errors: string[];
  status: 'completed' | 'failed';
}
