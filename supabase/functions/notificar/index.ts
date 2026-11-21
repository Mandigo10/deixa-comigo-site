// Envia alertas (Web Push) para os aparelhos do usuário.
// POST com header x-segredo (só o banco conhece): { user_id, titulo, corpo, url } ou { lembretes: true } (rotina diária).
// GET ?preparar=1: cria as chaves VAPID na primeira vez (ficam só no banco, nunca saem do servidor).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function config(): Promise<Record<string, string>> {
  const { data } = await admin.rpc('config_interna');
  return (data || {}) as Record<string, string>;
}
async function chaves() {
  let c = await config();
  if (!c.vapid_publica || !c.vapid_privada) {
    const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', par.privateKey);
    const pub = new Uint8Array([4, ...deB64url(jwk.x!), ...deB64url(jwk.y!)]);
    await admin.rpc('guardar_config', { p_chave: 'vapid_publica', p_valor: b64url(pub) });
    await admin.rpc('guardar_config', { p_chave: 'vapid_privada', p_valor: jwk.d! });
    c = await config(); // se outra chamada criou ao mesmo tempo, vale a que ficou gravada
  }
  webpush.setVapidDetails('https://deixa-comigo-site.jader-gabriel.workers.dev', c.vapid_publica, c.vapid_privada);
  return c;
}

async function enviar(userId: string, titulo: string, corpo: string, url: string) {
  const { data: subs } = await admin.from('push_inscricoes').select('id, endpoint, p256dh, auth').eq('user_id', userId);
  let ok = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo, corpo, url: url || '/app/' }), { TTL: 60 * 60 * 24, urgency: 'high' });
      ok++;
    } catch (e: any) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) await admin.from('push_inscricoes').delete().eq('id', s.id);
      else console.error('push', e && e.statusCode, e && e.body);
    }
  }
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    if (new URL(req.url).searchParams.get('preparar')) { await chaves(); return new Response('ok'); }
    return new Response('ok');
  }
  const c = await chaves();
  if (!c.notificar_segredo || req.headers.get('x-segredo') !== c.notificar_segredo) return new Response('não', { status: 401 });
  const corpo = await req.json().catch(() => ({}));
  if (corpo.lembretes) {
    const { data } = await admin.rpc('lembretes_do_dia');
    let n = 0;
    for (const l of (data || []) as any[]) n += await enviar(l.user_id, l.titulo, l.corpo, '/app/#/');
    return Response.json({ enviados: n });
  }
  if (!corpo.user_id || !corpo.titulo) return new Response('entrada', { status: 400 });
  const n = await enviar(corpo.user_id, String(corpo.titulo).slice(0, 80), String(corpo.corpo || '').slice(0, 200), String(corpo.url || '/app/'));
  return Response.json({ enviados: n });
});
