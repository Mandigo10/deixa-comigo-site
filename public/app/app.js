// Deixa Comigo — app (versão 1)
import { sb } from '../js/sb.js';
import { registrar } from '../js/eventos.js';
import { esc, brl, parseValor, round2, soDigitos, dataBR, hojeISO, linkWhatsApp, toast, copiar, NOMES_TIPO, primeiroNome } from '../js/util.js';
import { gerarMensagem, gerarConvite, gerarDivulgacao, TONS } from '../js/mensagens.js';
import { normalizarChave, validarChave } from '../js/pix.js';
import { MODELOS, vencimentoCiclo, textoRegra, valorDividido, categoriaDe } from '../js/combinados.js';
import { rotulo, valorDe, textoValor, mensagemCartela, divulgacaoCartela, AVISO_LEGAL } from '../js/cartelas.js';
import { CALCULADORAS, acharCalculadora, montarCalculadora, guardarPreenchimento, lerPreenchimento } from '../js/calculadoras.js';

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
  venda: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1 13H6z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  cartela: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  resumo: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  calc: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h8"/></svg>',
  casa: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-5h6v5"/></svg>',
  bolo: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21h16v-8H4z"/><path d="M4 16c2 1 4 1 6 0s4-1 6 0 3 1 4 0"/><path d="M12 13V9M12 6V5"/><path d="M7 13v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/></svg>',
  obra: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h20v3H2zM4 18V11a8 8 0 0 1 16 0v7"/><path d="M10 4.5V9M14 4.5V9"/></svg>',
  coracao: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16141F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
  mais: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  voltar: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
};
const COR_ICONE = { carona: 'lima', emprestimo: 'roxo', racha: 'pessego', vaquinha: 'pessego', viagem: 'roxo', mensalidade: 'lima', venda: 'pessego', cartela: 'lima' };
function tipoDe(c) { return categoriaDe(c); }
const NOME_STATUS = { pendente: 'Pendente', avisou_pago: 'Avisou que pagou', pago: 'Pago' };

// ---------- estrutura ----------
function casca(conteudo, { nav = true, ativo = '', voltar = '' } = {}) {
  const topo = voltar
    ? `<a class="btn texto" href="#${voltar}" aria-label="Voltar">${ICONE.voltar} Voltar</a>`
    : `<a class="marca" href="#/"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a>`;
  const barra = nav ? `
    <nav class="nav" aria-label="Menu principal"><div class="dentro">
      <a href="#/" ${ativo === 'inicio' ? 'aria-current="page"' : ''}>${ICONE.inicio}Início</a>
      <a href="#/resumo" ${ativo === 'resumo' ? 'aria-current="page"' : ''}>${ICONE.resumo}Resumo</a>
      <a href="#/nova" class="mais" aria-label="Novo combinado ou cobrança">${ICONE.mais}Novo</a>
      <a href="#/calc" ${ativo === 'calc' ? 'aria-current="page"' : ''}>${ICONE.calc}Calcular</a>
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
  [/^\/esqueci$/, () => telaEsqueci()],
  [/^\/nova-senha$/, () => telaNovaSenha()],
  [/^\/ajuda$/, () => telaAjuda()],
  [/^\/perfil$/, () => telaPerfil()],
  [/^\/nova$/, () => telaNova()],
  [/^\/nova\/(carona|emprestimo|racha)$/, (t) => telaFormulario(t)],
  [/^\/combinar\/(carona|vaquinha|viagem|mensalidade)$/, (m) => telaFormCombinado(m)],
  [/^\/k\/([0-9a-f-]{36})$/, (id) => telaCombinado(id)],
  [/^\/vender$/, () => telaFormVenda()],
  [/^\/cartela\/nova$/, () => telaFormCartela()],
  [/^\/cartela\/([0-9a-f-]{36})$/, (id) => telaCartela(id)],
  [/^\/c\/([0-9a-f-]{36})$/, (id) => telaCobranca(id)],
  [/^\/conta$/, () => telaConta()],
  [/^\/resumo$/, () => telaResumo()],
  [/^\/calc$/, () => telaCalculadoras()],
  [/^\/calc\/([a-z]+)$/, (id) => telaCalculadora(id)],
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
    const publica = /^\/(entrar|cadastro|esqueci)$/.test(caminho);
    if (!estado.sessao) {
      if (!publica) { location.hash = '/entrar'; return; }
    } else {
      if (publica) { location.hash = '/'; return; }
      if (!estado.perfilCarregado) await carregarPerfil();
      if ((!estado.perfil || !estado.perfil.chave_pix) && !['/perfil', '/nova-senha', '/ajuda'].includes(caminho)) { location.hash = '/perfil'; return; }
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
      <a href="#/esqueci" class="pequeno" style="align-self: center">Esqueci minha senha</a>
    </form>
    <p class="muted" style="text-align: center">Ainda não tem conta? <a href="#/cadastro">Criar conta grátis</a></p>
    <p class="muted pequeno" style="text-align: center"><a href="/termos/">Termos de uso</a> · <a href="/privacidade/">Privacidade</a></p>`, { nav: false }));
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
      <label class="check" style="align-items: flex-start"><input type="checkbox" id="aceite" style="margin-top: 2px"> <span>Li e aceito os <a href="/termos/" target="_blank" rel="noopener">Termos de uso</a> e a <a href="/privacidade/" target="_blank" rel="noopener">Política de privacidade</a>.</span></label>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">Criar conta</button>
    </form>
    <p class="muted" style="text-align: center">Já tem conta? <a href="#/entrar">Entrar</a></p>`, { nav: false }));
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = $('#nome').value.trim();
    const email = $('#email').value.trim();
    const senha = $('#senha').value;
    if (!nome) { $('#msg').textContent = 'Diga seu nome.'; return; }
    if (senha.length < 6) { $('#msg').textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if (!$('#aceite').checked) { $('#msg').textContent = 'Para criar a conta, aceite os Termos de uso e a Política de privacidade.'; return; }
    const btn = $('#f button[type=submit]');
    btn.disabled = true; $('#msg').textContent = '';
    const { data, error } = await sb.auth.signUp({
      email, password: senha,
      options: { data: { nome, aceite_termos: new Date().toISOString(), versao_termos: '2026-11' }, emailRedirectTo: `${location.origin}/app/` }
    });
    btn.disabled = false;
    if (error) { $('#msg').textContent = traduzErro(error); return; }
    registrar('conta_criada');
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
    registrar(primeiraVez ? 'perfil_criado' : 'perfil_editado');
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
function diasAte(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const [ha, hm, hd] = hojeISO().split('-').map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(ha, hm - 1, hd)) / 86400000);
}
// Véspera do vencimento: avisar com antecedência (uma vez)
function avisoDevido(p, c) {
  if (p.status !== 'pendente' || !p.enviado_em || !c.vencimento || p.ultimo_lembrete_em) return false;
  const faltam = diasAte(c.vencimento);
  return faltam >= 0 && faltam <= 1 && p.enviado_em.slice(0, 10) < hojeISO();
}
function restante(p) { return round2(Math.max(0, Number(p.valor) - Number(p.valor_pago || 0))); }

async function telaPainel() {
  render(casca('<p class="carregando">Carregando suas cobranças…</p>', { ativo: 'inicio' }));
  await sb.rpc('gerar_cobrancas_v2');
  let resCartelas = null;
  const [resC, resK] = await Promise.all([
    sb.from('cobrancas').select('*, participantes(*)').neq('status', 'cancelada').order('criado_em', { ascending: false }),
    sb.from('combinados').select('*, combinado_membros(*)').neq('status', 'encerrado').order('criado_em', { ascending: false }),
    sb.from('cartelas').select('id, titulo, quantidade, status, cartela_itens(status, valor)').order('criado_em', { ascending: false })
  ]).then((r) => { resCartelas = r[2]; return r.slice(0, 2); });
  if (resC.error) throw resC.error;
  if (resK.error) throw resK.error;
  const cartelas = (resCartelas && resCartelas.data) || [];
  const cobrancas = resC.data || [];
  const combinados = resK.data || [];
  let aReceber = 0; let recebido = 0;
  const tarefas = [];
  cartelas.forEach((ct) => {
    const avis = (ct.cartela_itens || []).filter((i) => i.status === 'avisou_pago').length;
    if (avis) tarefas.push({ href: `#/cartela/${ct.id}`, titulo: ct.titulo, txt: `${avis} ${avis === 1 ? 'item com aviso' : 'itens com aviso'} de "já paguei" na cartela. Confira e confirme.`, tag: 'Confirmar' });
  });
  combinados.filter((k) => k.status === 'ativo').forEach((k) => {
    (k.combinado_membros || []).filter((m) => m.ativo && !m.convite_enviado_em).forEach((m) => {
      tarefas.push({ href: `#/k/${k.id}`, titulo: k.titulo, txt: categoriaDe(k) === 'venda' ? `Mandar o carnê para ${esc(primeiroNome(m.nome))} confirmar a compra` : `Mandar o combinado para ${esc(primeiroNome(m.nome))} confirmar`, tag: 'Convidar' });
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
      else if (avisoDevido(p, c)) tarefas.push({ ...base, txt: `Avisar ${esc(primeiroNome(p.nome))} que ${brl(restante(p))} vence ${diasAte(c.vencimento) === 0 ? 'hoje' : 'amanhã'}`, tag: 'Avisar' });
      else if (lembreteDevido(p, c)) tarefas.push({ ...base, txt: `Lembrar ${esc(primeiroNome(p.nome))} de ${brl(restante(p))}${c.vencimento && diasAte(c.vencimento) < 0 ? ' (atrasado)' : ''}`, tag: 'Lembrar' });
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
      <span class="icone ${COR_ICONE[categoriaDe(k)]}">${ICONE[categoriaDe(k)]}</span>
      <span class="grow"><span class="titulo-item">${esc(k.titulo)}${categoriaDe(k) === 'venda' && ms[0] ? ` · ${esc(primeiroNome(ms[0].nome))}` : ''}</span>
        <span class="muted pequeno" style="display:block">${esc(textoRegra(k))}</span>
        <span class="muted pequeno" style="display:block">${k.vagas ? `${ms.length} de ${k.vagas} vagas` : categoriaDe(k) === 'venda' ? (toparam ? 'compra confirmada' : 'aguardando a cliente confirmar') : `${toparam} de ${ms.length} confirmaram`}${k.entrada_aberta ? ' · lista aberta' : ''}${k.status === 'pausado' ? ' · pausado' : ''}</span></span></a></li>`;
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
    ${cartelas.length ? `<section class="pilha-p" aria-labelledby="t-cart"><h2 id="t-cart">Cartelas</h2><ul class="lista">${cartelas.map((ct) => {
      const its = ct.cartela_itens || [];
      const rec = its.filter((i) => i.status === 'pago').reduce((s2, i) => s2 + Number(i.valor), 0);
      const avis = its.filter((i) => i.status === 'avisou_pago').length;
      return `<li><a class="item" href="#/cartela/${ct.id}"><span class="icone lima">${ICONE.cartela}</span><span class="grow"><span class="titulo-item">${esc(ct.titulo)}</span><span class="muted pequeno" style="display:block">${its.length} de ${ct.quantidade} escolhidos · ${brl(rec)} recebidos${ct.status === 'fechada' ? ' · fechada' : ''}</span></span>${avis ? `<span class="tag avisou_pago">${avis} avisaram</span>` : ''}</a></li>`;
    }).join('')}</ul></section>` : ''}
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
      <h2>Para quem vende</h2>
      <p class="muted">Troque o caderno pelo app: ele cobra na data e mostra quem pagou.</p>
    </div>
    ${opcao('/vender', 'venda', 'Venda parcelada (carnê)', 'Perfume, roupa, cosméticos: o cliente paga em parcelas e o app cobra cada mês.')}
    ${opcao('/cartela/nova', 'cartela', 'Cartela de números', 'A grade do papel no celular: cada um escolhe o seu número e você vê quem pagou.')}
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
          <div class="grade-2">
            <div class="campo"><label for="pedagio">Pedágio por dia, ida e volta (R$)</label><input id="pedagio" inputmode="decimal" value="0"></div>
            <div class="campo"><label for="estac">Estacionamento por dia (R$)</label><input id="estac" inputmode="decimal" value="0"></div>
          </div>
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
      <div class="card pilha-p">
        <label class="check"><input type="checkbox" id="aberta" ${modelo !== 'viagem' ? 'checked' : ''}> ${modelo === 'carona' ? 'Oferecer vagas por link (cada um garante a sua)' : 'Lista aberta por link (cada um coloca o nome)'}</label>
        <div id="bloco-aberta" class="pilha">
          <div class="campo"><label for="vagas">${modelo === 'carona' ? 'Vagas no carro (sem contar você)' : 'Limite de pessoas'}</label><input id="vagas" inputmode="numeric" value="${modelo === 'carona' ? 4 : 10}">${estado.perfil.plano === 'gratis' ? '<span class="ajuda">No plano grátis, até 10 pessoas por lista.</span>' : ''}</div>
          ${modelo === 'carona' ? '<label class="check"><input type="checkbox" id="dividir" checked> Dividir o custo do carro entre quem entrar (o preço cai a cada pessoa)</label><span class="ajuda" id="dividir-ajuda"></span>' : ''}
          ${modelo === 'vaquinha' ? '<span class="ajuda" id="vaq-ajuda"></span>' : ''}
        </div>
      </div>
      <div class="card pilha">
        <fieldset class="pilha-p" style="border: 0; padding: 0; margin: 0"><legend style="font-weight: 600; margin-bottom: 6px" id="leg-pessoas">Quem participa</legend>
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
  const pre = lerPreenchimento();
  if (pre && pre.modelo === modelo) {
    if (pre.titulo) $('#titulo').value = pre.titulo;
    const rf = pre.frequencia && app.querySelector(`input[name=freq][value=${pre.frequencia}]`);
    if (rf) rf.checked = true;
    const campoValor = $('#valor');
    if (campoValor && pre.valor) { campoValor.value = Number(pre.valor).toFixed(2).replace('.', ','); f.valorEditado = true; }
    if (pre.calc) f.calcExterno = pre.calc;
  }
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
      else if (f.calcExterno) k.detalhes = f.calcExterno;
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
    const aberta = $('#aberta').checked;
    k.entrada_aberta = aberta;
    k.valor_modo = 'fixo'; k.custo_base = null; k.incluir_organizador = true; k.vagas = null;
    if (aberta) {
      let vagas = Math.round(parseValor($('#vagas').value));
      if (!(vagas >= 1)) vagas = modelo === 'carona' ? 4 : 10;
      k.vagas = Math.min(vagas, estado.perfil.plano === 'gratis' ? 10 : 60);
      if (modelo === 'carona' && $('#dividir') && $('#dividir').checked) {
        const base = (f.calc && f.calc.custo_total) || (f.calcExterno && f.calcExterno.custo_total);
        if (base) {
          k.valor_modo = 'dividir'; k.custo_base = round2(base);
          k.incluir_organizador = $('#incluir') ? $('#incluir').checked : true;
          k.valor_por_pessoa = valorDividido(k, Math.max(1, pessoas.length));
        }
      }
      if (modelo === 'vaquinha' && app.querySelector('input[name=modo]:checked').value === 'meta') {
        const meta = parseValor($('#meta').value);
        if (meta > 0) {
          k.valor_modo = 'dividir'; k.custo_base = round2(meta); k.incluir_organizador = $('#incluir').checked;
          k.valor_por_pessoa = valorDividido(k, Math.max(1, pessoas.length));
        }
      }
    }
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
    const pedagio = round2(Math.max(0, parseValor($('#pedagio').value || '0') || 0) * dias);
    const estacionamento = round2(Math.max(0, parseValor($('#estac').value || '0') || 0) * dias);
    const total = round2(combustivel + desgaste + pedagio + estacionamento);
    const div = Math.max(pessoasValidas().length, 1) + ($('#incluir').checked ? 1 : 0);
    const por = round2(total / div);
    f.calc = { km_dia: km, dias, consumo, preco_litro: preco, desgaste_km: desg, km_total: round2(kmTotal), combustivel, desgaste, pedagio, estacionamento, custo_total: total, pessoas_divisao: div, motorista_incluido: $('#incluir').checked, periodo };
    const extras = [pedagio ? `pedágio ${brl(pedagio)}` : '', estacionamento ? `estacionamento ${brl(estacionamento)}` : ''].filter(Boolean).join(' + ');
    $('#calc-res').textContent = `Custo por ${periodo}: ${brl(total)} (combustível ${brl(combustivel)} + manutenção ${brl(desgaste)}${extras ? ' + ' + extras : ''}), dividido por ${div}: ${brl(por)} por pessoa.`;
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
    const aberta = $('#aberta').checked;
    $('#bloco-aberta').hidden = !aberta;
    $('#leg-pessoas').textContent = aberta ? 'Já quer incluir alguém? (opcional)' : 'Quem participa';
    const { k, pessoas } = montar();
    if ($('#dividir-ajuda')) $('#dividir-ajuda').textContent = k.valor_modo === 'dividir' ? '' : 'Para dividir, preencha "Calcular pelo custo do carro" acima. Sem isso, vale o valor fixo por pessoa.';
    if ($('#vaq-ajuda')) $('#vaq-ajuda').textContent = k.valor_modo === 'dividir' ? 'O valor total é dividido entre quem entrar. Você cobra quando fechar a lista.' : 'Quem entrar já recebe o Pix do valor fixo.';
    const ok = k.valor_por_pessoa > 0 && (k.regra === 'unico' ? !!k.prazo : !!k.inicio) && (modelo !== 'viagem' || k.parcelas >= 1);
    if (!ok) { $('#resumo').innerHTML = '<span style="color:#C9C5D6">Preencha os valores para ver o resumo do combinado.</span>'; return; }
    let linhas;
    if (k.valor_modo === 'dividir') {
      linhas = [['Custo a dividir', brl(k.custo_base)], ['Por pessoa com 1 na lista', brl(valorDividido(k, 1))]];
      if (k.vagas > 1) linhas.push([`Por pessoa com ${k.vagas} na lista`, brl(valorDividido(k, k.vagas))]);
      linhas.push(['Quanto mais gente', 'mais barato']);
    } else {
      const n = k.entrada_aberta ? (k.vagas || pessoas.length) : pessoas.length;
      linhas = [['Regra', textoRegra(k)], [k.entrada_aberta ? 'Com a lista cheia' : 'Participantes', `${n} pessoa${n === 1 ? '' : 's'}`]];
      if (k.regra === 'recorrente' && !k.parcelas) linhas.push([k.frequencia === 'semanal' ? 'Você recebe por semana' : 'Você recebe por mês', brl(k.valor_por_pessoa * n)]);
      else linhas.push(['Total a receber', brl(k.valor_por_pessoa * n * (k.parcelas || 1))]);
    }
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
    if (!pessoas.length && !k.entrada_aberta) { msg.textContent = 'Adicione pelo menos uma pessoa, ou abra a lista por link.'; return; }
    if (modelo === 'viagem' && !(k.parcelas >= 1 && k.parcelas <= 60)) { msg.textContent = 'Informe de 1 a 60 parcelas.'; return; }
    if (!(k.valor_por_pessoa > 0)) { msg.textContent = 'Informe o valor.'; return; }
    if (k.regra === 'unico' ? !k.prazo : !k.inicio) { msg.textContent = 'Escolha a data.'; return; }
    k.titulo = titulo;
    const btn = $('#f button[type=submit]');
    btn.disabled = true; btn.textContent = 'Criando…';
    const { data: novo, error } = await sb.from('combinados').insert(k).select().single();
    if (error) { btn.disabled = false; btn.textContent = 'Criar combinado'; msg.textContent = traduzErro(error); return; }
    if (pessoas.length) {
      const { error: e2 } = await sb.from('combinado_membros').insert(pessoas.map((p) => ({ ...p, combinado_id: novo.id })));
      if (e2) {
        await sb.from('combinados').delete().eq('id', novo.id);
        btn.disabled = false; btn.textContent = 'Criar combinado'; msg.textContent = traduzErro(e2); return;
      }
    }
    if (novo.valor_modo === 'dividir') await sb.rpc('recalcular_valores', { p_combinado: novo.id });
    await sb.rpc('gerar_cobrancas_v2');
    registrar('combinado_criado', { modelo, aberta: !!novo.entrada_aberta, dividir: novo.valor_modo === 'dividir' });
    toast(novo.entrada_aberta ? 'Lista aberta! Agora mande o link no grupo.' : 'Combinado criado! Agora mande para cada um topar.');
    go(`/k/${novo.id}`);
  });
}

async function telaCombinado(id) {
  render(casca('<p class="carregando">Carregando…</p>', { voltar: '/' }));
  const carregar = async () => {
    await sb.rpc('gerar_cobrancas_v2');
    const [rk, rc] = await Promise.all([
      sb.from('combinados').select('*, combinado_membros(*)').eq('id', id).maybeSingle(),
      sb.from('cobrancas').select('id, titulo, ciclo, vencimento, status, valor_total, participantes(status)').eq('combinado_id', id).order('ciclo', { ascending: false })
    ]);
    if (rk.error) throw rk.error;
    if (rk.data) rk.data.combinado_membros.sort((a, b) => a.criado_em.localeCompare(b.criado_em));
    return { k: rk.data, ciclos: rc.data || [] };
  };
  const inicial = await carregar();
  const k = inicial.k;
  if (!k) { render(casca('<div class="card pilha"><h2>Combinado não encontrado</h2><a class="btn" href="#/">Voltar ao início</a></div>', { voltar: '/' })); return; }
  let ciclos = inicial.ciclos;
  const recarregar = async () => {
    const r = await carregar();
    if (!r.k) { go('/'); return; }
    Object.assign(k, r.k);
    ciclos = r.ciclos;
    desenhar();
  };
  const linkLista = () => `${location.origin}/g/?t=${k.entrada_token}`;
  const abertos = new Set();
  const linkTopo = (m) => `${location.origin}/topo/?t=${m.token}`;
  const conviteDe = (m) => gerarConvite({ tom: k.tom, nome: m.nome, titulo: k.titulo, regra: textoRegra(k, m.valor), link: linkTopo(m), plano: estado.perfil.plano, categoria: categoriaDe(k) });

  const proxima = () => {
    if (k.regra === 'unico' || k.status !== 'ativo') return null;
    const n = (ciclos.length ? Math.max(...ciclos.map((c) => c.ciclo || 0)) : 0) + 1;
    if (k.parcelas && n > k.parcelas) return null;
    return vencimentoCiclo(k.inicio, k.frequencia, n);
  };

  const listaHTML = (ms) => {
    if (k.status === 'encerrado') return '';
    const temLista = k.entrada_aberta || k.vagas || k.valor_modo === 'dividir';
    if (!temLista) return '<button type="button" class="btn sec peq" data-acao="abrirlista" style="align-self: flex-start">Abrir lista por link</button>';
    const div = ms.length + (k.incluir_organizador ? 1 : 0);
    const pct = k.vagas ? Math.min(100, Math.round((ms.length / k.vagas) * 100)) : 0;
    return `<div class="card destaque pilha-p">
      <div class="linha-flex entre"><h2>${k.modelo === 'carona' ? 'Vagas' : 'Lista'}</h2><span class="tag ${k.entrada_aberta ? 'pago' : 'neutra'}">${k.entrada_aberta ? 'Aberta' : 'Fechada'}</span></div>
      <p><strong>${k.vagas ? `${ms.length} de ${k.vagas} preenchidas` : `${ms.length} na lista`}</strong></p>
      ${k.vagas ? `<div class="ocupacao" aria-hidden="true"><span style="width: ${pct}%"></span></div>` : ''}
      ${k.valor_modo === 'dividir' ? `<p class="muted pequeno">Custo de ${brl(k.custo_base)} dividido por ${div}: ${brl(k.valor_por_pessoa)} cada.${k.vagas && k.vagas > ms.length ? ` Com todas as vagas: ${brl(valorDividido(k, k.vagas))}.` : ''}</p>` : ''}
      ${k.entrada_aberta ? `<div class="acoes"><button type="button" class="btn peq" data-acao="divulgar">Mandar no grupo do WhatsApp</button><button type="button" class="btn sec peq" data-acao="copiarlista">Copiar link</button></div>` : ''}
      <div class="acoes">
        ${k.regra === 'unico' && k.valor_modo === 'dividir' && k.entrada_aberta ? '<button type="button" class="btn lima peq" data-acao="fechar-cobrar">Fechar lista e cobrar</button>' : ''}
        ${k.entrada_aberta ? '<button type="button" class="btn sec peq" data-acao="fecharlista">Fechar lista</button>' : '<button type="button" class="btn sec peq" data-acao="abrirlista">Reabrir lista</button>'}
      </div>
    </div>`;
  };

  const desenhar = () => {
    const ms = k.combinado_membros.filter((m) => m.ativo);
    const toparam = ms.filter((m) => m.aceito_em).length;
    const prox = proxima();
    const cartao = (m) => {
      const aberto = abertos.has(m.id);
      const situacao = m.aceito_em ? `<span class="tag pago">Confirmou em ${new Date(m.aceito_em).toLocaleDateString('pt-BR')}</span>`
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
        <div class="linha-flex"><span class="icone ${COR_ICONE[categoriaDe(k)]}">${ICONE[categoriaDe(k)]}</span><span class="tag neutra">${MODELOS[categoriaDe(k)].nome}</span>${k.status !== 'ativo' ? `<span class="tag pendente">${k.status === 'pausado' ? 'Pausado' : 'Encerrado'}</span>` : ''}</div>
        <h1>${esc(k.titulo)}</h1>
        <p class="muted">${esc(textoRegra(k))}${k.descricao ? ` · ${esc(k.descricao)}` : ''}</p>
      </div>
      <div class="resumo">
        <div class="card escuro">${categoriaDe(k) === 'venda'
          ? `<p class="muted pequeno">Compra confirmada pela cliente</p><p class="numero" style="color: var(--lima)">${toparam ? 'Sim' : 'Aguardando'}</p>`
          : `<p class="muted pequeno">Confirmaram o combinado</p><p class="numero" style="color: var(--lima)">${toparam} de ${ms.length}</p>`}</div>
        <div class="card"><p class="muted pequeno">${k.regra === 'unico' ? 'Prazo' : 'Próxima cobrança'}</p><p class="numero">${k.regra === 'unico' ? dataBR(k.prazo) : prox ? dataBR(prox) : '—'}</p></div>
      </div>
      ${listaHTML(ms)}
      <p class="muted pequeno">${k.regra === 'unico' && k.valor_modo === 'dividir' && k.entrada_aberta ? 'Quando você fechar a lista, o app calcula o valor final e cria a cobrança de cada um.' : 'O app cria a cobrança de cada data sozinho, 2 dias antes do vencimento, e te avisa em "Para fazer hoje". Quem não topou também recebe a cobrança.'}</p>
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
      if (k.valor_modo === 'dividir') { await sb.rpc('recalcular_valores', { p_combinado: k.id }); await recarregar(); } else desenhar();
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
      registrar('convite_enviado');
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
      m.ativo = false;
      if (k.valor_modo === 'dividir') { await sb.rpc('recalcular_valores', { p_combinado: k.id }); await recarregar(); } else desenhar();
    } else if (acao === 'divulgar') {
      const texto = gerarDivulgacao({ modelo: k.modelo, titulo: k.titulo, regra: textoRegra(k), vagas: k.vagas, dividir: k.valor_modo === 'dividir', link: linkLista(), plano: estado.perfil.plano });
      window.open(linkWhatsApp('', texto), '_blank', 'noopener');
      registrar('lista_divulgada', { modelo: k.modelo });
    } else if (acao === 'copiarlista') {
      const ok = await copiar(linkLista());
      toast(ok ? 'Link da lista copiado.' : 'Não consegui copiar.', ok ? 'ok' : 'erro');
    } else if (acao === 'abrirlista' || acao === 'fecharlista') {
      const { error: e5 } = await sb.from('combinados').update({ entrada_aberta: acao === 'abrirlista' }).eq('id', k.id);
      if (e5) { toast(traduzErro(e5), 'erro'); return; }
      toast(acao === 'abrirlista' ? 'Lista aberta. Mande o link no grupo!' : 'Lista fechada. Ninguém novo entra.');
      await recarregar();
    } else if (acao === 'fechar-cobrar') {
      const ativos = k.combinado_membros.filter((x) => x.ativo).length;
      if (!ativos) { toast('Ninguém entrou na lista ainda.', 'erro'); return; }
      if (!window.confirm(`Fechar a lista com ${ativos} pessoa${ativos === 1 ? '' : 's'}? Cada um vai pagar ${brl(k.valor_por_pessoa)}.`)) return;
      const { error: e6 } = await sb.from('combinados').update({ entrada_aberta: false }).eq('id', k.id);
      if (e6) { toast(traduzErro(e6), 'erro'); return; }
      await recarregar();
      toast('Lista fechada! Agora envie a cobrança para cada um.');
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
      <div class="grade-2">
        <div class="campo"><label for="pedagio">Pedágio por dia, ida e volta (R$)</label><input id="pedagio" inputmode="decimal" value="0"></div>
        <div class="campo"><label for="estac">Estacionamento por dia (R$)</label><input id="estac" inputmode="decimal" value="0"></div>
      </div>
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
      const pedagio = round2(Math.max(0, parseValor($('#pedagio').value || '0') || 0) * dias);
      const estacionamento = round2(Math.max(0, parseValor($('#estac').value || '0') || 0) * dias);
      const total = round2(combustivel + desgaste + pedagio + estacionamento);
      const divisao = nPag + (incluir ? 1 : 0);
      const linhas = [['Km rodados', `${round2(kmTotal).toLocaleString('pt-BR')} km`], ['Combustível', brl(combustivel)], ['Manutenção e pneus', brl(desgaste)]];
      if (pedagio) linhas.push(['Pedágio', brl(pedagio)]);
      if (estacionamento) linhas.push(['Estacionamento', brl(estacionamento)]);
      linhas.push(['Custo total', brl(total)], ['Dividido por', `${divisao} pessoa${divisao === 1 ? '' : 's'}`]);
      return { porPessoa: round2(total / divisao), detalhes: { km_dia: km, dias, consumo, preco_litro: preco, desgaste_km: desg, km_total: round2(kmTotal), combustivel, desgaste, pedagio, estacionamento, custo_total: total, pessoas_divisao: divisao, motorista_incluido: incluir }, linhas };
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
    registrar('cobranca_criada', { tipo });
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
    tipo: tipoDe(c), tom: c.tom, momento: p.enviado_em ? (avisoDevido(p, c) ? 'aviso' : 'lembrete') : (c.combinado_id ? 'combinado' : 'inicial'),
    nome: p.nome, valor: brl(restante(p)), titulo: c.titulo, vencimento: dataBR(c.vencimento),
    link: linkPublico(p.token), plano: estado.perfil.plano
  });
  const cartaoPessoa = (p) => {
    const aberto = abertoPara.has(p.id);
    let acoes = '';
    if (p.status === 'pendente') {
      acoes = `<button type="button" class="btn peq" data-acao="previa" data-id="${p.id}">${!p.enviado_em ? 'Enviar no WhatsApp' : avisoDevido(p, c) ? 'Avisar que está vencendo' : 'Lembrar no WhatsApp'}</button>
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
      registrar('cobranca_enviada', { via: 'whatsapp' });
      toast('Pronto! Agora é só apertar enviar no WhatsApp.');
    } else if (acao === 'copiarmsg') {
      const ok = await copiar($(`#m-${p.id}`).value);
      if (ok) { await registrarEnvio(p); toast('Mensagem copiada. Cole no WhatsApp.'); } else toast('Não consegui copiar. Selecione o texto e copie.', 'erro');
    } else if (acao === 'link') {
      const ok = await copiar(linkPublico(p.token));
      toast(ok ? 'Link de pagamento copiado.' : 'Não consegui copiar o link.', ok ? 'ok' : 'erro');
    } else if (acao === 'pago') {
      if (await atualizarP(p, { status: 'pago', valor_pago: p.valor, pago_em: new Date().toISOString() })) { registrar('pagamento_confirmado', { tipo: tipoDe(c) }); desenhar(); }
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

// ---------- venda parcelada (carnê) ----------
function telaFormVenda() {
  const f = { tom: 'leve' };
  render(casca(`
    <div class="pilha-p"><h1>Venda parcelada</h1><p class="muted">Registre a venda uma vez. O app cobra cada parcela na data e você vê quem pagou.</p></div>
    <form id="f" class="pilha" novalidate>
      <div class="card pilha">
        <div class="grade-2">
          <div class="campo"><label for="cliente">Cliente</label><input id="cliente" maxlength="60" placeholder="Nome"></div>
          <div class="campo"><label for="tel">WhatsApp</label><input id="tel" type="tel" inputmode="tel" maxlength="20" placeholder="(11) 98765-4321"></div>
        </div>
        <div class="campo"><label for="produto">O que foi vendido</label><input id="produto" maxlength="50" placeholder="Ex.: Perfume Malbec 100 ml"></div>
        <div class="grade-2">
          <div class="campo"><label for="total">Valor total (R$)</label><input id="total" inputmode="decimal" placeholder="Ex.: 300,00"></div>
          <div class="campo"><label for="parcelas">Parcelas</label><input id="parcelas" inputmode="numeric" value="3"></div>
        </div>
        <div class="campo"><label for="inicio">Primeira parcela em</label><input id="inicio" type="date" min="${hojeISO()}" value="${proximoDia(30)}"><span class="ajuda">As outras vencem no mesmo dia dos meses seguintes.</span></div>
        <div class="campo"><label for="descricao">Observação (opcional)</label><input id="descricao" maxlength="200" placeholder="Ex.: entregue em 20/11"></div>
      </div>
      <div id="resumo" class="calc" aria-live="polite"></div>
      <div class="card pilha-p"><span style="font-weight: 600">Tom das mensagens</span>${tonsHTML(f.tom)}</div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco lima" type="submit">Registrar venda</button>
    </form>`, { voltar: '/nova' }));
  ligarTons('tom', (t) => { f.tom = t; });
  const ler = () => {
    const total = parseValor($('#total').value);
    const parcelas = Math.round(parseValor($('#parcelas').value));
    return { total, parcelas, valor: total > 0 && parcelas > 0 ? round2(total / parcelas) : 0 };
  };
  const atualizar = () => {
    const r = ler();
    if (!(r.valor > 0)) { $('#resumo').innerHTML = '<span style="color:#C9C5D6">Preencha o valor e as parcelas para ver o carnê.</span>'; return; }
    const datas = Array.from({ length: Math.min(r.parcelas, 6) }, (_, i) => dataBR(vencimentoCiclo($('#inicio').value || hojeISO(), 'mensal', i + 1)));
    $('#resumo').innerHTML = `<div class="lin"><span>Parcelas</span><span>${r.parcelas}x de ${brl(r.valor)}</span></div>
      <div class="lin"><span>Vencimentos</span><span style="text-align:right">${datas.join(', ')}${r.parcelas > 6 ? '…' : ''}</span></div>
      <div class="lin total"><span>Total</span><span>${brl(r.valor * r.parcelas)}</span></div>`;
  };
  $('#f').addEventListener('input', atualizar);
  atualizar();
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#msg'); msg.textContent = '';
    const cliente = $('#cliente').value.trim();
    const produto = $('#produto').value.trim();
    const r = ler();
    if (!cliente) { msg.textContent = 'Diga o nome da cliente.'; return; }
    if (!produto) { msg.textContent = 'Diga o que foi vendido.'; return; }
    if (!(r.total > 0)) { msg.textContent = 'Informe o valor total.'; return; }
    if (!(r.parcelas >= 1 && r.parcelas <= 60)) { msg.textContent = 'Informe de 1 a 60 parcelas.'; return; }
    if (!$('#inicio').value) { msg.textContent = 'Escolha a data da primeira parcela.'; return; }
    const btn = $('#f button[type=submit]'); btn.disabled = true; btn.textContent = 'Registrando…';
    const { data: novo, error } = await sb.from('combinados').insert({
      modelo: 'viagem', titulo: produto, regra: 'recorrente', frequencia: 'mensal', parcelas: r.parcelas,
      valor_por_pessoa: r.valor, inicio: $('#inicio').value, tom: f.tom,
      descricao: $('#descricao').value.trim() || null,
      detalhes: { categoria: 'venda', produto, total: round2(r.total) }
    }).select().single();
    if (error) { btn.disabled = false; btn.textContent = 'Registrar venda'; msg.textContent = traduzErro(error); return; }
    const { error: e2 } = await sb.from('combinado_membros').insert({ combinado_id: novo.id, nome: cliente, telefone: soDigitos($('#tel').value) || null });
    if (e2) { await sb.from('combinados').delete().eq('id', novo.id); btn.disabled = false; btn.textContent = 'Registrar venda'; msg.textContent = traduzErro(e2); return; }
    await sb.rpc('gerar_cobrancas_v2');
    registrar('venda_criada', { parcelas: r.parcelas });
    toast('Venda registrada! Mande o carnê para a cliente confirmar.');
    go(`/k/${novo.id}`);
  });
}

// ---------- cartelas de números ou nomes ----------
function telaFormCartela() {
  const gratis = estado.perfil.plano === 'gratis';
  render(casca(`
    <div class="pilha-p"><h1>Nova cartela de números</h1><p class="muted">A grade do papel, no celular. Cada pessoa escolhe pelo link e paga com Pix, e você também pode lançar o que vendeu no papel.</p></div>
    <form id="f" class="pilha" novalidate>
      <div class="card pilha">
        <div class="campo"><label for="titulo">Nome da cartela</label><input id="titulo" maxlength="60" placeholder="Ex.: Chá de fraldas da Ana"></div>
        <div class="campo"><label for="descricao">Para que é (opcional)</label><input id="descricao" maxlength="200" placeholder="Ex.: ajudar com o enxoval"></div>
        <div class="campo" id="bloco-qtd"><label for="qtd">Quantos números</label><input id="qtd" inputmode="numeric" value="50"><span class="ajuda">${gratis ? 'De 2 a 100 no plano grátis.' : 'De 2 a 200.'}</span></div>
      </div>
      <div class="card pilha">
        <div class="campo"><span style="font-weight: 600; font-size: 0.92rem">Valor</span>
          <div class="pilha-p" role="radiogroup" aria-label="Como é o valor">
            <label class="check"><input type="radio" name="vmodo" value="fixo" checked> Valor fixo por número</label>
            <label class="check"><input type="radio" name="vmodo" value="numero"> O número escolhido é o valor (escolheu 37, paga R$ 37)</label>
          </div></div>
        <div class="campo"><label for="valor" id="rot-valor">Valor de cada um (R$)</label><input id="valor" inputmode="decimal" value="10,00"></div>
        <div class="grade-2">
          <div class="campo"><label for="prazo">Pagar até (opcional)</label><input id="prazo" type="date" min="${hojeISO()}"></div>
          <div class="campo"><label for="maxp">Máximo por pessoa</label><input id="maxp" inputmode="numeric" value="20"></div>
        </div>
      </div>
      <div id="resumo" class="calc" aria-live="polite"></div>
      <p class="aviso">${esc(AVISO_LEGAL)}</p>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco lima" type="submit">Criar cartela</button>
    </form>`, { voltar: '/nova' }));
  const ler = () => {
    const modo = 'numeros';
    const vmodo = app.querySelector('input[name=vmodo]:checked').value;
    const nomes = [];
    const quantidade = Math.round(parseValor($('#qtd').value));
    return { modo, vmodo, nomes, quantidade, valor: round2(parseValor($('#valor').value)), maxp: Math.round(parseValor($('#maxp').value)) };
  };
  const atualizar = () => {
    const r = ler();
    $('#rot-valor').textContent = r.vmodo === 'numero' ? 'Multiplicador (R$ por unidade do número)' : 'Valor de cada um (R$)';
    if (!(r.quantidade >= 2) || !(r.valor > 0)) { $('#resumo').innerHTML = '<span style="color:#C9C5D6">Preencha a quantidade e o valor.</span>'; return; }
    const cheio = r.vmodo === 'numero' ? r.valor * (r.quantidade * (r.quantidade + 1)) / 2 : r.valor * r.quantidade;
    $('#resumo').innerHTML = `<div class="lin"><span>${r.modo === 'nomes' ? 'Nomes' : 'Números'}</span><span>${r.quantidade}</span></div>
      <div class="lin"><span>Valor</span><span>${esc(textoValor({ ...r, valor_modo: r.vmodo }))}</span></div>
      <div class="lin total"><span>Se completar tudo</span><span>${brl(cheio)}</span></div>`;
  };
  $('#f').addEventListener('input', atualizar);
  $('#f').addEventListener('change', atualizar);
  atualizar();
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#msg'); msg.textContent = '';
    const r = ler();
    const titulo = $('#titulo').value.trim();
    const limite = gratis ? 100 : 200;
    if (!titulo) { msg.textContent = 'Dê um nome para a cartela.'; return; }
    if (!(r.quantidade >= 2 && r.quantidade <= limite)) { msg.textContent = `A cartela precisa ter de 2 a ${limite} ${r.modo === 'nomes' ? 'nomes' : 'números'}.`; return; }
    if (!(r.valor > 0)) { msg.textContent = 'Informe o valor.'; return; }
    const btn = $('#f button[type=submit]'); btn.disabled = true;
    const { data: nova, error } = await sb.from('cartelas').insert({
      titulo, descricao: $('#descricao').value.trim() || null, modo: r.modo, quantidade: r.quantidade,
      nomes: r.modo === 'nomes' ? r.nomes : [], valor_modo: r.vmodo, valor: r.valor,
      prazo: $('#prazo').value || null, max_por_pessoa: Math.min(Math.max(r.maxp || 20, 1), r.quantidade)
    }).select().single();
    btn.disabled = false;
    if (error) { msg.textContent = traduzErro(error); return; }
    registrar('cartela_criada', { modo: r.modo, quantidade: r.quantidade });
    toast('Cartela criada! Mande o link no grupo.');
    go(`/cartela/${nova.id}`);
  });
}

async function telaCartela(id) {
  render(casca('<p class="carregando">Carregando…</p>', { voltar: '/' }));
  const carregar = async () => {
    const [rc, ri] = await Promise.all([
      sb.from('cartelas').select('*').eq('id', id).maybeSingle(),
      sb.from('cartela_itens').select('*').eq('cartela_id', id).order('numero')
    ]);
    if (rc.error) throw rc.error;
    if (ri.error) throw ri.error;
    return { c: rc.data, itens: ri.data || [] };
  };
  let { c, itens } = await carregar();
  if (!c) { render(casca('<div class="card pilha"><h2>Cartela não encontrada</h2><a class="btn" href="#/">Voltar ao início</a></div>', { voltar: '/' })); return; }
  let sel = null;
  const recarregar = async () => { const r = await carregar(); c = r.c; itens = r.itens; desenhar(); };
  const linkCartela = () => `${location.origin}/n/?t=${c.entrada_token}`;
  const linkComprador = (tk) => `${location.origin}/n/?c=${tk}`;
  const porNumero = () => new Map(itens.map((i) => [i.numero, i]));
  const grupos = () => {
    const m = new Map();
    itens.forEach((i) => {
      const g = m.get(i.comprador_token) || { token: i.comprador_token, nome: i.nome, telefone: i.telefone, itens: [] };
      g.itens.push(i); m.set(i.comprador_token, g);
    });
    return Array.from(m.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const painelSel = () => {
    if (sel == null) return '';
    const it = porNumero().get(sel);
    const r = esc(rotulo(c, sel));
    if (!it) {
      return `<form id="lancar" class="card pilha-p" style="border: 2px solid var(--ink)" novalidate>
        <div class="linha-flex entre"><h3>${c.modo === 'nomes' ? '' : 'Número '}${r} · livre</h3><button type="button" class="btn texto peq" data-acao="fecharsel">Fechar</button></div>
        <p class="muted pequeno">Vendeu no papel? Lance aqui. Valor: ${brl(valorDe(c, sel))}.</p>
        <div class="grade-2">
          <div class="campo"><label class="sr" for="l-nome">Nome</label><input id="l-nome" maxlength="60" placeholder="Nome"></div>
          <div class="campo"><label class="sr" for="l-tel">WhatsApp</label><input id="l-tel" type="tel" inputmode="tel" maxlength="20" placeholder="WhatsApp (opcional)"></div>
        </div>
        <label class="check"><input type="checkbox" id="l-pago"> Já pagou</label>
        <button type="submit" class="btn peq" style="align-self: flex-start">Lançar</button>
      </form>`;
    }
    const st = { reservado: 'Escolhido, não pago', avisou_pago: 'Avisou que pagou', pago: 'Pago' }[it.status];
    return `<div class="card pilha-p" style="border: 2px solid var(--ink)">
      <div class="linha-flex entre"><h3>${c.modo === 'nomes' ? '' : 'Número '}${r}</h3><button type="button" class="btn texto peq" data-acao="fecharsel">Fechar</button></div>
      <p><strong>${esc(it.nome)}</strong>${it.telefone ? ` · ${esc(it.telefone)}` : ''}</p>
      <p class="muted pequeno">${brl(it.valor)} · <span class="tag ${it.status === 'reservado' ? 'pendente' : it.status}">${st}</span></p>
      <div class="acoes">
        ${it.status !== 'pago' ? `<button type="button" class="btn ${it.status === 'avisou_pago' ? 'lima' : ''} peq" data-acao="pago" data-n="${it.numero}">${it.status === 'avisou_pago' ? 'Confirmar que recebi' : 'Marcar como pago'}</button>` : `<button type="button" class="btn sec peq" data-acao="pendente" data-n="${it.numero}">Voltar para não pago</button>`}
        ${it.status !== 'pago' ? `<button type="button" class="btn sec peq" data-acao="cobrar" data-token="${it.comprador_token}">Cobrar no WhatsApp</button>` : ''}
        <button type="button" class="btn perigo peq" data-acao="liberar" data-n="${it.numero}">Liberar</button>
      </div>
    </div>`;
  };

  const desenhar = () => {
    const mapa = porNumero();
    const pagos = itens.filter((i) => i.status === 'pago');
    const avisaram = itens.filter((i) => i.status === 'avisou_pago').length;
    const recebido = pagos.reduce((s, i) => s + Number(i.valor), 0);
    const aReceber = itens.filter((i) => i.status !== 'pago').reduce((s, i) => s + Number(i.valor), 0);
    const aberta = c.status === 'aberta';
    const celulas = Array.from({ length: c.quantidade }, (_, k) => {
      const n = k + 1; const it = mapa.get(n);
      const cls = it ? it.status : 'livre';
      const titulo = it ? `${rotulo(c, n)}: ${it.nome}` : `${rotulo(c, n)}: livre`;
      return `<button type="button" class="num ${cls} ${sel === n ? 'selecionado' : ''}" data-n="${n}" aria-label="${esc(titulo)}" title="${esc(titulo)}">${esc(rotulo(c, n))}</button>`;
    }).join('');
    const gs = grupos();
    render(casca(`
      <div class="pilha-p">
        <div class="linha-flex"><span class="icone lima">${ICONE.cartela}</span><span class="tag neutra">Cartela</span><span class="tag ${aberta ? 'pago' : 'neutra'}">${aberta ? 'Aberta' : 'Fechada'}</span></div>
        <h1>${esc(c.titulo)}</h1>
        <p class="muted">${esc(textoValor(c))}${c.prazo ? ` · pagar até ${dataBR(c.prazo)}` : ''}${c.descricao ? ` · ${esc(c.descricao)}` : ''}</p>
      </div>
      <div class="resumo">
        <div class="card escuro"><p class="muted pequeno">Escolhidos</p><p class="numero" style="color: var(--lima)">${itens.length} de ${c.quantidade}</p></div>
        <div class="card"><p class="muted pequeno">Recebido</p><p class="numero">${brl(recebido)}</p><p class="muted pequeno">a receber ${brl(aReceber)}</p></div>
      </div>
      ${avisaram ? `<div class="aviso">${avisaram} ${avisaram === 1 ? 'item com aviso' : 'itens com aviso'} de "já paguei". Toque nos roxos para conferir e confirmar.</div>` : ''}
      ${aberta ? `<div class="acoes"><button type="button" class="btn peq" data-acao="divulgar">Mandar no grupo do WhatsApp</button><button type="button" class="btn sec peq" data-acao="copiar">Copiar link</button></div>` : ''}
      <div class="legenda" aria-hidden="true"><span><i></i>Livre</span><span><i style="background: var(--amarelo-claro); border-color:#F1D98A"></i>Não pago</span><span><i style="background: var(--roxo-claro); border-color:#B9AEFF"></i>Avisou</span><span><i style="background: var(--verde-claro); border-color:#A6E3C0"></i>Pago</span></div>
      <div class="grade-n ${c.modo === 'nomes' ? 'nomes-grade' : ''}" role="group" aria-label="Cartela">${celulas}</div>
      <div id="painel-sel">${painelSel()}</div>
      ${gs.length ? `<section class="pilha-p" aria-label="Por pessoa"><h2>Por pessoa</h2><ul class="lista">${gs.map((g) => {
        const total = g.itens.reduce((s, i) => s + Number(i.valor), 0);
        const falta = g.itens.filter((i) => i.status !== 'pago').reduce((s, i) => s + Number(i.valor), 0);
        return `<li class="item"><span class="grow"><span class="titulo-item">${esc(g.nome)}</span>
          <span class="muted pequeno" style="display:block">${g.itens.map((i) => esc(rotulo(c, i.numero))).join(', ')} · ${brl(total)}</span></span>
          ${falta ? `<span class="acoes" style="justify-content:flex-end"><button type="button" class="btn sec peq" data-acao="cobrar" data-token="${g.token}">Cobrar</button><button type="button" class="btn peq" data-acao="pagotudo" data-token="${g.token}">Pagou</button></span>` : '<span class="tag pago">Pago</span>'}</li>`;
      }).join('')}</ul></section>` : ''}
      <div class="acoes" style="margin-top: 8px">
        <button type="button" class="btn sec peq" data-acao="${aberta ? 'fechar' : 'abrir'}">${aberta ? 'Fechar cartela' : 'Reabrir cartela'}</button>
        <button type="button" class="btn perigo peq" data-acao="apagar">Apagar cartela</button>
      </div>
      <p class="muted pequeno">${esc(AVISO_LEGAL)}</p>`, { voltar: '/' }));
    const f = $('#lancar');
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = $('#l-nome').value.trim();
      if (nome.length < 2) { toast('Diga o nome.', 'erro'); return; }
      const tel = soDigitos($('#l-tel').value) || null;
      const pago = $('#l-pago').checked;
      const existente = tel ? itens.find((i) => i.telefone === tel) : itens.find((i) => i.nome.toLowerCase() === nome.toLowerCase());
      const novo = { cartela_id: c.id, numero: sel, nome, telefone: tel, valor: valorDe(c, sel), status: pago ? 'pago' : 'reservado', pago_em: pago ? new Date().toISOString() : null };
      if (existente) novo.comprador_token = existente.comprador_token;
      const { error: e1 } = await sb.from('cartela_itens').insert(novo);
      if (e1) { toast(/duplicate|unique/i.test(e1.message) ? 'Esse número acabou de ser escolhido.' : traduzErro(e1), 'erro'); await recarregar(); return; }
      toast('Lançado!'); sel = null; await recarregar();
    });
    const p = $('#painel-sel');
    if (p && sel != null) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  ouvinteTela = async (e) => {
    const cel = e.target.closest('.num[data-n]');
    if (cel) { sel = Number(cel.dataset.n); desenhar(); return; }
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    const n = Number(b.dataset.n);
    if (acao === 'fecharsel') { sel = null; desenhar(); }
    else if (acao === 'pago' || acao === 'pendente') {
      const mud = acao === 'pago' ? { status: 'pago', pago_em: new Date().toISOString() } : { status: 'reservado', pago_em: null, avisou_pago_em: null };
      const { error: e1 } = await sb.from('cartela_itens').update(mud).eq('cartela_id', c.id).eq('numero', n);
      if (e1) { toast(traduzErro(e1), 'erro'); return; }
      await recarregar();
    } else if (acao === 'pagotudo') {
      const { error: e2 } = await sb.from('cartela_itens').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('cartela_id', c.id).eq('comprador_token', b.dataset.token).neq('status', 'pago');
      if (e2) { toast(traduzErro(e2), 'erro'); return; }
      toast('Marcado como pago.'); await recarregar();
    } else if (acao === 'liberar') {
      if (!window.confirm(`Liberar ${rotulo(c, n)}? Ele volta a ficar livre para outra pessoa.`)) return;
      const { error: e3 } = await sb.from('cartela_itens').delete().eq('cartela_id', c.id).eq('numero', n);
      if (e3) { toast(traduzErro(e3), 'erro'); return; }
      sel = null; toast('Liberado.'); await recarregar();
    } else if (acao === 'cobrar') {
      const meus = itens.filter((i) => i.comprador_token === b.dataset.token);
      const pend = meus.filter((i) => i.status !== 'pago');
      const texto = mensagemCartela({ nome: meus[0].nome, titulo: c.titulo, itens: pend.map((i) => rotulo(c, i.numero)).join(', '), total: brl(pend.reduce((s, i) => s + Number(i.valor), 0)), link: linkComprador(b.dataset.token), plano: estado.perfil.plano });
      window.open(linkWhatsApp(meus[0].telefone, texto), '_blank', 'noopener');
    } else if (acao === 'divulgar') {
      window.open(linkWhatsApp('', divulgacaoCartela({ titulo: c.titulo, valor: textoValor(c), link: linkCartela(), plano: estado.perfil.plano })), '_blank', 'noopener');
    } else if (acao === 'copiar') {
      const ok = await copiar(linkCartela());
      toast(ok ? 'Link da cartela copiado.' : 'Não consegui copiar.', ok ? 'ok' : 'erro');
    } else if (acao === 'fechar' || acao === 'abrir') {
      const { error: e4 } = await sb.from('cartelas').update({ status: acao === 'fechar' ? 'fechada' : 'aberta' }).eq('id', c.id);
      if (e4) { toast(traduzErro(e4), 'erro'); return; }
      await recarregar();
    } else if (acao === 'apagar') {
      if (!window.confirm('Apagar esta cartela e tudo que foi lançado nela? Isso não pode ser desfeito.')) return;
      const { error: e5 } = await sb.from('cartelas').delete().eq('id', c.id);
      if (e5) { toast(traduzErro(e5), 'erro'); return; }
      toast('Cartela apagada.'); go('/');
    }
  };
  app.addEventListener('click', ouvinteTela);
  desenhar();
}

// ---------- calculadoras ----------
function telaCalculadoras() {
  const cores = ['lima', 'roxo', 'pessego'];
  render(casca(`
    <div class="pilha-p">
      <h1>Quanto custa de verdade?</h1>
      <p class="muted">Calcule o custo real antes de combinar. Os números certos tiram a vergonha de cobrar.</p>
    </div>
    ${CALCULADORAS.map((c, i) => `<a class="opcao" href="#/calc/${c.id}"><span class="icone ${cores[i % 3]}">${ICONE[c.icone] || ICONE.calc}</span><span><span class="display" style="font-size: 1.2rem; font-weight: 800; display:block">${esc(c.nome)}</span><span class="muted">${esc(c.resumo)}</span></span></a>`).join('')}
    <p class="muted pequeno">Também dá para usar sem conta, e mandar para quem precisa: <a href="/calculadoras/">deixacomigo · calculadoras</a></p>
  `, { ativo: 'calc' }));
}

function telaCalculadora(id) {
  const calc = acharCalculadora(id);
  if (!calc) { go('/calc'); return; }
  render(casca(`
    <div class="pilha-p"><h1>${esc(calc.nome)}</h1><p class="muted">${esc(calc.resumo)}</p></div>
    <div id="calc-area"></div>`, { voltar: '/calc', ativo: 'calc' }));
  registrar('calculadora_aberta', { calc: calc.id, logado: true });
  montarCalculadora($('#calc-area'), calc, (dados) => {
    registrar('calculadora_combinar', { calc: calc.id });
    guardarPreenchimento(dados);
    go(`/combinar/${dados.modelo}`);
  });
}

// ---------- resumo (dashboard) ----------
function somarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

async function telaResumo() {
  render(casca('<p class="carregando">Montando seu resumo…</p>', { ativo: 'resumo' }));
  await sb.rpc('gerar_cobrancas_v2');
  const [rc, rk, rn] = await Promise.all([
    sb.from('cobrancas').select('id, tipo, modelo, titulo, vencimento, status, combinado_id, ciclo, detalhes, participantes(id, nome, telefone, valor, valor_pago, status, pago_em)').neq('status', 'cancelada'),
    sb.from('combinados').select('id, modelo, titulo, regra, frequencia, inicio, prazo, parcelas, valor_por_pessoa, status, detalhes, combinado_membros(ativo, valor)').eq('status', 'ativo'),
    sb.from('cartela_itens').select('valor, status, nome, telefone, pago_em, cartelas(prazo)')
  ]);
  if (rc.error) throw rc.error;
  if (rk.error) throw rk.error;
  const cobrancas = rc.data || [];
  const combinados = rk.data || [];
  const hoje = hojeISO();
  const limite = somarDias(hoje, 30);
  const mesAtual = hoje.slice(0, 7);
  let aReceber = 0; let atrasado = 0; let recebidoMes = 0; let previsto = 0;
  const porTipo = {};
  const porPessoa = new Map();
  const agenda = [];

  cobrancas.forEach((c) => {
    const tipo = tipoDe(c);
    let restanteCobranca = 0;
    (c.participantes || []).forEach((p) => {
      if (p.status === 'pago') {
        if (p.pago_em && new Date(p.pago_em).toISOString().slice(0, 7) === mesAtual) recebidoMes += Number(p.valor);
        return;
      }
      if (c.status !== 'aberta') return;
      const r = restante(p);
      if (!r) return;
      restanteCobranca += r;
      aReceber += r;
      porTipo[tipo] = (porTipo[tipo] || 0) + r;
      const atr = c.vencimento && c.vencimento < hoje;
      if (atr) atrasado += r;
      const chave = soDigitos(p.telefone) || p.nome.trim().toLowerCase();
      const pessoa = porPessoa.get(chave) || { nome: p.nome, total: 0, atrasado: 0, itens: 0, tipos: new Set(), proximo: null };
      pessoa.total += r;
      if (atr) pessoa.atrasado += r;
      pessoa.itens += 1;
      pessoa.tipos.add(tipo);
      if (c.vencimento && c.vencimento >= hoje && (!pessoa.proximo || c.vencimento < pessoa.proximo)) pessoa.proximo = c.vencimento;
      porPessoa.set(chave, pessoa);
    });
    if (c.status === 'aberta' && restanteCobranca > 0 && c.vencimento && c.vencimento >= hoje && c.vencimento <= limite) {
      agenda.push({ data: c.vencimento, titulo: c.titulo, valor: restanteCobranca, href: `#/c/${c.id}`, futuro: false, tipo });
    }
  });

  ((rn && rn.data) || []).forEach((i) => {
    if (i.status === 'pago') {
      if (i.pago_em && new Date(i.pago_em).toISOString().slice(0, 7) === mesAtual) recebidoMes += Number(i.valor);
      return;
    }
    const v = Number(i.valor);
    aReceber += v;
    porTipo.cartela = (porTipo.cartela || 0) + v;
    const prazo = i.cartelas && i.cartelas.prazo;
    const atr = prazo && prazo < hoje;
    if (atr) atrasado += v;
    const chave = soDigitos(i.telefone) || i.nome.trim().toLowerCase();
    const pessoa = porPessoa.get(chave) || { nome: i.nome, total: 0, atrasado: 0, itens: 0, tipos: new Set(), proximo: null };
    pessoa.total += v; if (atr) pessoa.atrasado += v; pessoa.itens += 1; pessoa.tipos.add('cartela');
    porPessoa.set(chave, pessoa);
  });
  combinados.filter((k) => k.regra === 'recorrente').forEach((k) => {
    const ativos = (k.combinado_membros || []).filter((m) => m.ativo);
    if (!ativos.length) return;
    const porCiclo = ativos.reduce((s, m) => s + Number(m.valor || k.valor_por_pessoa), 0);
    const feitos = cobrancas.filter((c) => c.combinado_id === k.id).map((c) => c.ciclo || 0);
    let ciclo = (feitos.length ? Math.max(...feitos) : 0) + 1;
    for (let i = 0; i < 10; i++, ciclo++) {
      if (k.parcelas && ciclo > k.parcelas) break;
      const venc = vencimentoCiclo(k.inicio, k.frequencia, ciclo);
      if (venc > limite) break;
      previsto += porCiclo;
      agenda.push({ data: venc, titulo: k.titulo, valor: porCiclo, href: `#/k/${k.id}`, futuro: true, tipo: categoriaDe(k) });
    }
  });
  agenda.sort((a, b) => a.data.localeCompare(b.data));

  const maxTipo = Math.max(1, ...Object.values(porTipo));
  const pessoas = Array.from(porPessoa.values()).sort((a, b) => b.atrasado - a.atrasado || b.total - a.total);
  const nomeMes = MESES[new Date().getMonth()];
  const vazio = !aReceber && !recebidoMes && !agenda.length;

  render(casca(`
    <h1>Resumo</h1>
    <div class="resumo">
      <div class="card escuro"><p class="muted pequeno">A receber</p><p class="numero" style="color: var(--lima)">${brl(aReceber)}</p></div>
      <div class="card" style="${atrasado ? 'border-color: #F3C4BF' : ''}"><p class="muted pequeno">Atrasado</p><p class="numero" style="${atrasado ? 'color: var(--vermelho)' : ''}">${brl(atrasado)}</p></div>
      <div class="card"><p class="muted pequeno">Recebido em ${nomeMes}</p><p class="numero">${brl(recebidoMes)}</p></div>
      <div class="card"><p class="muted pequeno">Previsto (30 dias)</p><p class="numero">${brl(previsto)}</p><p class="muted pequeno">dos combinados</p></div>
    </div>
    ${vazio ? `<div class="card vazio pilha-p"><p><strong>Ainda não há números por aqui.</strong></p><p>Crie um combinado e acompanhe tudo nesta tela.</p><a class="btn" href="#/nova" style="align-self:center">Criar combinado</a></div>` : ''}
    ${Object.keys(porTipo).length ? `<section class="card pilha-p" aria-labelledby="t-tipo"><h2 id="t-tipo">A receber por tipo</h2>
      ${Object.entries(porTipo).sort((a, b) => b[1] - a[1]).map(([t, v]) => `
        <div class="pilha-p" style="gap: 4px; margin-top: 6px">
          <div class="linha-flex entre"><span style="font-weight: 600">${NOMES_TIPO[t] || t}</span><span>${brl(v)}</span></div>
          <div class="barra" style="height: 10px; margin-top: 0" aria-hidden="true"><span style="width: ${Math.max(4, Math.round((v / maxTipo) * 100))}%; background: var(--roxo)"></span></div>
        </div>`).join('')}
    </section>` : ''}
    ${pessoas.length ? `<section class="pilha-p" aria-labelledby="t-pessoas"><h2 id="t-pessoas">Quem te deve</h2><ul class="lista">
      ${pessoas.map((p) => `<li class="item"><span class="grow">
          <span class="titulo-item">${esc(p.nome)}</span>
          <span class="muted pequeno" style="display:block">${Array.from(p.tipos).map((t) => NOMES_TIPO[t] || t).join(', ')} · ${p.itens} cobrança${p.itens === 1 ? '' : 's'}${p.proximo ? ` · próxima ${dataBR(p.proximo)}` : ''}</span>
        </span>
        <span style="text-align: right"><strong>${brl(p.total)}</strong>${p.atrasado ? `<br><span class="tag" style="background:#FDE8E6; color: var(--vermelho)">${brl(p.atrasado)} atrasado</span>` : ''}</span></li>`).join('')}
    </ul></section>` : ''}
    ${agenda.length ? `<section class="pilha-p" aria-labelledby="t-agenda"><h2 id="t-agenda">Próximos 30 dias</h2><ul class="lista">
      ${agenda.map((a) => `<li><a class="item" href="${a.href}"><span class="icone ${COR_ICONE[a.tipo] || 'roxo'}" style="width:44px;height:44px">${ICONE[a.tipo] || ''}</span><span class="grow"><span class="titulo-item">${esc(a.titulo)}</span><span class="muted pequeno" style="display:block">${dataBR(a.data)}${diasAte(a.data) === 0 ? ' · hoje' : diasAte(a.data) === 1 ? ' · amanhã' : ''}${a.futuro ? ' · cobrança será criada' : ''}</span></span><strong>${brl(a.valor)}</strong></a></li>`).join('')}
    </ul></section>` : ''}
  `, { ativo: 'resumo' }));
}

// ---------- senha ----------
function telaEsqueci() {
  render(casca(`
    <div class="pilha-p" style="padding-top: 16px"><h1>Esqueci minha senha</h1><p class="muted">Digite seu e-mail. Se ele tiver conta, enviamos um link para criar uma senha nova.</p></div>
    <form id="f" class="card pilha" novalidate>
      <div class="campo"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" required></div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">Enviar link</button>
    </form>
    <p class="muted" style="text-align: center"><a href="#/entrar">Voltar para o login</a></p>`, { nav: false }));
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#msg').textContent = 'Confira o e-mail.'; return; }
    const btn = $('#f button[type=submit]'); btn.disabled = true;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/app/` });
    btn.disabled = false;
    if (error && /rate limit|too many/i.test(error.message)) { $('#msg').textContent = traduzErro(error); return; }
    registrar('senha_pedida');
    render(casca(`<div class="card pilha"><h2>Confira seu e-mail</h2><p>Se <strong>${esc(email)}</strong> tiver conta, o link para criar uma senha nova chega em alguns minutos. Olhe também o spam.</p><a class="btn" href="#/entrar">Voltar para o login</a></div>`, { nav: false }));
  });
}

function telaNovaSenha() {
  render(casca(`
    <div class="pilha-p" style="padding-top: 16px"><h1>Crie sua senha nova</h1></div>
    <form id="f" class="card pilha" novalidate>
      <div class="campo"><label for="s1">Senha nova</label><input id="s1" type="password" autocomplete="new-password" minlength="6"></div>
      <div class="campo"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password" minlength="6"></div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">Salvar senha</button>
    </form>`, { nav: false }));
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const s1 = $('#s1').value; const s2 = $('#s2').value;
    if (s1.length < 6) { $('#msg').textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if (s1 !== s2) { $('#msg').textContent = 'As duas senhas não são iguais.'; return; }
    const btn = $('#f button[type=submit]'); btn.disabled = true;
    const { error } = await sb.auth.updateUser({ password: s1 });
    btn.disabled = false;
    if (error) { $('#msg').textContent = traduzErro(error); return; }
    registrar('senha_trocada');
    toast('Senha nova salva!');
    go('/');
  });
}

// ---------- ajuda / reportar problema ----------
function telaAjuda() {
  render(casca(`
    <div class="pilha-p"><h1>Ajuda</h1><p class="muted">Algo não funcionou, ficou confuso ou você tem uma ideia? Conta pra gente. Cada mensagem é lida.</p></div>
    <form id="f" class="card pilha" novalidate>
      <div class="campo"><label for="msgtxt">O que aconteceu?</label><textarea id="msgtxt" maxlength="2000" placeholder="Ex.: tentei criar uma vaquinha e o botão não fez nada"></textarea></div>
      <div class="campo"><label for="contato">Como falamos com você (opcional)</label><input id="contato" maxlength="120" value="${esc(estado.sessao ? estado.sessao.user.email : '')}"></div>
      <p id="msg" class="erro" role="alert"></p>
      <button class="btn bloco" type="submit">Enviar</button>
    </form>
    <p class="muted pequeno" style="text-align: center"><a href="/termos/">Termos de uso</a> · <a href="/privacidade/">Privacidade</a></p>`, { ativo: 'conta', voltar: '/conta' }));
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensagem = $('#msgtxt').value.trim();
    if (mensagem.length < 3) { $('#msg').textContent = 'Escreva o que aconteceu.'; return; }
    const btn = $('#f button[type=submit]'); btn.disabled = true;
    const { error } = await sb.from('feedbacks').insert({ pagina: `app ${navigator.userAgent}`.slice(0, 200), mensagem, contato: $('#contato').value.trim() || null });
    btn.disabled = false;
    if (error) { $('#msg').textContent = traduzErro(error); return; }
    toast('Recebido! Obrigado por avisar.');
    go('/conta');
  });
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
    <div class="card pilha-p">
      <a class="btn sec" href="#/ajuda">Reportar problema ou dar ideia</a>
      <p class="pequeno" style="text-align: center"><a href="/termos/">Termos de uso</a> · <a href="/privacidade/">Política de privacidade</a></p>
    </div>
    <button type="button" class="btn sec bloco" id="sair">Sair da conta</button>
    <button type="button" class="btn perigo bloco" id="apagar-conta">Apagar minha conta</button>
    <p class="muted pequeno" style="text-align: center">Deixa Comigo · versão 1</p>
  `, { ativo: 'conta' }));
  $('#apagar-conta').addEventListener('click', async () => {
    const conf = window.prompt('Isso apaga sua conta e TUDO que você criou (combinados, cobranças, cartelas, vendas). Os links que você mandou param de funcionar. Não dá para desfazer.\n\nPara confirmar, digite APAGAR:');
    if (!conf || conf.trim().toUpperCase() !== 'APAGAR') { toast('Nada foi apagado.'); return; }
    const { error } = await sb.functions.invoke('apagar-conta', { method: 'POST' });
    if (error) { toast('Não consegui apagar agora. Tente de novo ou use "Reportar problema".', 'erro'); return; }
    await sb.auth.signOut();
    estado.perfil = null; estado.perfilCarregado = false; estado.sessao = null;
    render(casca('<div class="card pilha"><h2>Conta apagada</h2><p>Seus dados foram removidos. Obrigado por ter usado o Deixa Comigo.</p><a class="btn" href="/">Ir para o site</a></div>', { nav: false }));
  });
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
  if (window.__dxcmgRecuperacao && data.session) history.replaceState(null, '', '/app/#/nova-senha');
  registrar('app_aberto', { logado: !!data.session });
  sb.auth.onAuthStateChange((evento, sessao) => {
    const antes = !!estado.sessao;
    estado.sessao = sessao;
    if (evento === 'SIGNED_OUT') { estado.perfil = null; estado.perfilCarregado = false; }
    if (evento === 'PASSWORD_RECOVERY') { location.hash = '/nova-senha'; return; }
    if (antes !== !!sessao) setTimeout(rotear, 0);
  });
  window.addEventListener('hashchange', rotear);
  rotear();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/app/sw.js').catch(() => {});
})();
