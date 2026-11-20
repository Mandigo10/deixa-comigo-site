// Contagem de uso: registra eventos simples (sem dados pessoais) para saber onde as pessoas travam.
import { sb } from './sb.js';

export function registrar(nome, dados) {
  try {
    const pagina = (location.pathname + (location.hash || '')).replace(/[0-9a-f]{32}|[0-9a-f-]{36}/g, ':id').slice(0, 200);
    sb.from('eventos').insert({ nome, pagina, dados: dados || null }).then(() => {}, () => {});
  } catch (e) {
    // contagem nunca pode atrapalhar o app
  }
}
