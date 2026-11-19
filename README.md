# Deixa Comigo — site (landing pages)

- `public/index.html` (`/`) — landing page principal (carona, empréstimo, racha)
- `public/autonomos/` (`/autonomos/`) — landing page para autônomos
- `config.js` — URL e chave PÚBLICA do Supabase (projeto "Deixa Comigo")
- `app.js` — formulário da lista de espera, cliques nos planos, seletor de tom e simulador de reajuste

Hospedagem: Cloudflare Workers (arquivos estáticos em `public/`, configurados em `wrangler.jsonc`).
Comando de deploy: `npx wrangler deploy` — sem comando de build.
Cada alteração na branch `main` é publicada automaticamente.
