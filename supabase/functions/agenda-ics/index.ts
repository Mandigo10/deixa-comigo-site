// Link privado de calendário (.ics) para assinar no Google Agenda, Apple ou Outlook.
// GET /functions/v1/agenda-ics?t=<token de 64 hex>
import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const APP = 'https://deixa-comigo-site.jader-gabriel.workers.dev/app/';

const esc = (s: string) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dia = (d: string) => d.replace(/-/g, '');
function proxDia(d: string) { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); }
function dobrar(linha: string) {
  const out: string[] = []; let l = linha;
  while (new TextEncoder().encode(l).length > 74) { let n = 70; while (new TextEncoder().encode(l.slice(0, n)).length > 74) n--; out.push(l.slice(0, n)); l = ' ' + l.slice(n); }
  out.push(l); return out.join('\r\n');
}

Deno.serve(async (req) => {
  const t = new URL(req.url).searchParams.get('t') || '';
  if (!/^[0-9a-f]{64}$/.test(t)) return new Response('link inválido', { status: 404 });
  const { data: link } = await admin.from('agenda_links').select('user_id').eq('token', t).maybeSingle();
  if (!link) return new Response('link inválido', { status: 404 });
  const hoje = new Date(Date.now() - 3 * 3600 * 1000);
  const de = new Date(hoje); de.setUTCDate(de.getUTCDate() - 30);
  const ate = new Date(hoje); ate.setUTCDate(ate.getUTCDate() + 180);
  const { data: itens } = await admin.rpc('agenda_itens', { p_user: link.user_id, p_de: de.toISOString().slice(0, 10), p_ate: ate.toISOString().slice(0, 10) });
  const agora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Deixa Comigo//Agenda//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Deixa Comigo', 'X-WR-TIMEZONE:America/Sao_Paulo', 'REFRESH-INTERVAL;VALUE=DURATION:PT3H', 'X-PUBLISHED-TTL:PT3H'];
  for (const i of (itens || []) as any[]) {
    const nome = i.tipo === 'cobranca' ? `A receber: ${i.titulo}${i.valor ? ` (${brl(Number(i.valor))})` : ''}`
      : i.valor ? `${i.titulo} (${brl(Number(i.valor))})` : i.titulo;
    linhas.push('BEGIN:VEVENT', `UID:${i.tipo}-${i.ref}-${i.data}@deixacomigo`, `DTSTAMP:${agora}`);
    if (i.hora) {
      const h = String(i.hora).slice(0, 5).replace(':', '');
      linhas.push(`DTSTART;TZID=America/Sao_Paulo:${dia(i.data)}T${h}00`, 'DURATION:PT1H');
    } else linhas.push(`DTSTART;VALUE=DATE:${dia(i.data)}`, `DTEND;VALUE=DATE:${dia(proxDia(i.data))}`);
    linhas.push(dobrar(`SUMMARY:${esc(nome)}`));
    linhas.push(dobrar(`DESCRIPTION:${esc([i.detalhe, 'Abrir no app: ' + APP].filter(Boolean).join('\n'))}`), 'END:VEVENT');
  }
  linhas.push('END:VCALENDAR');
  return new Response(linhas.join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=900' } });
});
