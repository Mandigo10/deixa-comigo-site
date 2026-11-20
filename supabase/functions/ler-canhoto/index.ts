// Lê a foto do comprovante de aposta com IA (Claude, visão) e devolve os jogos.
// Só para usuários logados. Sem a chave ANTHROPIC_API_KEY configurada, devolve { sem_ia: true }
// e o app usa a leitura (OCR) no próprio celular.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const NOMES: Record<string, string> = {
  megasena: 'Mega-Sena', lotofacil: 'Lotofácil', quina: 'Quina', lotomania: 'Lotomania',
  duplasena: 'Dupla Sena', diadesorte: 'Dia de Sorte', timemania: 'Timemania'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ erro: 'metodo' }, 405);

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { data: u } = await sb.auth.getUser(token);
  if (!u || !u.user) return json({ erro: 'login' }, 401);

  const chave = Deno.env.get('ANTHROPIC_API_KEY');
  if (!chave) return json({ sem_ia: true });

  let corpo: { imagem?: string; tipo?: string; loteria?: string } = {};
  try { corpo = await req.json(); } catch (_) { return json({ erro: 'entrada' }, 400); }
  const imagem = String(corpo.imagem || '');
  const tipo = ['image/jpeg', 'image/png', 'image/webp'].includes(String(corpo.tipo)) ? String(corpo.tipo) : 'image/jpeg';
  if (imagem.length < 1000 || imagem.length > 6_000_000) return json({ erro: 'imagem' }, 400);
  const nome = NOMES[String(corpo.loteria)] || 'loteria da CAIXA';

  const pedido = `Esta foto é de um comprovante (canhoto) de aposta das Loterias CAIXA, provavelmente da ${nome}.
Leia com cuidado e extraia:
- o número do concurso;
- a data do sorteio;
- cada jogo apostado, com todas as dezenas na ordem impressa (cada linha/letra A, B, C... é um jogo).
Não invente números: se algo estiver ilegível, deixe de fora e marque "legivel": false.
Responda SOMENTE com um JSON, sem texto antes ou depois, neste formato:
{"loteria": "megasena|lotofacil|quina|lotomania|duplasena|diadesorte|timemania|outra", "concurso": 1234 ou null, "data_sorteio": "AAAA-MM-DD" ou null, "jogos": [[1,2,3,4,5,6]], "legivel": true}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('CANHOTO_MODELO') || 'claude-sonnet-5-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: tipo, data: imagem } },
          { type: 'text', text: pedido }
        ] }]
      }),
      signal: AbortSignal.timeout(45000)
    });
    if (!r.ok) { console.error('anthropic', r.status, await r.text()); return json({ erro: 'ia' }, 502); }
    const resp = await r.json();
    const texto = (resp.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) return json({ erro: 'leitura' }, 502);
    const lido = JSON.parse(m[0]);
    const jogos = Array.isArray(lido.jogos)
      ? lido.jogos.map((j: unknown) => (Array.isArray(j) ? j.map((x) => parseInt(String(x), 10)).filter((x) => Number.isFinite(x)) : [])).filter((j: number[]) => j.length)
      : [];
    return json({
      loteria: typeof lido.loteria === 'string' ? lido.loteria : null,
      concurso: Number.isFinite(Number(lido.concurso)) && Number(lido.concurso) > 0 ? Math.trunc(Number(lido.concurso)) : null,
      data_sorteio: /^\d{4}-\d{2}-\d{2}$/.test(String(lido.data_sorteio)) ? lido.data_sorteio : null,
      jogos, legivel: lido.legivel !== false, fonte: 'ia'
    });
  } catch (e) {
    console.error(e);
    return json({ erro: 'ia' }, 502);
  }
});
