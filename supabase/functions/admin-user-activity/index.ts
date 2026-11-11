import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { projectAuthActivity } from './response.ts';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authorization = req.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return jsonResponse({ error: 'Service unavailable' }, 500);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await authClient.auth.getUser();
  if (userError || !userResult.user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { data: isAdmin, error: roleError } = await authClient.rpc('is_admin', {
    _user_id: userResult.user.id,
  });
  if (roleError || isAdmin !== true) return jsonResponse({ error: 'Forbidden' }, 403);

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const linkedAuthIds = new Set<string>();
    const profilePageSize = 1000;

    for (let offset = 0; ; offset += profilePageSize) {
      const { data, error } = await adminClient
        .from('users')
        .select('auth_user_id')
        .not('auth_user_id', 'is', null)
        .order('auth_user_id', { ascending: true })
        .range(offset, offset + profilePageSize - 1);
      if (error) throw error;
      for (const row of data || []) {
        if (row.auth_user_id) linkedAuthIds.add(row.auth_user_id);
      }
      if (!data || data.length < profilePageSize) break;
    }

    const linkedIds = [...linkedAuthIds];
    const users = [];
    const batchSize = 20;
    for (let offset = 0; offset < linkedIds.length; offset += batchSize) {
      const batch = linkedIds.slice(offset, offset + batchSize);
      const results = await Promise.all(batch.map((id) => adminClient.auth.admin.getUserById(id)));
      for (const result of results) {
        if (result.error) throw result.error;
        if (result.data.user) users.push(projectAuthActivity(result.data.user));
      }
    }

    return jsonResponse({ users });
  } catch (error) {
    console.error('admin user activity lookup failed', error);
    return jsonResponse({ error: 'Could not load user activity' }, 500);
  }
});