// Supabase de mentira para testar as telas logadas sem rede.
const db = window.__DB__ || {};
window.__WRITES__ = [];
const pega = (r, c) => {
  const m = c.match(/^(\w+)->>(\w+)$/);
  if (m) return r[m[1]] ? r[m[1]][m[2]] : undefined;
  return r[c];
};
function consulta(tabela) {
  const filtros = []; let unico = null; let acao = null; let dados = null;
  const q = {
    select() { return q; }, order() { return q; }, limit() { return q; }, range() { return q; },
    eq(c, v) { filtros.push((r) => String(pega(r, c)) === String(v)); return q; },
    neq(c, v) { filtros.push((r) => String(pega(r, c)) !== String(v)); return q; },
    gte() { return q; }, lt() { return q; }, lte() { return q; }, in() { return q; }, is() { return q; }, not() { return q; },
    maybeSingle() { unico = 'talvez'; return q; }, single() { unico = 'um'; return q; },
    insert(o) { acao = 'insert'; dados = o; return q; }, upsert(o) { acao = 'insert'; dados = o; return q; },
    update(o) { acao = 'update'; dados = o; return q; }, delete() { acao = 'delete'; return q; },
    then(ok, erro) {
      try {
        db[tabela] = db[tabela] || [];
        let res;
        if (acao === 'insert') {
          const lista = (Array.isArray(dados) ? dados : [dados]).map((o) => ({ id: crypto.randomUUID(), criado_em: new Date().toISOString(), ...o }));
          db[tabela].push(...lista); window.__WRITES__.push({ tabela, acao, dados });
          res = Array.isArray(dados) ? lista : lista[0];
        } else {
          const linhas = db[tabela].filter((r) => filtros.every((f) => f(r)));
          if (acao === 'update') { linhas.forEach((r) => Object.assign(r, dados)); window.__WRITES__.push({ tabela, acao, dados }); }
          if (acao === 'delete') { db[tabela] = db[tabela].filter((r) => !linhas.includes(r)); window.__WRITES__.push({ tabela, acao }); }
          res = unico ? (linhas[0] || null) : linhas;
        }
        return Promise.resolve({ data: res, error: null }).then(ok, erro);
      } catch (e) { return Promise.resolve({ data: null, error: e }).then(ok, erro); }
    }
  };
  return q;
}
export function createClient() {
  const user = { id: 'u1', email: 'jader@teste.com', user_metadata: { nome: 'Jader' } };
  return {
    from: (t) => consulta(t),
    rpc: (nome, args) => { window.__WRITES__.push({ rpc: nome, args }); const r = (db.__rpc || {})[nome]; return Promise.resolve({ data: typeof r === 'function' ? r(args) : (r ?? null), error: null }); },
    auth: {
      getSession: async () => ({ data: { session: window.__SEM_LOGIN__ ? null : { user, access_token: 'x' } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}), signInWithPassword: async () => ({}), signUp: async () => ({ data: {} })
    },
    functions: { invoke: async () => ({ data: null, error: null }) },
    storage: { from: () => ({ upload: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: '' } }), remove: async () => ({}) }) }
  };
}
