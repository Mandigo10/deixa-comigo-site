// Vitrine: fotos do que está sendo oferecido (produto, presente, viagem...) nas páginas por link.
import { sb } from './sb.js';
import { esc, toast } from './util.js';
import { prepararFoto } from './boloes.js';

export const MAX_FOTOS = 8;
export function urlVitrine(caminho) {
  return `${window.DXCMG_CONFIG.SUPABASE_URL}/storage/v1/object/public/vitrine/${caminho.split('/').map(encodeURIComponent).join('/')}`;
}

export function vitrinePublicaHTML(fotos) {
  if (!fotos || !fotos.length) return '';
  return `<section class="vitrine" aria-label="Fotos">
    <div class="vitrine-trilho">${fotos.map((f, i) => `<figure>
      <a href="${esc(urlVitrine(f.caminho))}" target="_blank" rel="noopener"><img src="${esc(urlVitrine(f.caminho))}" alt="${esc(f.legenda || `Foto ${i + 1}`)}" loading="${i ? 'lazy' : 'eager'}"></a>
      ${f.legenda ? `<figcaption>${esc(f.legenda)}</figcaption>` : ''}</figure>`).join('')}</div>
    ${fotos.length > 1 ? `<p class="muted pequeno">Arraste para o lado para ver as ${fotos.length} fotos. Toque para ampliar.</p>` : '<p class="muted pequeno">Toque na foto para ampliar.</p>'}
  </section>`;
}

// Página pública: tipo = grupo | membro | cartela | comprador | bolao | cota
export async function carregarVitrinePublica(el, tipo, token) {
  if (!el) return;
  try {
    const { data } = await sb.rpc('vitrine_publica', { p_tipo: tipo, p_token: token });
    el.innerHTML = vitrinePublicaHTML(data || []);
  } catch (e) { /* sem fotos */ }
}

// Painel do organizador. alvo = combinado | cartela | bolao
const cache = new Map();
export function montarVitrineDono(el, { alvo, id, uid }) {
  if (!el) return;
  const chave = `${alvo}:${id}`;
  let enviando = '';
  const pintar = () => {
    const fotos = cache.get(chave) || [];
    el.innerHTML = `<section class="card pilha-p" aria-labelledby="t-vit-${id}">
      <h2 id="t-vit-${id}">Fotos do que você está oferecendo</h2>
      <p class="muted pequeno">Aparecem no topo da página que as pessoas abrem pelo link: o perfume, as fraldas do chá de bebê, o lugar da viagem. Até ${MAX_FOTOS} fotos.</p>
      ${fotos.length ? `<div class="vitrine-dono">${fotos.map((f) => `<div class="vit-item">
        <img src="${esc(urlVitrine(f.caminho))}" alt="${esc(f.legenda || 'Foto')}" loading="lazy">
        <label class="sr" for="leg-${f.id}">Legenda</label><input id="leg-${f.id}" data-leg="${f.id}" maxlength="80" placeholder="Legenda (opcional)" value="${esc(f.legenda || '')}">
        <button type="button" class="btn texto peq" data-tirar="${f.id}">Apagar</button></div>`).join('')}</div>` : ''}
      ${enviando ? `<p role="status"><strong>${esc(enviando)}</strong></p>` : fotos.length < MAX_FOTOS ? `<label class="btn sec peq" for="vit-arq-${id}" role="button" tabindex="0" style="align-self:flex-start">${fotos.length ? 'Adicionar mais fotos' : 'Adicionar fotos'}</label>
      <input type="file" id="vit-arq-${id}" accept="image/*" multiple hidden>` : ''}
    </section>`;
    const inp = el.querySelector(`#vit-arq-${id}`);
    if (inp) inp.addEventListener('change', () => enviar(Array.from(inp.files || [])));
    const lab = el.querySelector(`label[for="vit-arq-${id}"]`);
    if (lab) lab.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lab.click(); } });
  };
  const carregar = async () => {
    const { data } = await sb.from('vitrine_fotos').select('*').eq('alvo', alvo).eq('alvo_id', id).order('criado_em');
    cache.set(chave, data || []);
    pintar();
  };
  const enviar = async (arquivos) => {
    const livres = MAX_FOTOS - (cache.get(chave) || []).length;
    const lista = arquivos.slice(0, livres);
    if (arquivos.length > livres) toast(`Cabem só mais ${livres} ${livres === 1 ? 'foto' : 'fotos'}.`, 'erro');
    let falhas = 0;
    for (let i = 0; i < lista.length; i++) {
      enviando = `Enviando foto ${i + 1} de ${lista.length}…`; pintar();
      try {
        const foto = await prepararFoto(lista[i], 1400);
        const caminho = `${uid}/${alvo}/${id}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from('vitrine').upload(caminho, foto.blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw up.error;
        const { error } = await sb.from('vitrine_fotos').insert({ alvo, alvo_id: id, caminho });
        if (error) { sb.storage.from('vitrine').remove([caminho]).then(() => {}); throw error; }
      } catch (e) { console.error(e); falhas++; }
    }
    enviando = '';
    if (falhas) toast(falhas === 1 ? 'Uma foto não foi enviada. Tente de novo.' : `${falhas} fotos não foram enviadas. Tente de novo.`, 'erro');
    else if (lista.length) toast(lista.length === 1 ? 'Foto adicionada.' : 'Fotos adicionadas.');
    await carregar();
  };
  el.onclick = async (e) => {
    const b = e.target.closest('[data-tirar]');
    if (!b) return;
    if (!window.confirm('Apagar esta foto?')) return;
    const f = (cache.get(chave) || []).find((x) => x.id === b.dataset.tirar);
    const { error } = await sb.from('vitrine_fotos').delete().eq('id', f.id);
    if (error) { toast('Não deu certo agora.', 'erro'); return; }
    sb.storage.from('vitrine').remove([f.caminho]).then(() => {});
    await carregar();
  };
  el.onchange = async (e) => {
    const inp = e.target.closest('[data-leg]');
    if (!inp) return;
    const legenda = inp.value.trim() || null;
    const { error } = await sb.from('vitrine_fotos').update({ legenda }).eq('id', inp.dataset.leg);
    if (error) { toast('Não consegui salvar a legenda.', 'erro'); return; }
    const f = (cache.get(chave) || []).find((x) => x.id === inp.dataset.leg);
    if (f) f.legenda = legenda;
    toast('Legenda salva.');
  };
  if (cache.has(chave)) pintar();
  carregar();
}
