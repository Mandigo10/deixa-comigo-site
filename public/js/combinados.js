// Regras dos combinados, usadas pelo app e pela página do "Topo".
import { brl, dataBR, esc } from './util.js';

export const MODELOS = {
  carona: { nome: 'Carona fixa', curto: 'Carona' },
  vaquinha: { nome: 'Vaquinha', curto: 'Vaquinha' },
  viagem: { nome: 'Viagem parcelada', curto: 'Viagem' },
  mensalidade: { nome: 'Mensalidade do grupo', curto: 'Mensalidade' },
  venda: { nome: 'Venda parcelada', curto: 'Venda' }
};

// Categoria de exibição: vendas parceladas usam a estrutura de parcelas, marcadas nos detalhes
export function categoriaDe(x) {
  return (x && x.detalhes && x.detalhes.categoria) || (x && (x.modelo || x.tipo)) || '';
}

// Mesmo cálculo da função vencimento_ciclo do banco
export function vencimentoCiclo(inicioISO, frequencia, ciclo) {
  const [a, m, d] = inicioISO.split('-').map(Number);
  if (frequencia === 'semanal') {
    const dt = new Date(Date.UTC(a, m - 1, d + 7 * (ciclo - 1)));
    return dt.toISOString().slice(0, 10);
  }
  const totalMeses = (m - 1) + (ciclo - 1);
  const ano = a + Math.floor(totalMeses / 12);
  const mes = totalMeses % 12;
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const dt = new Date(Date.UTC(ano, mes, Math.min(d, ultimoDia)));
  return dt.toISOString().slice(0, 10);
}

// Valor por pessoa em listas que dividem o custo, para N participantes
export function valorDividido(cb, participantes) {
  const div = Math.max(1, participantes + (cb.incluir_organizador ? 1 : 0));
  return Math.round((Number(cb.custo_base) / div) * 100) / 100;
}

export function textoRegra(cb, valor) {
  const v = brl(valor ?? cb.valor_por_pessoa);
  if (cb.regra === 'unico') return `${v} por pessoa${cb.prazo ? `, até ${dataBR(cb.prazo)}` : ''}`;
  if (cb.parcelas && categoriaDe(cb) === 'venda') {
    const dia = Number(String(cb.inicio).slice(8, 10));
    return `${cb.parcelas}x de ${v}, todo dia ${dia}, a partir de ${dataBR(cb.inicio)}`;
  }
  if (cb.parcelas) {
    return `${v} por pessoa em ${cb.parcelas} parcela${cb.parcelas === 1 ? '' : 's'} ${cb.frequencia === 'semanal' ? 'semanais' : 'mensais'}, a partir de ${dataBR(cb.inicio)}`;
  }
  return `${v} por pessoa, ${cb.frequencia === 'semanal' ? 'toda semana' : 'todo mês'}, a partir de ${dataBR(cb.inicio)}`;
}

// Bloco de ocupação da lista (páginas públicas): barra + nomes + vagas livres
export function ocupacaoHTML(g, { escuro = false } = {}) {
  const ocupadas = Number(g.ocupadas ?? g.pessoas ?? 0);
  const limite = Number(g.limite || 0);
  const nomes = Array.isArray(g.nomes) ? g.nomes : [];
  const livres = limite ? Math.max(0, limite - ocupadas) : 0;
  const pct = limite ? Math.min(100, Math.round((ocupadas / limite) * 100)) : 0;
  const rotulo = g.vagas
    ? `${ocupadas} de ${g.vagas} vaga${g.vagas === 1 ? '' : 's'} preenchida${ocupadas === 1 ? '' : 's'}`
    : `${ocupadas} pessoa${ocupadas === 1 ? '' : 's'} na lista`;
  return `<div class="card ${escuro ? 'escuro' : ''} pilha-p">
    <div class="linha-flex entre"><h2>${g.modelo === 'carona' ? 'Ocupação do carro' : 'Quem já está'}</h2><strong>${esc(rotulo)}</strong></div>
    ${g.vagas ? `<div class="ocupacao" aria-hidden="true"><span style="width: ${pct}%"></span></div>` : ''}
    <div class="nomes">${nomes.map((n) => `<span>${esc(n)}</span>`).join('')}${g.vagas ? Array.from({ length: Math.min(livres, 12) }, () => '<span class="vaga">vaga livre</span>').join('') : ''}</div>
    ${g.modelo === 'carona' && g.incluir_organizador ? '<p class="muted pequeno">Fora o motorista.</p>' : ''}
  </div>`;
}
