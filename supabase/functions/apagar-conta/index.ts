// Edge Function: apaga a conta de quem está logado (e, em cascata, tudo o que a pessoa criou).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Método não permitido', { status: 405, headers: cors });
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ erro: 'sem_login' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return new Response(JSON.stringify({ erro: 'sem_login' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { error: e2 } = await admin.auth.admin.deleteUser(data.user.id);
  if (e2) return new Response(JSON.stringify({ erro: 'falhou' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
