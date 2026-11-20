// Deixa Comigo — app (versão 1)
import { sb } from '../js/sb.js';
import { esc, brl, parseValor, round2, soDigitos, dataBR, hojeISO, linkWhatsApp, toast, copiar, NOMES_TIPO, primeiroNome } from '../js/util.js';
import { gerarMensagem, gerarConvite, TONS } from '../js/mensagens.js';
import { normalizarChave, validarChave } from '../js/pix.js';
import { MODELOS, vencimentoCiclo, textoRegra } from '../js/combinados.js';

const app = document.getElementById('app');
const estado = { sessao: null, perfil: null, perfilCarregado: false };
const DIAS_ENTRE_LEMBRETES = 3;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const ICONE = {
  carona: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16v-3l2-5h14l2 5v3z"/><path d="M3 13h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></svg>',
  emprestimo: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3-3"/><path d="M20 16H6l3 3"/></svg>',
  racha: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6"/></svg>',
  vaquinha: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 10c0-3.3-3.1-6-7-6S5 6.7 5 10c0 2 1.1 3.7 2.8 4.8L7 19h3l.5-1.6c.5.1 1 .1 1.5.1s1 0 1.5-.1L14 19h3l-.8-4.2c1.1-.7 2-1.7 2.4-2.8H21v-3h-2.2"/><path d="M10 4.5l2-2 2 2"/></svg>',
  viagem: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 13.5L3 11l1.5-1.5 7.5 1L16.5 6a2 2 0 0 1 3 3L15 13.5l1 7.5-1.5 1.5-2.5-7.5-3 3V21l-1.5 1-1.5-3.5L2.5 17l1-1.5h3z"/></svg>',
  mensalidade: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15h3"/></svg>',
  inicio: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  conta: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  mais: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  voltar: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
};
const COR_ICONE = { carona: 'lima', emprestimo: 'roxo', racha: 'pessego', vaquinha: 'pessego', viagem: 'roxo', mensalidade: 'lima' };
function tipoDe(c) { return c.modelo || c.tipo; }
const NOME_STATUS = { pendente: 'Pendente', avisou_pago: 'Avisou que pagou', pago: 'Pago' };

// ---------- estrutura ----------
function casca(conteudo, { nav = true, ativo = '', voltar = '' } = {}) {
  const topo = voltar
    ? `<a class="btn texto" href="#${voltar}" aria-label="Voltar">${ICONE.voltar} Voltar</a>`
    : `<a class="marca" href="#/"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a>`;
  const barra = nav ? `
    <nav class="nav" aria-label="Menu principal"><div class="dentro">
      <a href="#/" ${ativo === 'inicio' ? 'aria-current="page"' : ''}>${ICONE.inicio}Início</a>
      <a href="#/nova" class="mais">${ICONE.mais}Nova cobrança</a>
      <a href="#/conta" ${ativo === 'conta' ? 'aria-current="page"' : ''}>${ICONE.conta}Conta</a>
    </div></nav>` : '';
  return `<div class="casca"><header class="topo">${topo}</header><main class="pilha">${conteudo}</main></div>${barra}`;
}
function render(html) { app.innerHTML = html; }
function $(sel) { return app.querySelector(sel); }
function $$(sel) { return Array.from(app.querySelectorAll(sel)); }
function go(caminho) {
  if (location.hash !== '#' + caminho) location.hash = caminho;
  else rotear();
}
function linkPublico(token) { return `${location.origin}/p/?t=${token}`; }
function mesAtual() { return MESES[new Date().getMonth()]; }
function tonsHTML(atual, nome = 'tom') {
  return `<div class="tons" role="group" aria-label="Tom da mensagem">${TONS.map((t) =>
    `<button type="button" class="tom" data-${nome}="${t.id}" aria-pressed="${t.id === atual}">${t.nome}</button>`).join('')}</div>`;
}
function ligarTons(nome, aoMudar) {
  $$(`[data-${nome}]`).forEach((b) => b.addEventListener('click', () => {
    $$(`[data-${nome}]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    aoMudar(b.dataset[nome]);
  }));
}
function traduzErro(e) {
  const m = String((e && e.message) || e || '');
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/already registered|already exists/i.test(m)) return 'Esse e-mail já tem conta. Tente entrar.';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere um pouco e tente de novo.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão. Confira sua internet e tente de novo.';
  return 'Não deu certo agora. Tente de novo em instantes.';
}
async function carregarPerfil() {
  const { data } = await sb.from('perfis').select('*').eq('id', estado.sessao.user.id).maybeSingle();
  estado.perfil = data || null;
  estado.perfilCarregado = true;
}

// ---------- rotas ----------
const ROTAS = [
  [/^\/entrar$/, () => telaEntrar()],
  [/^\/cadastro$/, () => telaCadastro()],
  [/^\/perfil$/, () => telaPerfil()],
  [/^\/nova$/, () => telaNova()],
  [/^\/nova\/(carona|emprestimo|racha)$/, (t) => telaFormulario(t)],
  [/^\/combinar\/(carona|vaquinha|viagem|mensalidade)$/, (m) => telaFormCombinado(m)],
  [/^\/k\/([0-9a-f-]{36})$/, (id) => telaCombinado(id)],
  [/^\/c\/([0-9a-f-]{36})$/, (id) => telaCobranca(id)],
  [/^\/conta$/, () => telaConta()],
  [/^\/?$/, () => telaPainel()]
];
let rodando = false;
let ouvinteTela = null;
let repetir = false;
async function rotear() {
  if (rodando) { repetir = true; return; }
  rodando = true;
  repetir = false;
  try {
    let caminho = location.hash.replace(/^#/, '') || '/';
    if (/access_token|type=|error=/.test(caminho)) { history.replaceState(null, '', '/app/#/'); caminho = '/'; }
    const publica = /^\/(entrar|cadastro)$/.test(caminho);
    if (!estado.sessao) {
      if (!publica) { location.hash = '/entrar'; return; }
    } else {
      if (publica) { location.hash = '/'; return; }
      if (!estado.perfilCarregado) await carregarPerfil();
      if ((!estado.perfil || !estado.perfil.chave_pix) && caminho !== '/perfil') { location.hash = '/perfil'; return; }
    }
    for (const [re, fn] of ROTAS) {
      const m = caminho.match(re);
      if (m) {
        window.scrollTo(0, 0);
        if (ouvinteTela) { app.removeEventListener('click', ouvinteTela); ouvinteTela = null; }
        try { await fn(...m.slice(1)); } catch (e) {
          console.error(e);
          render(casca(`<div class="card pilha"><h2>Ops</h2><p class="erro">${esc(traduzErro(e))}</p><a class="btn" href="#/">Voltar ao início</a></div>`));
        }
        return;
      }
    }
    location.hash = '/';
  } finally {
    rodando = false;
    if (repetir) { repetir = false; setTimeout(rotear, 0); }
  }
}

// ---------- entrar / cadastro ----------
function telaEntrar() {
  render(casca(`
    <div class="pilha" style="padding-top: 16px">
      <h1>Cobrar amigo é chato.<br><span style="color: var(--roxo)">Deixa comigo.</span></h1>
      <p class="muted">Entre para cobrar carona, empréstimo e racha sem climão.</p>
    </div>
    <form id="f" class="card pilha" novalidate>
      <div class="campo"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" required></div>
      <div class="campo"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="current-password" required></div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">Entrar</button>
    </form>
    <p class="muted" style="text-align: center">Ainda não tem conta? <a href="#/cadastro">Criar conta grátis</a></p>`, { nav: false }));
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#f button[type=submit]');
    btn.disabled = true; $('#msg').textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#senha').value });
    btn.disabled = false;
    if (error) $('#msg').textContent = traduzErro(error);
  });
}

function telaCadastro() {
  render(casca(`
    <div class="pilha" style="padding-top: 16px">
      <h1>Crie sua conta</h1>
      <p class="muted">Grátis. Leva menos de um minuto.</p>
    </div>
    <form id="f" class="card pilha" novalidate>
      <div class="campo"><label for="nome">Seu nome</label><input id="nome" autocomplete="name" maxlength="80" required><span class="ajuda">É assim que você aparece para quem vai te pagar.</span></div>
      <div class="campo"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" required></div>
      <div class="campo"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="new-password" minlength="6" required><span class="ajuda">Pelo menos 6 caracteres.</span></div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">Criar conta</button>
    </form>
    <p class="muted pequeno" style="text-align: center">Ao criar a conta, você concorda com o uso dos seus dados só para o funcionamento do app.</p>
    <p class="muted" style="text-align: center">Já tem conta? <a href="#/entrar">Entrar</a></p>`, { nav: false }));
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = $('#nome').value.trim();
    const email = $('#email').value.trim();
    const senha = $('#senha').value;
    if (!nome) { $('#msg').textContent = 'Diga seu nome.'; return; }
    if (senha.length < 6) { $('#msg').textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    const btn = $('#f button[type=submit]');
    btn.disabled = true; $('#msg').textContent = '';
    const { data, error } = await sb.auth.signUp({
      email, password: senha,
      options: { data: { nome }, emailRedirectTo: `${location.origin}/app/` }
    });
    btn.disabled = false;
    if (error) { $('#msg').textContent = traduzErro(error); return; }
    if (!data.session) {
      render(casca(`<div class="card pilha"><h2>Confira seu e-mail</h2><p>Enviamos um link de confirmação para <strong>${esc(email)}</strong>. Depois de confirmar, é só entrar.</p><a class="btn" href="#/entrar">Ir para o login</a></div>`, { nav: false }));
    }
  });
}

// ---------- perfil / chave Pix ----------
function telaPerfil() {
  const p = estado.perfil || {};
  const nomeMeta = (estado.sessao.user.user_metadata || {}).nome || '';
  const primeiraVez = !p.chave_pix;
  const tipos = [['telefone', 'Celular'], ['cpf', 'CPF'], ['email', 'E-mail'], ['cnpj', 'CNPJ'], ['aleatoria', 'Chave aleatória']];
  render(casca(`
    <div class="pilha-p">
      <h1>${primeiraVez ? 'Onde você quer receber?' : 'Meus dados'}</h1>
      <p class="muted">Sua chave Pix aparece no link de pagamento para a pessoa te pagar direto. O dinheiro cai na sua conta: o app nunca toca nele.</p>
    </div>
    <form id="f" class="card pilha" novalidate>
      <div class="campo"><label for="nome">Seu nome</label><input id="nome" maxlength="80" value="${esc(p.nome || nomeMeta)}" required></div>
      <div class="campo"><label for="tipo">Tipo de chave Pix</label>
        <select id="tipo">${tipos.map(([v, n]) => `<option value="${v}" ${p.tipo_chave === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="campo"><label for="chave">Chave Pix</label><input id="chave" maxlength="77" value="${esc(p.chave_pix || '')}" required autocomplete="off"><span class="ajuda" id="ajuda-chave"></span></div>
      <div class="campo"><label for="cidade">Sua cidade</label><input id="cidade" maxlength="40" value="${esc(p.cidade && p.cidade !== 'SAO PAULO' ? p.cidade : (p.cidade || ''))}" placeholder="Ex.: Curitiba" required><span class="ajuda">O Pix pede a cidade de quem recebe.</span></div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">${primeiraVez ? 'Salvar e começar' : 'Salvar'}</button>
    </form>`, { nav: !primeiraVez, ativo: 'conta', voltar: primeiraVez ? '' : '/conta' }));
  const ajudas = { telefone: 'Com DDD. Ex.: (11) 98765-4321', cpf: 'Só os números do CPF.', email: 'O e-mail cadastrado como chave Pix.', cnpj: 'Só os números do CNPJ.', aleatoria: 'Cole a chave aleatória completa.' };
  const atualizarAjuda = () => { $('#ajuda-chave').textContent = ajudas[$('#tipo').value]; };
  $('#tipo').addEventListener('change', atualizarAjuda);
  atualizarAjuda();
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo = $('#tipo').value;
    const nome = $('#nome').value.trim();
    const cidade = $('#cidade').value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().slice(0, 15);
    if (!nome) { $('#msg').textContent = 'Diga seu nome.'; return; }
    if (!validarChave(tipo, $('#chave').value)) { $('#msg').textContent = 'Essa chave Pix não parece certa. Confira o tipo e o número.'; return; }
    if (!cidade) { $('#msg').textContent = 'Diga sua cidade.'; return; }
    const btn = $('#f button[type=submit]');
    btn.disabled = true;
    const { data, error } = await sb.from('perfis').upsert({
      id: estado.sessao.user.id, nome, tipo_chave: tipo, chave_pix: normalizarChave(tipo, $('#chave').value), cidade
    }).select().single();
    btn.disabled = false;
    if (error) { $('#msg').textContent = traduzErro(error); return; }
    estado.perfil = data;
    toast('Dados salvos!');
    go(primeiraVez ? '/nova' : '/conta');
  });
}

// ---------- painel ----------
function lembreteDevido(p, c) {
  if (p.status !== 'pendente' || !p.enviado_em) return false;
  const ultimo = new Date(p.ultimo_lembrete_em || p.enviado_em);
  const dias = (Date.now() - ultimo.getTime()) / 86400000;
  if (c.vencimento) {
    if (hojeISO() < c.vencimento) return false;
    return dias >= (p.lembretes_enviados === 0 ? 1 : DIAS_ENTRE_LEMBRETES);
  }
  return dias >= DIAS_ENTRE_LEMBRETES;
}
function restante(p) { return round2(Math.max(0, Number(p.valor) - Number(p.valor_pago || 0))); }

async function telaPainel() {
  render(casca('<p class="carregando">Carregando suas cobranças…</p>', { ativo: 'inicio' }));
  await sb.rpc('gerar_cobrancas');
  const [resC, resK] = await Promise.all([
    sb.from('cobrancas').select('*, participantes(*)').neq('status', 'cancelada').order('criado_em', { ascending: false }),
    sb.from('combinados').select('*, combinado_membros(*)').neq('status', 'encerrado').order('criado_em', { ascending: false })
  ]);
  if (resC.error) throw resC.error;
  if (resK.error) throw resK.error;
  const cobrancas = resC.data || [];
  const combinados = resK.data || [];
  let aReceber = 0; let recebido = 0;
  const tarefas = [];
  combinados.filter((k) => k.status === 'ativo').forEach((k) => {
    (k.combinado_membros || []).filter((m) => m.ativo && !m.convite_enviado_em).forEach((m) => {
      tarefas.push({ href: `#/k/${k.id}`, titulo: k.titulo, txt: `Mandar o combinado para ${esc(primeiroNome(m.nome))} topar`, tag: 'Convidar' });
    });
  });
  cobrancas.forEach((c) => {
    (c.participantes || []).forEach((p) => {
      if (p.status === 'pago') recebido += Number(p.valor);
      else {
        recebido += Number(p.valor_pago || 0);
        if (c.status === 'aberta') aReceber += restante(p);
      }
      if (c.status !== 'aberta') return;
      const base = { href: `#/c/${c.id}`, titulo: c.titulo };
      if (p.status === 'avisou_pago') tarefas.push({ ...base, txt: `${esc(primeiroNome(p.nome))} avisou que pagou ${brl(restante(p))}. Confira e confirme.`, tag: 'Confirmar' });
      else if (p.status === 'pendente' && !p.enviado_em) tarefas.push({ ...base, txt: `Enviar a cobrança para ${esc(primeiroNome(p.nome))}`, tag: 'Enviar' });
      else if (lembreteDevido(p, c)) tarefas.push({ ...base, txt: `Lembrar ${esc(primeiroNome(p.nome))} de ${brl(restante(p))}`, tag: 'Lembrar' });
    });
  });
  const abertas = cobrancas.filter((c) => c.status === 'aberta');
  const concluidas = cobrancas.filter((c) => c.status === 'concluida');
  const itemCobranca = (c) => {
    const ps = c.participantes || [];
    const pagos = ps.filter((p) => p.status === 'pago').length;
    const pct = ps.length ? Math.round((pagos / ps.length) * 100) : 0;
    return `<li><a class="item" href="#/c/${c.id}">
      <span class="icone ${COR_ICONE[tipoDe(c)]}">${ICONE[tipoDe(c)]}</span>
      <span class="grow"><span class="titulo-item">${esc(c.titulo)}</span>
        <span class="muted pequeno" style="display:block">${NOMES_TIPO[tipoDe(c)]}${c.vencimento ? ` · vence ${dataBR(c.vencimento)}` : ''} · ${pagos} de ${ps.length} pago${ps.length === 1 ? '' : 's'}</span>
        <span class="barra" aria-hidden="true"><span style="width: ${pct}%"></span></span></span>
      <strong>${brl(c.valor_total)}</strong></a></li>`;
  };
  const itemCombinado = (k) => {
    const ms = (k.combinado_membros || []).filter((m) => m.ativo);
    const toparam = ms.filter((m) => m.aceito_em).length;
    return `<li><a class="item" href="#/k/${k.id}">
      <span class="icone ${COR_ICONE[k.modelo]}">${ICONE[k.modelo]}</span>
      <span class="grow"><span class="titulo-item">${esc(k.titulo)}</span>
        <span class="muted pequeno" style="display:block">${esc(textoRegra(k))}</span>
        <span class="muted pequeno" style="display:block">${toparam} de ${ms.length} toparam${k.status === 'pausado' ? ' · pausado' : ''}</span></span></a></li>`;
  };
  const nome = primeiroNome(estado.perfil.nome);
  render(casca(`
    <h1>Oi, ${esc(nome)}!</h1>
    <div class="resumo">
      <div class="card escuro"><p class="muted pequeno">A receber</p><p class="numero" style="color: var(--lima)">${brl(aReceber)}</p></div>
      <div class="card"><p class="muted pequeno">Já recebido</p><p class="numero">${brl(recebido)}</p></div>
    </div>
    ${tarefas.length ? `<section class="pilha-p" aria-labelledby="t-hoje"><h2 id="t-hoje">Para fazer hoje</h2><ul class="lista">
      ${tarefas.map((t) => `<li><a class="item" href="${t.href}"><span class="grow">${t.txt}<span class="muted pequeno" style="display:block">${esc(t.titulo)}</span></span><span class="tag ${t.tag === 'Confirmar' ? 'avisou_pago' : t.tag === 'Convidar' ? 'neutra' : 'pendente'}">${t.tag}</span></a></li>`).join('')}
    </ul></section>` : ''}
    <section class="pilha-p" aria-labelledby="t-comb">
      <div class="linha-flex entre"><h2 id="t-comb">Combinados</h2><a class="btn peq" href="#/nova">${ICONE.mais}Novo</a></div>
      ${combinados.length ? `<ul class="lista">${combinados.map(itemCombinado).join('')}</ul>` : `
        <div class="card vazio pilha-p"><p><strong>Combine antes, cobre sem climão.</strong></p><p>Carona da semana, vaquinha do churrasco, viagem parcelada, pelada do mês: todo mundo topa as regras e o app cobra na data.</p><a class="btn" href="#/nova" style="align-self: center">Criar o primeiro combinado</a></div>`}
    </section>
    ${abertas.length ? `<section class="pilha-p" aria-labelledby="t-abertas"><h2 id="t-abertas">Cobranças em aberto</h2>
      <ul class="lista">${abertas.map(itemCobranca).join('')}</ul></section>` : ''}
    ${concluidas.length ? `<details class="pilha-p"><summary style="cursor:pointer; font-weight: 700; min-height: 44px; display:flex; align-items:center">Concluídas (${concluidas.length})</summary><ul class="lista">${concluidas.map(itemCobranca).join('')}</ul></details>` : ''}
  `, { ativo: 'inicio' }));
}

// ---------- nova cobrança ----------
function telaNova() {
  const opcao = (href, tipo, titulo, txt) => `<a class="opcao" href="#${href}"><span class="icone ${COR_ICONE[tipo]}">${ICONE[tipo]}</span><span><span class="display" style="font-size: 1.25rem; font-weight: 800; display:block">${titulo}</span><span class="muted">${txt}</span></span></a>`;
  render(casca(`
    <div class="pilha-p">
      <h1>Combine antes</h1>
      <p class="muted">Todo mundo topa as regras agora, e o app cobra sozinho na data. Ninguém precisa pedir nada depois.</p>
    </div>
    ${opcao('/combinar/carona', 'carona', 'Carona fixa', 'Valor por semana ou por mês para quem vai junto.')}
    ${opcao('/combinar/vaquinha', 'vaquinha', 'Vaquinha', 'Churrasco, festa, presente: cada um paga antes, ninguém adianta nada.')}
    ${opcao('/combinar/viagem', 'viagem', 'Viagem parcelada', 'O valor da viagem dividido em parcelas até a data.')}
    ${opcao('/combinar/mensalidade', 'mensalidade', 'Mensalidade do grupo', 'Pelada, quadra, república, streaming dividido.')}
    <div class="pilha-p" style="margin-top: 16px">
      <h2>Cobrar o que já passou</h2>
      <p class="muted">Para o que não foi combinado antes.</p>
    </div>
    ${opcao('/nova/carona', 'carona', 'Carona', 'Divide combustível e desgaste do carro entre os passageiros.')}
    ${opcao('/nova/emprestimo', 'emprestimo', 'Empréstimo', 'Aquele dinheiro que ficou no "te passo".')}
    ${opcao('/nova/racha', 'racha', 'Racha', 'Você pagou tudo e cada um te devolve a sua parte.')}
  `, { ativo: '' }));
}

// ---------- combinados ----------
function proximoDia(diasAFrente) {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function telaFormCombinado(modelo) {
  const f = { tom: 'leve', pessoas: [{ nome: '', telefone: '' }], valorEditado: false };
  const textos = {
    carona: { titulo: 'Combinar carona fixa', ph: 'Ex.: Carona para o trabalho' },
    vaquinha: { titulo: 'Combinar vaquinha', ph: 'Ex.: Churrasco de fim de ano' },
    viagem: { titulo: 'Combinar viagem parcelada', ph: 'Ex.: Viagem para a praia em julho' },
    mensalidade: { titulo: 'Combinar mensalidade', ph: 'Ex.: Pelada de quinta' }
  }[modelo];
  const freqHTML = (padrao) => `
    <div class="campo"><span style="font-weight: 600; font-size: 0.92rem">Cobrar</span>
      <div class="tons" role="radiogroup" aria-label="Frequência">
        <label class="check"><input type="radio" name="freq" value="semanal" ${padrao === 'semanal' ? 'checked' : ''}> Toda semana</label>
        <label class="check"><input type="radio" name="freq" value="mensal" ${padrao === 'mensal' ? 'checked' : ''}> Todo mês</label>
      </div></div>`;
  let especifico = '';
  if (modelo === 'carona') {
    especifico = `
      ${freqHTML('semanal')}
      <div class="campo"><label for="inicio">Primeira cobrança em</label><input id="inicio" type="date" min="${hojeISO()}" value="${proximoDia(7)}"></div>
      <div class="campo"><label for="valor">Valor por pessoa, por <span id="rot-periodo">semana</span> (R$)</label><input id="valor" inputmode="decimal" placeholder="Ex.: 60,00"></div>
      <details class="card" style="padding: 14px"><summary style="cursor:pointer; font-weight: 600; min-height: 44px; display:flex; align-items:center">Calcular pelo custo do carro</summary>
        <div class="pilha" style="margin-top: 8px">
          <div class="grade-2">
            <div class="campo"><label for="km">Km por dia (ida e volta)</label><input id="km" inputmode="decimal" placeholder="Ex.: 36"></div>
            <div class="campo"><label for="dias">Dias por <span class="rot-periodo2">semana</span></label><input id="dias" inputmode="numeric" value="5"></div>
            <div class="campo"><label for="consumo">Consumo (km/l)</label><input id="consumo" inputmode="decimal" placeholder="Ex.: 11"></div>
            <div class="campo"><label for="preco">Preço do litro (R$)</label><input id="preco" inputmode="decimal" placeholder="Ex.: 6,19"></div>
          </div>
          <div class="campo"><label for="desgaste">Desgaste por km (R$)</label><input id="desgaste" inputmode="decimal" value="0,15"><span class="ajuda">Pneu, revisão e óleo. Ajuste se quiser.</span></div>
          <label class="check"><input type="checkbox" id="incluir" checked> Dividir também com o motorista (eu)</label>
          <p id="calc-res" class="muted pequeno" aria-live="polite"></p>
        </div>
      </details>`;
  } else if (modelo === 'vaquinha') {
    especifico = `
      <div class="campo"><span style="font-weight: 600; font-size: 0.92rem">Como dividir</span>
        <div class="tons" role="radiogroup" aria-label="Como dividir">
          <label class="check"><input type="radio" name="modo" value="meta" checked> Tenho um valor total</label>
          <label class="check"><input type="radio" name="modo" value="fixo"> Valor fixo por pessoa</label>
        </div></div>
      <div class="campo" id="bloco-meta"><label for="meta">Valor total da vaquinha (R$)</label><input id="meta" inputmode="decimal" placeholder="Ex.: 600,00"></div>
      <label class="check" id="bloco-incluir"><input type="checkbox" id="incluir" checked> Eu também entro na divisão</label>
      <div class="campo" id="bloco-fixo" hidden><label for="valor">Valor por pessoa (R$)</label><input id="valor" inputmode="decimal" placeholder="Ex.: 50,00"></div>
      <div class="campo"><label for="prazo">Pagar até</label><input id="prazo" type="date" min="${hojeISO()}" value="${proximoDia(7)}"></div>
      <div class="campo"><label for="descricao">Para que é (opcional)</label><input id="descricao" maxlength="200" placeholder="Ex.: carne, bebida e carvão"></div>`;
  } else if (modelo === 'viagem') {
    especifico = `
      <div class="grade-2">
        <div class="campo"><label for="total">Valor total por pessoa (R$)</label><input id="total" inputmode="decimal" placeholder="Ex.: 1.200,00"></div>
        <div class="campo"><label for="parcelas">Em quantas parcelas</label><input id="parcelas" inputmode="numeric" value="6"></div>
      </div>
      <div class="campo"><label for="inicio">Primeira parcela em</label><input id="inicio" type="date" min="${hojeISO()}" value="${proximoDia(7)}"><span class="ajuda">As próximas vencem no mesmo dia dos meses seguintes.</span></div>
      <div class="campo"><label for="descricao">O que está incluído (opcional)</label><input id="descricao" maxlength="200" placeholder="Ex.: casa, combustível e mercado"></div>`;
  } else {
    especifico = `
      ${freqHTML('mensal')}
      <div class="campo"><label for="valor">Valor por pessoa (R$)</label><input id="valor" inputmode="decimal" placeholder="Ex.: 40,00"></div>
      <div class="campo"><label for="inicio">Primeira cobrança em</label><input id="inicio" type="date" min="${hojeISO()}" value="${proximoDia(7)}"></div>
      <div class="campo"><label for="descricao">Observação (opcional)</label><input id="descricao" maxlength="200" placeholder="Ex.: aluguel da quadra + bola"></div>`;
  }

  render(casca(`
    <h1>${textos.titulo}</h1>
    <form id="f" class="pilha" novalidate>
      <div class="card pilha">
        <div class="campo"><label for="titulo">Nome do combinado</label><input id="titulo" maxlength="60" placeholder="${textos.ph}"></div>
        ${especifico}
      </div>
      <div class="card pilha">
        <fieldset class="pilha-p" style="border: 0; padding: 0; margin: 0"><legend style="font-weight: 600; margin-bottom: 6px">Quem participa</legend>
          <div id="pessoas" class="pilha-p">${linhasPessoasHTML(f.pessoas, 'Pessoa')}</div>
          <button type="button" class="btn sec peq" id="add-pessoa" style="align-self: flex-start">${ICONE.mais}Adicionar pessoa</button>
        </fieldset>
      </div>
      <div id="resumo" class="calc" aria-live="polite"></div>
      <div class="card pilha-p"><span style="font-weight: 600">Tom das mensagens</span>${tonsHTML(f.tom)}</div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco lima" type="submit">Criar combinado</button>
    </form>`, { voltar: '/nova' }));

  ligarTons('tom', (t) => { f.tom = t; });
  const freqAtual = () => { const r = app.querySelector('input[name=freq]:checked'); return r ? r.value : 'mensal'; };
  const pessoasValidas = () => f.pessoas.map((p) => ({ nome: p.nome.trim(), telefone: soDigitos(p.telefone) || null })).filter((p) => p.nome);

  // Retorna o combinado montado (ou { erro })
  const montar = () => {
    const pessoas = pessoasValidas();
    const n = Math.max(pessoas.length, 1);
    const k = { modelo, tom: f.tom, detalhes: {} };
    if (modelo === 'carona') {
      k.regra = 'recorrente'; k.frequencia = freqAtual(); k.inicio = $('#inicio').value;
      k.valor_por_pessoa = round2(parseValor($('#valor').value));
      if (f.calc) k.detalhes = f.calc;
    } else if (modelo === 'vaquinha') {
      k.regra = 'unico'; k.prazo = $('#prazo').value; k.inicio = hojeISO();
      const modo = app.querySelector('input[name=modo]:checked').value;
      if (modo === 'meta') {
        const meta = parseValor($('#meta').value);
        const div = n + ($('#incluir').checked ? 1 : 0);
        k.valor_por_pessoa = round2(meta / div);
        k.detalhes = { meta: round2(meta), pessoas_divisao: div, eu_incluido: $('#incluir').checked };
      } else {
        k.valor_por_pessoa = round2(parseValor($('#valor').value));
      }
    } else if (modelo === 'viagem') {
      const total = parseValor($('#total').value);
      const parcelas = Math.round(parseValor($('#parcelas').value));
      k.regra = 'recorrente'; k.frequencia = 'mensal'; k.inicio = $('#inicio').value; k.parcelas = parcelas;
      k.valor_por_pessoa = round2(total / parcelas);
      k.detalhes = { total_por_pessoa: round2(total) };
    } else {
      k.regra = 'recorrente'; k.frequencia = freqAtual(); k.inicio = $('#inicio').value;
      k.valor_por_pessoa = round2(parseValor($('#valor').value));
    }
    const d = $('#descricao');
    k.descricao = d && d.value.trim() ? d.value.trim() : null;
    return { k, pessoas };
  };

  const calcularCarona = () => {
    if (modelo !== 'carona') return;
    const km = parseValor($('#km').value), dias = parseValor($('#dias').value), consumo = parseValor($('#consumo').value), preco = parseValor($('#preco').value);
    const desg = parseValor($('#desgaste').value || '0');
    const periodo = freqAtual() === 'semanal' ? 'semana' : 'mês';
    $('#rot-periodo').textContent = periodo;
    $$('.rot-periodo2').forEach((el) => { el.textContent = periodo; });
    if (!(km > 0 && dias > 0 && consumo > 0 && preco > 0) || !(desg >= 0)) { $('#calc-res').textContent = 'Preencha km, dias, consumo e preço para calcular.'; f.calc = null; return; }
    const kmTotal = km * dias;
    const combustivel = round2((kmTotal / consumo) * preco);
    const desgaste = round2(kmTotal * desg);
    const total = round2(combustivel + desgaste);
    const div = Math.max(pessoasValidas().length, 1) + ($('#incluir').checked ? 1 : 0);
    const por = round2(total / div);
    f.calc = { km_dia: km, dias, consumo, preco_litro: preco, desgaste_km: desg, km_total: round2(kmTotal), combustivel, desgaste, custo_total: total, pessoas_divisao: div, motorista_incluido: $('#incluir').checked, periodo };
    $('#calc-res').textContent = `Custo por ${periodo}: ${brl(total)} (combustível ${brl(combustivel)} + desgaste ${brl(desgaste)}), dividido por ${div}: ${brl(por)} por pessoa.`;
    if (!f.valorEditado) $('#valor').value = por.toFixed(2).replace('.', ',');
  };

  const atualizarResumo = () => {
    calcularCarona();
    if (modelo === 'vaquinha') {
      const modo = app.querySelector('input[name=modo]:checked').value;
      $('#bloco-meta').hidden = modo !== 'meta';
      $('#bloco-incluir').hidden = modo !== 'meta';
      $('#bloco-fixo').hidden = modo !== 'fixo';
    }
    const { k, pessoas } = montar();
    const ok = k.valor_por_pessoa > 0 && (k.regra === 'unico' ? !!k.prazo : !!k.inicio) && (modelo !== 'viagem' || k.parcelas >= 1);
    if (!ok) { $('#resumo').innerHTML = '<span style="color:#C9C5D6">Preencha os valores para ver o resumo do combinado.</span>'; return; }
    const linhas = [['Regra', textoRegra(k)], ['Participantes', String(pessoas.length)]];
    if (k.regra === 'recorrente' && !k.parcelas) linhas.push([k.frequencia === 'semanal' ? 'Você recebe por semana' : 'Você recebe por mês', brl(k.valor_por_pessoa * pessoas.length)]);
    else linhas.push(['Total a receber', brl(k.valor_por_pessoa * pessoas.length * (k.parcelas || 1))]);
    $('#resumo').innerHTML = `${linhas.slice(0, -1).map(([a, b]) => `<div class="lin"><span>${a}</span><span style="text-align:right">${esc(b)}</span></div>`).join('')}<div class="lin total"><span>${linhas[linhas.length - 1][0]}</span><span>${linhas[linhas.length - 1][1]}</span></div>`;
  };

  $('#f').addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.lista) f.pessoas[Number(el.dataset.i)][el.dataset.k] = el.value;
    if (el.id === 'valor') f.valorEditado = !!el.value;
    atualizarResumo();
  });
  $('#f').addEventListener('change', atualizarResumo);
  $('#f').addEventListener('click', (e) => {
    const b = e.target.closest('[data-remover]');
    if (!b) return;
    f.pessoas.splice(Number(b.dataset.i), 1);
    $('#pessoas').innerHTML = linhasPessoasHTML(f.pessoas, 'Pessoa');
    atualizarResumo();
  });
  $('#add-pessoa').addEventListener('click', () => {
    f.pessoas.push({ nome: '', telefone: '' });
    $('#pessoas').innerHTML = linhasPessoasHTML(f.pessoas, 'Pessoa');
    const el = $(`#pn${f.pessoas.length - 1}`); if (el) el.focus();
    atualizarResumo();
  });
  atualizarResumo();

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#msg');
    msg.textContent = '';
    const titulo = $('#titulo').value.trim();
    const { k, pessoas } = montar();
    if (!titulo) { msg.textContent = 'Dê um nome para o combinado.'; return; }
    if (!pessoas.length) { msg.textContent = 'Adicione pelo menos uma pessoa.'; return; }
    if (modelo === 'viagem' && !(k.parcelas >= 1 && k.parcelas <= 60)) { msg.textContent = 'Informe de 1 a 60 parcelas.'; return; }
    if (!(k.valor_por_pessoa > 0)) { msg.textContent = 'Informe o valor.'; return; }
    if (k.regra === 'unico' ? !k.prazo : !k.inicio) { msg.textContent = 'Escolha a data.'; return; }
    k.titulo = titulo;
    const btn = $('#f button[type=submit]');
    btn.disabled = true; btn.textContent = 'Criando…';
    const { data: novo, error } = await sb.from('combinados').insert(k).select().single();
    if (error) { btn.disabled = false; btn.textContent = 'Criar combinado'; msg.textContent = traduzErro(error); return; }
    const { error: e2 } = await sb.from('combinado_membros').insert(pessoas.map((p) => ({ ...p, combinado_id: novo.id })));
    if (e2) {
      await sb.from('combinados').delete().eq('id', novo.id);
      btn.disabled = false; btn.textContent = 'Criar combinado'; msg.textContent = traduzErro(e2); return;
    }
    await sb.rpc('gerar_cobrancas');
    toast('Combinado criado! Agora mande para cada um topar.');
    go(`/k/${novo.id}`);
  });
}

async function telaCombinado(id) {
  render(casca('<p class="carregando">Carregando…</p>', { voltar: '/' }));
  await sb.rpc('gerar_cobrancas');
  const [rk, rc] = await Promise.all([
    sb.from('combinados').select('*, combinado_membros(*)').eq('id', id).maybeSingle(),
    sb.from('cobrancas').select('id, titulo, ciclo, vencimento, status, valor_total, participantes(status)').eq('combinado_id', id).order('ciclo', { ascending: false })
  ]);
  if (rk.error) throw rk.error;
  const k = rk.data;
  if (!k) { render(casca('<div class="card pilha"><h2>Combinado não encontrado</h2><a class="btn" href="#/">Voltar ao início</a></div>', { voltar: '/' })); return; }
  const ciclos = rc.data || [];
  k.combinado_membros.sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const abertos = new Set();
  const linkTopo = (m) => `${location.origin}/topo/?t=${m.token}`;
  const conviteDe = (m) => gerarConvite({ tom: k.tom, nome: m.nome, titulo: k.titulo, regra: textoRegra(k, m.valor), link: linkTopo(m), plano: estado.perfil.plano });

  const proxima = () => {
    if (k.regra === 'unico' || k.status !== 'ativo') return null;
    const n = (ciclos.length ? Math.max(...ciclos.map((c) => c.ciclo || 0)) : 0) + 1;
    if (k.parcelas && n > k.parcelas) return null;
    return vencimentoCiclo(k.inicio, k.frequencia, n);
  };

  const desenhar = () => {
    const ms = k.combinado_membros.filter((m) => m.ativo);
    const toparam = ms.filter((m) => m.aceito_em).length;
    const prox = proxima();
    const cartao = (m) => {
      const aberto = abertos.has(m.id);
      const situacao = m.aceito_em ? `<span class="tag pago">Topou em ${new Date(m.aceito_em).toLocaleDateString('pt-BR')}</span>`
        : m.convite_enviado_em ? '<span class="tag pendente">Convite enviado</span>' : '<span class="tag neutra">Convite não enviado</span>';
      return `<article class="pessoa" aria-label="${esc(m.nome)}">
        <div class="linha-flex entre"><div><h3>${esc(m.nome)}</h3><p class="muted pequeno">${brl(m.valor || k.valor_por_pessoa)} ${k.regra === 'unico' ? 'no total' : k.parcelas ? 'por parcela' : k.frequencia === 'semanal' ? 'por semana' : 'por mês'}</p></div>${situacao}</div>
        ${k.status !== 'encerrado' && !m.aceito_em ? `<div class="acoes">
          <button type="button" class="btn peq" data-acao="previa" data-id="${m.id}">${m.convite_enviado_em ? 'Reenviar convite' : 'Enviar convite no WhatsApp'}</button>
          <button type="button" class="btn sec peq" data-acao="link" data-id="${m.id}">Copiar link</button>
        </div>` : ''}
        ${aberto ? `<div class="previa">
          <label for="m-${m.id}" class="pequeno" style="font-weight: 600">Convite (pode editar antes de enviar)</label>
          <textarea id="m-${m.id}">${esc(conviteDe(m))}</textarea>
          <div class="acoes">
            <button type="button" class="btn peq" data-acao="whats" data-id="${m.id}">Abrir WhatsApp</button>
            <button type="button" class="btn sec peq" data-acao="copiarmsg" data-id="${m.id}">Copiar mensagem</button>
            <button type="button" class="btn texto peq" data-acao="fechar" data-id="${m.id}">Fechar</button>
          </div></div>` : ''}
        ${k.status !== 'encerrado' ? `<button type="button" class="btn texto peq" data-acao="remover" data-id="${m.id}" style="align-self: flex-start">Tirar do combinado</button>` : ''}
      </article>`;
    };
    render(casca(`
      <div class="pilha-p">
        <div class="linha-flex"><span class="icone ${COR_ICONE[k.modelo]}">${ICONE[k.modelo]}</span><span class="tag neutra">${MODELOS[k.modelo].nome}</span>${k.status !== 'ativo' ? `<span class="tag pendente">${k.status === 'pausado' ? 'Pausado' : 'Encerrado'}</span>` : ''}</div>
        <h1>${esc(k.titulo)}</h1>
        <p class="muted">${esc(textoRegra(k))}${k.descricao ? ` · ${esc(k.descricao)}` : ''}</p>
      </div>
      <div class="resumo">
        <div class="card escuro"><p class="muted pequeno">Toparam</p><p class="numero" style="color: var(--lima)">${toparam} de ${ms.length}</p></div>
        <div class="card"><p class="muted pequeno">${k.regra === 'unico' ? 'Prazo' : 'Próxima cobrança'}</p><p class="numero">${k.regra === 'unico' ? dataBR(k.prazo) : prox ? dataBR(prox) : '—'}</p></div>
      </div>
      <p class="muted pequeno">O app cria a cobrança de cada data sozinho, 2 dias antes do vencimento, e te avisa em "Para fazer hoje". Quem não topou também recebe a cobrança.</p>
      ${k.status === 'ativo' ? `<div class="card pilha-p"><span style="font-weight: 600">Tom das mensagens</span>${tonsHTML(k.tom, 'tomk')}</div>` : ''}
      <section class="pilha-p" aria-label="Participantes"><h2>Participantes</h2>${ms.map(cartao).join('')}
        ${k.status !== 'encerrado' ? `<form id="add" class="card pilha-p" novalidate>
          <span style="font-weight: 600">Adicionar pessoa</span>
          <div class="grade-2">
            <div class="campo"><label class="sr" for="novo-nome">Nome</label><input id="novo-nome" maxlength="60" placeholder="Nome"></div>
            <div class="campo"><label class="sr" for="novo-tel">WhatsApp</label><input id="novo-tel" type="tel" inputmode="tel" maxlength="20" placeholder="WhatsApp (opcional)"></div>
          </div>
          <button type="submit" class="btn sec peq" style="align-self: flex-start">Adicionar</button>
          <span class="ajuda muted pequeno">Entra a partir da próxima cobrança.</span>
        </form>` : ''}
      </section>
      ${ciclos.length ? `<section class="pilha-p" aria-label="Cobranças"><h2>Cobranças</h2><ul class="lista">${ciclos.map((c) => {
        const pagos = c.participantes.filter((p) => p.status === 'pago').length;
        return `<li><a class="item" href="#/c/${c.id}"><span class="grow"><span class="titulo-item">${esc(c.titulo)}</span><span class="muted pequeno" style="display:block">Vence ${dataBR(c.vencimento)} · ${pagos} de ${c.participantes.length} pagos</span></span><span class="tag ${c.status === 'concluida' ? 'pago' : 'pendente'}">${c.status === 'concluida' ? 'Concluída' : 'Em aberto'}</span></a></li>`;
      }).join('')}</ul></section>` : ''}
      <div class="acoes" style="margin-top: 8px">
        ${k.status === 'ativo' ? '<button type="button" class="btn sec peq" data-acao="pausar">Pausar</button>' : ''}
        ${k.status === 'pausado' ? '<button type="button" class="btn sec peq" data-acao="retomar">Retomar</button>' : ''}
        ${k.status !== 'encerrado' ? '<button type="button" class="btn sec peq" data-acao="encerrar">Encerrar</button>' : ''}
        <button type="button" class="btn perigo peq" data-acao="apagar">Apagar combinado</button>
      </div>`, { voltar: '/' }));
    ligarTons('tomk', async (t) => {
      k.tom = t;
      desenhar();
      await sb.from('combinados').update({ tom: t }).eq('id', k.id);
    });
    const add = $('#add');
    if (add) add.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = $('#novo-nome').value.trim();
      if (!nome) { toast('Diga o nome da pessoa.', 'erro'); return; }
      const { data: m, error: e1 } = await sb.from('combinado_membros').insert({ combinado_id: k.id, nome, telefone: soDigitos($('#novo-tel').value) || null }).select().single();
      if (e1) { toast(traduzErro(e1), 'erro'); return; }
      k.combinado_membros.push(m);
      toast(`${primeiroNome(nome)} entrou no combinado.`);
      desenhar();
    });
  };

  const marcarConvite = async (m) => {
    const { data, error: e } = await sb.from('combinado_membros').update({ convite_enviado_em: new Date().toISOString() }).eq('id', m.id).select().single();
    if (!e) Object.assign(m, data);
    abertos.delete(m.id);
    desenhar();
  };

  ouvinteTela = async (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    const m = k.combinado_membros.find((x) => x.id === b.dataset.id);
    if (acao === 'previa') { abertos.add(m.id); desenhar(); const t = $(`#m-${m.id}`); if (t) t.focus(); }
    else if (acao === 'fechar') { abertos.delete(m.id); desenhar(); }
    else if (acao === 'whats') {
      window.open(linkWhatsApp(m.telefone, $(`#m-${m.id}`).value), '_blank', 'noopener');
      await marcarConvite(m);
      toast('Pronto! Agora é só apertar enviar no WhatsApp.');
    } else if (acao === 'copiarmsg') {
      const ok = await copiar($(`#m-${m.id}`).value);
      if (ok) { await marcarConvite(m); toast('Convite copiado. Cole no WhatsApp.'); } else toast('Não consegui copiar.', 'erro');
    } else if (acao === 'link') {
      const ok = await copiar(linkTopo(m));
      toast(ok ? 'Link do convite copiado.' : 'Não consegui copiar o link.', ok ? 'ok' : 'erro');
    } else if (acao === 'remover') {
      if (!window.confirm(`Tirar ${m.nome} do combinado? As próximas cobranças não vão incluir essa pessoa.`)) return;
      const { error: e1 } = await sb.from('combinado_membros').update({ ativo: false }).eq('id', m.id);
      if (e1) { toast(traduzErro(e1), 'erro'); return; }
      m.ativo = false; desenhar();
    } else if (acao === 'pausar' || acao === 'retomar' || acao === 'encerrar') {
      if (acao === 'encerrar' && !window.confirm('Encerrar este combinado? Não serão criadas novas cobranças. As que já existem continuam.')) return;
      const status = acao === 'pausar' ? 'pausado' : acao === 'retomar' ? 'ativo' : 'encerrado';
      const { error: e2 } = await sb.from('combinados').update({ status }).eq('id', k.id);
      if (e2) { toast(traduzErro(e2), 'erro'); return; }
      k.status = status;
      toast(status === 'pausado' ? 'Combinado pausado.' : status === 'ativo' ? 'Combinado retomado.' : 'Combinado encerrado.');
      desenhar();
    } else if (acao === 'apagar') {
      if (!window.confirm('Apagar este combinado de vez? As cobranças já criadas continuam na sua lista.')) return;
      const { error: e3 } = await sb.from('combinados').delete().eq('id', k.id);
      if (e3) { toast(traduzErro(e3), 'erro'); return; }
      toast('Combinado apagado.'); go('/');
    }
  };
  app.addEventListener('click', ouvinteTela);
  desenhar();
}

function linhasPessoasHTML(lista, rotulo) {
  return lista.map((p, i) => `
    <div class="linha-pessoa">
      <div class="campo"><label class="sr" for="pn${i}">Nome ${i + 1}</label><input id="pn${i}" data-lista="pessoas" data-i="${i}" data-k="nome" placeholder="${rotulo} ${i + 1}" maxlength="60" value="${esc(p.nome)}"></div>
      <div class="campo"><label class="sr" for="pt${i}">WhatsApp ${i + 1}</label><input id="pt${i}" data-lista="pessoas" data-i="${i}" data-k="telefone" type="tel" inputmode="tel" placeholder="WhatsApp (opcional)" maxlength="20" value="${esc(p.telefone)}"></div>
      <button type="button" class="remover" data-remover="pessoas" data-i="${i}" aria-label="Remover ${esc(p.nome || rotulo + ' ' + (i + 1))}" ${lista.length === 1 ? 'disabled' : ''}>×</button>
    </div>`).join('');
}
function linhasGastosHTML(lista) {
  return lista.map((g, i) => `
    <div class="linha-gasto">
      <div class="campo"><label class="sr" for="gd${i}">Gasto ${i + 1}</label><input id="gd${i}" data-lista="gastos" data-i="${i}" data-k="descricao" placeholder="Ex.: Carne" maxlength="40" value="${esc(g.descricao)}"></div>
      <div class="campo"><label class="sr" for="gv${i}">Valor do gasto ${i + 1}</label><input id="gv${i}" data-lista="gastos" data-i="${i}" data-k="valor" inputmode="decimal" placeholder="R$ 0,00" value="${esc(g.valor)}"></div>
      <button type="button" class="remover" data-remover="gastos" data-i="${i}" aria-label="Remover gasto ${i + 1}" ${lista.length === 1 ? 'disabled' : ''}>×</button>
    </div>`).join('');
}

function telaFormulario(tipo) {
  const f = {
    tom: 'leve',
    pessoas: [{ nome: '', telefone: '' }],
    gastos: [{ descricao: '', valor: '' }]
  };
  const rotuloPessoa = tipo === 'carona' ? 'Passageiro' : 'Pessoa';
  let corpo = '';
  if (tipo === 'carona') {
    corpo = `
      <div class="campo"><label for="titulo">Nome da cobrança</label><input id="titulo" maxlength="80" value="Carona de ${mesAtual()}"></div>
      <div class="grade-2">
        <div class="campo"><label for="km">Km por dia (ida e volta)</label><input id="km" inputmode="decimal" placeholder="Ex.: 36"></div>
        <div class="campo"><label for="dias">Dias de carona</label><input id="dias" inputmode="numeric" placeholder="Ex.: 20"></div>
        <div class="campo"><label for="consumo">Consumo do carro (km/l)</label><input id="consumo" inputmode="decimal" placeholder="Ex.: 11"></div>
        <div class="campo"><label for="preco">Preço do litro (R$)</label><input id="preco" inputmode="decimal" placeholder="Ex.: 6,19"></div>
      </div>
      <div class="campo"><label for="desgaste">Desgaste do carro por km (R$)</label><input id="desgaste" inputmode="decimal" value="0,15"><span class="ajuda">Pneu, revisão e óleo. R$ 0,15 por km é uma média para carro popular; ajuste se quiser.</span></div>
      <label class="check"><input type="checkbox" id="incluir" checked> Dividir também com o motorista (eu)</label>`;
  } else if (tipo === 'emprestimo') {
    corpo = `
      <div class="campo"><label for="titulo">O que foi?</label><input id="titulo" maxlength="80" placeholder="Ex.: Empréstimo para o conserto do carro"></div>
      <div class="campo"><label for="valor">Valor emprestado (R$)</label><input id="valor" inputmode="decimal" placeholder="Ex.: 300,00"></div>
      <div class="campo"><label for="descricao">Observação (opcional)</label><input id="descricao" maxlength="200" placeholder="Ex.: emprestado em 10/03"></div>`;
  } else {
    corpo = `
      <div class="campo"><label for="titulo">Nome do racha</label><input id="titulo" maxlength="80" placeholder="Ex.: Churrasco do sábado"></div>
      <fieldset class="pilha-p" style="border: 0; padding: 0; margin: 0"><legend style="font-weight: 600; margin-bottom: 6px">O que você pagou</legend>
        <div id="gastos" class="pilha-p">${linhasGastosHTML(f.gastos)}</div>
        <button type="button" class="btn sec peq" id="add-gasto" style="align-self: flex-start">${ICONE.mais}Adicionar gasto</button>
      </fieldset>
      <label class="check"><input type="checkbox" id="incluir" checked> Incluir minha parte na divisão</label>`;
  }
  const blocoPessoas = tipo === 'emprestimo' ? `
      <div class="grade-2">
        <div class="campo"><label for="pnome">Para quem?</label><input id="pnome" maxlength="60" placeholder="Nome"></div>
        <div class="campo"><label for="ptel">WhatsApp (opcional)</label><input id="ptel" type="tel" inputmode="tel" maxlength="20" placeholder="(11) 98765-4321"></div>
      </div>` : `
      <fieldset class="pilha-p" style="border: 0; padding: 0; margin: 0"><legend style="font-weight: 600; margin-bottom: 6px">${tipo === 'carona' ? 'Passageiros' : 'Quem vai pagar'}</legend>
        <div id="pessoas" class="pilha-p">${linhasPessoasHTML(f.pessoas, rotuloPessoa)}</div>
        <button type="button" class="btn sec peq" id="add-pessoa" style="align-self: flex-start">${ICONE.mais}Adicionar ${rotuloPessoa.toLowerCase()}</button>
      </fieldset>`;

  const titulos = { carona: 'Cobrar carona', emprestimo: 'Cobrar empréstimo', racha: 'Fechar racha' };
  render(casca(`
    <h1>${titulos[tipo]}</h1>
    <form id="f" class="pilha" novalidate>
      <div class="card pilha">${corpo}</div>
      <div class="card pilha">${blocoPessoas}</div>
      ${tipo !== 'emprestimo' ? '<div id="calc" class="calc" aria-live="polite"></div>' : ''}
      <div class="card pilha">
        <div class="campo"><label for="venc">Pagar até (opcional)</label><input id="venc" type="date" min="${hojeISO()}"></div>
        <div class="campo"><span style="font-weight: 600; font-size: 0.92rem">Tom da mensagem</span>${tonsHTML(f.tom)}<span class="ajuda">Dá para mudar depois, antes de enviar.</span></div>
      </div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco lima" type="submit">Criar cobrança</button>
    </form>`, { voltar: '/nova' }));

  ligarTons('tom', (t) => { f.tom = t; });

  const calcular = () => {
    const pessoas = f.pessoas.filter((p) => p.nome.trim());
    const nPag = Math.max(pessoas.length, 1);
    if (tipo === 'carona') {
      const km = parseValor($('#km').value), dias = parseValor($('#dias').value), consumo = parseValor($('#consumo').value), preco = parseValor($('#preco').value);
      const desg = parseValor($('#desgaste').value || '0');
      const incluir = $('#incluir').checked;
      if (!(km > 0 && dias > 0 && consumo > 0 && preco > 0) || !(desg >= 0)) return null;
      const kmTotal = km * dias;
      const combustivel = round2((kmTotal / consumo) * preco);
      const desgaste = round2(kmTotal * desg);
      const total = round2(combustivel + desgaste);
      const divisao = nPag + (incluir ? 1 : 0);
      return { porPessoa: round2(total / divisao), detalhes: { km_dia: km, dias, consumo, preco_litro: preco, desgaste_km: desg, km_total: round2(kmTotal), combustivel, desgaste, custo_total: total, pessoas_divisao: divisao, motorista_incluido: incluir }, linhas: [['Km rodados', `${round2(kmTotal).toLocaleString('pt-BR')} km`], ['Combustível', brl(combustivel)], ['Desgaste do carro', brl(desgaste)], ['Custo total', brl(total)], ['Dividido por', `${divisao} pessoa${divisao === 1 ? '' : 's'}`]] };
    }
    if (tipo === 'racha') {
      const gastos = f.gastos.map((g) => ({ descricao: g.descricao.trim() || 'Gasto', valor: parseValor(g.valor) })).filter((g) => g.valor > 0);
      if (!gastos.length) return null;
      const total = round2(gastos.reduce((s, g) => s + g.valor, 0));
      const incluir = $('#incluir').checked;
      const divisao = nPag + (incluir ? 1 : 0);
      return { porPessoa: round2(total / divisao), detalhes: { gastos: gastos.map((g) => ({ descricao: g.descricao.slice(0, 40), valor: round2(g.valor) })), total_gastos: total, pessoas_divisao: divisao, eu_incluido: incluir }, linhas: [['Total gasto', brl(total)], ['Dividido por', `${divisao} pessoa${divisao === 1 ? '' : 's'}`]] };
    }
    return null;
  };
  const atualizarCalc = () => {
    if (tipo === 'emprestimo') return;
    const r = calcular();
    $('#calc').innerHTML = r
      ? `${r.linhas.map(([a, b]) => `<div class="lin"><span>${a}</span><span>${b}</span></div>`).join('')}<div class="lin total"><span>Cada ${tipo === 'carona' ? 'passageiro' : 'pessoa'} paga</span><span>${brl(r.porPessoa)}</span></div>`
      : `<span class="muted" style="color:#C9C5D6">${tipo === 'carona' ? 'Preencha km, dias, consumo e preço do litro para ver a conta.' : 'Lance os gastos para ver quanto cada um paga.'}</span>`;
  };
  const redesenharLista = (qual) => {
    if (qual === 'pessoas') $('#pessoas').innerHTML = linhasPessoasHTML(f.pessoas, rotuloPessoa);
    else $('#gastos').innerHTML = linhasGastosHTML(f.gastos);
    atualizarCalc();
  };
  $('#f').addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.lista) f[el.dataset.lista][Number(el.dataset.i)][el.dataset.k] = el.value;
    atualizarCalc();
  });
  $('#f').addEventListener('change', atualizarCalc);
  $('#f').addEventListener('click', (e) => {
    const b = e.target.closest('[data-remover]');
    if (!b) return;
    f[b.dataset.remover].splice(Number(b.dataset.i), 1);
    redesenharLista(b.dataset.remover);
  });
  const addP = $('#add-pessoa');
  if (addP) addP.addEventListener('click', () => {
    f.pessoas.push({ nome: '', telefone: '' });
    redesenharLista('pessoas');
    const i = f.pessoas.length - 1; const el = $(`#pn${i}`); if (el) el.focus();
  });
  const addG = $('#add-gasto');
  if (addG) addG.addEventListener('click', () => {
    f.gastos.push({ descricao: '', valor: '' });
    redesenharLista('gastos');
    const i = f.gastos.length - 1; const el = $(`#gd${i}`); if (el) el.focus();
  });
  atualizarCalc();

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#msg');
    msg.textContent = '';
    const titulo = $('#titulo').value.trim();
    if (!titulo) { msg.textContent = 'Dê um nome para a cobrança.'; return; }
    let participantes = [];
    let detalhes = {};
    let descricao = null;
    if (tipo === 'emprestimo') {
      const nome = $('#pnome').value.trim();
      const valor = round2(parseValor($('#valor').value));
      if (!nome) { msg.textContent = 'Diga para quem você emprestou.'; return; }
      if (!(valor > 0)) { msg.textContent = 'Informe o valor emprestado.'; return; }
      participantes = [{ nome, telefone: soDigitos($('#ptel').value) || null, valor }];
      descricao = $('#descricao').value.trim() || null;
    } else {
      const pessoas = f.pessoas.map((p) => ({ nome: p.nome.trim(), telefone: soDigitos(p.telefone) || null })).filter((p) => p.nome);
      if (!pessoas.length) { msg.textContent = `Adicione pelo menos ${tipo === 'carona' ? 'um passageiro' : 'uma pessoa'}.`; return; }
      const r = calcular();
      if (!r) { msg.textContent = tipo === 'carona' ? 'Preencha km, dias, consumo e preço do litro.' : 'Lance pelo menos um gasto com valor.'; return; }
      if (!(r.porPessoa > 0)) { msg.textContent = 'O valor por pessoa ficou zerado. Confira os números.'; return; }
      participantes = pessoas.map((p) => ({ ...p, valor: r.porPessoa }));
      detalhes = r.detalhes;
    }
    const valorTotal = round2(participantes.reduce((s, p) => s + p.valor, 0));
    const btn = $('#f button[type=submit]');
    btn.disabled = true; btn.textContent = 'Criando…';
    const { data: c, error } = await sb.from('cobrancas').insert({
      tipo, titulo, descricao, valor_total: valorTotal, vencimento: $('#venc').value || null, tom: f.tom, detalhes
    }).select().single();
    if (error) { btn.disabled = false; btn.textContent = 'Criar cobrança'; msg.textContent = traduzErro(error); return; }
    const { error: e2 } = await sb.from('participantes').insert(participantes.map((p) => ({ ...p, cobranca_id: c.id })));
    if (e2) {
      await sb.from('cobrancas').delete().eq('id', c.id);
      btn.disabled = false; btn.textContent = 'Criar cobrança'; msg.textContent = traduzErro(e2); return;
    }
    toast('Cobrança criada! Agora é só enviar.');
    go(`/c/${c.id}`);
  });
}

// ---------- detalhe da cobrança ----------
async function telaCobranca(id) {
  render(casca('<p class="carregando">Carregando…</p>', { voltar: '/' }));
  const { data: c, error } = await sb.from('cobrancas').select('*, participantes(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!c) { render(casca('<div class="card pilha"><h2>Cobrança não encontrada</h2><a class="btn" href="#/">Voltar ao início</a></div>', { voltar: '/' })); return; }
  c.participantes.sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const abertoPara = new Set();

  const resumoDetalhes = () => {
    const d = c.detalhes || {};
    if (c.tipo === 'carona' && d.custo_total) return `${d.dias} dias${d.periodo ? ' por ' + d.periodo : ''} · ${Number(d.km_dia).toLocaleString('pt-BR')} km/dia · custo total ${brl(d.custo_total)} dividido por ${d.pessoas_divisao}`;
    if (c.tipo === 'racha' && d.total_gastos) return `Total gasto ${brl(d.total_gastos)} dividido por ${d.pessoas_divisao}`;
    if (d.meta) return `Meta da vaquinha ${brl(d.meta)}${c.descricao ? ' · ' + esc(c.descricao) : ''}`;
    if (d.total_por_pessoa) return `Viagem: ${brl(d.total_por_pessoa)} por pessoa no total${c.descricao ? ' · ' + esc(c.descricao) : ''}`;
    return c.descricao ? esc(c.descricao) : '';
  };
  const mensagemPara = (p) => gerarMensagem({
    tipo: tipoDe(c), tom: c.tom, momento: p.enviado_em ? 'lembrete' : (c.combinado_id ? 'combinado' : 'inicial'),
    nome: p.nome, valor: brl(restante(p)), titulo: c.titulo, vencimento: dataBR(c.vencimento),
    link: linkPublico(p.token), plano: estado.perfil.plano
  });
  const cartaoPessoa = (p) => {
    const aberto = abertoPara.has(p.id);
    let acoes = '';
    if (p.status === 'pendente') {
      acoes = `<button type="button" class="btn peq" data-acao="previa" data-id="${p.id}">${p.enviado_em ? 'Lembrar no WhatsApp' : 'Enviar no WhatsApp'}</button>
               <button type="button" class="btn sec peq" data-acao="link" data-id="${p.id}">Copiar link</button>
               <button type="button" class="btn sec peq" data-acao="pago" data-id="${p.id}">Recebi</button>`;
    } else if (p.status === 'avisou_pago') {
      acoes = `<button type="button" class="btn lima peq" data-acao="pago" data-id="${p.id}">Confirmar que recebi</button>
               <button type="button" class="btn sec peq" data-acao="naopago" data-id="${p.id}">Ainda não caiu</button>`;
    } else {
      acoes = `<button type="button" class="btn texto peq" data-acao="desfazer" data-id="${p.id}">Desfazer</button>`;
    }
    const info = p.status === 'pago' ? `Pago${p.pago_em ? ' em ' + new Date(p.pago_em).toLocaleDateString('pt-BR') : ''}`
      : p.status === 'avisou_pago' ? 'Avisou que pagou. Confira no seu banco.'
      : p.enviado_em ? `Cobrança enviada${p.lembretes_enviados ? ` · ${p.lembretes_enviados} lembrete${p.lembretes_enviados === 1 ? '' : 's'}` : ''}` : 'Ainda não enviada';
    return `<article class="pessoa" aria-label="${esc(p.nome)}">
      <div class="linha-flex entre"><div><h3>${esc(p.nome)}</h3><p class="muted pequeno">${info}</p></div>
        <div style="text-align: right"><strong>${brl(p.status === 'pago' ? p.valor : restante(p))}</strong><br><span class="tag ${p.status}">${NOME_STATUS[p.status]}</span></div></div>
      ${c.status === 'aberta' ? `<div class="acoes">${acoes}</div>` : ''}
      ${aberto ? `<div class="previa">
        <label for="m-${p.id}" class="pequeno" style="font-weight: 600">Mensagem (pode editar antes de enviar)</label>
        <textarea id="m-${p.id}">${esc(mensagemPara(p))}</textarea>
        <div class="acoes">
          <button type="button" class="btn peq" data-acao="whats" data-id="${p.id}">Abrir WhatsApp</button>
          <button type="button" class="btn sec peq" data-acao="copiarmsg" data-id="${p.id}">Copiar mensagem</button>
          <button type="button" class="btn texto peq" data-acao="fechar" data-id="${p.id}">Fechar</button>
        </div>
        ${p.telefone ? '' : '<p class="muted pequeno">Sem WhatsApp cadastrado: o WhatsApp vai abrir para você escolher o contato.</p>'}
      </div>` : ''}
    </article>`;
  };
  const desenhar = () => {
    const ps = c.participantes;
    const pagos = ps.filter((p) => p.status === 'pago').length;
    render(casca(`
      <div class="pilha-p">
        <div class="linha-flex"><span class="icone ${COR_ICONE[tipoDe(c)]}">${ICONE[tipoDe(c)]}</span><span class="tag neutra">${NOMES_TIPO[tipoDe(c)]}</span>${c.status !== 'aberta' ? `<span class="tag pago">${c.status === 'concluida' ? 'Concluída' : 'Cancelada'}</span>` : ''}</div>
        <h1>${esc(c.titulo)}</h1>
        <p class="muted">${resumoDetalhes()}</p>
        ${c.combinado_id ? `<a class="pequeno" href="#/k/${c.combinado_id}">Ver o combinado</a>` : ''}
      </div>
      <div class="resumo">
        <div class="card escuro"><p class="muted pequeno">Total</p><p class="numero">${brl(c.valor_total)}</p></div>
        <div class="card"><p class="muted pequeno">${c.vencimento ? 'Pagar até' : 'Pagos'}</p><p class="numero">${c.vencimento ? dataBR(c.vencimento) : `${pagos}/${ps.length}`}</p></div>
      </div>
      ${c.status === 'aberta' ? `<div class="card pilha-p"><span style="font-weight: 600">Tom das mensagens</span>${tonsHTML(c.tom, 'tomc')}</div>` : ''}
      <section class="pilha-p" aria-label="Quem deve"><h2>${c.tipo === 'carona' ? 'Passageiros' : c.tipo === 'racha' ? 'Quem paga' : 'Quem deve'}</h2>
        ${ps.map(cartaoPessoa).join('')}</section>
      <div class="acoes" style="margin-top: 8px">
        ${c.status === 'aberta' ? '<button type="button" class="btn sec peq" data-acao="concluir">Marcar como concluída</button><button type="button" class="btn perigo peq" data-acao="cancelar">Cancelar cobrança</button>'
          : '<button type="button" class="btn sec peq" data-acao="reabrir">Reabrir</button><button type="button" class="btn perigo peq" data-acao="apagar">Apagar</button>'}
      </div>`, { voltar: '/' }));
    ligarTons('tomc', async (t) => {
      c.tom = t;
      desenhar();
      await sb.from('cobrancas').update({ tom: t }).eq('id', c.id);
    });
  };

  const atualizarP = async (p, mudancas) => {
    const { data, error: e } = await sb.from('participantes').update(mudancas).eq('id', p.id).select().single();
    if (e) { toast(traduzErro(e), 'erro'); return false; }
    Object.assign(p, data);
    const todosPagos = c.participantes.every((x) => x.status === 'pago');
    const novoStatus = todosPagos ? 'concluida' : 'aberta';
    if (c.status !== novoStatus && c.status !== 'cancelada') {
      await sb.from('cobrancas').update({ status: novoStatus }).eq('id', c.id);
      c.status = novoStatus;
      if (todosPagos) toast('Todo mundo pagou! Cobrança concluída.');
    }
    return true;
  };
  const registrarEnvio = async (p) => {
    if (!p.enviado_em) await atualizarP(p, { enviado_em: new Date().toISOString() });
    else await atualizarP(p, { ultimo_lembrete_em: new Date().toISOString(), lembretes_enviados: (p.lembretes_enviados || 0) + 1 });
    abertoPara.delete(p.id);
    desenhar();
  };

  ouvinteTela = async function aoClicar(e) {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const p = c.participantes.find((x) => x.id === b.dataset.id);
    const acao = b.dataset.acao;
    if (acao === 'previa') { abertoPara.add(p.id); desenhar(); const t = $(`#m-${p.id}`); if (t) t.focus(); }
    else if (acao === 'fechar') { abertoPara.delete(p.id); desenhar(); }
    else if (acao === 'whats') {
      const texto = $(`#m-${p.id}`).value;
      window.open(linkWhatsApp(p.telefone, texto), '_blank', 'noopener');
      await registrarEnvio(p);
      toast('Pronto! Agora é só apertar enviar no WhatsApp.');
    } else if (acao === 'copiarmsg') {
      const ok = await copiar($(`#m-${p.id}`).value);
      if (ok) { await registrarEnvio(p); toast('Mensagem copiada. Cole no WhatsApp.'); } else toast('Não consegui copiar. Selecione o texto e copie.', 'erro');
    } else if (acao === 'link') {
      const ok = await copiar(linkPublico(p.token));
      toast(ok ? 'Link de pagamento copiado.' : 'Não consegui copiar o link.', ok ? 'ok' : 'erro');
    } else if (acao === 'pago') {
      if (await atualizarP(p, { status: 'pago', valor_pago: p.valor, pago_em: new Date().toISOString() })) desenhar();
    } else if (acao === 'naopago' || acao === 'desfazer') {
      if (await atualizarP(p, { status: 'pendente', valor_pago: 0, pago_em: null, avisou_pago_em: null })) desenhar();
    } else if (acao === 'concluir' || acao === 'reabrir' || acao === 'cancelar') {
      if (acao === 'cancelar' && !window.confirm('Cancelar esta cobrança? Os links de pagamento param de funcionar.')) return;
      const status = acao === 'reabrir' ? 'aberta' : acao === 'concluir' ? 'concluida' : 'cancelada';
      const { error: e3 } = await sb.from('cobrancas').update({ status }).eq('id', c.id);
      if (e3) { toast(traduzErro(e3), 'erro'); return; }
      if (status === 'cancelada') { toast('Cobrança cancelada.'); go('/'); return; }
      c.status = status; desenhar();
    } else if (acao === 'apagar') {
      if (!window.confirm('Apagar esta cobrança de vez? Isso não pode ser desfeito.')) return;
      const { error: e4 } = await sb.from('cobrancas').delete().eq('id', c.id);
      if (e4) { toast(traduzErro(e4), 'erro'); return; }
      toast('Cobrança apagada.'); go('/');
    }
  };
  app.addEventListener('click', ouvinteTela);
  desenhar();
}

// ---------- conta ----------
function telaConta() {
  const p = estado.perfil;
  const tipos = { telefone: 'Celular', cpf: 'CPF', email: 'E-mail', cnpj: 'CNPJ', aleatoria: 'Chave aleatória' };
  render(casca(`
    <h1>Conta</h1>
    <div class="card pilha-p">
      <p class="muted pequeno">Nome</p><p><strong>${esc(p.nome)}</strong></p>
      <p class="muted pequeno">Chave Pix (${tipos[p.tipo_chave] || ''})</p><p><strong>${esc(p.chave_pix)}</strong></p>
      <p class="muted pequeno">E-mail de acesso</p><p>${esc(estado.sessao.user.email)}</p>
      <a class="btn sec" href="#/perfil" style="margin-top: 8px">Editar meus dados</a>
    </div>
    <div class="card destaque pilha-p">
      <div class="linha-flex entre"><h2>Plano ${p.plano === 'gratis' ? 'Grátis' : p.plano === 'plus' ? 'Plus' : 'Autônomo'}</h2><span class="tag neutra">Atual</span></div>
      <p class="muted">${p.plano === 'gratis' ? 'Suas mensagens saem com "enviado por dx cmg". O Plus, sem marca e com lembretes ilimitados, chega em breve.' : 'Obrigado por apoiar o Deixa Comigo!'}</p>
    </div>
    <button type="button" class="btn sec bloco" id="sair">Sair da conta</button>
    <p class="muted pequeno" style="text-align: center">Deixa Comigo · versão 1</p>
  `, { ativo: 'conta' }));
  $('#sair').addEventListener('click', async () => {
    await sb.auth.signOut();
    estado.perfil = null; estado.perfilCarregado = false; estado.sessao = null;
    go('/entrar');
  });
}

// ---------- início ----------
(async function iniciar() {
  const { data } = await sb.auth.getSession();
  estado.sessao = data.session;
  sb.auth.onAuthStateChange((evento, sessao) => {
    const antes = !!estado.sessao;
    estado.sessao = sessao;
    if (evento === 'SIGNED_OUT') { estado.perfil = null; estado.perfilCarregado = false; }
    if (antes !== !!sessao) setTimeout(rotear, 0);
  });
  window.addEventListener('hashchange', rotear);
  rotear();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/app/sw.js').catch(() => {});
})();
