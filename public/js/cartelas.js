// Cartelas de números ou nomes (sem prêmio e sem sorteio).
import { brl, primeiroNome } from './util.js';

export function rotulo(cartela, n) {
  if (cartela.modo === 'nomes') {
    const lista = Array.isArray(cartela.nomes) ? cartela.nomes : [];
    return lista[n - 1] || String(n);
  }
  return String(n).padStart(String(cartela.quantidade).length, '0');
}

export function valorDe(cartela, n) {
  return cartela.valor_modo === 'numero' ? Math.round(n * Number(cartela.valor) * 100) / 100 : Number(cartela.valor);
}

export function textoValor(cartela) {
  if (cartela.valor_modo === 'numero') {
    return Number(cartela.valor) === 1 ? 'O número que você escolher é o valor, em reais' : `Cada número vale ${brl(cartela.valor)} vezes o número escolhido`;
  }
  return `${brl(cartela.valor)} por ${cartela.modo === 'nomes' ? 'nome' : 'número'}`;
}

export function mensagemCartela({ nome, titulo, itens, total, link, plano }) {
  const n = primeiroNome(nome);
  let msg = `Oi, ${n}! Na cartela "${titulo}" você ficou com: ${itens}. Total: ${total}. O Pix está aqui: ${link}`;
  if (!plano || plano === 'gratis') msg += '\n\nenviado por dx cmg · Deixa Comigo';
  return msg;
}

export function divulgacaoCartela({ titulo, valor, link, plano }) {
  let msg = `Escolha o seu na cartela "${titulo}" (${valor}). É só tocar no link, escolher e pagar com Pix: ${link}`;
  if (!plano || plano === 'gratis') msg += '\n\nenviado por dx cmg · Deixa Comigo';
  return msg;
}

export const AVISO_LEGAL = 'A cartela serve para organizar contribuições e vendas. Não use para rifas ou sorteios de prêmios: no Brasil eles precisam de autorização do Ministério da Fazenda.';
