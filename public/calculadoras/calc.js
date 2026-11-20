// Calculadoras públicas (sem login): atraem gente nova e levam para o app.
import { esc } from '../js/util.js';
import { CALCULADORAS, acharCalculadora, montarCalculadora, guardarPreenchimento } from '../js/calculadoras.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

function casca(conteudo) {
  return `<div class="casca" style="padding-bottom: 48px">
    <header class="topo"><a class="marca" href="/" aria-label="Deixa Comigo"><span class="logo">dx<br>cmg</span><span class="marca-nome">Deixa Comigo</span></a>
      <a class="btn peq" href="/app/">Entrar no app</a></header>
    <main class="pilha">${conteudo}</main>
    <footer class="pilha-p" style="margin-top: 32px; text-align: center">
      <p class="muted pequeno">Calculadoras gratuitas do Deixa Comigo. Os resultados são estimativas a partir dos números que você informar.</p>
    </footer>
  </div>`;
}

function lista() {
  document.title = 'Calculadoras de custo real · Deixa Comigo';
  app.innerHTML = casca(`
    <div class="pilha-p">
      <h1>Quanto custa de verdade?</h1>
      <p class="muted">Faça a conta antes de combinar. Com os números certos, cobrar deixa de ser constrangedor.</p>
    </div>
    ${CALCULADORAS.map((c) => `<a class="opcao" href="?c=${c.id}"><span><span class="display" style="font-size: 1.2rem; font-weight: 800; display:block">${esc(c.nome)}</span><span class="muted">${esc(c.resumo)}</span></span></a>`).join('')}
  `);
}

function uma(calc) {
  document.title = `${calc.nome} · Calculadora · Deixa Comigo`;
  app.innerHTML = casca(`
    <a class="btn texto" href="/calculadoras/" style="align-self: flex-start; padding-left: 0">← Todas as calculadoras</a>
    <div class="pilha-p"><h1>${esc(calc.nome)}</h1><p class="muted">${esc(calc.resumo)}</p></div>
    <div id="calc-area"></div>
    <div class="card escuro pilha-p">
      <h2>Agora é só combinar</h2>
      <p class="muted">No Deixa Comigo, todo mundo topa o valor antes e o app cobra na data, com Pix. Sem você precisar pedir.</p>
      <a class="btn lima" href="/app/#/cadastro">Criar conta grátis</a>
    </div>
  `);
  montarCalculadora(document.getElementById('calc-area'), calc, (dados) => {
    guardarPreenchimento(dados);
    location.href = `/app/#/combinar/${dados.modelo}`;
  });
}

const calc = acharCalculadora(params.get('c') || '');
if (calc) uma(calc); else lista();
