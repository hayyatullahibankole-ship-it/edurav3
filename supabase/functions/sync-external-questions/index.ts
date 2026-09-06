import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import type { NormalizedQuestion, ProviderConfig, SyncRequest, SyncResult } from './types.ts';
import { sdashapiAdapter } from './providers/sdashapi.ts';
import { alocAdapter } from './providers/aloc.ts';

const adapters = {
  aloc: alocAdapter,
  sdashapi: sdashapiAdapter,
};

const DEFAULT_DAILY_CAP = 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify admin
    const { data: userRes, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const user = userRes.user;
    const { data: isAdmin, error: roleErr } = await authClient.rpc('is_admin', { _user_id: user.id });
    if (roleErr || !isAdmin) {
      return json({ error: 'Forbidden: admin only' }, 403);
    }

    const body = await req.json().catch(() => ({})) as Partial<SyncRequest>;

    const provider = body.provider;
    if (!provider || !(provider in adapters)) {
      return json({ error: 'Invalid or missing provider. Use aloc or sdashapi.' }, 400);
    }

    if (!body.exam_body) {
      return json({ error: 'exam_body is required (JAMB, WAEC, NECO, POST_UTME).' }, 400);
    }

    const examBody = body.exam_body.toUpperCase();
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 100);
    const dryRun = Boolean(body.dry_run);

    // Resolve Edura subject
    let eduraSubjectId: string | null = body.subject_id || null;
    if (!eduraSubjectId) {
      // Try to find a default mapping for this provider + exam body
      const { data: mapping } = await adminClient
        .from('external_question_mappings')
        .select('edura_subject_id')
        .eq('provider', provider)
        .eq('exam_body', examBody)
        .eq('is_active', true)
        .maybeSingle();
      eduraSubjectId = mapping?.edura_subject_id || null;
    }

    if (!eduraSubjectId) {
      return json({ error: 'No Edura subject mapping found. Please map a subject first.' }, 400);
    }

    // API key config
    const apiKeyName = provider === 'aloc' ? 'ALOC_API_KEY' : 'SDASHAPI_API_KEY';
    const apiKey = Deno.env.get(apiKeyName);
    if (!apiKey) {
      return json({ error: `${apiKeyName} secret is not configured.` }, 500);
    }

    const baseUrlName = provider === 'aloc' ? 'ALOC_BASE_URL' : 'SDASHAPI_BASE_URL';
    const defaultBaseUrl = provider === 'aloc' ? 'https://api.aloc.com.ng/api/v1' : 'https://sdashapi.com/api';
    const baseUrl = Deno.env.get(baseUrlName) || defaultBaseUrl;

    const config: ProviderConfig = { apiKey, baseUrl };

    // Check daily cap
    const { data: dailyCountData } = await adminClient.rpc('get_daily_import_count', { _provider: provider });
    const dailyCount = Number(dailyCountData) || 0;
    const dailyCap = Number(Deno.env.get('EXTERNAL_IMPORT_DAILY_CAP')) || DEFAULT_DAILY_CAP;

    if (dailyCount + limit > dailyCap) {
      return json({ error: `Daily import cap of ${dailyCap} would be exceeded. Already imported ${dailyCount} today.` }, 429);
    }

    // Create sync log
    const { data: logRow, error: logErr } = await adminClient
      .from('external_sync_logs')
      .insert({
        provider,
        exam_body: examBody,
        subject_id: eduraSubjectId,
        year: body.year || null,
        requested_count: limit,
        status: 'running',
        created_by: user.id,
      })
      .select()
      .single();

    if (logErr || !logRow) {
      return json({ error: 'Failed to create sync log: ' + (logErr?.message || 'unknown') }, 500);
    }

    const syncRequest: SyncRequest = {
      provider,
      exam_body: examBody,
      subject_id: eduraSubjectId,
      year: body.year || undefined,
      limit,
      dry_run: dryRun,
    };

    let questions: NormalizedQuestion[] = [];
    let errors: string[] = [];

    try {
      questions = await adapters[provider].fetchQuestions(syncRequest, config);
    } catch (fetchError) {
      errors.push(fetchError instanceof Error ? fetchError.message : String(fetchError));
      await adminClient
        .from('external_sync_logs')
        .update({ status: 'failed', error_message: errors.join('\n'), completed_at: new Date().toISOString() })
        .eq('id', logRow.id);
      return json({ error: 'Failed to fetch questions', details: errors }, 502);
    }

    if (dryRun) {
      await adminClient
        .from('external_sync_logs')
        .update({
          status: 'completed',
          imported_count: 0,
          skipped_count: questions.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logRow.id);
      return json({ dry_run: true, preview: questions.slice(0, 5), total: questions.length });
    }

    // Upsert questions
    let imported = 0;
    let skipped = 0;
    let errorCount = 0;

    for (const q of questions) {
      try {
        if (!q.question_text || q.options.length < 2) {
          skipped++;
          continue;
        }

        // Check duplicate by external_id + provider
        const { data: existing } = await adminClient
          .from('questions')
          .select('id')
          .eq('external_source', provider)
          .eq('external_id', q.external_id)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error: insertErr } = await adminClient.from('questions').insert({
          subject_id: eduraSubjectId,
          type: 'MCQ_SINGLE',
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty_level: q.difficulty_level,
          tags: q.tags,
          media_urls: q.media_urls,
          points: 1,
          is_active: true,
          external_source: provider,
          external_id: q.external_id,
          exam_body: q.exam_body,
          exam_year: q.exam_year,
        });

        if (insertErr) {
          errorCount++;
          errors.push(`Insert error for ${q.external_id}: ${insertErr.message}`);
        } else {
          imported++;
        }
      } catch (e) {
        errorCount++;
        errors.push(String(e));
      }
    }

    const status: 'completed' | 'failed' = errorCount > imported ? 'failed' : 'completed';

    await adminClient
      .from('external_sync_logs')
      .update({
        status,
        imported_count: imported,
        skipped_count: skipped,
        error_count: errorCount,
        error_message: errors.slice(0, 5).join('\n') || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logRow.id);

    const result: SyncResult = {
      log_id: logRow.id,
      provider,
      exam_body: examBody,
      requested_count: limit,
      imported_count: imported,
      skipped_count: skipped,
      error_count: errorCount,
      errors: errors.slice(0, 10),
      status,
    };

    return json(result);
  } catch (error) {
    console.error('sync-external-questions error', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
