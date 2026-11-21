// Bolão público: entrar (?t=) e ver a própria cota, os jogos e o resultado (?c=).
import { sb } from '../js/sb.js';
import { carregarVitrinePublica } from '../js/vitrine.js';
import { registrar } from '../js/eventos.js';
import { esc, brl, dataBR, primeiroNome, soDigitos, toast, copiar, ativarMascaras, formatarTelefone } from '../js/util.js';
import { gerarPix } from '../js/pix.js';
import { AVISO_BOLAO, LOTERIAS, textoConcurso, jogosHTML, conferenciaHTML, buscarResultado, urlFoto, nomeLoteria, seletorHTML, ligarSeletor, jogadoNosJogos, bolasHTML, mostrarProximo } from '../js/boloes.js';

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
      <p class="pequeno"><a href="/?utm_source=link_bolao&amp;utm_medium=rodape">Também quer organizar o seu? Deixa comigo.</a> · <a href="/resultados/">Resultados</a> · <a href="/termos/">Termos</a> · <a href="/privacidade/">Privacidade</a> · <a href="/ajuda/">Ajuda</a></p>
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
  const { data: b, error } = await sb.rpc('bolao_publico_v2', { p_token: tEntrada });
  if (error || !b) { app.innerHTML = casca('<div class="card pilha"><h1>Bolão não encontrado</h1><p class="muted">Ele pode ter sido apagado.</p></div>'); return; }
  document.title = `${b.titulo} · Deixa Comigo`;
  const meu = ler(`dxcmg_bolao_${tEntrada}`);
  const livres = b.max_cotas ? Math.max(b.max_cotas - b.cotas, 0) : null;
  const maxAgora = Math.max(1, Math.min(b.max_por_pessoa, livres == null ? b.max_por_pessoa : livres));
  const ppc = b.palpites_por_cota || 0;
  const L = LOTERIAS[b.loteria];
  const escolha = { lot: b.loteria, jogos: ppc ? [[]] : [], atual: 0, aoMexer: () => { const m = document.getElementById('msg'); if (m) m.textContent = ''; } };
  const ajustarJogos = (cotas) => {
    const total = cotas * ppc;
    while (escolha.jogos.length < total) escolha.jogos.push([]);
    escolha.jogos.length = total;
    if (escolha.atual >= total) escolha.atual = Math.max(0, total - 1);
  };
  const sorteioFuturo = !b.data_sorteio || b.data_sorteio >= hoje();

  const desenhar = (msgErro = '', cotas = 1) => {
    app.innerHTML = casca(`
      <div class="pilha-p">
        <p class="muted">${esc(b.organizador)} está organizando:</p>
        <h1>${esc(b.titulo)}</h1>
      <div class="vitrine-slot" data-vitrine="bolao"></div>
        <p class="muted">${esc(textoConcurso(b))}${b.descricao ? ` · ${esc(b.descricao)}` : ''}</p>
      </div>
      <div class="card escuro pilha-p">
        <p><strong style="color: var(--lima); font-size: 1.3rem">${brl(b.valor_cota)} por cota</strong></p>
        <p class="muted">${plural(b.pessoas, 'pessoa já entrou', 'pessoas já entraram')} · ${plural(b.cotas, 'cota', 'cotas')}${b.max_cotas ? ` de ${b.max_cotas}` : ''}</p>
        ${b.max_cotas ? `<span class="ocupacao" aria-hidden="true"><span style="width: ${Math.min(100, Math.round((b.cotas / b.max_cotas) * 100))}%"></span></span>` : ''}
        ${b.jogos ? `<p class="muted pequeno">${plural(b.jogos, 'jogo registrado', 'jogos registrados')}</p>` : ''}
        ${b.prazo ? `<p class="muted pequeno">Pagar até ${dataBR(b.prazo)}</p>` : ''}
        <p id="proximo" class="pequeno" style="color: var(--lima)" hidden></p>
      </div>
      ${meu ? `<a class="btn" href="?c=${esc(meu)}">Ver minha cota${b.jogos ? ' e os jogos' : ''}</a>` : ''}
      ${b.aberto && livres !== 0 ? `<form id="f" class="card pilha" style="border: 2px solid var(--ink)" novalidate>
        <h2>${meu ? 'Entrar com outro número' : 'Quero entrar'}</h2>
        <div class="campo"><label for="nome">Seu nome</label><input id="nome" maxlength="60" autocomplete="name" value="${esc(ler('dxcmg_nome') || '')}"></div>
        <div class="campo"><label for="tel">Seu WhatsApp</label><input id="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="(11) 98765-4321" value="${esc(formatarTelefone(ler('dxcmg_tel') || ''))}"><span class="ajuda">Para ${esc(primeiroNome(b.organizador))} confirmar o seu pagamento.</span></div>
        <div class="campo"><label for="cotas">Quantas cotas</label>
          <div class="linha-flex"><button type="button" class="btn sec peq" data-passo="-1" aria-label="Menos uma cota">−</button><input id="cotas" inputmode="numeric" value="${cotas}" style="max-width: 90px; text-align: center"><button type="button" class="btn sec peq" data-passo="1" aria-label="Mais uma cota">+</button></div>
          <span class="ajuda">Até ${plural(maxAgora, 'cota', 'cotas')} por pessoa.</span></div>
        ${ppc ? `<div class="campo"><span style="font-weight: 600; font-size: 0.92rem">Seus números (opcional)</span>
          <span class="ajuda">Cada cota dá direito a ${plural(ppc, 'jogo', 'jogos')} de ${L.simples} números. Toque nos números ou use a Surpresinha. Se não escolher, ${esc(primeiroNome(b.organizador))} escolhe por você.</span>
          <div id="seletor" class="pilha-p" style="margin-top: 8px"></div></div>` : ''}
        <div class="calc"><div class="lin total"><span>Você paga</span><span id="total">${brl(cotas * b.valor_cota)}</span></div></div>
        <p id="msg" class="erro" role="alert">${esc(msgErro)}</p>
        <button type="submit" class="btn lima bloco">Entrar e pagar com Pix</button>
        <p class="muted pequeno">Só ${esc(primeiroNome(b.organizador))} vê seu nome e seu WhatsApp. Os outros veem só quantas pessoas entraram.</p>
      </form>` : `<div class="aviso">${livres === 0 ? 'As cotas acabaram.' : 'O bolão está fechado para novas entradas.'}</div>`}
    `);
    if (sorteioFuturo) mostrarProximo(document.getElementById('proximo'), b);
    const f = document.getElementById('f');
    if (!f) return;
    const caixa = document.getElementById('seletor');
    const pintarSeletor = () => { if (caixa) caixa.innerHTML = seletorHTML(b.loteria, escolha.jogos, escolha.atual); };
    if (caixa) { ajustarJogos(cotas); pintarSeletor(); ligarSeletor(caixa, escolha, pintarSeletor, (m) => toast(m, 'erro')); }
    const campo = document.getElementById('cotas');
    const atualizar = () => {
      const n = Math.max(1, Math.min(maxAgora, parseInt(soDigitos(campo.value), 10) || 1));
      document.getElementById('total').textContent = brl(n * b.valor_cota);
      if (caixa && escolha.jogos.length !== n * ppc) { ajustarJogos(n); pintarSeletor(); }
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
      const meio = escolha.jogos.findIndex((j) => j.length > 0 && j.length < L.simples);
      if (meio >= 0) { escolha.atual = meio; desenhar(`Complete o jogo ${meio + 1} (faltam ${L.simples - escolha.jogos[meio].length} números) ou toque em Limpar.`, n); return; }
      const completos = escolha.jogos.filter((j) => j.length === L.simples);
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      const { data: r, error: e2 } = await sb.rpc('entrar_bolao', { p_token: tEntrada, p_nome: nome, p_telefone: tel, p_cotas: n });
      if (e2 || !r) { btn.disabled = false; toast('Não deu certo agora. Tente de novo.', 'erro'); return; }
      if (r.erro) {
        const t = { limite: `O máximo é ${r.max} por pessoa.`, lotado: r.livres ? `Só sobraram ${plural(r.livres, 'cota', 'cotas')}.` : 'As cotas acabaram.', fechado: 'O bolão foi fechado.', nome: 'Diga seu nome.', telefone: 'Confira o WhatsApp, com DDD.', cotas: 'Escolha quantas cotas.', link: 'Este link não vale mais.' };
        desenhar(t[r.erro] || 'Não deu certo agora.', n); return;
      }
      if (completos.length) {
        const { data: rp } = await sb.rpc('salvar_palpites', { p_token: r.token, p_jogos: completos });
        if (!rp || rp.erro) toast(rp && rp.erro === 'fechado' ? 'Os jogos já foram feitos: seus números não entraram.' : 'Você entrou, mas os números não foram salvos. Escolha de novo na próxima tela.', 'erro');
        else registrar('bolao_palpites', { qtd: completos.length });
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
  const [{ data: d, error }, { data: pal }] = await Promise.all([
    sb.rpc('cota_bolao_v2', { p_token: tCota }),
    sb.rpc('palpites_cota', { p_token: tCota })
  ]);
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
      <div class="vitrine-slot" data-vitrine="cota"></div>
      <p class="muted">${esc(textoConcurso(d))}</p>
      <p id="proximo" class="pequeno" hidden></p>
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
    ${pal && pal.palpites_por_cota ? '<section class="pilha-p" id="sec-palpites" aria-labelledby="t-meus"></section>' : ''}
    <section class="pilha-p" aria-labelledby="t-jogos">
      <h2 id="t-jogos">Jogos</h2>
      ${jogos.length ? (d.resultado && d.conferencia ? `<p class="muted">${plural(jogos.length, 'jogo', 'jogos')} de ${esc(nomeLoteria(d.loteria))}. A conferência de cada um está abaixo.</p>` : jogosHTML(jogos, d.loteria))
        : `<div class="card"><p class="muted">Os jogos aparecem aqui assim que ${esc(primeiroNome(d.organizador))} fizer as apostas e registrar o canhoto.</p></div>`}
      ${(d.fotos || []).length ? `<div class="fotos">${d.fotos.map((f, i) => `<a href="${esc(urlFoto(f))}" target="_blank" rel="noopener"><img src="${esc(urlFoto(f))}" alt="Foto do canhoto ${i + 1}" loading="lazy"></a>`).join('')}</div><p class="muted pequeno">Toque na foto para ampliar. O comprovante original fica com ${esc(primeiroNome(d.organizador))}.</p>` : ''}
    </section>
    ${blocoResultado}
  `);

  if (!d.resultado && d.concurso && (!d.data_sorteio || d.data_sorteio >= hoje())) mostrarProximo(document.getElementById('proximo'), d);
  const sec = document.getElementById('sec-palpites');
  if (sec) montarPalpites(sec, pal, d, jogos);

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
// Seção "Seus números" na página da cota
function montarPalpites(sec, pal, d, jogos) {
  const L = LOTERIAS[pal.loteria];
  const max = pal.cotas * pal.palpites_por_cota;
  let editando = false;
  const escolha = { lot: pal.loteria, jogos: [], atual: 0 };
  const pintar = () => {
    const meus = pal.meus || [];
    if (editando) {
      sec.innerHTML = `<h2 id="t-meus">Seus números</h2>
        <div class="card pilha" style="border: 2px solid var(--ink)">
          <p class="muted pequeno">Você pode escolher até ${plural(max, 'jogo', 'jogos')} de ${L.simples} números. Jogo em branco não conta.</p>
          <div id="seletor" class="pilha-p"></div>
          <p id="msg-pal" class="erro" role="alert"></p>
          <div class="acoes"><button type="button" class="btn lima" data-p="salvar">Salvar meus números</button><button type="button" class="btn sec" data-p="cancelar">Cancelar</button></div>
        </div>`;
      const caixa = sec.querySelector('#seletor');
      const repintar = () => { caixa.innerHTML = seletorHTML(pal.loteria, escolha.jogos, escolha.atual); };
      repintar();
      ligarSeletor(caixa, escolha, repintar, (m) => toast(m, 'erro'));
      return;
    }
    const temJogos = jogos.length > 0;
    sec.innerHTML = `<h2 id="t-meus">Seus números</h2>
      ${meus.length ? `<ol class="jogos">${meus.map((j, i) => {
        const tag = temJogos ? (jogadoNosJogos(j, jogos) ? '<span class="tag pago">Jogado ✓</span>' : '<span class="tag pendente">Não está nos jogos</span>') : '';
        return `<li><span class="linha-flex entre"><span class="muted pequeno">Seu jogo ${i + 1}</span>${tag}</span>${bolasHTML(j)}</li>`;
      }).join('')}</ol>` : `<div class="card"><p class="muted">${pal.pode_editar ? `Você tem direito a ${plural(max, 'jogo', 'jogos')} de ${L.simples} números. Se não escolher, ${esc(primeiroNome(d.organizador))} escolhe por você.` : 'Você não escolheu números. Os jogos foram escolhidos por quem organizou.'}</p></div>`}
      ${temJogos && meus.some((j) => !jogadoNosJogos(j, jogos)) ? `<p class="aviso">Algum número seu não aparece nos jogos registrados. Fale com ${esc(primeiroNome(d.organizador))}.</p>` : ''}
      ${pal.pode_editar ? `<button type="button" class="btn sec" data-p="editar" style="align-self:flex-start">${meus.length ? 'Trocar meus números' : 'Escolher meus números'}</button>` : ''}`;
  };
  sec.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    if (b.dataset.p === 'editar') {
      escolha.jogos = Array.from({ length: max }, (_, i) => (pal.meus[i] ? [...pal.meus[i]] : []));
      escolha.atual = 0; editando = true; pintar();
    } else if (b.dataset.p === 'cancelar') { editando = false; pintar(); }
    else if (b.dataset.p === 'salvar') {
      const meio = escolha.jogos.findIndex((j) => j.length > 0 && j.length < L.simples);
      if (meio >= 0) { escolha.atual = meio; sec.querySelector('#seletor').innerHTML = seletorHTML(pal.loteria, escolha.jogos, escolha.atual); sec.querySelector('#msg-pal').textContent = `Complete o jogo ${meio + 1} ou toque em Limpar.`; return; }
      const completos = escolha.jogos.filter((j) => j.length === L.simples);
      b.disabled = true;
      const { data: r, error } = await sb.rpc('salvar_palpites', { p_token: tCota, p_jogos: completos });
      if (error || !r || r.erro) {
        b.disabled = false;
        const t = { fechado: 'Os jogos já foram feitos ou o bolão fechou: não dá mais para trocar.', limite: `Você pode escolher até ${r && r.max} jogos.`, jogo: `Confira o jogo ${r && r.n}: ele precisa ter ${L.simples} números.` };
        sec.querySelector('#msg-pal').textContent = (r && t[r.erro]) || 'Não deu certo agora. Tente de novo.'; return;
      }
      registrar('bolao_palpites', { qtd: completos.length });
      pal.meus = completos; editando = false; pintar();
      toast(completos.length ? 'Números salvos!' : 'Pronto: quem organizou escolhe por você.');
    }
  });
  pintar();
}

if (tCota) minhaCota(); else entrada();

// fotos da vitrine: recarrega sempre que a página é redesenhada
const fotosVitrine = {};
new MutationObserver(() => {
  document.querySelectorAll('.vitrine-slot:not([data-ok])').forEach((el) => {
    el.dataset.ok = '1';
    const tipo = el.dataset.vitrine;
    const tk = { grupo: typeof token !== 'undefined' ? token : '', membro: typeof token !== 'undefined' ? token : '', cartela: typeof tCartela !== 'undefined' ? tCartela : '', comprador: typeof tComprador !== 'undefined' ? tComprador : '', bolao: typeof tEntrada !== 'undefined' ? tEntrada : '', cota: typeof tCota !== 'undefined' ? tCota : '' }[tipo];
    if (fotosVitrine[tipo] !== undefined) { el.innerHTML = fotosVitrine[tipo]; return; }
    carregarVitrinePublica(el, tipo, tk).then(() => { fotosVitrine[tipo] = el.innerHTML; });
  });
}).observe(document.getElementById('app'), { childList: true, subtree: true });
