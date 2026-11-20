// Lista aberta: qualquer pessoa com o link vê as vagas e coloca o nome.
import { sb } from '../js/sb.js';
import { registrar } from '../js/eventos.js';
import { esc, brl, primeiroNome, soDigitos, toast, ativarMascaras } from '../js/util.js';
import { MODELOS, textoRegra, valorDividido, ocupacaoHTML } from '../js/combinados.js';

const app = document.getElementById('app');
const token = new URLSearchParams(location.search).get('t') || '';
const CHAVE = `dxcmg_grupo_${token}`;

function casca(conteudo) {
  return `<div class="casca" style="padding-bottom: 48px">
    <header class="topo"><a class="marca" href="/" aria-label="Deixa Comigo"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a></header>
    <main class="pilha">${conteudo}</main>
    <footer class="pilha-p" style="margin-top: 32px; text-align: center">
      <p class="muted pequeno">O Deixa Comigo organiza a lista e as datas. O pagamento vai direto para quem organizou, por Pix: o app não recebe nem guarda dinheiro.</p>
      <p class="pequeno"><a href="/?utm_source=link_grupo&amp;utm_medium=rodape">Quer organizar a sua? Deixa comigo.</a> · <a href="/termos/">Termos</a> · <a href="/privacidade/">Privacidade</a> · <a href="/ajuda/">Ajuda</a></p>
    </footer>
  </div>`;
}

function guardado() {
  try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
}
function guardar(t) {
  try { localStorage.setItem(CHAVE, t); } catch (e) { /* sem armazenamento */ }
}

function precoHTML(g, podeEntrar) {
  if (g.valor_modo === 'dividir' && g.custo_base) {
    const ocupadas = Number(g.ocupadas);
    const agora = valorDividido(g, Math.max(1, podeEntrar ? ocupadas + 1 : ocupadas));
    const comMaisUm = valorDividido(g, ocupadas + 2);
    const podeMais = podeEntrar && (!g.limite || ocupadas + 2 <= Number(g.limite));
    return `<p class="muted pequeno">Valor por pessoa${g.regra === 'unico' ? '' : ` por ${g.frequencia === 'semanal' ? 'semana' : 'mês'}`}</p>
      <p class="numero" style="font-size: 2.2rem; color: var(--lima)">${brl(agora)}</p>
      <p>Custo total de ${brl(g.custo_base)} dividido por todo mundo${g.incluir_organizador ? ', incluindo quem organiza' : ''}.${podeMais ? ` <strong style="color: var(--lima)">Se mais 1 entrar depois de você, cai para ${brl(comMaisUm)}.</strong>` : ''}</p>`;
  }
  return `<p class="muted pequeno">Valor por pessoa</p>
    <p class="numero" style="font-size: 2.2rem; color: var(--lima)">${brl(g.valor)}</p>
    <p>${esc(textoRegra(g, g.valor))}</p>`;
}

function detalhesHTML(g) {
  const d = g.detalhes || {};
  const linhas = [];
  if (g.modelo === 'carona' && d.custo_total) {
    linhas.push([`Custo do carro por ${d.periodo || 'período'}`, brl(d.custo_total)]);
    if (d.km_total) linhas.push(['Km', `${Number(d.km_total).toLocaleString('pt-BR')} km`]);
    if (d.combustivel) linhas.push(['Combustível', brl(d.combustivel)]);
    if (d.desgaste) linhas.push(['Manutenção e pneus', brl(d.desgaste)]);
    if (Number(d.pedagio) > 0) linhas.push(['Pedágio', brl(d.pedagio)]);
    if (Number(d.estacionamento) > 0) linhas.push(['Estacionamento', brl(d.estacionamento)]);
  }
  if (g.regra !== 'unico') linhas.push(['Quando', textoRegra(g, g.valor).split(', ').slice(1).join(', ')]);
  if (g.regra === 'unico' && g.prazo) linhas.push(['Pagar até', new Date(g.prazo + 'T12:00:00').toLocaleDateString('pt-BR')]);
  if (g.descricao) linhas.push(['Observação', g.descricao]);
  if (!linhas.length) return '';
  return `<div class="card pilha-p">${linhas.map(([a, b]) => `<div class="linha-flex entre"><span class="muted">${esc(a)}</span><span style="text-align:right; font-weight:600">${esc(b)}</span></div>`).join('')}</div>`;
}

async function iniciar() {
  if (!/^[0-9a-f]{32}$/.test(token)) {
    app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1><p class="muted">Confira se o link foi copiado inteiro.</p></div>');
    return;
  }
  const { data: g, error } = await sb.rpc('grupo_publico', { p_token: token });
  if (error || !g) {
    app.innerHTML = casca('<div class="card pilha"><h1>Lista não encontrada</h1><p class="muted">Ela pode ter sido apagada. Fale com quem te mandou o link.</p></div>');
    return;
  }
  const org = primeiroNome(g.organizador);
  const meu = guardado();
  const cheio = g.limite && Number(g.ocupadas) >= Number(g.limite);
  const carona = g.modelo === 'carona';
  document.title = `${g.titulo} · Deixa Comigo`;

  let acao = '';
  if (meu) {
    acao = `<div class="card pilha-p" style="border: 2px solid var(--ink)"><h2>Você já está na lista</h2><p class="muted">Veja a sua parte, a ocupação e o Pix quando chegar a data.</p><a class="btn" href="/topo/?t=${esc(meu)}">Ver minha parte</a></div>`;
  } else if (!g.aberto) {
    acao = `<div class="card pilha-p"><h2>A lista está fechada</h2><p class="muted">Fale com ${esc(org)} se quiser participar.</p></div>`;
  } else if (cheio) {
    const motivo = g.vagas && Number(g.ocupadas) >= Number(g.vagas) ? (carona ? 'O carro lotou!' : 'A lista lotou!') : `A lista chegou no limite de ${g.limite} pessoas.`;
    acao = `<div class="card pilha-p"><h2>${motivo}</h2><p class="muted">Fale com ${esc(org)}: se abrir vaga, você entra.</p></div>`;
  } else {
    acao = `<form id="f" class="card pilha" style="border: 2px solid var(--ink)" novalidate>
      <h2>${carona ? 'Garantir minha vaga' : 'Colocar meu nome'}</h2>
      <div class="campo"><label for="nome">Seu nome</label><input id="nome" maxlength="60" autocomplete="name" required></div>
      <div class="campo"><label for="tel">Seu WhatsApp</label><input id="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="(11) 98765-4321"><span class="ajuda">Para ${esc(org)} te mandar o Pix na data. Recomendado.</span></div>
      <p id="msg" class="erro" role="alert"></p>
      <button type="submit" class="btn lima bloco">${carona ? 'Quero a vaga' : 'Entrar na lista'}</button>
      <p class="muted pequeno">Seu primeiro nome aparece para o grupo. Seu WhatsApp, só para ${esc(org)}.</p>
    </form>`;
  }

  app.innerHTML = casca(`
    <div class="pilha-p">
      <p class="muted">${esc(g.organizador)} ${carona ? 'está oferecendo carona' : 'está organizando'}:</p>
      <h1>${esc(g.titulo)}</h1>
      <span class="tag neutra" style="align-self: flex-start">${esc(MODELOS[g.modelo] ? MODELOS[g.modelo].nome : 'Combinado')}</span>
    </div>
    <div class="card escuro pilha-p">${precoHTML(g, !meu && g.aberto && !cheio)}</div>
    ${ocupacaoHTML(g)}
    ${detalhesHTML(g)}
    ${acao}
  `);

  const f = document.getElementById('f');
  if (f) f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const tel = soDigitos(document.getElementById('tel').value);
    const msg = document.getElementById('msg');
    msg.textContent = '';
    if (nome.length < 2) { msg.textContent = 'Diga seu nome.'; return; }
    if (tel && (tel.length < 10 || tel.length > 13)) { msg.textContent = 'Confira o WhatsApp, com DDD.'; return; }
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    const { data: r, error: e2 } = await sb.rpc('entrar_grupo', { p_token: token, p_nome: nome, p_telefone: tel || null });
    if (e2 || !r) { btn.disabled = false; msg.textContent = 'Não deu certo agora. Tente de novo.'; return; }
    if (r.erro) {
      btn.disabled = false;
      const textos = { lotado: carona ? 'Que pena, o carro acabou de lotar.' : 'Que pena, a lista acabou de lotar.', limite: 'A lista chegou no limite de pessoas.', fechado: 'A lista foi fechada.', nome: 'Diga seu nome.', telefone: 'Confira o WhatsApp, com DDD.', link: 'Este link não vale mais.' };
      msg.textContent = textos[r.erro] || 'Não deu certo agora.';
      return;
    }
    guardar(r.token);
    registrar('lista_entrada', { modelo: g.modelo });
    toast(r.ja_estava ? 'Você já estava na lista!' : (carona ? 'Vaga garantida!' : 'Você está na lista!'));
    location.href = `/topo/?t=${r.token}`;
  });
}

ativarMascaras(document);
iniciar();
