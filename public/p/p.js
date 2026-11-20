// Página pública de pagamento: quem recebe o link vê o extrato, paga com Pix e avisa que pagou.
import { sb } from '../js/sb.js';
import { esc, brl, dataBR, round2, copiar, toast, primeiroNome, NOMES_TIPO } from '../js/util.js';
import { gerarPix } from '../js/pix.js';

const app = document.getElementById('app');
const token = new URLSearchParams(location.search).get('t') || '';

function casca(conteudo) {
  return `<div class="casca" style="padding-bottom: 48px">
    <header class="topo"><a class="marca" href="/" aria-label="Deixa Comigo"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a></header>
    <main class="pilha">${conteudo}</main>
    <footer class="pilha-p" style="margin-top: 32px; text-align: center">
      <p class="muted pequeno">Esta cobrança foi organizada pelo Deixa Comigo. O pagamento vai direto para a conta de quem cobrou: o app não recebe nem guarda dinheiro.</p>
      <p class="pequeno"><a href="/?utm_source=link_cobranca&amp;utm_medium=rodape">Também tem alguém para cobrar? Deixa comigo.</a></p>
    </footer>
  </div>`;
}

function extrato(d, c) {
  const det = c.detalhes || {};
  const linhas = [];
  if (c.tipo === 'carona' && det.custo_total) {
    linhas.push(['Dias de carona', String(det.dias)]);
    linhas.push(['Km rodados', `${Number(det.km_total).toLocaleString('pt-BR')} km`]);
    linhas.push(['Combustível', brl(det.combustivel)]);
    linhas.push(['Desgaste do carro (pneu, revisão)', brl(det.desgaste)]);
    linhas.push(['Custo total', brl(det.custo_total)]);
    linhas.push(['Dividido entre', `${det.pessoas_divisao} pessoas${det.motorista_incluido ? ' (com o motorista)' : ''}`]);
  } else if (c.tipo === 'racha' && det.total_gastos) {
    (det.gastos || []).forEach((g) => linhas.push([g.descricao, brl(g.valor)]));
    linhas.push(['Total', brl(det.total_gastos)]);
    linhas.push(['Dividido entre', `${det.pessoas_divisao} pessoas`]);
  } else if (c.descricao) {
    linhas.push(['Observação', c.descricao]);
  }
  if (Number(c.valor_pago) > 0) linhas.push(['Já pago', brl(c.valor_pago)]);
  if (!linhas.length) return '';
  return `<div class="calc">${linhas.map(([a, b]) => `<div class="lin"><span>${esc(a)}</span><span style="text-align:right">${esc(b)}</span></div>`).join('')}
    <div class="lin total"><span>Sua parte</span><span>${brl(d)}</span></div></div>`;
}

async function iniciar() {
  if (!/^[0-9a-f]{32}$/.test(token)) {
    app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1><p class="muted">Confira se o link foi copiado inteiro, ou peça um novo para quem te cobrou.</p></div>');
    return;
  }
  const { data: c, error } = await sb.rpc('cobranca_publica', { p_token: token });
  if (error || !c) {
    app.innerHTML = casca('<div class="card pilha"><h1>Cobrança não encontrada</h1><p class="muted">Ela pode ter sido cancelada. Fale com quem te enviou o link.</p></div>');
    return;
  }
  const devido = round2(Math.max(0, Number(c.valor) - Number(c.valor_pago || 0)));
  const credor = primeiroNome(c.credor);
  const titulo = `${NOMES_TIPO[c.tipo]} · ${c.titulo}`;
  document.title = `${c.titulo} · Deixa Comigo`;

  if (c.status === 'pago') {
    app.innerHTML = casca(`<div class="card pilha" style="text-align:center"><h1>Tudo certo, ${esc(primeiroNome(c.participante))}!</h1><p>${esc(credor)} confirmou o pagamento de <strong>${esc(c.titulo)}</strong>. Obrigado!</p></div>`);
    return;
  }

  const pix = c.chave_pix ? gerarPix({ chave: c.chave_pix, nome: c.credor, cidade: c.cidade, valor: devido, txid: 'DXCMG' + token.slice(0, 12) }) : '';
  const avisou = c.status === 'avisou_pago';

  app.innerHTML = casca(`
    <div class="pilha-p">
      <p class="muted">Oi, ${esc(primeiroNome(c.participante))}! ${esc(c.credor)} te enviou:</p>
      <h1>${esc(titulo)}</h1>
    </div>
    <div class="card escuro pilha-p">
      <p class="muted pequeno">Valor a pagar</p>
      <p class="numero" style="font-size: 2.4rem; color: var(--lima)">${brl(devido)}</p>
      ${c.vencimento ? `<p class="muted">Até ${dataBR(c.vencimento)}</p>` : ''}
    </div>
    ${extrato(devido, c)}
    ${avisou ? `<div class="card pilha-p" style="border-color: var(--roxo)"><h2>Você já avisou que pagou</h2><p class="muted">${esc(credor)} vai conferir e confirmar. Não precisa fazer mais nada.</p></div>` : ''}
    ${pix ? `<section class="card pilha" aria-labelledby="t-pix">
      <h2 id="t-pix">Pagar com Pix</h2>
      <ol class="muted" style="margin: 0; padding-left: 20px">
        <li>Toque em <strong>Copiar código Pix</strong>.</li>
        <li>No app do seu banco, escolha <strong>Pix copia e cola</strong> e cole.</li>
        <li>Confira o nome (${esc(c.credor)}) e o valor, e confirme.</li>
      </ol>
      <button type="button" class="btn bloco" id="copiar">Copiar código Pix</button>
      <img id="qr" class="qr" alt="QR code do Pix de ${esc(brl(devido))} para ${esc(c.credor)}" hidden>
      <details><summary class="pequeno" style="cursor:pointer; min-height: 44px; display:flex; align-items:center">Ver código e chave Pix</summary>
        <div class="pilha-p"><p class="codigo" id="codigo">${esc(pix)}</p><p class="pequeno muted">Chave Pix: ${esc(c.chave_pix)}</p></div></details>
    </section>` : '<div class="aviso">Quem te cobrou ainda não cadastrou a chave Pix. Combine o pagamento direto com essa pessoa.</div>'}
    ${avisou ? '' : `<div class="card pilha-p">
      <h2>Já pagou?</h2>
      <p class="muted">Avise com um toque. ${esc(credor)} recebe o aviso e confirma.</p>
      <button type="button" class="btn lima bloco" id="paguei">Já paguei</button>
    </div>`}
  `);

  const btnCopiar = document.getElementById('copiar');
  if (btnCopiar) btnCopiar.addEventListener('click', async () => {
    const ok = await copiar(pix);
    toast(ok ? 'Código copiado! Cole no app do seu banco.' : 'Não consegui copiar. Abra "Ver código" e copie.', ok ? 'ok' : 'erro');
    if (ok) btnCopiar.textContent = 'Código copiado ✓';
  });

  const btnPaguei = document.getElementById('paguei');
  if (btnPaguei) btnPaguei.addEventListener('click', async () => {
    btnPaguei.disabled = true;
    const { error: e } = await sb.rpc('avisar_pagamento', { p_token: token });
    if (e) { btnPaguei.disabled = false; toast('Não deu certo agora. Tente de novo.', 'erro'); return; }
    btnPaguei.closest('.card').innerHTML = `<h2>Obrigado!</h2><p class="muted">Avisamos ${esc(credor)}. Agora é só aguardar a confirmação.</p>`;
  });

  if (pix) {
    try {
      const mod = await import('https://esm.sh/qrcode@1.5.4');
      const QR = mod.default || mod;
      const url = await QR.toDataURL(pix, { width: 440, margin: 1, color: { dark: '#16141F', light: '#FFFFFF' } });
      const img = document.getElementById('qr');
      img.src = url;
      img.hidden = false;
    } catch (e) {
      // sem QR code: o copia e cola continua funcionando
    }
  }
}

iniciar();
