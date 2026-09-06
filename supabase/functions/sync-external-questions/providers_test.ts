import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { sdashapiAdapter } from './providers/sdashapi.ts';
import { alocAdapter } from './providers/aloc.ts';
import type { SyncRequest } from './types.ts';

const config = { apiKey: 'test-key', baseUrl: 'http://localhost:9999' };

Deno.test('sdashapiAdapter normalizes single result', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: 200,
        data: {
          id: 'q1',
          question: 'What is 2 + 2?',
          option: { a: '2', b: '3', c: '4', d: '5' },
          answer: 'c',
          solution: 'Basic addition.',
          examyear: '2022',
          examtype: 'utme',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  const questions = await sdashapiAdapter.fetchQuestions(
    { provider: 'sdashapi', exam_body: 'JAMB', limit: 1, year: 2022 } as SyncRequest,
    config
  );

  assertEquals(questions.length, 1);
  assertEquals(questions[0].question_text, 'What is 2 + 2?');
  assertEquals(questions[0].options, ['2', '3', '4', '5']);
  assertEquals(questions[0].correct_answer, 2);
  assertEquals(questions[0].exam_year, 2022);

  globalThis.fetch = originalFetch;
});

Deno.test('sdashapiAdapter normalizes array result', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: 200,
        data: [
          {
            id: 'q2',
            question: 'Capital of Nigeria?',
            option: { a: 'Lagos', b: 'Abuja' },
            answer: 'b',
            solution: 'Abuja is the capital.',
            examyear: '2021',
            examtype: 'utme',
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  const questions = await sdashapiAdapter.fetchQuestions(
    { provider: 'sdashapi', exam_body: 'JAMB', limit: 1, year: 2021 } as SyncRequest,
    config
  );

  assertEquals(questions.length, 1);
  assertEquals(questions[0].correct_answer, 1);

  globalThis.fetch = originalFetch;
});

Deno.test('alocAdapter normalizes object options', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [
          {
            id: 'a1',
            question: 'Largest planet?',
            option: { a: 'Earth', b: 'Mars', c: 'Jupiter' },
            answer: 'c',
            explanation: 'Jupiter is the largest.',
            year: 2023,
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  const questions = await alocAdapter.fetchQuestions(
    { provider: 'aloc', exam_body: 'WAEC', limit: 1, year: 2023 } as SyncRequest,
    config
  );

  assertEquals(questions.length, 1);
  assertEquals(questions[0].correct_answer, 2);
  assertEquals(questions[0].exam_year, 2023);

  globalThis.fetch = originalFetch;
});

Deno.test('alocAdapter builds a v2 URL with subject and type', () => {
  const url = alocAdapter.buildUrl(
    { provider: 'aloc', exam_body: 'JAMB', provider_subject: 'english', limit: 20, year: 2019 } as SyncRequest,
    config,
  );
  assertEquals(url, 'http://localhost:9999/m?subject=english&type=utme&year=2019&limit=20');
});

Deno.test('sdashapiAdapter builds a URL with subject', () => {
  const url = sdashapiAdapter.buildUrl(
    { provider: 'sdashapi', exam_body: 'WAEC', provider_subject: 'biology', limit: 50 } as SyncRequest,
    config,
  );
  assertEquals(url, 'http://localhost:9999/v1/q?subject=biology&type=wassce&limit=50');
});

Deno.test('sdashapiAdapter returns empty list when provider has no data', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ status: 200, data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  const questions = await sdashapiAdapter.fetchQuestions(
    { provider: 'sdashapi', exam_body: 'JAMB', provider_subject: 'english', limit: 10 } as SyncRequest,
    config,
  );
  assertEquals(questions.length, 0);

  globalThis.fetch = originalFetch;
});
