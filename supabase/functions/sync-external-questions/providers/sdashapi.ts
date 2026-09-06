import type { NormalizedQuestion, ProviderAdapter, ProviderConfig, SyncRequest } from '../types.ts';

const EXAM_BODY_MAP: Record<string, string> = {
  JAMB: 'utme',
  WAEC: 'wassce',
  NECO: 'neco',
  POST_UTME: 'post-utme',
};

const LETTER_INDEX: Record<string, number> = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
};

function normalizeExamBody(examBody: string): string {
  return EXAM_BODY_MAP[examBody.toUpperCase()] || examBody.toLowerCase();
}

function parseOptions(optionObj: Record<string, string>): string[] {
  const letters = ['a', 'b', 'c', 'd', 'e'];
  return letters
    .map((letter) => optionObj[letter])
    .filter((text) => typeof text === 'string' && text.trim().length > 0);
}

function parseCorrectAnswer(answer: string, options: string[]): number {
  const letter = String(answer).toLowerCase().trim();
  const index = LETTER_INDEX[letter];
  if (index === undefined || index >= options.length) {
    return 0;
  }
  return index;
}

export const sdashapiAdapter: ProviderAdapter = {
  name: 'sdashapi',

  async fetchQuestions(params: SyncRequest, config: ProviderConfig): Promise<NormalizedQuestion[]> {
    const url = new URL(`${config.baseUrl}/v1/q`);
    if (params.year) url.searchParams.set('year', String(params.year));
    url.searchParams.set('type', normalizeExamBody(params.exam_body));
    url.searchParams.set('limit', String(Math.min(params.limit || 50, 50)));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'AccessToken': config.apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`SdashAPI HTTP ${response.status}: ${text}`);
    }

    const payload = await response.json();

    if (payload.status && payload.status !== 200) {
      throw new Error(`SdashAPI error ${payload.status}: ${payload.message || 'Unknown error'}`);
    }

    const rawData = payload.data;
    const items = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];

    return items.map((item: any) => {
      const options = parseOptions(item.option || {});
      const correctAnswer = parseCorrectAnswer(item.answer, options);
      const examYear = item.examyear ? parseInt(String(item.examyear), 10) : params.year || null;

      return {
        external_id: String(item.id),
        question_text: String(item.question || '').trim(),
        options,
        correct_answer: correctAnswer,
        explanation: item.solution ? String(item.solution).trim() : null,
        exam_body: params.exam_body,
        exam_year: examYear,
        difficulty_level: 1,
        tags: [String(item.examtype || params.exam_body).toUpperCase(), examYear ? String(examYear) : ''].filter(Boolean),
        media_urls: item.image ? [String(item.image)] : [],
      };
    });
  },
};
