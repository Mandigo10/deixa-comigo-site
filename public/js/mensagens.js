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

  if (momento === 'combinado') {
    if (tipo === 'aluno') {
      if (tom === 'leve') msg = `Oi, ${n}! Tudo bem? Segue a mensalidade (${titulo}): ${valor}${ate}. O Pix está aqui: ${link} Obrigado pela confiança!`;
      else if (tom === 'neutro') msg = `Oi, ${n}. Mensalidade ${titulo}: ${valor}${vencimento ? `, vencimento ${vencimento}` : ''}. Pix: ${link}`;
      else msg = `Oi, ${n}. A mensalidade ${titulo} (${valor}) vence${vencimento ? ` em ${vencimento}` : ' agora'}. Peço que pague até a data. Pix: ${link}`;
    } else if (tipo === 'venda') {
      if (tom === 'leve') msg = `Oi, ${n}! Passando para lembrar da ${titulo}: ${valor}${ate}. O Pix está aqui: ${link} Obrigada pela preferência!`;
      else if (tom === 'neutro') msg = `Oi, ${n}. ${titulo}: ${valor}${vencimento ? `, vencimento ${vencimento}` : ''}. Pix: ${link}`;
      else msg = `Oi, ${n}. A ${titulo} (${valor}) vence${vencimento ? ` em ${vencimento}` : ' agora'}. Peço que pague até a data. Pix: ${link}`;
    } else if (tipo === 'vaquinha') {
      if (tom === 'leve') msg = `Oi, ${n}! Vaquinha de ${t}: cada um entra com ${valor}${ate}. Assim ninguém precisa adiantar nada. O Pix está aqui: ${link}`;
      else if (tom === 'neutro') msg = `Oi, ${n}. Vaquinha de ${t}: ${valor} por pessoa${vencimento ? `, até ${vencimento}` : ''}. Pix: ${link}`;
      else msg = `Oi, ${n}. Para a vaquinha de ${t} fechar, falta a sua parte: ${valor}${ate}. Pix: ${link}`;
    } else if (tom === 'leve') {
      msg = `Oi, ${n}! Chegou a data do nosso combinado (${titulo}): ${valor}${ate}. O Pix está aqui: ${link} Valeu!`;
    } else if (tom === 'neutro') {
      msg = `Oi, ${n}. Conforme combinado, ${titulo}: ${valor}${vencimento ? `, com vencimento em ${vencimento}` : ''}. Pix: ${link}`;
    } else {
      msg = `Oi, ${n}. Conforme o combinado, ${titulo} vence${vencimento ? ` em ${vencimento}` : ' agora'}: ${valor}. O Pix está aqui: ${link}`;
    }
  } else if (momento === 'aviso') {
    if (tom === 'leve') msg = `Oi, ${n}! Só avisando com antecedência: ${t} (${valor}) vence em ${vencimento}. O Pix já está aqui, pra facilitar: ${link}`;
    else if (tom === 'neutro') msg = `Oi, ${n}. Lembrete: ${valor} de ${t} vence em ${vencimento}. Pix: ${link}`;
    else msg = `Oi, ${n}. ${t} vence em ${vencimento}: ${valor}. Peço que acerte até a data. Pix: ${link}`;
  } else if (momento === 'lembrete') {
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

  return assinar(msg, plano);
}

function assinar(msg, plano) {
  if (!plano || plano === 'gratis') return msg + '\n\nenviado por dx cmg · Deixa Comigo';
  return msg;
}

// Divulgação da lista aberta (para mandar no grupo do WhatsApp)
export function gerarDivulgacao({ modelo, titulo, regra, vagas, dividir, link, plano }) {
  let msg;
  if (modelo === 'carona') {
    msg = `Tô oferecendo carona: ${titulo}. ${regra}${vagas ? `. São ${vagas} vagas` : ''}${dividir ? ', e quanto mais gente entrar, mais barato fica pra todo mundo' : ''}. Quem quiser, garante a vaga aqui: ${link}`;
  } else if (modelo === 'vaquinha') {
    msg = `Bora? ${titulo}: ${regra}${dividir ? ' (o valor é dividido entre quem entrar)' : ''}. Coloca seu nome na lista aqui: ${link}`;
  } else {
    msg = `${titulo}: ${regra}${vagas ? `. ${vagas} vagas` : ''}. Quem topar, entra pela lista: ${link}`;
  }
  return assinar(msg, plano);
}

// Convite para "topar" um combinado
export function gerarConvite({ tom, nome, titulo, regra, link, plano, categoria }) {
  const n = primeiroNome(nome);
  let msg;
  if (categoria === 'aluno') {
    msg = `Oi, ${n}! Para ficar mais prático, agora organizo as mensalidades pelo Deixa Comigo: ${titulo}, ${regra}. Todo mês você recebe o Pix certinho, sem precisar lembrar. Confirme aqui: ${link}`;
  } else if (categoria === 'venda') {
    msg = `Oi, ${n}! Registrei sua compra no Deixa Comigo: ${titulo}, ${regra}. Assim você recebe o Pix certinho em cada data. Toque em "Topo" para confirmar: ${link}`;
  } else if (tom === 'leve') {
    msg = `Oi, ${n}! Pra gente nunca precisar ficar falando de dinheiro depois, coloquei nosso combinado no Deixa Comigo: ${titulo}, ${regra}. Dá uma olhada e, se estiver ok, toca em "Topo": ${link}`;
  } else if (tom === 'neutro') {
    msg = `Oi, ${n}. Organizei "${titulo}" no Deixa Comigo: ${regra}. As regras estão neste link; se concordar, toque em "Topo": ${link}`;
  } else {
    msg = `Oi, ${n}. Sobre "${titulo}": ${regra}. Confirme que está de acordo neste link: ${link}`;
  }
  return assinar(msg, plano);
}

// Aviso de reajuste anual para um aluno ou cliente
export function avisoReajuste({ tom, nome, servico, de, para, pct, apartir, plano }) {
  const n = primeiroNome(nome);
  let msg;
  if (tom === 'firme') msg = `Oi, ${n}. Aviso: a partir de ${apartir}, a mensalidade de ${servico} passa de ${de} para ${para} (reajuste anual de ${pct}).`;
  else if (tom === 'neutro') msg = `Oi, ${n}. Comunico com antecedência que, a partir de ${apartir}, a mensalidade de ${servico} passa de ${de} para ${para}, reajuste anual de ${pct}. Qualquer dúvida, estou à disposição.`;
  else msg = `Oi, ${n}! Tudo bem? Passando pra avisar com antecedência: a partir de ${apartir}, a mensalidade de ${servico} passa de ${de} para ${para} (reajuste anual de ${pct}). Muito obrigado pela confiança de sempre, é um prazer acompanhar você!`;
  return assinar(msg, plano);
}

// Recibo em texto, para mandar no WhatsApp
export function textoRecibo({ nome, valor, extenso, referente, data, recebedor, plano }) {
  const msg = `RECIBO\n\nRecebi de ${nome} a quantia de ${valor} (${extenso}), referente a ${referente}.\n\n${data}\n${recebedor}`;
  return assinar(msg, plano);
}
