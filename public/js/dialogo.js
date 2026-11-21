// Janelas de confirmação e pergunta no visual do Deixa Comigo
// (no lugar de window.confirm/prompt, que mostram o endereço do site no topo).
import { esc } from './util.js';

let estilo = false;
function prepararEstilo() {
  if (estilo) return;
  estilo = true;
  const s = document.createElement('style');
  s.textContent = `
  .dlg-fundo { position: fixed; inset: 0; background: rgba(22,20,31,.55); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; padding: 16px; animation: dlgEntra .15s ease-out; }
  @media (min-width: 600px) { .dlg-fundo { align-items: center; } }
  .dlg { background: #fff; color: #16141F; width: 100%; max-width: 440px; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 20px 50px rgba(22,20,31,.3); font-family: Inter, system-ui, sans-serif; }
  .dlg h2 { margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.35rem; letter-spacing: -0.02em; }
  .dlg p { margin: 0; color: #4A4659; line-height: 1.5; white-space: pre-line; }
  .dlg input { min-height: 48px; border-radius: 14px; border: 2px solid #D8D4E6; padding: 0 14px; font: inherit; font-size: 1rem; }
  .dlg input:focus { outline: 3px solid #DCD6FF; border-color: #4B2FE0; }
  .dlg .dlg-acoes { display: flex; gap: 10px; flex-wrap: wrap-reverse; justify-content: flex-end; margin-top: 4px; }
  .dlg button { min-height: 48px; padding: 0 20px; border-radius: 14px; border: 0; font: inherit; font-weight: 700; cursor: pointer; flex: 1 1 140px; }
  .dlg .dlg-nao { background: #F4F2FB; color: #16141F; }
  .dlg .dlg-sim { background: #4B2FE0; color: #fff; }
  .dlg .dlg-sim.perigo { background: #B42318; }
  @keyframes dlgEntra { from { opacity: 0; } to { opacity: 1; } }`;
  document.head.appendChild(s);
}

function abrir({ titulo, texto, ok = 'Confirmar', cancelar = 'Cancelar', perigo = false, campo = null }) {
  prepararEstilo();
  return new Promise((resolver) => {
    const anterior = document.activeElement;
    const fundo = document.createElement('div');
    fundo.className = 'dlg-fundo';
    fundo.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <h2 id="dlg-t">${esc(titulo)}</h2>
      ${texto ? `<p>${esc(texto)}</p>` : ''}
      ${campo ? `<input id="dlg-campo" value="${esc(campo.valor || '')}" inputmode="${campo.modo || 'text'}" aria-label="${esc(titulo)}">` : ''}
      <div class="dlg-acoes">
        ${cancelar ? `<button type="button" class="dlg-nao">${esc(cancelar)}</button>` : ''}
        <button type="button" class="dlg-sim ${perigo ? 'perigo' : ''}">${esc(ok)}</button>
      </div></div>`;
    document.body.appendChild(fundo);
    const input = fundo.querySelector('#dlg-campo');
    const fechar = (valor) => {
      fundo.remove();
      document.removeEventListener('keydown', teclas);
      if (anterior && anterior.focus) anterior.focus();
      resolver(valor);
    };
    const sim = () => fechar(campo ? input.value : true);
    const nao = () => fechar(campo ? null : false);
    const teclas = (e) => {
      if (e.key === 'Escape') nao();
      if (e.key === 'Enter' && (campo || document.activeElement === fundo.querySelector('.dlg-sim'))) { e.preventDefault(); sim(); }
    };
    document.addEventListener('keydown', teclas);
    fundo.querySelector('.dlg-sim').addEventListener('click', sim);
    const b = fundo.querySelector('.dlg-nao'); if (b) b.addEventListener('click', nao);
    fundo.addEventListener('click', (e) => { if (e.target === fundo) nao(); });
    (input || fundo.querySelector('.dlg-sim')).focus();
    if (input) input.select();
  });
}

// Separa "Pergunta? Explicação." em título curto + texto
function partir(msg) {
  const m = String(msg).match(/^(.+?\?)\s+([\s\S]+)$/);
  return m ? { titulo: m[1], texto: m[2] } : { titulo: String(msg), texto: '' };
}

export function confirmar(msg, opcoes = {}) {
  const { titulo, texto } = partir(msg);
  const perigo = opcoes.perigo ?? /^(Apagar|Cancelar|Tirar|Encerrar|Liberar)/.test(titulo);
  const verbo = (titulo.match(/^(Apagar|Cancelar|Tirar|Encerrar|Liberar|Fechar|Trocar)/) || [])[1];
  return abrir({ titulo, texto, perigo, ok: opcoes.ok || (verbo ? (verbo === 'Cancelar' ? 'Sim, cancelar' : verbo) : 'Confirmar'), cancelar: opcoes.cancelar || (verbo === 'Cancelar' ? 'Voltar' : 'Cancelar') });
}

export function perguntar(msg, valor = '', opcoes = {}) {
  const { titulo, texto } = partir(msg);
  return abrir({ titulo: opcoes.titulo || titulo, texto: opcoes.titulo ? msg : texto, ok: opcoes.ok || 'Salvar', campo: { valor, modo: opcoes.modo } });
}

export function avisar(titulo, texto = '', ok = 'Entendi') {
  return abrir({ titulo, texto, ok, cancelar: null });
}
