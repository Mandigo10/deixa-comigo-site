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
