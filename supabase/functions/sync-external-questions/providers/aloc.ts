import type { NormalizedQuestion, ProviderAdapter, ProviderConfig, SyncRequest } from '../types.ts';

const EXAM_BODY_MAP: Record<string, string> = {
  JAMB: 'utme',
  WAEC: 'wassce',
  NECO: 'neco',
  POST_UTME: 'post-utme',
};

function normalizeExamBody(examBody: string): string {
  return EXAM_BODY_MAP[examBody.toUpperCase()] || examBody.toLowerCase();
}

function parseCorrectAnswer(answer: any, options: string[]): number {
  if (typeof answer === 'number') {
    return Math.max(0, Math.min(options.length - 1, answer));
  }
  const letter = String(answer).toLowerCase().trim();
  const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
  const index = map[letter];
  if (index !== undefined && index < options.length) {
    return index;
  }
  return 0;
}

function extractOptions(item: any): string[] {
  // ALOC may return options as an array or as an object with letter keys.
  const raw = item.options || item.option;
  if (Array.isArray(raw)) {
    return raw.map((o: any) => String(o || '').trim()).filter(Boolean);
  }
  if (raw && typeof raw === 'object') {
    return ['a', 'b', 'c', 'd', 'e']
      .map((letter) => String(raw[letter] || '').trim())
      .filter(Boolean);
  }
  return [];
}

export const alocAdapter: ProviderAdapter = {
  name: 'aloc',

  async fetchQuestions(params: SyncRequest, config: ProviderConfig): Promise<NormalizedQuestion[]> {
    const url = new URL(`${config.baseUrl}/questions`);
    if (params.year) url.searchParams.set('year', String(params.year));
    url.searchParams.set('exam', normalizeExamBody(params.exam_body));
    url.searchParams.set('limit', String(Math.min(params.limit || 50, 100)));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`ALOC HTTP ${response.status}: ${text}`);
    }

    const payload = await response.json();

    // ALOC response shape is configurable via env vars; common shapes:
    // { data: [...] }, { questions: [...] }, or plain array
    const rawItems =
      Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.questions)
        ? payload.questions
        : payload.results || [];

    return rawItems.map((item: any) => {
      const options = extractOptions(item);
      const examYear = item.year || item.exam_year || params.year || null;

      return {
        external_id: String(item.id || item.question_id || `${Date.now()}-${Math.random()}`),
        question_text: String(item.question || item.question_text || '').trim(),
        options,
        correct_answer: parseCorrectAnswer(item.answer || item.correct_answer, options),
        explanation: item.explanation || item.solution || item.answer_explanation || null,
        exam_body: params.exam_body,
        exam_year: examYear ? parseInt(String(examYear), 10) : null,
        difficulty_level: Number(item.difficulty || item.difficulty_level || 1),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [normalizeExamBody(params.exam_body)],
        media_urls: item.image ? [String(item.image)] : [],
      };
    });
  },
};
