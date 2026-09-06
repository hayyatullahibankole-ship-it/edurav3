import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import type { NormalizedQuestion, ProviderConfig, SyncRequest, SyncResult } from './types.ts';
import { safeUrl } from './types.ts';
import { sdashapiAdapter } from './providers/sdashapi.ts';
import { alocAdapter } from './providers/aloc.ts';

const adapters = {
  aloc: alocAdapter,
  sdashapi: sdashapiAdapter,
};

const DEFAULT_DAILY_CAP = 20000;

function providerConfig(provider: 'aloc' | 'sdashapi'): { config?: ProviderConfig; error?: string } {
  const apiKeyName = provider === 'aloc' ? 'ALOC_API_KEY' : 'SDASHAPI_API_KEY';
  const apiKey = Deno.env.get(apiKeyName);
  if (!apiKey) {
    return { error: `${apiKeyName} is not configured in the project secrets.` };
  }
  const baseUrlName = provider === 'aloc' ? 'ALOC_BASE_URL' : 'SDASHAPI_BASE_URL';
  const defaultBaseUrl =
    provider === 'aloc' ? 'https://questions.aloc.com.ng/api/v2' : 'https://sdashapi.com/api';
  return { config: { apiKey, baseUrl: Deno.env.get(baseUrlName) || defaultBaseUrl } };
}

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

    const { data: userRes, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userRes?.user) {
      console.error('auth failed', userErr?.message);
      return json({ error: 'You are not signed in. Sign in as an admin and try again.' }, 401);
    }

    const user = userRes.user;
    const { data: isAdmin, error: roleErr } = await authClient.rpc('is_admin', { _user_id: user.id });
    if (roleErr) {
      console.error('is_admin rpc error', roleErr.message);
      return json({ error: `Could not verify admin role: ${roleErr.message}` }, 403);
    }
    if (!isAdmin) {
      return json({ error: 'This action is restricted to admin accounts.' }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Partial<SyncRequest>;
    const provider = body.provider;
    if (!provider || !(provider in adapters)) {
      return json({ error: 'Choose a provider (ALOC or SdashAPI) before importing.' }, 400);
    }

    const action = body.action || 'sync';
    const cfg = providerConfig(provider);
    if (!cfg.config) return json({ error: cfg.error }, 500);
    const config = cfg.config;

    // --- Connection test -------------------------------------------------
    if (action === 'test_connection') {
      const testRequest: SyncRequest = {
        provider,
        exam_body: body.exam_body?.toUpperCase() || 'JAMB',
        provider_subject: body.provider_subject || 'english',
        limit: 1,
      };
      const url = adapters[provider].buildUrl(testRequest, config);
      try {
        const questions = await adapters[provider].fetchQuestions(testRequest, config);
        return json({
          ok: true,
          provider,
          url: safeUrl(url),
          sample_count: questions.length,
          message:
            questions.length > 0
              ? `${provider} connection works. Sample question received.`
              : `${provider} responded but returned no questions for this subject/exam.`,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('test_connection failed', provider, message);
        return json({ ok: false, provider, url: safeUrl(url), error: message }, 502);
      }
    }

    // --- Sync ------------------------------------------------------------
    if (!body.exam_body) {
      return json({ error: 'Select an exam body (JAMB, WAEC, NECO or Post-UTME).' }, 400);
    }

    const examBody = body.exam_body.toUpperCase();
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 500);
    const dryRun = Boolean(body.dry_run);

    // Resolve the mapping: Edura subject + provider subject code.
    let mappingQuery = adminClient
      .from('external_question_mappings')
      .select('edura_subject_id, external_subject_name')
      .eq('provider', provider)
      .eq('exam_body', examBody)
      .eq('is_active', true);

    if (body.subject_id) mappingQuery = mappingQuery.eq('edura_subject_id', body.subject_id);

    const { data: mappingRows, error: mappingErr } = await mappingQuery.limit(1);
    if (mappingErr) {
      console.error('mapping lookup failed', mappingErr.message);
      return json({ error: `Could not read subject mappings: ${mappingErr.message}` }, 500);
    }

    const mapping = mappingRows?.[0];
    const eduraSubjectId = mapping?.edura_subject_id || null;
    const providerSubject = mapping?.external_subject_name || null;

    if (!eduraSubjectId || !providerSubject) {
      return json(
        {
          error: `No ${provider.toUpperCase()} subject mapping exists for this subject and ${examBody}. Map the subject first, then import.`,
        },
        400,
      );
    }

    const { data: dailyCountData } = await adminClient.rpc('get_daily_import_count', { _provider: provider });
    const dailyCount = Number(dailyCountData) || 0;
    const dailyCap = Number(Deno.env.get('EXTERNAL_IMPORT_DAILY_CAP')) || DEFAULT_DAILY_CAP;
    if (dailyCount + limit > dailyCap) {
      return json(
        { error: `Daily import cap of ${dailyCap} would be exceeded. Already imported ${dailyCount} today.` },
        429,
      );
    }

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
      console.error('sync log insert failed', logErr?.message);
      return json({ error: 'Failed to create sync log: ' + (logErr?.message || 'unknown') }, 500);
    }

    const syncRequest: SyncRequest = {
      provider,
      exam_body: examBody,
      subject_id: eduraSubjectId,
      provider_subject: providerSubject,
      year: body.year || undefined,
      limit,
      dry_run: dryRun,
    };

    console.log('sync start', {
      provider,
      examBody,
      providerSubject,
      year: syncRequest.year,
      limit,
      dryRun,
      url: safeUrl(adapters[provider].buildUrl(syncRequest, config)),
    });

    let questions: NormalizedQuestion[] = [];
    const errors: string[] = [];

    try {
      questions = await adapters[provider].fetchQuestions(syncRequest, config);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error('provider fetch failed', provider, message);
      await adminClient
        .from('external_sync_logs')
        .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
        .eq('id', logRow.id);
      return json({ error: `${provider.toUpperCase()} request failed: ${message}`, details: [message] }, 502);
    }

    if (questions.length === 0) {
      const message = `No questions returned for ${providerSubject} (${examBody}${
        syncRequest.year ? `, ${syncRequest.year}` : ''
      }). Try another year or subject.`;
      await adminClient
        .from('external_sync_logs')
        .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
        .eq('id', logRow.id);
      return json({ error: message }, 404);
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

    let imported = 0;
    let skipped = 0;
    let errorCount = 0;

    for (const q of questions) {
      try {
        if (!q.question_text || q.options.length < 2) {
          skipped++;
          continue;
        }

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
    console.log('sync done', { provider, imported, skipped, errorCount, status });

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
