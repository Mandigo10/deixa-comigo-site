// Busca o resultado oficial de uma loteria da CAIXA e guarda em resultados_loteria.
// Entrada (POST JSON): { loteria: 'megasena' | ... | 'todas', concurso?: number }
// Sem concurso: devolve o último resultado e o próximo concurso.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const LOTERIAS = ['megasena', 'lotofacil', 'quina', 'lotomania', 'duplasena', 'diadesorte', 'timemania'];
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const recentes = new Map<string, { em: number; dados: unknown }>();

const PALAVRAS: Record<string, number> = { sena: 6, quina: 5, quadra: 4, terno: 3, duque: 2 };
function acertosDe(desc: string): number | null {
  const m = desc.match(/(\d+)\s*acerto/i);
  if (m) return Number(m[1]);
  const p = Object.keys(PALAVRAS).find((k) => new RegExp(`\\b${k}\\b`, 'i').test(desc));
  return p ? PALAVRAS[p] : null;
}
function dataISO(br: string | undefined | null): string | null {
  const m = String(br || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
const nums = (a: unknown): number[] => (Array.isArray(a) ? a.map((x) => parseInt(String(x), 10)).filter((x) => Number.isFinite(x)) : []);

type Resultado = {
  loteria: string; concurso: number; data: string | null; dezenas: number[]; dezenas2: number[] | null;
  rateio: { acertos: number | null; sorteio: number | null; descricao: string; ganhadores: number; valor: number }[];
  acumulado: boolean | null; proximo: { concurso: number | null; data: string | null; estimativa: number | null }; fonte: string;
};

function daCaixa(lot: string, j: Record<string, any>): Resultado | null {
  if (!j || !j.numero) return null;
  const dez = nums(j.listaDezenas);
  if (!dez.length) return null;
  const d2 = nums(j.listaDezenasSegundoSorteio);
  return {
    loteria: lot, concurso: Number(j.numero), data: dataISO(j.dataApuracao), dezenas: dez, dezenas2: d2.length ? d2 : null,
    rateio: (j.listaRateioPremio || []).map((r: any) => {
      const desc = String(r.descricaoFaixa || '');
      return { acertos: acertosDe(desc), sorteio: lot === 'duplasena' ? (/2\s*[ºo°]/i.test(desc) || Number(r.faixa) > 4 ? 2 : 1) : null,
        descricao: desc, ganhadores: Number(r.numeroDeGanhadores || 0), valor: Number(r.valorPremio || 0) };
    }),
    acumulado: typeof j.acumulado === 'boolean' ? j.acumulado : null,
    proximo: { concurso: j.numeroConcursoProximo ? Number(j.numeroConcursoProximo) : null, data: dataISO(j.dataProximoConcurso), estimativa: j.valorEstimadoProximoConcurso != null ? Number(j.valorEstimadoProximoConcurso) : null },
    fonte: 'caixa'
  };
}
function daReserva(lot: string, j: Record<string, any>): Resultado | null {
  if (!j || !j.concurso) return null;
  let dez = nums(j.dezenas);
  let d2: number[] | null = null;
  if (lot === 'duplasena' && dez.length === 12) { d2 = dez.slice(6); dez = dez.slice(0, 6); }
  if (!dez.length) return null;
  return {
    loteria: lot, concurso: Number(j.concurso), data: dataISO(j.data), dezenas: dez, dezenas2: d2,
    rateio: (j.premiacoes || []).map((r: any, i: number, todas: any[]) => {
      const desc = String(r.descricao || '');
      return { acertos: acertosDe(desc), sorteio: lot === 'duplasena' ? (/2\s*[ºo°]/i.test(desc) || i >= todas.length / 2 ? 2 : 1) : null,
        descricao: desc, ganhadores: Number(r.ganhadores || 0), valor: Number(r.valorPremio || 0) };
    }),
    acumulado: typeof j.acumulou === 'boolean' ? j.acumulou : null,
    proximo: { concurso: j.proximoConcurso ? Number(j.proximoConcurso) : null, data: dataISO(j.dataProximoConcurso), estimativa: j.valorEstimadoProximoConcurso != null ? Number(j.valorEstimadoProximoConcurso) : null },
    fonte: 'loteriascaixa-api'
  };
}

async function baixar(url: string): Promise<Record<string, any> | null> {
  try {
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) { return null; }
}

async function buscar(lot: string, concurso: number | null): Promise<Resultado | null> {
  const c = concurso ? String(concurso) : '';
  const a = daCaixa(lot, (await baixar(`https://servicebus2.caixa.gov.br/portaldeloterias/api/${lot}/${c}`)) || {});
  if (a && (!concurso || a.concurso === concurso)) return a;
  const b = daReserva(lot, (await baixar(`https://loteriascaixa-api.herokuapp.com/api/${lot}/${c || 'latest'}`)) || {});
  if (b && (!concurso || b.concurso === concurso)) return b;
  return null;
}

async function guardar(r: Resultado) {
  await admin.from('resultados_loteria').upsert({
    loteria: r.loteria, concurso: r.concurso, data: r.data, dezenas: r.dezenas, dezenas2: r.dezenas2,
    rateio: r.rateio, acumulado: r.acumulado, proximo: r.proximo, fonte: r.fonte, buscado_em: new Date().toISOString()
  });
}

// Último resultado: usa o guardado enquanto o próximo sorteio não aconteceu (sorteios às 20h, resultado ~21h).
async function ultimo(lot: string) {
  const { data: ult } = await admin.from('resultados_loteria').select('*').eq('loteria', lot).order('concurso', { ascending: false }).limit(1).maybeSingle();
  if (ult && ult.proximo && ult.proximo.data && Date.now() - Date.parse(ult.buscado_em) < 6 * 3600 * 1000) {
    const agora = new Date(Date.now() - 3 * 3600 * 1000);
    const hoje = agora.toISOString().slice(0, 10);
    if (ult.proximo.data > hoje || (ult.proximo.data === hoje && agora.getUTCHours() < 21)) return ult;
  }
  const memo = recentes.get(`${lot}:ultimo`);
  if (memo && Date.now() - memo.em < 5 * 60 * 1000) return memo.dados as Resultado | null;
  const r = await buscar(lot, null);
  if (r) await guardar(r);
  const final = r || ult || null;
  recentes.set(`${lot}:ultimo`, { em: Date.now(), dados: final });
  return final;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ erro: 'metodo' }, 405);
  let corpo: { loteria?: string; concurso?: number } = {};
  try { corpo = await req.json(); } catch (_) { return json({ erro: 'entrada' }, 400); }
  const lot = String(corpo.loteria || '');
  if (lot === 'todas') {
    const lista = await Promise.all(LOTERIAS.map((l) => ultimo(l)));
    return json({ resultados: lista.filter(Boolean) });
  }
  const concurso = corpo.concurso ? Math.trunc(Number(corpo.concurso)) : null;
  if (!LOTERIAS.includes(lot) || (concurso !== null && !(concurso > 0 && concurso < 100000))) return json({ erro: 'entrada' }, 400);
  if (!concurso) {
    const u = await ultimo(lot);
    return json(u ? { resultado: u } : { pendente: true, ultimo: null });
  }

  const { data: salvo } = await admin.from('resultados_loteria').select('*').eq('loteria', lot).eq('concurso', concurso).maybeSingle();
  if (salvo) return json({ resultado: salvo });
  const chave = `${lot}:${concurso}`;
  const memo = recentes.get(chave);
  if (memo && Date.now() - memo.em < 5 * 60 * 1000) return json(memo.dados);

  let dados: unknown;
  const r = await buscar(lot, concurso);
  if (r) {
    await guardar(r);
    dados = { resultado: r };
  } else {
    // ainda não sorteado (ou fonte fora do ar): devolve o último para mostrar o próximo concurso
    const u = await ultimo(lot);
    dados = { pendente: true, ultimo: u ? { concurso: u.concurso, data: u.data, proximo: u.proximo } : null };
  }
  recentes.set(chave, { em: Date.now(), dados });
  return json(dados);
});
