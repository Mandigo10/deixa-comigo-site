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
