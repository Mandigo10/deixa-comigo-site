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
  vaquinha: 'Vaquinha', viagem: 'Viagem', mensalidade: 'Mensalidade', venda: 'Venda parcelada', cartela: 'Cartela', aluno: 'Mensalidade'
};

// ---------- máscaras ----------
export function formatarTelefone(v) {
  let d = soDigitos(v);
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
export function formatarCPF(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
export function formatarCNPJ(v) {
  const d = soDigitos(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
export function formatarChave(tipo, chave) {
  if (tipo === 'telefone') return formatarTelefone(chave);
  if (tipo === 'cpf') return formatarCPF(chave);
  if (tipo === 'cnpj') return formatarCNPJ(chave);
  return chave || '';
}
const MASCARAS = { tel: formatarTelefone, cpf: formatarCPF, cnpj: formatarCNPJ };
// Aplica a máscara enquanto a pessoa digita: campos type="tel" e campos com data-mascara="cpf|cnpj|tel".
// Ao apagar, não reformata (para não "prender" o cursor nos parênteses e traços); reformata ao sair do campo.
export function ativarMascaras(raiz = document) {
  const aplicar = (el) => {
    const tipo = el.dataset.mascara || (el.type === 'tel' ? 'tel' : '');
    const fmt = MASCARAS[tipo];
    if (!fmt) return;
    const novo = fmt(el.value);
    if (novo !== el.value) el.value = novo;
  };
  raiz.addEventListener('input', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (e.inputType && e.inputType.startsWith('delete')) return;
    aplicar(el);
  });
  raiz.addEventListener('focusout', (e) => {
    if (e.target instanceof HTMLInputElement) aplicar(e.target);
  });
}

// Valor em reais por extenso, para recibos. Ex.: 1234.5 → "mil duzentos e trinta e quatro reais e cinquenta centavos"
export function valorPorExtenso(valor) {
  const U = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const ate999 = (n) => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100); const r = n % 100;
    const partes = [];
    if (c) partes.push(C[c]);
    if (r) partes.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' e ' + U[r % 10] : ''));
    return partes.join(' e ');
  };
  const total = Math.round(Math.abs(Number(valor) || 0) * 100);
  const reais = Math.floor(total / 100); const cent = total % 100;
  const grupos = [];
  let n = reais; while (n > 0) { grupos.push(n % 1000); n = Math.floor(n / 1000); }
  const escalas = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
  const pedacos = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i]; if (!g) continue;
    let txt = i === 1 && g === 1 ? 'mil' : ate999(g) + (i ? ' ' + escalas[i][g === 1 ? 0 : 1] : '');
    pedacos.push({ txt, g, i });
  }
  let r = '';
  pedacos.forEach((p, k) => {
    if (k === 0) r = p.txt;
    else r += (p.i === 0 && (p.g < 100 || p.g % 100 === 0) ? ' e ' : p.i === 0 ? ' ' : ', ') + p.txt;
  });
  const grande = grupos.length > 2 && grupos[0] === 0 && grupos[1] === 0;
  let fim = '';
  if (reais) fim = `${r}${grande ? ' de' : ''} ${reais === 1 ? 'real' : 'reais'}`;
  if (cent) fim += `${reais ? ' e ' : ''}${ate999(cent)} ${cent === 1 ? 'centavo' : 'centavos'}`;
  return fim || 'zero reais';
}
