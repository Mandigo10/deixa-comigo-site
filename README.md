# Deixa Comigo — site (landing pages)

- `public/index.html` (`/`) — landing page principal (carona, empréstimo, racha)
- `public/autonomos/` (`/autonomos/`) — landing page para autônomos
- `config.js` — URL e chave PÚBLICA do Supabase (projeto "Deixa Comigo")
- `app.js` — formulário da lista de espera, cliques nos planos, seletor de tom e simulador de reajuste

Hospedagem: Cloudflare Workers (arquivos estáticos em `public/`, configurados em `wrangler.jsonc`).
Comando de deploy: `npx wrangler deploy` — sem comando de build.
Cada alteração na branch `main` é publicada automaticamente.

## App (versão 1)

- `public/app/` — app em `/app/` (login, painel, carona, empréstimo, racha, mensagens, lembretes)
- `public/p/` — página pública de pagamento em `/p/?t=<token>` (extrato, Pix copia e cola, QR code, "Já paguei")
- `public/js/` — módulos compartilhados (Supabase, Pix BR Code, mensagens, utilidades)
- `public/css/app.css` — estilo do app

Sem etapa de build: os módulos JavaScript rodam direto no navegador; a biblioteca do Supabase vem do esm.sh.
Banco: projeto Supabase "Deixa Comigo" (tabelas `perfis`, `cobrancas`, `participantes`, com RLS;
funções públicas `cobranca_publica` e `avisar_pagamento`, que só funcionam com o token secreto do link).
