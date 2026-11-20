// Bolão público: entrar (?t=) e ver a própria cota, os jogos e o resultado (?c=).
import { sb } from '../js/sb.js';
import { registrar } from '../js/eventos.js';
import { esc, brl, dataBR, primeiroNome, soDigitos, toast, copiar, ativarMascaras, formatarTelefone } from '../js/util.js';
import { gerarPix } from '../js/pix.js';
import { AVISO_BOLAO, textoConcurso, jogosHTML, conferenciaHTML, buscarResultado, urlFoto, nomeLoteria } from '../js/boloes.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const tEntrada = params.get('t') || '';
const tCota = params.get('c') || '';
const hoje = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

function casca(conteudo) {
  return `<div class="casca" style="padding-bottom: 48px">
    <header class="topo"><a class="marca" href="/" aria-label="Deixa Comigo"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a></header>
    <main class="pilha">${conteudo}</main>
    <footer class="pilha-p" style="margin-top: 32px; text-align: center">
      <p class="muted pequeno">${esc(AVISO_BOLAO)}</p>
      <p class="pequeno"><a href="/?utm_source=link_bolao&amp;utm_medium=rodape">Também quer organizar o seu? Deixa comigo.</a> · <a href="/termos/">Termos</a> · <a href="/privacidade/">Privacidade</a> · <a href="/ajuda/">Ajuda</a></p>
    </footer>
  </div>`;
}
const invalido = (t) => !/^[0-9a-f]{32}$/.test(t);
function guardar(chave, v) { try { localStorage.setItem(chave, v); } catch (e) { /* nada */ } }
function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// ---------- entrar ----------
async function entrada() {
  if (invalido(tEntrada)) { app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1></div>'); return; }
  const { data: b, error } = await sb.rpc('bolao_publico', { p_token: tEntrada });
  if (error || !b) { app.innerHTML = casca('<div class="card pilha"><h1>Bolão não encontrado</h1><p class="muted">Ele pode ter sido apagado.</p></div>'); return; }
  document.title = `${b.titulo} · Deixa Comigo`;
  const meu = ler(`dxcmg_bolao_${tEntrada}`);
  const livres = b.max_cotas ? Math.max(b.max_cotas - b.cotas, 0) : null;
  const maxAgora = Math.max(1, Math.min(b.max_por_pessoa, livres == null ? b.max_por_pessoa : livres));

  const desenhar = (msgErro = '', cotas = 1) => {
    app.innerHTML = casca(`
      <div class="pilha-p">
        <p class="muted">${esc(b.organizador)} está organizando:</p>
        <h1>${esc(b.titulo)}</h1>
        <p class="muted">${esc(textoConcurso(b))}${b.descricao ? ` · ${esc(b.descricao)}` : ''}</p>
      </div>
      <div class="card escuro pilha-p">
        <p><strong style="color: var(--lima); font-size: 1.3rem">${brl(b.valor_cota)} por cota</strong></p>
        <p class="muted">${plural(b.pessoas, 'pessoa já entrou', 'pessoas já entraram')} · ${plural(b.cotas, 'cota', 'cotas')}${b.max_cotas ? ` de ${b.max_cotas}` : ''}</p>
        ${b.max_cotas ? `<span class="ocupacao" aria-hidden="true"><span style="width: ${Math.min(100, Math.round((b.cotas / b.max_cotas) * 100))}%"></span></span>` : ''}
        ${b.jogos ? `<p class="muted pequeno">${plural(b.jogos, 'jogo registrado', 'jogos registrados')}</p>` : ''}
        ${b.prazo ? `<p class="muted pequeno">Pagar até ${dataBR(b.prazo)}</p>` : ''}
      </div>
      ${meu ? `<a class="btn" href="?c=${esc(meu)}">Ver minha cota${b.jogos ? ' e os jogos' : ''}</a>` : ''}
      ${b.aberto && livres !== 0 ? `<form id="f" class="card pilha" style="border: 2px solid var(--ink)" novalidate>
        <h2>${meu ? 'Entrar com outro número' : 'Quero entrar'}</h2>
        <div class="campo"><label for="nome">Seu nome</label><input id="nome" maxlength="60" autocomplete="name" value="${esc(ler('dxcmg_nome') || '')}"></div>
        <div class="campo"><label for="tel">Seu WhatsApp</label><input id="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="(11) 98765-4321" value="${esc(formatarTelefone(ler('dxcmg_tel') || ''))}"><span class="ajuda">Para ${esc(primeiroNome(b.organizador))} confirmar o seu pagamento.</span></div>
        <div class="campo"><label for="cotas">Quantas cotas</label>
          <div class="linha-flex"><button type="button" class="btn sec peq" data-passo="-1" aria-label="Menos uma cota">−</button><input id="cotas" inputmode="numeric" value="${cotas}" style="max-width: 90px; text-align: center"><button type="button" class="btn sec peq" data-passo="1" aria-label="Mais uma cota">+</button></div>
          <span class="ajuda">Até ${plural(maxAgora, 'cota', 'cotas')} por pessoa.</span></div>
        <div class="calc"><div class="lin total"><span>Você paga</span><span id="total">${brl(cotas * b.valor_cota)}</span></div></div>
        <p id="msg" class="erro" role="alert">${esc(msgErro)}</p>
        <button type="submit" class="btn lima bloco">Entrar e pagar com Pix</button>
        <p class="muted pequeno">Só ${esc(primeiroNome(b.organizador))} vê seu nome e seu WhatsApp. Os outros veem só quantas pessoas entraram.</p>
      </form>` : `<div class="aviso">${livres === 0 ? 'As cotas acabaram.' : 'O bolão está fechado para novas entradas.'}</div>`}
    `);
    const f = document.getElementById('f');
    if (!f) return;
    const campo = document.getElementById('cotas');
    const atualizar = () => {
      const n = Math.max(1, Math.min(maxAgora, parseInt(soDigitos(campo.value), 10) || 1));
      document.getElementById('total').textContent = brl(n * b.valor_cota);
      return n;
    };
    campo.addEventListener('input', atualizar);
    f.querySelectorAll('[data-passo]').forEach((bt) => bt.addEventListener('click', () => {
      campo.value = Math.max(1, Math.min(maxAgora, (parseInt(campo.value, 10) || 1) + Number(bt.dataset.passo)));
      atualizar();
    }));
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const tel = soDigitos(document.getElementById('tel').value);
      const n = atualizar();
      if (nome.length < 2) { desenhar('Diga seu nome.', n); return; }
      if (tel.length < 10 || tel.length > 13) { desenhar('Confira o WhatsApp, com DDD.', n); return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      const { data: r, error: e2 } = await sb.rpc('entrar_bolao', { p_token: tEntrada, p_nome: nome, p_telefone: tel, p_cotas: n });
      if (e2 || !r) { btn.disabled = false; toast('Não deu certo agora. Tente de novo.', 'erro'); return; }
      if (r.erro) {
        const t = { limite: `O máximo é ${r.max} por pessoa.`, lotado: r.livres ? `Só sobraram ${plural(r.livres, 'cota', 'cotas')}.` : 'As cotas acabaram.', fechado: 'O bolão foi fechado.', nome: 'Diga seu nome.', telefone: 'Confira o WhatsApp, com DDD.', cotas: 'Escolha quantas cotas.', link: 'Este link não vale mais.' };
        desenhar(t[r.erro] || 'Não deu certo agora.', n); return;
      }
      guardar(`dxcmg_bolao_${tEntrada}`, r.token);
      guardar('dxcmg_nome', nome); guardar('dxcmg_tel', tel);
      if (!r.ja) registrar('bolao_entrada', { cotas: n });
      else toast('Esse WhatsApp já estava no bolão. Aqui está a sua cota.');
      location.href = `?c=${r.token}`;
    });
  };
  desenhar();
}

// ---------- minha cota ----------
async function minhaCota(jaBuscou = false) {
  if (invalido(tCota)) { app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1></div>'); return; }
  const { data: d, error } = await sb.rpc('cota_bolao', { p_token: tCota });
  if (error || !d) { app.innerHTML = casca('<div class="card pilha"><h1>Nada encontrado</h1><p class="muted">Sua cota pode ter sido removida. Fale com quem organizou.</p></div>'); return; }
  document.title = `${d.titulo} · Deixa Comigo`;
  guardar(`dxcmg_bolao_${d.entrada_token}`, tCota);
  const eu = d.eu;
  const pago = eu.status === 'pago';
  const avisou = eu.status === 'avisou_pago';
  const jogos = d.jogos || [];
  const pix = d.chave_pix && !pago && !avisou && Number(eu.valor) > 0
    ? gerarPix({ chave: d.chave_pix, nome: d.organizador, cidade: d.cidade, valor: Number(eu.valor), txid: 'DXCMGB' + tCota.slice(0, 12) }) : '';

  // conferência: busca o resultado quando o sorteio já passou e ainda não temos
  let blocoResultado = '';
  if (jogos.length && d.concurso) {
    if (!d.conferencia) {
      blocoResultado = `<div class="card pilha-p"><h2>Resultado</h2><p class="muted">Confira o resultado do concurso ${d.concurso} no app ou no site Loterias CAIXA.</p></div>`;
    } else if (d.resultado) {
      blocoResultado = `<section class="pilha-p" aria-label="Conferência"><h2>Conferência</h2>${conferenciaHTML(jogos, d.resultado, d.loteria)}</section>`;
    } else if (!d.data_sorteio || d.data_sorteio <= hoje()) {
      if (!jaBuscou) {
        buscarResultado(d.loteria, d.concurso).then((r) => { if (r && r.resultado) minhaCota(true); });
      }
      blocoResultado = `<div class="card pilha-p"><h2>Resultado</h2><p class="muted">Assim que a CAIXA divulgar o resultado do concurso ${d.concurso}, a conferência dos jogos aparece aqui sozinha.</p></div>`;
    } else {
      blocoResultado = `<div class="card pilha-p"><h2>Resultado</h2><p class="muted">O sorteio é em ${dataBR(d.data_sorteio)}. Depois dele, volte aqui: a conferência dos jogos aparece sozinha.</p></div>`;
    }
  }

  app.innerHTML = casca(`
    <div class="pilha-p">
      <p class="muted">Oi, ${esc(primeiroNome(eu.nome))}! Bolão de ${esc(d.organizador)}:</p>
      <h1>${esc(d.titulo)}</h1>
      <p class="muted">${esc(textoConcurso(d))}</p>
    </div>
    <div class="card ${pago ? '' : 'escuro'} pilha-p">
      <p class="muted pequeno">Sua parte</p>
      <p class="numero" style="font-size: 2.2rem; ${pago ? '' : 'color: var(--lima)'}">${brl(eu.valor)}</p>
      <p class="${pago ? '' : 'muted'}">${plural(eu.cotas, 'cota', 'cotas')} · <span class="tag ${pago ? 'pago' : avisou ? 'avisou_pago' : 'pendente'}">${pago ? 'Pago' : avisou ? 'Aguardando confirmação' : 'Não pago'}</span></p>
      ${!pago && d.prazo ? `<p class="muted">Pagar até ${dataBR(d.prazo)}</p>` : ''}
    </div>
    ${avisou ? `<div class="card pilha-p"><h2>Você já avisou que pagou</h2><p class="muted">${esc(primeiroNome(d.organizador))} vai conferir e confirmar.</p></div>` : ''}
    ${pix ? `<section class="card pilha" aria-labelledby="t-pix">
      <h2 id="t-pix">Pagar com Pix</h2>
      <ol class="muted" style="margin:0; padding-left: 20px"><li>Toque em <strong>Copiar código Pix</strong>.</li><li>No app do banco, escolha <strong>Pix copia e cola</strong> e cole.</li><li>Confira o nome (${esc(d.organizador)}) e o valor.</li></ol>
      <button type="button" class="btn bloco" id="copiar">Copiar código Pix</button>
      <img id="qr" class="qr" alt="QR code do Pix de ${esc(brl(eu.valor))}" hidden>
    </section>
    <div class="card pilha-p"><h2>Já pagou?</h2><p class="muted">Avise com um toque.</p><button type="button" class="btn lima bloco" id="paguei">Já paguei</button></div>` : ''}
    ${!pago && !avisou && !d.chave_pix ? '<div class="aviso">Quem organizou ainda não cadastrou a chave Pix. Combine o pagamento direto.</div>' : ''}
    <div class="card pilha-p">
      <h2>Quem está no bolão</h2>
      <p>${plural(d.pessoas, 'pessoa', 'pessoas')} · ${plural(d.cotas, 'cota', 'cotas')}${d.max_cotas ? ` de ${d.max_cotas}` : ''} · ${plural(d.cotas_pagas, 'cota paga', 'cotas pagas')}</p>
      ${d.aberto ? `<a class="btn texto" href="?t=${esc(d.entrada_token)}" style="align-self:flex-start; padding-left:0">Chamar mais gente</a>` : ''}
    </div>
    <section class="pilha-p" aria-labelledby="t-jogos">
      <h2 id="t-jogos">Jogos</h2>
      ${jogos.length ? (d.resultado && d.conferencia ? `<p class="muted">${plural(jogos.length, 'jogo', 'jogos')} de ${esc(nomeLoteria(d.loteria))}. A conferência de cada um está abaixo.</p>` : jogosHTML(jogos, d.loteria))
        : `<div class="card"><p class="muted">Os jogos aparecem aqui assim que ${esc(primeiroNome(d.organizador))} fizer as apostas e registrar o canhoto.</p></div>`}
      ${(d.fotos || []).length ? `<div class="fotos">${d.fotos.map((f, i) => `<a href="${esc(urlFoto(f))}" target="_blank" rel="noopener"><img src="${esc(urlFoto(f))}" alt="Foto do canhoto ${i + 1}" loading="lazy"></a>`).join('')}</div><p class="muted pequeno">Toque na foto para ampliar. O comprovante original fica com ${esc(primeiroNome(d.organizador))}.</p>` : ''}
    </section>
    ${blocoResultado}
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
    const { error: e } = await sb.rpc('avisar_pagamento_bolao', { p_token: tCota });
    if (e) { bp.disabled = false; toast('Não deu certo agora.', 'erro'); return; }
    registrar('paguei', { tipo: 'bolao' });
    minhaCota(true);
  });
  if (pix) {
    try {
      const mod = await import('https://esm.sh/qrcode@1.5.4');
      const QR = mod.default || mod;
      const img = document.getElementById('qr');
      img.src = await QR.toDataURL(pix, { width: 440, margin: 1, color: { dark: '#16141F', light: '#FFFFFF' } });
      img.hidden = false;
    } catch (e) { /* sem QR */ }
  }
}

ativarMascaras(document);
if (tCota) minhaCota(); else entrada();
