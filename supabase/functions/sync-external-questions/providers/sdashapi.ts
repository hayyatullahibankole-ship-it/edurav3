import type { NormalizedQuestion, ProviderAdapter, ProviderConfig, SyncRequest } from '../types.ts';
import { safeUrl } from '../types.ts';

const EXAM_BODY_MAP: Record<string, string> = {
  JAMB: 'utme',
  WAEC: 'wassce',
  NECO: 'neco',
  POST_UTME: 'post-utme',
};

const LETTER_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };

function normalizeExamBody(examBody: string): string {
  return EXAM_BODY_MAP[examBody.toUpperCase()] || examBody.toLowerCase();
}

function parseOptions(optionObj: Record<string, string>): string[] {
  return ['a', 'b', 'c', 'd', 'e']
    .map((letter) => optionObj?.[letter])
    .filter((text) => typeof text === 'string' && text.trim().length > 0)
    .map((text) => String(text).trim());
}

function parseCorrectAnswer(answer: unknown, options: string[]): number {
  const letter = String(answer ?? '').toLowerCase().trim();
  const index = LETTER_INDEX[letter];
  if (index === undefined || index >= options.length) return 0;
  return index;
}

export const sdashapiAdapter: ProviderAdapter = {
  name: 'sdashapi',

  buildUrl(params: SyncRequest, config: ProviderConfig): string {
    const url = new URL(`${config.baseUrl.replace(/\/$/, '')}/v1/q`);
    url.searchParams.set('subject', String(params.provider_subject || '').toLowerCase());
    url.searchParams.set('type', normalizeExamBody(params.exam_body));
    if (params.year) url.searchParams.set('year', String(params.year));
    url.searchParams.set('limit', String(Math.min(params.limit || 50, 50)));
    return url.toString();
  },

  async fetchQuestions(params: SyncRequest, config: ProviderConfig): Promise<NormalizedQuestion[]> {
    const totalWanted = Math.max(1, params.limit || 50);
    const collected: NormalizedQuestion[] = [];
    const seen = new Set<string>();

    // SdashAPI caps a single call at 50 questions; repeat until we have enough.
    const rounds = Math.ceil(totalWanted / 50);
    for (let i = 0; i < rounds; i++) {
      const remaining = totalWanted - collected.length;
      if (remaining <= 0) break;

      const url = this.buildUrl({ ...params, limit: Math.min(remaining, 50) }, config);
      console.log('[sdashapi] GET', safeUrl(url));

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', AccessToken: config.apiKey },
      });

      const text = await response.text();
      if (!response.ok) {
        console.error('[sdashapi] HTTP', response.status, text.slice(0, 400));
        if (collected.length > 0) break;
        throw new Error(`SdashAPI HTTP ${response.status}: ${text.slice(0, 300)}`);
      }

      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`SdashAPI returned a non-JSON response: ${text.slice(0, 200)}`);
      }

      if (payload?.status && Number(payload.status) >= 400) {
        throw new Error(`SdashAPI error ${payload.status}: ${payload.message || 'Unknown error'}`);
      }

      const rawData = payload?.data;
      const items = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
      console.log('[sdashapi] received', items.length, 'items');
      if (items.length === 0) break;

      for (const item of items) {
        const options = parseOptions(item.option || item.options || {});
        const examYear = item.examyear ? parseInt(String(item.examyear), 10) : params.year || null;
        const externalId = String(item.id ?? `${examYear || ''}-${String(item.question || '').slice(0, 40)}`);
        if (seen.has(externalId)) continue;
        seen.add(externalId);

        collected.push({
          external_id: externalId,
          question_text: String(item.question ?? '').trim(),
          options,
          correct_answer: parseCorrectAnswer(item.answer, options),
          explanation: item.solution ? String(item.solution).trim() : null,
          exam_body: params.exam_body,
          exam_year: examYear,
          difficulty_level: 1,
          tags: [String(item.examtype || params.exam_body).toUpperCase(), examYear ? String(examYear) : '']
            .filter(Boolean),
          media_urls: item.image ? [String(item.image)] : [],
        });
      }
    }

    return collected.slice(0, totalWanted);
  },
};
