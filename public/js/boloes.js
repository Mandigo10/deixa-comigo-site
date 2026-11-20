// Bolão de loteria: regras das loterias, leitura do canhoto, conferência e mensagens.
import { sb } from './sb.js';
import { esc, brl, dataBR, primeiroNome } from './util.js';

export const LOTERIAS = {
  megasena: { nome: 'Mega-Sena', min: 6, max: 20, de: 1, ate: 60, premio: [6, 5, 4], faixas: { 6: 'Sena', 5: 'Quina', 4: 'Quadra' } },
  lotofacil: { nome: 'Lotofácil', min: 15, max: 20, de: 1, ate: 25, premio: [15, 14, 13, 12, 11] },
  quina: { nome: 'Quina', min: 5, max: 15, de: 1, ate: 80, premio: [5, 4, 3, 2], faixas: { 5: 'Quina', 4: 'Quadra', 3: 'Terno', 2: 'Duque' } },
  lotomania: { nome: 'Lotomania', min: 50, max: 50, de: 0, ate: 99, premio: [20, 19, 18, 17, 16, 15, 0] },
  duplasena: { nome: 'Dupla Sena', min: 6, max: 15, de: 1, ate: 50, premio: [6, 5, 4, 3], duplo: true, faixas: { 6: 'Sena', 5: 'Quina', 4: 'Quadra', 3: 'Terno' } },
  diadesorte: { nome: 'Dia de Sorte', min: 7, max: 15, de: 1, ate: 31, premio: [7, 6, 5, 4], obs: 'O Mês da Sorte não entra na conferência automática: confira no canhoto.' },
  timemania: { nome: 'Timemania', min: 10, max: 10, de: 1, ate: 80, premio: [7, 6, 5, 4, 3], obs: 'O Time do Coração não entra na conferência automática: confira no canhoto.' }
};

// Conferência automática: plano pago, ou liberada para todos até o fim do lançamento.
export const CONFERENCIA_GRATIS_ATE = '2027-01-31';
export function conferenciaLiberada(plano) {
  const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  return (plano && plano !== 'gratis') || hoje <= CONFERENCIA_GRATIS_ATE;
}

export const AVISO_BOLAO = 'Bolão entre conhecidos para dividir apostas oficiais da CAIXA. O app não vende cotas, não cobra taxa e não recebe dinheiro: o Pix vai direto para quem organiza, que faz as apostas na lotérica e guarda os comprovantes. Quem está com o comprovante é quem recebe o prêmio na CAIXA, e a divisão é a combinada entre vocês.';

export function nomeLoteria(lot) { return (LOTERIAS[lot] || {}).nome || 'Loteria'; }
export function dezena(n) { return String(n).padStart(2, '0'); }
export function nomeFaixa(lot, acertos) {
  const f = (LOTERIAS[lot] || {}).faixas;
  return (f && f[acertos]) || `${acertos} acerto${acertos === 1 ? '' : 's'}`;
}
export function textoConcurso(b) {
  const partes = [nomeLoteria(b.loteria)];
  if (b.concurso) partes.push(`concurso ${b.concurso}`);
  if (b.data_sorteio) partes.push(`sorteio ${dataBR(b.data_sorteio)}`);
  return partes.join(' · ');
}

// "05 12 23-34, 45 56" -> [5, 12, 23, 34, 45, 56]
export function lerDezenas(txt) {
  const v = (String(txt || '').match(/\d{1,3}/g) || []).map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x));
  return Array.from(new Set(v)).sort((a, b) => a - b);
}
export function erroJogo(dezenas, lot) {
  const L = LOTERIAS[lot];
  if (!L) return 'Loteria inválida.';
  if (dezenas.some((n) => n < L.de || n > L.ate)) return `As dezenas vão de ${dezena(L.de)} a ${L.ate}.`;
  if (dezenas.length < L.min || dezenas.length > L.max) {
    return L.min === L.max ? `Cada jogo tem ${L.min} dezenas (este tem ${dezenas.length}).` : `Cada jogo tem de ${L.min} a ${L.max} dezenas (este tem ${dezenas.length}).`;
  }
  return '';
}

// Procura jogos no texto lido do canhoto (OCR).
export function jogosDoTexto(texto, lot) {
  const L = LOTERIAS[lot];
  const jogos = [];
  let acum = [];
  const emitir = (arr) => { const j = Array.from(new Set(arr)).sort((x, y) => x - y); if (!erroJogo(j, lot)) jogos.push(j); };
  const fechar = () => { if (acum.length >= L.min) emitir(acum); acum = []; };
  const RE = /(?<!\d)\d{2}(?!\d)/g;
  String(texto || '').split(/\r?\n/).forEach((linha) => {
    const ts = (linha.match(RE) || []).map(Number).filter((n) => n >= L.de && n <= L.ate);
    const resto = linha.replace(RE, '').replace(/[^0-9A-Za-z]/g, '');
    if (ts.length < 3 || resto.length > 3) { fechar(); return; }
    if (/^\s*[A-La-l][\s.:)-]/.test(linha)) fechar();
    if (ts.length >= L.min && ts.length <= L.max) { fechar(); emitir(ts); return; }
    if (acum.length + ts.length > L.max) fechar();
    acum.push(...ts);
    if (L.min === L.max && acum.length === L.min) fechar();
  });
  fechar();
  const vistos = new Set();
  return jogos.filter((j) => { const k = j.join(','); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
export function concursoDoTexto(texto) {
  const m = String(texto || '').match(/CONC\w*\D{0,6}(\d{3,5})/i);
  return m ? Number(m[1]) : null;
}

// Foto -> JPEG menor (para enviar e para ler)
export async function prepararFoto(arquivo, lado = 1600) {
  const bmp = await createImageBitmap(arquivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.85));
  const base64 = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
  return { blob, base64, canvas: cv };
}

let tesseract = null;
function carregarTesseract() {
  if (tesseract) return tesseract;
  tesseract = new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = () => ok(window.Tesseract);
    s.onerror = () => { tesseract = null; falha(new Error('ocr')); };
    document.head.appendChild(s);
  });
  return tesseract;
}
async function lerNoCelular(canvas, lot, aoProgredir) {
  const T = await carregarTesseract();
  // tons de cinza com mais contraste ajudam no papel térmico
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const g = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
    const c = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128));
    img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
  }
  ctx.putImageData(img, 0, 0);
  const { data } = await T.recognize(canvas, 'por', { logger: (m) => { if (aoProgredir && m.status === 'recognizing text') aoProgredir(Math.round(m.progress * 100)); } });
  return { jogos: jogosDoTexto(data.text, lot), concurso: concursoDoTexto(data.text), fonte: 'ocr' };
}

// Lê o canhoto: IA no servidor; sem IA configurada (ou se falhar), lê no próprio celular.
export async function lerCanhoto(foto, lot, aoProgredir) {
  try {
    const { data, error } = await sb.functions.invoke('ler-canhoto', { body: { imagem: foto.base64, tipo: 'image/jpeg', loteria: lot } });
    if (!error && data && !data.sem_ia && !data.erro) {
      const jogos = (data.jogos || []).map((j) => Array.from(new Set(j)).sort((a, b) => a - b));
      if (jogos.length) return { jogos, concurso: data.concurso, data_sorteio: data.data_sorteio, loteria: data.loteria, fonte: 'ia' };
    }
  } catch (e) { /* segue para o OCR */ }
  return lerNoCelular(foto.canvas, lot, aoProgredir);
}

export async function buscarResultado(lot, concurso) {
  try {
    const { data, error } = await sb.functions.invoke('resultado-loteria', { body: { loteria: lot, concurso: concurso || undefined } });
    if (error) return null;
    return data;
  } catch (e) { return null; }
}

export function urlFoto(caminho) {
  return `${window.DXCMG_CONFIG.SUPABASE_URL}/storage/v1/object/public/canhotos/${caminho.split('/').map(encodeURIComponent).join('/')}`;
}

// ---------- conferência ----------
export function conferir(jogo, r, lot) {
  const L = LOTERIAS[lot];
  const conta = (sorteadas) => { const s = new Set(sorteadas || []); return jogo.filter((n) => s.has(n)).length; };
  const sorteios = L.duplo && r.dezenas2 ? [r.dezenas, r.dezenas2] : [r.dezenas];
  return sorteios.map((dz, i) => {
    const acertos = conta(dz);
    const premiado = L.premio.includes(acertos);
    const faixa = premiado ? (r.rateio || []).find((x) => x.acertos === acertos && (x.sorteio == null || x.sorteio === i + 1)) : null;
    return { sorteio: L.duplo ? i + 1 : null, acertos, premiado, valor: faixa ? Number(faixa.valor) : null };
  });
}

export function bolasHTML(dezenas, { acertos = null, escuro = false } = {}) {
  const s = acertos ? new Set(acertos) : null;
  return `<span class="bolas">${dezenas.map((n) => `<span class="bola ${s && s.has(n) ? 'acerto' : ''} ${escuro ? 'sorteada' : ''}">${dezena(n)}</span>`).join('')}</span>`;
}

export function jogosHTML(jogos, lot) {
  if (!jogos.length) return '';
  return `<ol class="jogos">${jogos.map((j, i) => `<li><span class="muted pequeno">Jogo ${i + 1}</span>${bolasHTML(j)}</li>`).join('')}</ol>`;
}

export function resumoConferencia(jogos, r, lot) {
  const linhas = jogos.map((j) => ({ jogo: j, res: conferir(j, r, lot) }));
  const premiados = linhas.filter((l) => l.res.some((x) => x.premiado));
  const total = premiados.reduce((s, l) => s + l.res.filter((x) => x.premiado).reduce((a, x) => a + (x.valor || 0), 0), 0);
  return { linhas, premiados, total };
}

export function conferenciaHTML(jogos, r, lot) {
  const L = LOTERIAS[lot];
  const { linhas, premiados, total } = resumoConferencia(jogos, r, lot);
  const maxAc = Math.max(0, ...linhas.flatMap((l) => l.res.map((x) => x.acertos)));
  const sorteadas = L.duplo && r.dezenas2
    ? `<p class="muted pequeno">1º sorteio</p>${bolasHTML(r.dezenas, { escuro: true })}<p class="muted pequeno">2º sorteio</p>${bolasHTML(r.dezenas2, { escuro: true })}`
    : bolasHTML(r.dezenas, { escuro: true });
  const manchete = premiados.length
    ? `<h2 style="color: var(--lima)">${premiados.length === 1 ? '1 jogo premiado' : `${premiados.length} jogos premiados`}!</h2>${total > 0 ? `<p>Prêmio estimado: <strong style="color: var(--lima)">${brl(total)}</strong></p>` : ''}`
    : `<h2>Não foi dessa vez</h2><p class="muted">Nenhum jogo premiado. O que mais acertou fez ${maxAc} ${maxAc === 1 ? 'ponto' : 'pontos'}.</p>`;
  return `<div class="card escuro pilha-p">
      <p class="muted pequeno">Resultado · concurso ${r.concurso}${r.data ? ` · ${dataBR(r.data)}` : ''}</p>
      ${sorteadas}
      ${manchete}
    </div>
    <ol class="jogos">${linhas.map((l, i) => {
      const tags = l.res.map((x) => `<span class="tag ${x.premiado ? 'pago' : 'neutra'}">${x.sorteio ? `${x.sorteio}º: ` : ''}${x.acertos} ${x.acertos === 1 ? 'acerto' : 'acertos'}${x.premiado ? ` · ${esc(nomeFaixa(lot, x.acertos))}${x.valor ? ` · ${brl(x.valor)}` : ''}` : ''}</span>`).join(' ');
      const acertadas = L.duplo && r.dezenas2 ? [...r.dezenas, ...r.dezenas2] : r.dezenas;
      return `<li><span class="linha-flex entre"><span class="muted pequeno">Jogo ${i + 1}</span><span>${tags}</span></span>${bolasHTML(l.jogo, { acertos: acertadas })}</li>`;
    }).join('')}</ol>
    <p class="muted pequeno">Valores por aposta segundo o rateio oficial. Jogos com mais dezenas podem ganhar em mais de uma faixa: confirme o valor final na lotérica ou no app Loterias CAIXA.${L.obs ? ` ${L.obs}` : ''}</p>`;
}

// ---------- mensagens ----------
const assinatura = (plano) => (!plano || plano === 'gratis' ? '\n\nenviado por dx cmg · Deixa Comigo' : '');

export function divulgacaoBolao({ b, link, plano }) {
  return `🍀 Bolão "${b.titulo}" (${textoConcurso(b)})\nCota: ${brl(b.valor_cota)}\n\nEntra pelo link, paga com Pix e acompanha os jogos e o resultado por lá: ${link}${assinatura(plano)}`;
}
export function mensagemCota({ nome, titulo, cotas, valor, link, plano }) {
  return `Oi, ${primeiroNome(nome)}! Falta a sua parte do bolão "${titulo}": ${cotas} ${cotas === 1 ? 'cota' : 'cotas'}, ${brl(valor)}. O Pix está aqui, é só copiar e colar: ${link}${assinatura(plano)}`;
}
export function mensagemJogos({ b, qtd, link, plano }) {
  return `🍀 Jogos do bolão "${b.titulo}" registrados: ${qtd} ${qtd === 1 ? 'jogo' : 'jogos'} para o ${textoConcurso(b)}. Os números e a foto do canhoto estão no link, e o resultado aparece lá depois do sorteio: ${link}${assinatura(plano)}`;
}
export function mensagemResultado({ b, r, jogos, link, plano }) {
  const { premiados, total, linhas } = resumoConferencia(jogos, r, b.loteria);
  const dz = r.dezenas.map(dezena).join(' ') + (r.dezenas2 ? ` / ${r.dezenas2.map(dezena).join(' ')}` : '');
  const maxAc = Math.max(0, ...linhas.flatMap((l) => l.res.map((x) => x.acertos)));
  const txt = premiados.length
    ? `🎉 Temos ${premiados.length === 1 ? '1 jogo premiado' : `${premiados.length} jogos premiados`}${total > 0 ? ` (estimado ${brl(total)})` : ''}!`
    : `Não foi dessa vez: o jogo que mais acertou fez ${maxAc} ${maxAc === 1 ? 'ponto' : 'pontos'}.`;
  return `Resultado do bolão "${b.titulo}" · ${nomeLoteria(b.loteria)} ${r.concurso}\nSorteadas: ${dz}\n${txt}\n\nConferência de cada jogo: ${link}${assinatura(plano)}`;
}
