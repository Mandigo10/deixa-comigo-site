// Deixa Comigo — app (versão 1)
import { sb } from '../js/sb.js';
import { esc, brl, parseValor, round2, soDigitos, dataBR, hojeISO, linkWhatsApp, toast, copiar, NOMES_TIPO, primeiroNome } from '../js/util.js';
import { gerarMensagem, TONS } from '../js/mensagens.js';
import { normalizarChave, validarChave } from '../js/pix.js';

const app = document.getElementById('app');
const estado = { sessao: null, perfil: null, perfilCarregado: false };
const DIAS_ENTRE_LEMBRETES = 3;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const ICONE = {
  carona: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16v-3l2-5h14l2 5v3z"/><path d="M3 13h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></svg>',
  emprestimo: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3-3"/><path d="M20 16H6l3 3"/></svg>',
  racha: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6"/></svg>',
  inicio: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  conta: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  mais: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  voltar: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
};
const COR_ICONE = { carona: 'lima', emprestimo: 'roxo', racha: 'pessego' };
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
  const { data, error } = await sb.from('cobrancas').select('*, participantes(*)').neq('status', 'cancelada').order('criado_em', { ascending: false });
  if (error) throw error;
  const cobrancas = data || [];
  let aReceber = 0; let recebido = 0;
  const tarefas = [];
  cobrancas.forEach((c) => {
    (c.participantes || []).forEach((p) => {
      if (p.status === 'pago') recebido += Number(p.valor);
      else {
        recebido += Number(p.valor_pago || 0);
        if (c.status === 'aberta') aReceber += restante(p);
      }
      if (c.status !== 'aberta') return;
      if (p.status === 'avisou_pago') tarefas.push({ c, txt: `${esc(primeiroNome(p.nome))} avisou que pagou ${brl(restante(p))}. Confira e confirme.`, tag: 'Confirmar' });
      else if (p.status === 'pendente' && !p.enviado_em) tarefas.push({ c, txt: `Enviar a cobrança para ${esc(primeiroNome(p.nome))}`, tag: 'Enviar' });
      else if (lembreteDevido(p, c)) tarefas.push({ c, txt: `Lembrar ${esc(primeiroNome(p.nome))} de ${brl(restante(p))}`, tag: 'Lembrar' });
    });
  });
  const abertas = cobrancas.filter((c) => c.status === 'aberta');
  const concluidas = cobrancas.filter((c) => c.status === 'concluida');
  const itemCobranca = (c) => {
    const ps = c.participantes || [];
    const pagos = ps.filter((p) => p.status === 'pago').length;
    const pct = ps.length ? Math.round((pagos / ps.length) * 100) : 0;
    return `<li><a class="item" href="#/c/${c.id}">
      <span class="icone ${COR_ICONE[c.tipo]}">${ICONE[c.tipo]}</span>
      <span class="grow"><span class="titulo-item">${esc(c.titulo)}</span>
        <span class="muted pequeno" style="display:block">${NOMES_TIPO[c.tipo]} · ${pagos} de ${ps.length} pago${ps.length === 1 ? '' : 's'}</span>
        <span class="barra" aria-hidden="true"><span style="width: ${pct}%"></span></span></span>
      <strong>${brl(c.valor_total)}</strong></a></li>`;
  };
  const nome = primeiroNome(estado.perfil.nome);
  render(casca(`
    <h1>Oi, ${esc(nome)}!</h1>
    <div class="resumo">
      <div class="card escuro"><p class="muted pequeno">A receber</p><p class="numero" style="color: var(--lima)">${brl(aReceber)}</p></div>
      <div class="card"><p class="muted pequeno">Já recebido</p><p class="numero">${brl(recebido)}</p></div>
    </div>
    ${tarefas.length ? `<section class="pilha-p" aria-labelledby="t-hoje"><h2 id="t-hoje">Para fazer hoje</h2><ul class="lista">
      ${tarefas.map((t) => `<li><a class="item" href="#/c/${t.c.id}"><span class="grow">${t.txt}<span class="muted pequeno" style="display:block">${esc(t.c.titulo)}</span></span><span class="tag ${t.tag === 'Confirmar' ? 'avisou_pago' : 'pendente'}">${t.tag}</span></a></li>`).join('')}
    </ul></section>` : ''}
    <section class="pilha-p" aria-labelledby="t-abertas">
      <div class="linha-flex entre"><h2 id="t-abertas">Em aberto</h2><a class="btn peq" href="#/nova">${ICONE.mais}Nova</a></div>
      ${abertas.length ? `<ul class="lista">${abertas.map(itemCobranca).join('')}</ul>` : `
        <div class="card vazio pilha-p"><p><strong>Nenhuma cobrança em aberto.</strong></p><p>Aquela carona, aquele empréstimo, aquele churrasco… deixa comigo.</p><a class="btn" href="#/nova" style="align-self: center">Criar a primeira cobrança</a></div>`}
    </section>
    ${concluidas.length ? `<details class="pilha-p"><summary style="cursor:pointer; font-weight: 700; min-height: 44px; display:flex; align-items:center">Concluídas (${concluidas.length})</summary><ul class="lista">${concluidas.map(itemCobranca).join('')}</ul></details>` : ''}
  `, { ativo: 'inicio' }));
}

// ---------- nova cobrança ----------
function telaNova() {
  const opcao = (tipo, titulo, txt) => `<a class="opcao" href="#/nova/${tipo}"><span class="icone ${COR_ICONE[tipo]}">${ICONE[tipo]}</span><span><span class="display" style="font-size: 1.3rem; font-weight: 800; display:block">${titulo}</span><span class="muted">${txt}</span></span></a>`;
  render(casca(`
    <h1>O que vamos cobrar?</h1>
    ${opcao('carona', 'Carona', 'Divide combustível e desgaste do carro entre os passageiros.')}
    ${opcao('emprestimo', 'Empréstimo', 'Aquele dinheiro que você emprestou e ficou no "te passo".')}
    ${opcao('racha', 'Racha', 'Churrasco, viagem, presente: cada um paga a sua parte.')}
  `, { ativo: '' }));
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
    if (c.tipo === 'carona' && d.custo_total) return `${d.dias} dias · ${Number(d.km_dia).toLocaleString('pt-BR')} km/dia · custo total ${brl(d.custo_total)} dividido por ${d.pessoas_divisao}`;
    if (c.tipo === 'racha' && d.total_gastos) return `Total gasto ${brl(d.total_gastos)} dividido por ${d.pessoas_divisao}`;
    return c.descricao ? esc(c.descricao) : '';
  };
  const mensagemPara = (p) => gerarMensagem({
    tipo: c.tipo, tom: c.tom, momento: p.enviado_em ? 'lembrete' : 'inicial',
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
        <div class="linha-flex"><span class="icone ${COR_ICONE[c.tipo]}">${ICONE[c.tipo]}</span><span class="tag neutra">${NOMES_TIPO[c.tipo]}</span>${c.status !== 'aberta' ? `<span class="tag pago">${c.status === 'concluida' ? 'Concluída' : 'Cancelada'}</span>` : ''}</div>
        <h1>${esc(c.titulo)}</h1>
        <p class="muted">${resumoDetalhes()}</p>
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
