// Página do convite: a pessoa vê as regras do combinado e toca em "Topo".
import { sb } from '../js/sb.js';
import { carregarVitrinePublica } from '../js/vitrine.js';
import { registrar } from '../js/eventos.js';
import { esc, brl, dataBR, toast, primeiroNome, copiar, linkWhatsApp } from '../js/util.js';
import { MODELOS, textoRegra, ocupacaoHTML, categoriaDe } from '../js/combinados.js';

const app = document.getElementById('app');
const token = new URLSearchParams(location.search).get('t') || '';

function casca(conteudo) {
  return `<div class="casca" style="padding-bottom: 48px">
    <header class="topo"><a class="marca" href="/" aria-label="Deixa Comigo"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a></header>
    <main class="pilha">${conteudo}</main>
    <footer class="pilha-p" style="margin-top: 32px; text-align: center">
      <p class="muted pequeno">O Deixa Comigo organiza o combinado e lembra as datas. O pagamento vai direto para quem organizou: o app não recebe nem guarda dinheiro.</p>
      <p class="pequeno"><a href="/?utm_source=link_combinado&amp;utm_medium=rodape">Quer combinar algo com o seu grupo? Deixa comigo.</a> · <a href="/termos/">Termos</a> · <a href="/privacidade/">Privacidade</a> · <a href="/ajuda/">Ajuda</a></p>
    </footer>
  </div>`;
}

function detalhesHTML(k) {
  const d = k.detalhes || {};
  const linhas = [];
  if (k.modelo === 'carona' && d.custo_total) {
    linhas.push([`Km por ${d.periodo || 'período'}`, `${Number(d.km_total).toLocaleString('pt-BR')} km`]);
    linhas.push(['Combustível', brl(d.combustivel)]);
    linhas.push(['Manutenção e pneus', brl(d.desgaste)]);
    if (Number(d.pedagio) > 0) linhas.push(['Pedágio', brl(d.pedagio)]);
    if (Number(d.estacionamento) > 0) linhas.push(['Estacionamento', brl(d.estacionamento)]);
    linhas.push([`Custo por ${d.periodo || 'período'}`, brl(k.custo_base || d.custo_total)]);
    linhas.push(['Dividido entre', `${d.pessoas_divisao} pessoas${(k.incluir_organizador ?? d.motorista_incluido) ? ' (com o motorista)' : ''}`]);
  }
  if (k.modelo === 'vaquinha' && d.meta) {
    linhas.push(['Valor total', brl(d.meta)]);
    linhas.push(['Dividido entre', `${d.pessoas_divisao} pessoas`]);
  }
  if (d.categoria === 'venda') {
    linhas.push(['Compra', d.produto || k.titulo]);
    linhas.push(['Valor total', brl(d.total)]);
    linhas.push(['Parcelas', `${k.parcelas}x de ${brl(k.valor)}`]);
  }
  if (k.modelo === 'viagem' && d.total_por_pessoa) {
    linhas.push(['Total por pessoa', brl(d.total_por_pessoa)]);
    linhas.push(['Parcelas', `${k.parcelas}x de ${brl(k.valor)}`]);
  }
  if (d.categoria === 'aluno') {
    if (d.servico) linhas.push(['Serviço', d.servico]);
    linhas.push(['Mensalidade', brl(k.valor)]);
    linhas.push(['Vencimento', `todo dia ${Number(String(k.inicio).slice(8, 10))}`]);
    if (d.reajuste && d.reajuste.valor) linhas.push([`A partir de ${dataBR(d.reajuste.a_partir)}`, `${brl(d.reajuste.valor)} (reajuste anual)`]);
  }
  if (k.descricao) linhas.push(['Observação', k.descricao]);
  if (!linhas.length) return '';
  return `<div class="calc">${linhas.map(([a, b]) => `<div class="lin"><span>${esc(a)}</span><span style="text-align:right">${esc(b)}</span></div>`).join('')}</div>`;
}

function comoFunciona(k) {
  if (k.regra === 'unico') return `Até ${dataBR(k.prazo)}, você recebe o link com o Pix da sua parte. É só pagar e tocar em "Já paguei".`;
  const quando = k.parcelas ? `Em cada uma das ${k.parcelas} datas` : (k.frequencia === 'semanal' ? 'Toda semana' : 'Todo mês');
  return `${quando}, você recebe o link com o Pix. É só pagar e tocar em "Já paguei". Sem ninguém precisar cobrar ninguém.`;
}

async function iniciar() {
  if (!/^[0-9a-f]{32}$/.test(token)) {
    app.innerHTML = casca('<div class="card pilha"><h1>Link inválido</h1><p class="muted">Confira se o link foi copiado inteiro, ou peça um novo para quem te convidou.</p></div>');
    return;
  }
  const { data: k, error } = await sb.rpc('combinado_publico_v3', { p_token: token });
  if (error || !k) {
    app.innerHTML = casca('<div class="card pilha"><h1>Combinado não encontrado</h1><p class="muted">Ele pode ter sido apagado, ou você foi retirado dele. Fale com quem te convidou.</p></div>');
    return;
  }
  const org = primeiroNome(k.organizador);
  document.title = `${k.titulo} · Deixa Comigo`;
  const topou = !!k.aceito_em;
  const encerrado = k.status === 'encerrado';
  const lista = k.vagas || k.aberto || k.valor_modo === 'dividir';
  const temVaga = !k.limite || Number(k.pessoas) < Number(k.limite);
  const linkGrupo = k.entrada_token && temVaga ? `${location.origin}/g/?t=${k.entrada_token}` : '';
  const aguardandoFechar = k.regra === 'unico' && k.valor_modo === 'dividir' && k.aberto;

  app.innerHTML = casca(`
    <div class="pilha-p">
      <p class="muted">Oi, ${esc(primeiroNome(k.membro))}! ${categoriaDe(k) === 'venda' ? `${esc(k.organizador)} registrou a sua compra:` : categoriaDe(k) === 'aluno' ? `${esc(k.organizador)} organizou a sua mensalidade:` : `${esc(k.organizador)} te chamou para um combinado:`}</p>
      <h1>${esc(k.titulo)}</h1>
      <div class="vitrine-slot" data-vitrine="membro"></div>
      <span class="tag neutra" style="align-self: flex-start">${esc(MODELOS[categoriaDe(k)] ? MODELOS[categoriaDe(k)].nome : 'Combinado')}</span>
    </div>
    <div class="card escuro pilha-p">
      <p class="muted pequeno">${categoriaDe(k) === 'aluno' ? 'Sua mensalidade' : 'Sua parte'}${aguardandoFechar || (k.valor_modo === 'dividir' && k.aberto) ? ' (por enquanto)' : ''}</p>
      <p class="numero" style="font-size: 2.2rem; color: var(--lima)">${brl(k.valor)}</p>
      <p>${esc(textoRegra(k, k.valor))}</p>
      ${k.valor_modo === 'dividir' && k.aberto ? '<p class="muted pequeno">O custo é dividido entre todo mundo: se mais gente entrar, sua parte diminui.</p>' : ''}
      ${k.pagamento_token ? `<a class="btn lima bloco" href="/p/?t=${esc(k.pagamento_token)}" style="margin-top: 8px">${categoriaDe(k) === 'aluno' ? 'Pagar a mensalidade' : 'Pagar minha parte'}</a>` : ''}
      ${aguardandoFechar ? `<p class="muted pequeno" style="margin-top: 8px">Quando ${esc(org)} fechar a lista, o valor final e o Pix aparecem aqui.</p>` : ''}
    </div>
    ${lista ? ocupacaoHTML(k) : ''}
    ${linkGrupo ? `<div class="card pilha-p"><h2>Chame mais gente</h2><p class="muted">${k.valor_modo === 'dividir' ? 'Quanto mais gente, mais barato para todo mundo.' : 'Ainda tem vaga.'}</p>
      <div class="acoes"><a class="btn peq" href="${esc(linkWhatsApp('', `Entra nessa: ${k.titulo}. ${linkGrupo}`))}" target="_blank" rel="noopener">Mandar no WhatsApp</a><button type="button" class="btn sec peq" id="copiar-grupo">Copiar link</button></div></div>` : ''}
    ${k.cofre_token ? `<a class="card pilha-p" href="/app/#/cofre/${esc(k.cofre_token)}" style="text-decoration: none; color: inherit; border: 2px solid var(--ink)"><strong>Acompanhe o cofrinho do grupo</strong><span class="muted pequeno">Veja quanto já foi arrecadado e quanto falta. →</span></a>` : ''}
    ${detalhesHTML(k)}
    <div class="card pilha-p">
      <h2>Como funciona</h2>
      <p class="muted">${esc(comoFunciona(k))}</p>
      ${['venda', 'aluno'].includes(categoriaDe(k)) ? '' : `<p class="pequeno"><strong>${k.aceitos} de ${k.pessoas}</strong> já confirmaram.</p>`}
    </div>
    <div id="acao" class="card pilha-p" style="border: 2px solid var(--ink)">
      ${encerrado ? '<h2>Este combinado foi encerrado</h2><p class="muted">Não há novas cobranças.</p>'
        : topou ? `<h2>Você está dentro</h2><p class="muted">Desde ${new Date(k.aceito_em).toLocaleDateString('pt-BR')}. ${k.pagamento_token ? 'Sua cobrança já está disponível no botão "Pagar minha parte".' : 'Quando chegar a data, você recebe o link de pagamento.'}</p>`
        : `<h2>${categoriaDe(k) === 'venda' ? 'Confere a sua compra?' : categoriaDe(k) === 'aluno' ? 'Tudo certo com a mensalidade?' : 'Tá combinado?'}</h2><p class="muted">Ao confirmar, ${esc(org)} fica sabendo que você concorda com ${categoriaDe(k) === 'venda' ? 'o valor e as datas das parcelas' : categoriaDe(k) === 'aluno' ? 'o valor e o dia do vencimento' : 'essas regras'}.</p>
           <button type="button" class="btn lima bloco" id="topo">${categoriaDe(k) === 'venda' ? 'Confirmar compra' : categoriaDe(k) === 'aluno' ? 'Confirmar' : 'Topo!'}</button>
           <p class="muted pequeno">Não concorda com algo? Fale direto com ${esc(org)} antes.</p>`}
    </div>
  `);

  const cg = document.getElementById('copiar-grupo');
  if (cg) cg.addEventListener('click', async () => {
    const ok = await copiar(linkGrupo);
    toast(ok ? 'Link da lista copiado.' : 'Não consegui copiar.', ok ? 'ok' : 'erro');
  });
  const btn = document.getElementById('topo');
  if (btn) btn.addEventListener('click', async () => {
    btn.disabled = true;
    const { error: e } = await sb.rpc('aceitar_combinado', { p_token: token });
    if (e) { btn.disabled = false; toast('Não deu certo agora. Tente de novo.', 'erro'); return; }
    registrar('topo_aceito', { modelo: k.modelo });
    document.getElementById('acao').innerHTML = `<h2>Combinado!</h2><p class="muted">${esc(org)} já sabe que você topou. Quando chegar a data, você recebe o link de pagamento.</p>`;
  });
}

iniciar();

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
