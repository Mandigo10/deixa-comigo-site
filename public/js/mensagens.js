// Mensagens prontas: o coração do Deixa Comigo.
// tipo: carona | emprestimo | racha · tom: leve | neutro | firme · momento: inicial | lembrete

import { primeiroNome } from './util.js';

export const TONS = [
  { id: 'leve', nome: 'Leve' },
  { id: 'neutro', nome: 'Neutro' },
  { id: 'firme', nome: 'Firme' }
];

export function gerarMensagem({ tipo, tom, momento, nome, valor, titulo, vencimento, link, plano }) {
  const n = primeiroNome(nome);
  const ate = vencimento ? ` até ${vencimento}` : '';
  const t = `"${titulo}"`;
  let msg = '';

  if (momento === 'lembrete') {
    if (tom === 'leve') {
      msg = `Oi, ${n}! Só um lembrete amigo: ${t} (${valor}) ainda está em aberto. O Pix continua aqui, pra facilitar: ${link}`;
    } else if (tom === 'neutro') {
      msg = `Oi, ${n}. Lembrete: ${valor} referente a ${t}${vencimento ? `, com vencimento em ${vencimento}` : ''}. O Pix está neste link: ${link}`;
    } else {
      msg = `Oi, ${n}. Ainda não recebi os ${valor} de ${t}. Consegue resolver hoje? O Pix está aqui: ${link}`;
    }
  } else if (tipo === 'carona') {
    if (tom === 'leve') {
      msg = `Oi, ${n}! Fiz as contas da nossa carona (${titulo}) pra ficar justo pra todo mundo. Sua parte deu ${valor}${ate}. O extrato e o Pix estão aqui: ${link} Valeu pela companhia!`;
    } else if (tom === 'neutro') {
      msg = `Oi, ${n}. Segue o fechamento da carona (${titulo}): sua parte ficou em ${valor}, com combustível e desgaste do carro divididos${vencimento ? `. Vencimento: ${vencimento}` : ''}. Extrato e Pix: ${link}`;
    } else {
      msg = `Oi, ${n}. A carona (${titulo}) está em aberto: ${valor}. Consegue acertar${ate || ' esta semana'}? Extrato e Pix: ${link}`;
    }
  } else if (tipo === 'emprestimo') {
    if (tom === 'leve') {
      msg = `Oi, ${n}! Tudo bem? Passando pra lembrar com carinho daquele valor que combinamos (${titulo}): ${valor}${vencimento ? `, pra ${vencimento}` : ''}. Deixei o Pix aqui pra facilitar: ${link}`;
    } else if (tom === 'neutro') {
      msg = `Oi, ${n}. Referente ao empréstimo (${titulo}): ${valor}${vencimento ? `, com vencimento em ${vencimento}` : ''}. O Pix está neste link: ${link}`;
    } else {
      msg = `Oi, ${n}. O empréstimo de ${valor} (${titulo}) ainda está em aberto. Preciso que a gente acerte${ate || ' esta semana'}. O Pix está aqui: ${link}`;
    }
  } else {
    if (tom === 'leve') {
      msg = `Oi, ${n}! Fechei as contas de ${t}. Sua parte ficou em ${valor}${ate}. O extrato e o Pix estão aqui: ${link} Foi ótimo!`;
    } else if (tom === 'neutro') {
      msg = `Oi, ${n}. Contas de ${t} fechadas: sua parte é ${valor}${vencimento ? `, com vencimento em ${vencimento}` : ''}. Extrato e Pix: ${link}`;
    } else {
      msg = `Oi, ${n}. Sua parte de ${t} (${valor}) ainda está em aberto. Consegue acertar${ate || ' até sexta'}? O Pix está aqui: ${link}`;
    }
  }

  if (!plano || plano === 'gratis') {
    msg += '\n\nenviado por dx cmg · Deixa Comigo';
  }
  return msg;
}
