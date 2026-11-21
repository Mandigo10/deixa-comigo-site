// Contatos: lista do usuário, autocompletar nos formulários, importação e janela de edição.
import { esc, soDigitos, formatarTelefone } from './util.js';

// Entre vários telefones, prefere o celular (11 dígitos), que é o que tem WhatsApp.
export function melhorTelefone(lista) {
  const ok = (lista || []).map(telefoneBR).filter(Boolean);
  return ok.find((t) => t.length === 11) || ok[0] || '';
}

// Telefone brasileiro só com DDD + número (10 ou 11 dígitos). Tira +55 e zeros de operadora.
export function telefoneBR(t) {
  let d = soDigitos(t);
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  if (d.length > 11) d = d.slice(-11);
  return d.length === 10 || d.length === 11 ? d : '';
}

export function datalistHTML(contatos) {
  return `<datalist id="dl-contatos">${(contatos || []).map((c) => `<option value="${esc(c.nome)}">${esc(formatarTelefone(c.telefone))}</option>`).join('')}</datalist>`;
}

// Ao escolher um nome da lista, preenche o WhatsApp da mesma linha (se estiver vazio).
export function ligarAutocompletar(raiz, contatos) {
  const achar = (nome) => {
    const n = nome.trim().toLowerCase();
    return n ? contatos().find((c) => c.nome.trim().toLowerCase() === n) : null;
  };
  const alvo = (el) => {
    if (el.dataset.contatoTel) return raiz.querySelector(el.dataset.contatoTel);
    if (el.dataset.lista && el.dataset.k === 'nome') return raiz.querySelector(`[data-lista="${el.dataset.lista}"][data-i="${el.dataset.i}"][data-k="telefone"]`);
    return null;
  };
  const tratar = (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || el.getAttribute('list') !== 'dl-contatos') return;
    const c = achar(el.value);
    const t = c && alvo(el);
    if (t && !soDigitos(t.value)) {
      t.value = formatarTelefone(c.telefone);
      t.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  raiz.addEventListener('change', tratar);
  raiz.addEventListener('input', tratar);
}

// ---------- importação ----------
function linhasCSV(texto) {
  const linhas = []; let campo = ''; let linha = []; let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (ch === '"') aspas = false; else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === ',') { linha.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && texto[i + 1] === '\n') i++; linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else campo += ch;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((x) => x.trim()));
}

// Arquivo exportado do Google Contatos (CSV) ou de qualquer agenda (vCard .vcf).
export function lerArquivoContatos(texto) {
  const saida = [];
  const t = String(texto || '').replace(/^﻿/, '');
  if (/BEGIN:VCARD/i.test(t)) {
    t.split(/END:VCARD/i).forEach((bloco) => {
      const des = bloco.replace(/\r?\n[ \t]/g, '');
      const fn = (des.match(/^FN[^:\n]*:(.+)$/im) || [])[1];
      const n = (des.match(/^N[;:][^\n]*$/im) || [])[0];
      let nome = (fn || '').trim();
      if (!nome && n) { const p = n.replace(/^N[^:]*:/i, '').split(';'); nome = [p[1], p[0]].filter(Boolean).join(' ').trim(); }
      const tels = [...des.matchAll(/^TEL[^:\n]*:(.+)$/gim)].map((m) => m[1]);
      const tel = melhorTelefone(tels);
      if (nome && tel) saida.push({ nome, telefone: tel });
    });
    return saida;
  }
  const linhas = linhasCSV(t);
  if (linhas.length < 2) return saida;
  const cab = linhas[0].map((h) => h.trim().toLowerCase());
  const col = (...nomes) => cab.findIndex((h) => nomes.includes(h));
  const iNome = col('name', 'nome', 'display name', 'nome de exibição');
  const iPri = col('first name', 'given name', 'nome próprio', 'primeiro nome');
  const iMeio = col('middle name', 'additional name', 'nome do meio');
  const iSob = col('last name', 'family name', 'sobrenome');
  const iTels = cab.map((h, i) => (/phone.*value|telefone.*valor|^phone|^telefone|celular|mobile/.test(h) ? i : -1)).filter((i) => i >= 0);
  linhas.slice(1).forEach((l) => {
    let nome = iNome >= 0 ? (l[iNome] || '').trim() : '';
    if (!nome) nome = [iPri, iMeio, iSob].filter((i) => i >= 0).map((i) => (l[i] || '').trim()).filter(Boolean).join(' ');
    const tel = melhorTelefone(iTels.flatMap((i) => String(l[i] || '').split(':::')));
    if (nome && tel) saida.push({ nome: nome.slice(0, 80), telefone: tel });
  });
  return saida;
}

export const temAgendaDoCelular = () => 'contacts' in navigator && 'ContactsManager' in window;
export async function contatosDoCelular() {
  const lista = await navigator.contacts.select(['name', 'tel'], { multiple: true });
  return lista.map((c) => ({ nome: ((c.name || [])[0] || '').trim().slice(0, 80), telefone: melhorTelefone(c.tel) }))
    .filter((c) => c.nome && c.telefone);
}

// ---------- janela para editar nome e WhatsApp ----------
export function editarPessoa({ titulo = 'Editar', nome = '', telefone = '', exigirTelefone = false } = {}) {
  return new Promise((resolver) => {
    const d = document.createElement('dialog');
    d.className = 'janela';
    d.innerHTML = `<form method="dialog" class="pilha" novalidate>
      <h2>${esc(titulo)}</h2>
      <div class="campo"><label for="ed-nome">Nome</label><input id="ed-nome" maxlength="60" value="${esc(nome)}" list="dl-contatos" data-contato-tel="#ed-tel" autocomplete="off"></div>
      <div class="campo"><label for="ed-tel">WhatsApp</label><input id="ed-tel" type="tel" inputmode="tel" maxlength="20" value="${esc(formatarTelefone(telefone || ''))}" placeholder="(11) 98765-4321"></div>
      <p class="erro" id="ed-msg" role="alert"></p>
      <div class="acoes"><button class="btn" value="ok">Salvar</button><button class="btn sec" value="cancelar" formnovalidate>Cancelar</button></div>
    </form>`;
    document.body.appendChild(d);
    const fechar = (v) => { d.close(); d.remove(); resolver(v); };
    d.querySelector('form').addEventListener('submit', (e) => {
      const botao = e.submitter && e.submitter.value;
      if (botao !== 'ok') { e.preventDefault(); fechar(null); return; }
      e.preventDefault();
      const n = d.querySelector('#ed-nome').value.trim();
      const tel = soDigitos(d.querySelector('#ed-tel').value);
      const msg = d.querySelector('#ed-msg');
      if (n.length < 2) { msg.textContent = 'Diga o nome.'; return; }
      if ((tel || exigirTelefone) && (tel.length < 10 || tel.length > 13)) { msg.textContent = 'Confira o WhatsApp, com DDD.'; return; }
      fechar({ nome: n, telefone: tel || null });
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); fechar(null); });
    d.showModal();
    d.querySelector('#ed-nome').focus();
  });
}

// ---------- importação direta da conta Google (People API) ----------
// Só funciona quando o dono do app configura GOOGLE_CLIENT_ID em /config.js.
export const googleClientId = () => (window.DXCMG_CONFIG || {}).GOOGLE_CLIENT_ID || '';
let gsi = null;
export function prepararGoogle() {
  if (!googleClientId() || gsi) return gsi;
  gsi = new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => ok(window.google); s.onerror = () => { gsi = null; erro(new Error('google_script')); };
    document.head.appendChild(s);
  });
  return gsi;
}
export async function contatosDoGoogle() {
  const g = await prepararGoogle();
  const token = await new Promise((ok, erro) => {
    const cliente = g.accounts.oauth2.initTokenClient({
      client_id: googleClientId(),
      scope: 'https://www.googleapis.com/auth/contacts.readonly',
      callback: (r) => (r && r.access_token ? ok(r.access_token) : erro(new Error((r && r.error) || 'google_negado'))),
      error_callback: (e) => erro(new Error((e && e.type) || 'google_fechado'))
    });
    cliente.requestAccessToken();
  });
  const saida = []; let pagina = '';
  try {
    do {
      const u = new URL('https://people.googleapis.com/v1/people/me/connections');
      u.searchParams.set('personFields', 'names,phoneNumbers');
      u.searchParams.set('pageSize', '1000');
      if (pagina) u.searchParams.set('pageToken', pagina);
      const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`google_${r.status}`);
      const j = await r.json();
      (j.connections || []).forEach((p) => {
        const nome = (((p.names || [])[0] || {}).displayName || '').trim();
        const tel = melhorTelefone((p.phoneNumbers || []).map((x) => x.canonicalForm || x.value));
        if (nome && tel) saida.push({ nome: nome.slice(0, 80), telefone: tel });
      });
      pagina = j.nextPageToken || '';
    } while (pagina);
  } finally {
    try { g.accounts.oauth2.revoke(token, () => {}); } catch (e) { /* sem problema */ }
  }
  return saida;
}

// ---------- escolher contato nos formulários ----------
// Em todo campo de nome com list="dl-contatos": botão de agenda dentro do campo (abre a lista com busca)
// e sugestões enquanto digita. Ao escolher, preenche nome e WhatsApp; o usuário só confere e salva.
let estiloSeletor = false;
function prepararEstiloSeletor() {
  if (estiloSeletor) return;
  estiloSeletor = true;
  const s = document.createElement('style');
  s.textContent = `
  .com-contato { position: relative; display: block; }
  .com-contato > input { padding-right: 52px; width: 100%; box-sizing: border-box; }
  .bt-contatos { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 44px; height: 40px; border: 0; border-radius: 10px; background: #F4F2FB; color: #4B2FE0; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .bt-contatos:hover { background: #DCD6FF; }
  .sugestoes { position: absolute; left: 0; min-width: min(280px, 85vw); right: 0; top: calc(100% + 4px); background: #fff; border: 2px solid #16141F; border-radius: 14px; margin: 0; padding: 4px; list-style: none; z-index: 50; max-height: 260px; overflow: auto; box-shadow: 0 12px 30px rgba(22,20,31,.15); }
  .sugestoes button, .sel-lista button { width: 100%; text-align: left; background: none; border: 0; border-radius: 10px; padding: 10px 12px; font: inherit; color: #16141F; cursor: pointer; display: flex; flex-direction: column; gap: 2px; min-height: 48px; justify-content: center; }
  .sugestoes button:hover, .sugestoes button:focus, .sel-lista button:hover, .sel-lista button:focus { background: #F4F2FB; outline: none; }
  .sugestoes small, .sel-lista small { color: #57536A; }
  .sel-fundo { position: fixed; inset: 0; background: rgba(22,20,31,.55); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
  @media (min-width: 600px) { .sel-fundo { align-items: center; } }
  .sel { background: #fff; width: 100%; max-width: 480px; max-height: 85vh; border-radius: 24px 24px 0 0; padding: 20px 16px calc(16px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px; font-family: Inter, system-ui, sans-serif; }
  @media (min-width: 600px) { .sel { border-radius: 24px; } }
  .sel h2 { margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.3rem; }
  .sel input[type=search] { min-height: 48px; border-radius: 14px; border: 2px solid #D8D4E6; padding: 0 14px; font: inherit; font-size: 1rem; }
  .sel-lista { list-style: none; margin: 0; padding: 0; overflow: auto; flex: 1 1 auto; min-height: 120px; }
  .sel-topo { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .sel-fechar { border: 0; background: #F4F2FB; border-radius: 10px; min-height: 40px; padding: 0 14px; font: inherit; font-weight: 600; cursor: pointer; }
  .sel-celular { min-height: 48px; border-radius: 14px; border: 2px solid #16141F; background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
  .preenchido { animation: preenchido 1.2s ease-out; }
  @keyframes preenchido { from { background: #E9FBC2; } to { background: #fff; } }`;
  document.head.appendChild(s);
}
const ICONE_AGENDA = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="15" height="18" rx="2"/><circle cx="11.5" cy="10" r="2.6"/><path d="M7.5 17a4 4 0 0 1 8 0"/><path d="M19 7h2M19 12h2M19 17h2"/></svg>';
const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function filtrar(lista, termo, max) {
  const b = semAcento(termo).trim(); const d = soDigitos(termo);
  if (!b && !d) return lista.slice(0, max);
  return lista.filter((c) => semAcento(c.nome).includes(b) || (d.length >= 3 && String(c.telefone).includes(d))).slice(0, max);
}
function campoTelefoneDe(raiz, el) {
  if (el.dataset.contatoTel) return (el.closest('dialog, form, .dlg, main') || raiz).querySelector(el.dataset.contatoTel) || raiz.querySelector(el.dataset.contatoTel);
  if (el.dataset.lista && el.dataset.k === 'nome') return raiz.querySelector(`[data-lista="${el.dataset.lista}"][data-i="${el.dataset.i}"][data-k="telefone"]`);
  return null;
}
function preencher(raiz, el, c) {
  el.value = c.nome;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.classList.remove('preenchido'); void el.offsetWidth; el.classList.add('preenchido');
  const t = campoTelefoneDe(raiz, el);
  if (t && c.telefone) {
    t.value = formatarTelefone(c.telefone);
    t.dispatchEvent(new Event('input', { bubbles: true }));
    t.dispatchEvent(new Event('change', { bubbles: true }));
    t.classList.remove('preenchido'); void t.offsetWidth; t.classList.add('preenchido');
  }
}
function abrirLista(contatos, { doCelular } = {}) {
  prepararEstiloSeletor();
  return new Promise((resolver) => {
    const fundo = document.createElement('div');
    fundo.className = 'sel-fundo';
    fundo.innerHTML = `<div class="sel" role="dialog" aria-modal="true" aria-labelledby="sel-t">
      <div class="sel-topo"><h2 id="sel-t">Escolher contato</h2><button type="button" class="sel-fechar">Fechar</button></div>
      <input type="search" placeholder="Buscar por nome ou número" aria-label="Buscar contato" autocomplete="off">
      ${doCelular ? '<button type="button" class="sel-celular">Abrir a agenda do celular</button>' : ''}
      <ul class="sel-lista" role="listbox"></ul>
    </div>`;
    (document.querySelector('dialog[open]') || document.body).appendChild(fundo);
    const busca = fundo.querySelector('input'); const ul = fundo.querySelector('.sel-lista');
    const fechar = (v) => { fundo.remove(); document.removeEventListener('keydown', esc2); resolver(v); };
    const esc2 = (e) => { if (e.key === 'Escape') fechar(null); };
    document.addEventListener('keydown', esc2);
    const desenhar = () => {
      const fs = filtrar(contatos, busca.value, 300);
      ul.innerHTML = fs.length ? fs.map((c, i) => `<li><button type="button" data-i="${i}"><strong>${esc(c.nome)}</strong><small>${esc(formatarTelefone(c.telefone))}</small></button></li>`).join('')
        : `<li class="muted" style="padding: 12px">${contatos.length ? 'Ninguém com esse nome.' : 'Você ainda não tem contatos salvos. Importe em Conta → Meus contatos.'}</li>`;
      ul.querySelectorAll('button[data-i]').forEach((b) => b.addEventListener('click', () => fechar(fs[Number(b.dataset.i)])));
    };
    busca.addEventListener('input', desenhar);
    fundo.querySelector('.sel-fechar').addEventListener('click', () => fechar(null));
    fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(null); });
    const bc = fundo.querySelector('.sel-celular');
    if (bc) bc.addEventListener('click', async () => {
      try {
        const r = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        const c = r && r[0];
        if (c) fechar({ nome: ((c.name || [])[0] || '').trim().slice(0, 80), telefone: melhorTelefone(c.tel), daAgenda: true });
      } catch (e) { /* cancelou */ }
    });
    desenhar();
    if (window.matchMedia('(min-width: 600px)').matches) busca.focus();
  });
}
export function ligarSeletorContatos(raiz, contatos, { aoImportar } = {}) {
  prepararEstiloSeletor();
  const decorar = () => {
    raiz.querySelectorAll('input[list="dl-contatos"]').forEach((el) => {
      if (el.dataset.seletor) return;
      el.dataset.seletor = '1';
      el.removeAttribute('list');
      el.setAttribute('autocomplete', 'off');
      const envolve = document.createElement('span');
      envolve.className = 'com-contato';
      el.parentNode.insertBefore(envolve, el);
      envolve.appendChild(el);
      const bt = document.createElement('button');
      bt.type = 'button'; bt.className = 'bt-contatos'; bt.innerHTML = ICONE_AGENDA;
      bt.setAttribute('aria-label', 'Escolher dos meus contatos');
      envolve.appendChild(bt);
      let ul = null;
      const fecharSug = () => { if (ul) { ul.remove(); ul = null; } };
      bt.addEventListener('click', async () => {
        fecharSug();
        const c = await abrirLista(contatos(), { doCelular: 'contacts' in navigator && 'ContactsManager' in window });
        if (!c || !c.nome) return;
        preencher(raiz, el, c);
        if (c.daAgenda && aoImportar) aoImportar(c);
      });
      el.addEventListener('input', () => {
        fecharSug();
        if (document.activeElement !== el || el.value.trim().length < 2) return;
        const fs = filtrar(contatos(), el.value, 6).filter((c) => semAcento(c.nome) !== semAcento(el.value));
        if (!fs.length) return;
        ul = document.createElement('ul'); ul.className = 'sugestoes'; ul.setAttribute('role', 'listbox');
        ul.innerHTML = fs.map((c, i) => `<li><button type="button" data-i="${i}"><strong>${esc(c.nome)}</strong><small>${esc(formatarTelefone(c.telefone))}</small></button></li>`).join('');
        ul.querySelectorAll('button').forEach((b) => b.addEventListener('mousedown', (e) => { e.preventDefault(); preencher(raiz, el, fs[Number(b.dataset.i)]); fecharSug(); }));
        envolve.appendChild(ul);
      });
      el.addEventListener('blur', () => setTimeout(fecharSug, 150));
      el.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharSug(); });
    });
  };
  decorar();
  new MutationObserver(decorar).observe(raiz, { childList: true, subtree: true });
}
