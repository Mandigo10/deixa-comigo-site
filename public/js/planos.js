// Planos e preços do Deixa Comigo: fonte única para o site e o app.
// Para mudar um preço, mude só aqui.
// No banco, o plano Profissional continua com o valor 'autonomo' (coluna perfis.plano).

export const LIBERADO_ATE = '2027-01-31'; // recursos pagos liberados para todos até esta data (igual ao bolão)

export const PLANOS = {
  gratis: { nome: 'Grátis', linha: 'pf', preco: 0 },
  plus: { nome: 'Plus', linha: 'pf', preco: 9.90 },
  autonomo: { nome: 'Profissional', linha: 'pro', preco: 24.90 }
};

// Períodos do plano Profissional: valor cobrado de uma vez no período
export const PERIODOS_PRO = [
  { id: 'mensal', nome: 'Mensal', meses: 1, total: 24.90 },
  { id: 'semestral', nome: 'Semestral', meses: 6, total: 126.90 },
  { id: 'anual', nome: 'Anual', meses: 12, total: 224.10 }
];

export function nomePlano(plano) {
  return (PLANOS[plano] || PLANOS.gratis).nome;
}

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Texto pronto de cada período: preço por mês, total e economia
export function resumoPeriodo(id) {
  const p = PERIODOS_PRO.find((x) => x.id === id) || PERIODOS_PRO[0];
  const cheio = PERIODOS_PRO[0].total * p.meses;
  const desconto = Math.round((1 - p.total / cheio) * 100);
  return {
    ...p,
    porMes: brl(Math.floor((p.total / p.meses) * 100) / 100),
    totalTxt: brl(p.total),
    desconto,
    economia: brl(cheio - p.total),
    legenda: p.meses === 1 ? 'cobrado todo mês · cancele quando quiser'
      : `${brl(p.total)} a cada ${p.meses === 6 ? '6 meses' : 'ano'} · economize ${brl(cheio - p.total)} (${desconto}% off)`
  };
}

// Liga os botões de período (data-periodo) e preenche [data-pro="porMes|legenda"] dentro do container
export function ligarPeriodos(container, inicial = 'anual') {
  if (!container) return;
  const botoes = Array.from(container.querySelectorAll('[data-periodo]'));
  const escolher = (id) => {
    const r = resumoPeriodo(id);
    botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.periodo === id)));
    container.querySelectorAll('[data-pro]').forEach((el) => { el.textContent = r[el.dataset.pro]; });
  };
  botoes.forEach((b) => b.addEventListener('click', () => escolher(b.dataset.periodo)));
  escolher(inicial);
}

// Limites do Grátis (valem a partir de 01/02/2027; o banco é quem garante, via trigger checar_limites)
export const LIMITES_GRATIS = { combinados: 3, pessoasLista: 10, vendas: 3, alunos: 3, cartelas: 1, numerosCartela: 50, boloes: 1 };
export const FIM_LANCAMENTO = '2027-02-01T00:00:00-03:00';
export const DIAS_TESTE = 15;

// Cartela Turbinada: compra avulsa, paga uma vez (ainda sem pagamento: registra interesse)
export const TURBINADA = [
  { id: 'turbinada200', numeros: 200, preco: 19.90 },
  { id: 'turbinada1000', numeros: 1000, preco: 29.90 }
];

export const BENEFICIOS_PLUS = [
  'Combinados, listas, carnês e bolões sem limite',
  'Cartelas de até 1.000 números',
  'Mensagens sem o "enviado por dx cmg"',
  'Cofrinho mostrando quem já pagou',
  'Receber em várias chaves Pix',
  'Google Agenda, lembretes no celular e conferência do bolão'
];

// Plano que vale agora, a partir do perfil (igual à função plano_efetivo do banco)
export function calcularPlano(perfil, agora = new Date()) {
  if (!perfil) return { plano: 'gratis', emTeste: false, testeAte: null, lancamento: agora < new Date(FIM_LANCAMENTO) };
  const ate = perfil.plus_teste_ate ? new Date(perfil.plus_teste_ate) : null;
  const emTeste = perfil.plano === 'gratis' && !!ate && ate > agora && (ate - DIAS_TESTE * 864e5) <= agora;
  return { plano: perfil.plano !== 'gratis' ? perfil.plano : emTeste ? 'plus' : 'gratis', emTeste, testeAte: ate, lancamento: agora < new Date(FIM_LANCAMENTO) };
}
