import type { NormalizedQuestion, ProviderAdapter, ProviderConfig, SyncRequest } from '../types.ts';
import { safeUrl } from '../types.ts';

const EXAM_BODY_MAP: Record<string, string> = {
  JAMB: 'utme',
  WAEC: 'wassce',
  NECO: 'neco',
  POST_UTME: 'post-utme',
};

function normalizeExamBody(examBody: string): string {
  return EXAM_BODY_MAP[examBody.toUpperCase()] || examBody.toLowerCase();
}

function parseCorrectAnswer(answer: unknown, options: string[]): number {
  if (typeof answer === 'number') {
    return Math.max(0, Math.min(options.length - 1, answer));
  }
  const letter = String(answer ?? '').toLowerCase().trim();
  const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
  const index = map[letter];
  if (index !== undefined && index < options.length) return index;
  return 0;
}

function extractOptions(item: any): string[] {
  const raw = item.option || item.options;
  if (Array.isArray(raw)) {
    return raw.map((o: any) => String(o ?? '').trim()).filter(Boolean);
  }
  if (raw && typeof raw === 'object') {
    return ['a', 'b', 'c', 'd', 'e']
      .map((letter) => String(raw[letter] ?? '').trim())
      .filter(Boolean);
  }
  return [];
}

export const alocAdapter: ProviderAdapter = {
  name: 'aloc',

  buildUrl(params: SyncRequest, config: ProviderConfig): string {
    const many = (params.limit || 1) > 1;
    const url = new URL(`${config.baseUrl.replace(/\/$/, '')}/${many ? 'm' : 'q'}`);
    url.searchParams.set('subject', String(params.provider_subject || '').toLowerCase());
    url.searchParams.set('type', normalizeExamBody(params.exam_body));
    if (params.year) url.searchParams.set('year', String(params.year));
    if (many) url.searchParams.set('limit', String(Math.min(params.limit || 20, 40)));
    return url.toString();
  },

  async fetchQuestions(params: SyncRequest, config: ProviderConfig): Promise<NormalizedQuestion[]> {
    const url = this.buildUrl(params, config);
    console.log('[aloc] GET', safeUrl(url));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        AccessToken: config.apiKey,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('[aloc] HTTP', response.status, text.slice(0, 400));
      throw new Error(`ALOC HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`ALOC returned a non-JSON response: ${text.slice(0, 200)}`);
    }

    if (payload?.status && Number(payload.status) >= 400) {
      throw new Error(`ALOC error ${payload.status}: ${payload.message || payload.error || 'Unknown error'}`);
    }

    const rawData = payload?.data;
    const items = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
    console.log('[aloc] received', items.length, 'items');

    return items.map((item: any) => {
      const options = extractOptions(item);
      const examYear = item.examyear || item.year || params.year || null;

      return {
        external_id: String(item.id ?? item.question_id ?? `${item.examyear || ''}-${String(item.question || '').slice(0, 40)}`),
        question_text: String(item.question ?? '').trim(),
        options,
        correct_answer: parseCorrectAnswer(item.answer ?? item.correct_answer, options),
        explanation: item.solution || item.explanation || null,
        exam_body: params.exam_body,
        exam_year: examYear ? parseInt(String(examYear), 10) : null,
        difficulty_level: 1,
        tags: [String(item.examtype || normalizeExamBody(params.exam_body)).toUpperCase(), params.provider_subject || '']
          .filter(Boolean),
        media_urls: item.image ? [String(item.image)] : [],
      };
    });
  },
};
