/**
 * Normalises the many exam-type spellings used across the app
 * ("jamb", "JAMB Practice", "post-utme", "POST_UTME"...) into the
 * canonical exam_body value stored on questions.
 */
export type ExamBody = 'JAMB' | 'WAEC' | 'NECO' | 'POST_UTME';

export const EXAM_BODIES: ExamBody[] = ['JAMB', 'WAEC', 'NECO', 'POST_UTME'];

export const EXAM_BODY_LABELS: Record<ExamBody, string> = {
  JAMB: 'JAMB',
  WAEC: 'WAEC',
  NECO: 'NECO',
  POST_UTME: 'Post-UTME',
};

export function normalizeExamBody(value?: string | null): ExamBody | null {
  if (!value) return null;
  const v = String(value).toUpperCase().replace(/[\s-]+/g, '_');
  if (v.includes('POST_UTME') || v.includes('POSTUTME') || v.includes('POST_UME')) return 'POST_UTME';
  if (v.includes('JAMB') || v.includes('UTME')) return 'JAMB';
  if (v.includes('WAEC') || v.includes('WASSCE')) return 'WAEC';
  if (v.includes('NECO')) return 'NECO';
  return null;
}
