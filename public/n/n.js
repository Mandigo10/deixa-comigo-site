// Cartela pública: escolher números/nomes (?t=) e ver os seus para pagar (?c=).
import { sb } from '../js/sb.js';
import { esc, brl, dataBR, primeiroNome, soDigitos, toast, copiar } from '../js/util.js';
import { gerarPix } from '../js/pix.js';
import { rotulo, valorDe, textoValor, AVISO_LEGAL } from '../js/cartelas.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const tCartela = params.get('t') || '';
const tComprador = params.get('c') || '';

function casca(conteudo) {
  return `<div class="casca" style="padding-bottom: 48px">
    <header class="topo"><a class="marca" href="/" aria-label="Deixa Comigo"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a></header>
    <main class="pilha">${conteudo}</main>
    <footer class="pilha-p" style="margin-top: 32px; text-align: center">
      <p class="muted pequeno">O pagamento vai direto para quem organizou, por Pix: o app não recebe nem guarda dinheiro. ${esc(AVISO_LEGAL)}</p>
      <p class="pequeno"><a href="/?utm_source=link_cartela&amp;utm_medium=rodape">Também quer organizar a sua? Deixa comigo.</a></p>
    </footer>
  </div>`;
}
const invalido = (t) => !/^[0-9a-f]{32}$/.test(t);
function guardar(chave, v) { try { localStorage.setItem(chave, v); } catch (e) { /* nada */ } }
function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }

// ---------- escolher ----------
async function escolher() {
  if (invalido(tCartela)) { app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1></div>'); return; }
  const { data: c, error } = await sb.rpc('cartela_publica', { p_token: tCartela });
  if (error || !c) { app.innerHTML = casca('<div class="card pilha"><h1>Cartela não encontrada</h1><p class="muted">Ela pode ter sido apagada.</p></div>'); return; }
  document.title = `${c.titulo} · Deixa Comigo`;
  const ocupados = new Map((c.ocupados || []).map((o) => [o.n, o]));
  const escolhidos = new Set();
  const meu = ler(`dxcmg_cartela_${tCartela}`);
  const livres = c.quantidade - ocupados.size;

  const desenhar = (msgErro = '') => {
    const total = Array.from(escolhidos).reduce((s, n) => s + valorDe(c, n), 0);
    const celulas = Array.from({ length: c.quantidade }, (_, k) => {
      const n = k + 1;
      const r = esc(rotulo(c, n));
      if (ocupados.has(n)) return `<button type="button" class="num ocupado" disabled aria-label="${r}: já escolhido">${r}</button>`;
      const on = escolhidos.has(n);
      return `<button type="button" class="num ${on ? 'escolhido' : 'livre'}" data-n="${n}" aria-pressed="${on}" aria-label="${r}${on ? ', selecionado' : ''}">${r}</button>`;
    }).join('');
    app.innerHTML = casca(`
      <div class="pilha-p">
        <p class="muted">${esc(c.organizador)} está organizando:</p>
        <h1>${esc(c.titulo)}</h1>
        ${c.descricao ? `<p class="muted">${esc(c.descricao)}</p>` : ''}
      </div>
      <div class="card escuro pilha-p">
        <p><strong style="color: var(--lima)">${esc(textoValor(c))}</strong></p>
        <p class="muted pequeno">${livres} de ${c.quantidade} livres${c.prazo ? ` · pagar até ${dataBR(c.prazo)}` : ''}</p>
      </div>
      ${meu ? `<a class="btn sec" href="?c=${esc(meu)}">Ver os que eu já escolhi</a>` : ''}
      ${c.aberta ? '' : '<div class="aviso">A cartela está fechada para novas escolhas.</div>'}
      <div class="grade-n ${c.modo === 'nomes' ? 'nomes-grade' : ''}" role="group" aria-label="Escolha ${c.modo === 'nomes' ? 'os nomes' : 'os números'}">${celulas}</div>
      ${c.aberta ? `<form id="f" class="card pilha" style="border: 2px solid var(--ink)" novalidate>
        <h2>${escolhidos.size ? `Você escolheu ${escolhidos.size}: ${brl(total)}` : `Toque ${c.modo === 'nomes' ? 'nos nomes' : 'nos números'} que você quer`}</h2>
        ${escolhidos.size ? `<p class="muted pequeno">${Array.from(escolhidos).sort((a, b) => a - b).map((n) => esc(rotulo(c, n))).join(', ')}</p>` : ''}
        <div class="campo"><label for="nome">Seu nome</label><input id="nome" maxlength="60" autocomplete="name" value="${esc(ler('dxcmg_nome') || '')}"></div>
        <div class="campo"><label for="tel">Seu WhatsApp</label><input id="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="(11) 98765-4321" value="${esc(ler('dxcmg_tel') || '')}"><span class="ajuda">Para ${esc(primeiroNome(c.organizador))} te mandar o Pix e confirmar o pagamento.</span></div>
        <p id="msg" class="erro" role="alert">${esc(msgErro)}</p>
        <button type="submit" class="btn lima bloco" ${escolhidos.size ? '' : 'disabled'}>Reservar e pagar</button>
        <p class="muted pequeno">Só ${esc(primeiroNome(c.organizador))} vê seu nome e seu WhatsApp.${c.max_por_pessoa ? ` Até ${c.max_por_pessoa} por pessoa.` : ''}</p>
      </form>` : ''}
    `);
    const f = document.getElementById('f');
    if (f) f.addEventListener('submit', reservar);
  };

  const reservar = async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const tel = soDigitos(document.getElementById('tel').value);
    if (nome.length < 2) { desenhar('Diga seu nome.'); return; }
    if (tel && (tel.length < 10 || tel.length > 13)) { desenhar('Confira o WhatsApp, com DDD.'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const { data: r, error: e2 } = await sb.rpc('reservar_cartela', { p_token: tCartela, p_numeros: Array.from(escolhidos), p_nome: nome, p_telefone: tel || null });
    if (e2 || !r) { btn.disabled = false; toast('Não deu certo agora. Tente de novo.', 'erro'); return; }
    if (r.erro === 'ocupado') {
      (r.numeros || []).forEach((n) => { ocupados.set(n, { n }); escolhidos.delete(n); });
      desenhar(`Alguém foi mais rápido: ${(r.numeros || []).map((n) => rotulo(c, n)).join(', ')} já ${r.numeros && r.numeros.length > 1 ? 'foram escolhidos' : 'foi escolhido'}. Escolha outro.`);
      return;
    }
    if (r.erro) {
      const t = { limite: `O máximo é ${r.max} por pessoa.`, fechada: 'A cartela foi fechada.', nome: 'Diga seu nome.', telefone: 'Confira o WhatsApp, com DDD.', vazio: 'Escolha pelo menos um.', numero: 'Número inválido.', link: 'Este link não vale mais.' };
      desenhar(t[r.erro] || 'Não deu certo agora.');
      return;
    }
    guardar(`dxcmg_cartela_${tCartela}`, r.token);
    guardar('dxcmg_nome', nome);
    if (tel) guardar('dxcmg_tel', tel);
    location.href = `?c=${r.token}`;
  };

  app.addEventListener('click', (ev) => {
    const b = ev.target.closest('.num[data-n]');
    if (!b) return;
    const n = Number(b.dataset.n);
    if (escolhidos.has(n)) escolhidos.delete(n); else escolhidos.add(n);
    const nome = document.getElementById('nome');
    const tel = document.getElementById('tel');
    const vals = [nome ? nome.value : '', tel ? tel.value : ''];
    desenhar();
    if (nome) document.getElementById('nome').value = vals[0];
    if (tel) document.getElementById('tel').value = vals[1];
  });
  desenhar();
}

// ---------- meus números + Pix ----------
async function meus() {
  if (invalido(tComprador)) { app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1></div>'); return; }
  const { data: d, error } = await sb.rpc('comprador_cartela', { p_token: tComprador });
  if (error || !d || !d.itens) { app.innerHTML = casca('<div class="card pilha"><h1>Nada encontrado</h1><p class="muted">Seus números podem ter sido liberados. Fale com quem organizou.</p></div>'); return; }
  document.title = `${d.titulo} · Deixa Comigo`;
  const cart = { modo: d.modo, nomes: d.nomes, quantidade: Math.max(...d.itens.map((i) => i.n)) };
  const pend = d.itens.filter((i) => i.status !== 'pago');
  const reservados = d.itens.filter((i) => i.status === 'reservado');
  const devido = pend.reduce((s, i) => s + Number(i.valor), 0);
  const tudoPago = !pend.length;
  const avisou = !reservados.length && pend.length > 0;
  const pix = d.chave_pix && devido > 0 ? gerarPix({ chave: d.chave_pix, nome: d.organizador, cidade: d.cidade, valor: devido, txid: 'DXCMG' + tComprador.slice(0, 12) }) : '';
  const tag = { reservado: '<span class="tag pendente">Não pago</span>', avisou_pago: '<span class="tag avisou_pago">Avisou</span>', pago: '<span class="tag pago">Pago</span>' };

  app.innerHTML = casca(`
    <div class="pilha-p">
      <p class="muted">Oi, ${esc(primeiroNome(d.comprador))}! Na cartela de ${esc(d.organizador)}:</p>
      <h1>${esc(d.titulo)}</h1>
    </div>
    <div class="card pilha-p">
      <h2>Os seus</h2>
      <ul class="lista">${d.itens.map((i) => `<li class="item"><span class="grow"><strong>${esc(rotulo(cart, i.n))}</strong></span><span>${brl(i.valor)}</span>${tag[i.status]}</li>`).join('')}</ul>
      ${d.aberta ? `<a class="btn texto" href="?t=${esc(d.entrada_token)}" style="align-self:flex-start; padding-left:0">Escolher mais</a>` : ''}
    </div>
    ${tudoPago ? `<div class="card pilha-p" style="text-align:center"><h2>Tudo pago!</h2><p class="muted">${esc(primeiroNome(d.organizador))} confirmou. Obrigado!</p></div>` : `
      <div class="card escuro pilha-p">
        <p class="muted pequeno">${avisou ? 'Aguardando confirmação' : 'Valor a pagar'}</p>
        <p class="numero" style="font-size: 2.2rem; color: var(--lima)">${brl(devido)}</p>
        ${d.prazo ? `<p class="muted">Até ${dataBR(d.prazo)}</p>` : ''}
      </div>
      ${avisou ? `<div class="card pilha-p"><h2>Você já avisou que pagou</h2><p class="muted">${esc(primeiroNome(d.organizador))} vai conferir e confirmar.</p></div>` : ''}
      ${pix && !avisou ? `<section class="card pilha" aria-labelledby="t-pix">
        <h2 id="t-pix">Pagar com Pix</h2>
        <ol class="muted" style="margin:0; padding-left: 20px"><li>Toque em <strong>Copiar código Pix</strong>.</li><li>No app do banco, escolha <strong>Pix copia e cola</strong> e cole.</li><li>Confira o nome (${esc(d.organizador)}) e o valor.</li></ol>
        <button type="button" class="btn bloco" id="copiar">Copiar código Pix</button>
        <img id="qr" class="qr" alt="QR code do Pix de ${esc(brl(devido))}" hidden>
      </section>
      <div class="card pilha-p"><h2>Já pagou?</h2><p class="muted">Avise com um toque.</p><button type="button" class="btn lima bloco" id="paguei">Já paguei</button></div>` : ''}
      ${!d.chave_pix ? '<div class="aviso">Quem organizou ainda não cadastrou a chave Pix. Combine o pagamento direto.</div>' : ''}`}
  `);

  const bc = document.getElementById('copiar');
  if (bc) bc.addEventListener('click', async () => {
    const ok = await copiar(pix);
    toast(ok ? 'Código copiado! Cole no app do banco.' : 'Não consegui copiar.', ok ? 'ok' : 'erro');
    if (ok) bc.textContent = 'Código copiado ✓';
  });
  const bp = document.getElementById('paguei');
  if (bp) bp.addEventListener('click', async () => {
    bp.disabled = true;
    const { error: e } = await sb.rpc('avisar_pagamento_cartela', { p_token: tComprador });
    if (e) { bp.disabled = false; toast('Não deu certo agora.', 'erro'); return; }
    bp.closest('.card').innerHTML = `<h2>Obrigado!</h2><p class="muted">Avisamos ${esc(primeiroNome(d.organizador))}. Agora é só aguardar a confirmação.</p>`;
  });
  if (pix && !avisou) {
    try {
      const mod = await import('https://esm.sh/qrcode@1.5.4');
      const QR = mod.default || mod;
      const img = document.getElementById('qr');
      img.src = await QR.toDataURL(pix, { width: 440, margin: 1, color: { dark: '#16141F', light: '#FFFFFF' } });
      img.hidden = false;
    } catch (e) { /* sem QR */ }
  }
}

if (tComprador) meus(); else escolher();
