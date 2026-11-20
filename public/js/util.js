// Utilidades compartilhadas entre o app e a página de pagamento.

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function brl(n) {
  const v = Number(n || 0);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Aceita "1.234,56", "1234,56", "1234.56", "12"
export function parseValor(txt) {
  if (typeof txt === 'number') return txt;
  let s = String(txt || '').trim().replace(/[R$\s]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // "3.000" = três mil
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function soDigitos(s) {
  return String(s || '').replace(/\D/g, '');
}

export function dataBR(iso) {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function hojeISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

export function linkWhatsApp(telefone, texto) {
  let d = soDigitos(telefone);
  if (d.length === 10 || d.length === 11) d = '55' + d;
  const base = d.length >= 12 ? `https://wa.me/${d}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(texto)}`;
}

export function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast mostrar ${tipo}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast'; }, 3200);
}

export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
    return ok;
  }
}

export const NOMES_TIPO = {
  carona: 'Carona', emprestimo: 'Empréstimo', racha: 'Racha',
  vaquinha: 'Vaquinha', viagem: 'Viagem', mensalidade: 'Mensalidade'
};
