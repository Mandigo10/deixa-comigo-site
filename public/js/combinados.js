// Regras dos combinados, usadas pelo app e pela página do "Topo".
import { brl, dataBR } from './util.js';

export const MODELOS = {
  carona: { nome: 'Carona fixa', curto: 'Carona' },
  vaquinha: { nome: 'Vaquinha', curto: 'Vaquinha' },
  viagem: { nome: 'Viagem parcelada', curto: 'Viagem' },
  mensalidade: { nome: 'Mensalidade do grupo', curto: 'Mensalidade' }
};

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

export function textoRegra(cb, valor) {
  const v = brl(valor ?? cb.valor_por_pessoa);
  if (cb.regra === 'unico') return `${v} por pessoa${cb.prazo ? `, até ${dataBR(cb.prazo)}` : ''}`;
  if (cb.parcelas) {
    return `${v} por pessoa em ${cb.parcelas} parcela${cb.parcelas === 1 ? '' : 's'} ${cb.frequencia === 'semanal' ? 'semanais' : 'mensais'}, a partir de ${dataBR(cb.inicio)}`;
  }
  return `${v} por pessoa, ${cb.frequencia === 'semanal' ? 'toda semana' : 'todo mês'}, a partir de ${dataBR(cb.inicio)}`;
}
