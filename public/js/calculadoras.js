// Calculadoras de custo real: carona e preço justo para profissionais e autônomos.
// Usadas dentro do app (#/calc) e na página pública /calculadoras/.
import { esc, brl, parseValor, round2 } from './util.js';

const n = (v) => { const x = parseValor(v); return Number.isFinite(x) ? x : 0; };
const pct = (v) => n(v) / 100;
const kmFmt = (v) => `${round2(v).toLocaleString('pt-BR')} km`;
const hFmt = (v) => `${round2(v).toLocaleString('pt-BR')} h`;

export const CALCULADORAS = [
  {
    id: 'carona',
    nome: 'Custo real da carona',
    resumo: 'Combustível, manutenção, pedágio e estacionamento divididos de forma justa.',
    icone: 'carona',
    campos: [
      { id: 'km_dia', label: 'Km por dia (ida e volta)', padrao: '36' },
      { id: 'dias_mes', label: 'Dias de carona no mês', padrao: '22' },
      { id: 'consumo', label: 'Consumo do carro (km/l)', padrao: '11' },
      { id: 'preco_litro', label: 'Preço do litro (R$)', padrao: '6,19' },
      { id: 'manutencao_km', label: 'Manutenção e pneus por km (R$)', padrao: '0,15', ajuda: 'Revisão, óleo e pneus. R$ 0,15 é uma média para carro popular.' },
      { id: 'pedagio_dia', label: 'Pedágio por dia, ida e volta (R$)', padrao: '0' },
      { id: 'estacionamento_dia', label: 'Estacionamento por dia (R$)', padrao: '0' },
      { id: 'pessoas', label: 'Pessoas no carro, contando você', padrao: '3' }
    ],
    calcular(v) {
      const km = n(v.km_dia) * n(v.dias_mes);
      const combustivel = n(v.consumo) > 0 ? (km / n(v.consumo)) * n(v.preco_litro) : 0;
      const manut = km * n(v.manutencao_km);
      const pedagio = n(v.pedagio_dia) * n(v.dias_mes);
      const estac = n(v.estacionamento_dia) * n(v.dias_mes);
      const total = combustivel + manut + pedagio + estac;
      const pessoas = Math.max(1, Math.round(n(v.pessoas)));
      const porPessoaMes = total / pessoas;
      const porPessoaDia = n(v.dias_mes) > 0 ? porPessoaMes / n(v.dias_mes) : 0;
      return {
        linhas: [['Km no mês', kmFmt(km)], ['Combustível', brl(combustivel)], ['Manutenção e pneus', brl(manut)],
          ...(pedagio ? [['Pedágio', brl(pedagio)]] : []), ...(estac ? [['Estacionamento', brl(estac)]] : []),
          ['Custo total do mês', brl(total)], ['Dividido entre', `${pessoas} pessoa${pessoas === 1 ? '' : 's'}`], ['Por pessoa, por dia', brl(porPessoaDia)]],
        destaque: ['Cada um paga por mês', brl(porPessoaMes)],
        frase: `Sem dividir, você gasta ${brl(total)} por mês para levar todo mundo.`,
        combinar: { modelo: 'carona', valor: round2(porPessoaMes), frequencia: 'mensal', titulo: 'Carona para o trabalho', rotulo: 'por pessoa, por mês',
          calc: { km_dia: n(v.km_dia), dias: n(v.dias_mes), consumo: n(v.consumo), preco_litro: n(v.preco_litro), desgaste_km: n(v.manutencao_km), pedagio_dia: n(v.pedagio_dia), estacionamento_dia: n(v.estacionamento_dia), km_total: round2(km), combustivel: round2(combustivel), desgaste: round2(manut), pedagio: round2(pedagio), estacionamento: round2(estac), custo_total: round2(total), pessoas_divisao: pessoas, motorista_incluido: true, periodo: 'mês' } }
      };
    }
  },
  {
    id: 'aula',
    nome: 'Preço da aula ou sessão',
    resumo: 'Para professor, personal, instrutor e terapeuta: quanto cobrar por aula contando preparo, deslocamento e custos.',
    icone: 'aluno',
    campos: [
      { id: 'renda', label: 'Quanto você quer ganhar por mês (R$)', padrao: '4.000' },
      { id: 'aulas', label: 'Aulas ou sessões dadas por mês', padrao: '80', ajuda: 'Conte só as que são pagas. Ex.: 20 por semana = 80 no mês.' },
      { id: 'preparo', label: 'Horas de preparo, correção e mensagens por mês', padrao: '20', ajuda: 'Esse tempo não é pago à parte, então entra no preço da aula.' },
      { id: 'duracao', label: 'Duração de cada aula (horas)', padrao: '1' },
      { id: 'deslocamento', label: 'Deslocamento por aula (R$)', padrao: '8', ajuda: 'Se a aula é na casa do aluno ou numa academia. Online: 0.' },
      { id: 'fixos', label: 'Custos fixos por mês (R$)', padrao: '250', ajuda: 'Material, plataforma, sala ou academia, conselho de classe (CREF, CRP, CRN…), internet.' },
      { id: 'mei', label: 'Imposto MEI (DAS) ou carnê-leão por mês (R$)', padrao: '0' },
      { id: 'reserva', label: 'Reserva para férias, faltas e imprevistos (%)', padrao: '15', ajuda: 'Profissional autônomo não tem férias pagas nem 13º, e aluno falta.' }
    ],
    calcular(v) {
      const aulas = Math.max(1, n(v.aulas));
      const fixos = n(v.fixos) + n(v.mei);
      const base = (n(v.renda) + fixos) / aulas + n(v.deslocamento);
      const preco = base * (1 + pct(v.reserva));
      const horas = aulas * Math.max(0.25, n(v.duracao)) + n(v.preparo);
      const minimo = fixos / aulas + n(v.deslocamento);
      return {
        linhas: [['Sua renda por aula', brl(n(v.renda) / aulas)], ['Custos fixos e impostos por aula', brl(fixos / aulas)], ['Deslocamento', brl(n(v.deslocamento))], ['Reserva', brl(preco - base)], ['Horas trabalhadas no mês (com preparo)', hFmt(horas)], ['Sua hora de verdade', brl((n(v.renda)) / Math.max(1, horas))]],
        destaque: ['Cobre por aula', brl(preco)],
        frase: `Abaixo de ${brl(minimo)} por aula você paga para trabalhar. Com 2 aulas por semana, a mensalidade fica em ${brl(preco * 2 * 4.33)}.`,
        combinar: { modelo: 'aluno', rota: '/aluno/novo', valor: round2(preco * 4.33), frequencia: 'mensal', titulo: 'Aulas', rotulo: 'por mês (1 aula por semana)' }
      };
    }
  },
  {
    id: 'pacote',
    nome: 'Mensalidade ou pacote de aulas',
    resumo: 'Transforme o preço da aula em mensalidade ou pacote fechado, com desconto que ainda vale a pena.',
    icone: 'aluno',
    campos: [
      { id: 'preco', label: 'Preço de uma aula avulsa (R$)', padrao: '90' },
      { id: 'semana', label: 'Aulas por semana', padrao: '2' },
      { id: 'desconto', label: 'Desconto da mensalidade sobre a avulsa (%)', padrao: '10', ajuda: 'Quem paga por mês costuma ganhar um desconto e você ganha previsibilidade.' },
      { id: 'pacote', label: 'Aulas no pacote fechado', padrao: '10' },
      { id: 'desconto_pacote', label: 'Desconto do pacote (%)', padrao: '5' }
    ],
    calcular(v) {
      const porMes = n(v.semana) * 4.33;
      const cheia = n(v.preco) * porMes;
      const mensal = cheia * (1 - pct(v.desconto));
      const pacote = n(v.preco) * n(v.pacote) * (1 - pct(v.desconto_pacote));
      return {
        linhas: [['Aulas por mês, em média', `${round2(porMes).toLocaleString('pt-BR')} (o mês tem 4,33 semanas)`], ['Valor cheio do mês', brl(cheia)], ['Mensalidade com desconto', brl(mensal)], ['Cada aula sai por', brl(porMes ? mensal / porMes : 0)], [`Pacote de ${n(v.pacote)} aulas`, brl(pacote)]],
        destaque: ['Mensalidade', brl(mensal)],
        frase: `Cobrar "4 semanas" por mês esconde ${brl(n(v.preco) * n(v.semana) * 0.33)} de aulas todo mês: use 4,33.`,
        combinar: { modelo: 'aluno', rota: '/aluno/novo', valor: round2(mensal), frequencia: 'mensal', titulo: 'Aulas', rotulo: 'por mês' }
      };
    }
  },
  {
    id: 'diarista',
    nome: 'Diarista',
    resumo: 'Quanto cobrar por diária para cobrir seus custos e ter a renda que você quer.',
    icone: 'casa',
    campos: [
      { id: 'renda', label: 'Quanto você quer ganhar por mês (R$)', padrao: '3.000' },
      { id: 'diarias', label: 'Diárias por mês', padrao: '20' },
      { id: 'horas', label: 'Horas por diária', padrao: '8' },
      { id: 'transporte', label: 'Transporte por diária (R$)', padrao: '12' },
      { id: 'produtos', label: 'Produtos, luvas e uniforme por mês (R$)', padrao: '60' },
      { id: 'mei', label: 'Imposto MEI (DAS) por mês, se tiver (R$)', padrao: '0', ajuda: 'Coloque o valor do seu boleto do MEI, se você for MEI.' },
      { id: 'celular', label: 'Celular e internet por mês (R$)', padrao: '50' },
      { id: 'reserva', label: 'Reserva para férias e imprevistos (%)', padrao: '10', ajuda: 'Autônomo não tem férias pagas nem 13º: essa reserva cobre isso.' }
    ],
    calcular(v) {
      const diarias = Math.max(1, n(v.diarias));
      const fixos = n(v.produtos) + n(v.mei) + n(v.celular);
      const base = (n(v.renda) + fixos) / diarias + n(v.transporte);
      const preco = base * (1 + pct(v.reserva));
      const minimo = fixos / diarias + n(v.transporte);
      return {
        linhas: [['Custos fixos do mês', brl(fixos)], ['Custos por diária', brl(fixos / diarias + n(v.transporte))], ['Sua renda por diária', brl(n(v.renda) / diarias)], ['Reserva', brl(preco - base)], ['Valor da sua hora', brl(preco / Math.max(1, n(v.horas)))]],
        destaque: ['Cobre por diária', brl(preco)],
        frase: `Abaixo de ${brl(minimo)} por diária você paga para trabalhar.`,
        combinar: { modelo: 'mensalidade', valor: round2(preco), frequencia: 'semanal', titulo: 'Diária de limpeza', rotulo: 'por diária' }
      };
    }
  },
  {
    id: 'confeiteiro',
    nome: 'Confeiteiro(a)',
    resumo: 'Preço de um bolo ou encomenda com ingredientes, gás, embalagem e o seu tempo.',
    icone: 'bolo',
    semCombinar: true,
    campos: [
      { id: 'ingredientes', label: 'Ingredientes da receita (R$)', padrao: '45' },
      { id: 'embalagem', label: 'Embalagem, caixa e topo (R$)', padrao: '8' },
      { id: 'horas', label: 'Horas de trabalho na encomenda', padrao: '3' },
      { id: 'forno', label: 'Horas de forno', padrao: '1' },
      { id: 'forno_hora', label: 'Gás e energia por hora de forno (R$)', padrao: '3' },
      { id: 'entrega', label: 'Entrega (R$)', padrao: '0' },
      { id: 'renda', label: 'Quanto você quer ganhar por mês (R$)', padrao: '2.500' },
      { id: 'horas_mes', label: 'Horas que você trabalha por mês', padrao: '160' },
      { id: 'margem', label: 'Margem de lucro (%)', padrao: '30', ajuda: 'O lucro do negócio, além do seu salário: para investir e cobrir perdas.' }
    ],
    calcular(v) {
      const valorHora = n(v.renda) / Math.max(1, n(v.horas_mes));
      const mao = n(v.horas) * valorHora;
      const forno = n(v.forno) * n(v.forno_hora);
      const custo = n(v.ingredientes) + n(v.embalagem) + forno + n(v.entrega);
      const preco = (custo + mao) * (1 + pct(v.margem));
      return {
        linhas: [['Ingredientes e embalagem', brl(n(v.ingredientes) + n(v.embalagem))], ['Gás e energia', brl(forno)], ...(n(v.entrega) ? [['Entrega', brl(n(v.entrega))]] : []), ['Seu tempo', `${hFmt(n(v.horas))} × ${brl(valorHora)} = ${brl(mao)}`], ['Lucro do negócio', brl(preco - custo - mao)]],
        destaque: ['Preço da encomenda', brl(preco)],
        frase: `Só os custos já são ${brl(custo)}. Cobrar menos que ${brl(custo + mao)} é trabalhar de graça.`,
        combinar: null
      };
    }
  },
  {
    id: 'motorista',
    nome: 'Motorista de aplicativo',
    resumo: 'Quanto sobra de verdade depois de combustível, manutenção, seguro e parcela.',
    icone: 'carona',
    semCombinar: true,
    campos: [
      { id: 'faturamento', label: 'Quanto o app te paga por mês (R$)', padrao: '5.000' },
      { id: 'horas', label: 'Horas rodando por mês', padrao: '200' },
      { id: 'km', label: 'Km rodados por mês', padrao: '4.000' },
      { id: 'consumo', label: 'Consumo (km/l)', padrao: '12' },
      { id: 'preco_litro', label: 'Preço do litro (R$)', padrao: '6,19' },
      { id: 'manutencao_km', label: 'Manutenção e pneus por km (R$)', padrao: '0,15' },
      { id: 'parcela', label: 'Parcela ou aluguel do carro por mês (R$)', padrao: '0' },
      { id: 'seguro', label: 'Seguro por mês (R$)', padrao: '200' },
      { id: 'ipva', label: 'IPVA e licenciamento por ano (R$)', padrao: '1.200' },
      { id: 'outros', label: 'Celular, lavagem e outros por mês (R$)', padrao: '100' }
    ],
    calcular(v) {
      const km = n(v.km);
      const combustivel = n(v.consumo) > 0 ? (km / n(v.consumo)) * n(v.preco_litro) : 0;
      const manut = km * n(v.manutencao_km);
      const fixos = n(v.parcela) + n(v.seguro) + n(v.ipva) / 12 + n(v.outros);
      const custo = combustivel + manut + fixos;
      const lucro = n(v.faturamento) - custo;
      const porKm = km > 0 ? custo / km : 0;
      return {
        linhas: [['Combustível', brl(combustivel)], ['Manutenção e pneus', brl(manut)], ['Custos fixos (parcela, seguro, IPVA, outros)', brl(fixos)], ['Custo total', brl(custo)], ['Seu custo por km', brl(porKm)], ['Sobra no mês', brl(lucro)]],
        destaque: ['Você ganha por hora, de verdade', brl(lucro / Math.max(1, n(v.horas)))],
        frase: `Corrida que paga menos de ${brl(porKm)} por km rodado (contando o trajeto até o passageiro) dá prejuízo.`,
        combinar: null
      };
    }
  },
  {
    id: 'favor',
    nome: 'Quem sempre ajuda de graça',
    resumo: 'Quanto valem os favores que você faz todo mês: seu tempo, seu carro, seus gastos.',
    icone: 'coracao',
    campos: [
      { id: 'vezes', label: 'Quantas vezes por mês você ajuda', padrao: '4' },
      { id: 'horas', label: 'Horas por vez', padrao: '2' },
      { id: 'valor_hora', label: 'Quanto vale sua hora (R$)', padrao: '25', ajuda: 'Se não souber, use o que você ganha por hora no seu trabalho.' },
      { id: 'km', label: 'Km rodados por vez', padrao: '10' },
      { id: 'custo_km', label: 'Custo do carro por km (R$)', padrao: '0,70', ajuda: 'Combustível mais desgaste. Use a calculadora de carona para achar o seu.' },
      { id: 'gastos', label: 'Outros gastos por vez (R$)', padrao: '0', ajuda: 'Material, lanche, estacionamento…' }
    ],
    calcular(v) {
      const porVez = n(v.horas) * n(v.valor_hora) + n(v.km) * n(v.custo_km) + n(v.gastos);
      const mes = porVez * n(v.vezes);
      return {
        linhas: [['Seu tempo por vez', brl(n(v.horas) * n(v.valor_hora))], ['Carro por vez', brl(n(v.km) * n(v.custo_km))], ...(n(v.gastos) ? [['Outros gastos por vez', brl(n(v.gastos))]] : []), ['Cada ajuda vale', brl(porVez)], ['Em um ano', brl(mes * 12)]],
        destaque: ['Você doa por mês', brl(mes)],
        frase: 'Ajudar é ótimo. Mas, se virou rotina, dá para combinar pelo menos os custos, sem climão.',
        combinar: { modelo: 'mensalidade', valor: round2(n(v.km) * n(v.custo_km) * n(v.vezes) + n(v.gastos) * n(v.vezes)), frequencia: 'mensal', titulo: 'Ajuda do mês', rotulo: 'por mês, só os custos do carro e gastos' }
      };
    }
  }
];

export function acharCalculadora(id) {
  return CALCULADORAS.find((c) => c.id === id);
}

// Desenha a calculadora num container e atualiza o resultado a cada digitação.
// aoCombinar(dados) é chamado quando a pessoa toca em "Combinar esse valor".
export function montarCalculadora(container, calc, aoCombinar) {
  container.innerHTML = `
    <form class="pilha" novalidate id="calc-form">
      <div class="card pilha">
        ${calc.campos.map((c) => `<div class="campo"><label for="c-${c.id}">${esc(c.label)}</label>
          <input id="c-${c.id}" name="${c.id}" inputmode="decimal" value="${esc(c.padrao)}">${c.ajuda ? `<span class="ajuda">${esc(c.ajuda)}</span>` : ''}</div>`).join('')}
      </div>
      <div class="calc" id="calc-res" aria-live="polite"></div>
      <p class="muted pequeno" id="calc-frase"></p>
      ${calc.semCombinar ? '' : '<button type="button" class="btn lima bloco" id="calc-combinar" hidden>Combinar esse valor</button>'}
      <p class="muted pequeno">Os valores iniciais são só exemplos. Troque pelos seus para ter a conta certa.</p>
    </form>`;
  const form = container.querySelector('#calc-form');
  let ultimo = null;
  const atualizar = () => {
    const v = {};
    calc.campos.forEach((c) => { v[c.id] = form.querySelector(`#c-${c.id}`).value; });
    const r = calc.calcular(v);
    ultimo = r;
    container.querySelector('#calc-res').innerHTML = `${r.linhas.map(([a, b]) => `<div class="lin"><span>${esc(a)}</span><span style="text-align:right">${esc(b)}</span></div>`).join('')}
      <div class="lin total"><span>${esc(r.destaque[0])}</span><span>${esc(r.destaque[1])}</span></div>`;
    container.querySelector('#calc-frase').textContent = r.frase || '';
    const btn = container.querySelector('#calc-combinar');
    if (btn) {
      btn.hidden = !(r.combinar && r.combinar.valor > 0);
      if (r.combinar) btn.textContent = `Combinar ${brl(r.combinar.valor)}${r.combinar.rotulo ? ' ' + r.combinar.rotulo : ''}`;
    }
  };
  form.addEventListener('input', atualizar);
  form.addEventListener('submit', (e) => e.preventDefault());
  const btn = container.querySelector('#calc-combinar');
  if (btn) btn.addEventListener('click', () => { if (ultimo && ultimo.combinar) aoCombinar(ultimo.combinar); });
  atualizar();
}

// Guarda o valor calculado para pré-preencher o formulário de combinado
export function guardarPreenchimento(dados) {
  try { sessionStorage.setItem('dxcmg_prefill', JSON.stringify(dados)); } catch (e) { /* sem armazenamento */ }
}
export function lerPreenchimento() {
  try {
    const t = sessionStorage.getItem('dxcmg_prefill');
    sessionStorage.removeItem('dxcmg_prefill');
    return t ? JSON.parse(t) : null;
  } catch (e) { return null; }
}
