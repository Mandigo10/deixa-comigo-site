# Deixa Comigo (DX CMG) — contexto do projeto

Leia este arquivo inteiro antes de mexer em qualquer coisa. Ele resume o que foi construído e decidido até 20/11/2026.

## Quem é o dono e como trabalhar
- Dono: Jader (fala português, mora no Brasil). É um negócio paralelo dele: um app que tira o constrangimento de cobrar as pessoas.
- Responda e escreva tudo em **português do Brasil**, em linguagem simples (ele não é programador).
- Ele pediu para **não pedir autorização a cada comando**: rode, teste e publique sozinho. Pergunte antes só de: gastar dinheiro, criar contas, apagar dados reais de usuários, ou decisões de produto que mudam regra de negócio.
- **Nunca** publique ou guarde o CPF do dono (foi tirado de propósito dos termos). **Nunca** digite senhas em sites. Chaves de API (Resend, Anthropic, Mercado Pago) quem cola é ele, no painel; não peça a chave no chat.

## Ideia do produto
"Combinou antes, deixa que o app cobra." A pessoa combina regras antes (carona, vaquinha, viagem parcelada, mensalidade, venda parcelada, cartela, bolão) e o app manda as cobranças pelo WhatsApp com Pix na data. O app **não recebe nem guarda dinheiro**: o Pix vai direto para quem organiza (BR Code gerado no navegador).
- Planos: Grátis (assinatura "enviado por dx cmg" nas mensagens, limites), Plus R$ 9,90 e Autônomo R$ 24,90 "em breve" (sem cobrança implementada; coluna `perfis.plano`, protegida por trigger `proteger_plano`).
- Legal: não fazer rifa/sorteio com prêmio (precisa autorização do Ministério da Fazenda) nem consórcio (Banco Central). Cartela = só números, sem sorteio. Bolão = dividir apostas oficiais da CAIXA, sem taxa, com aviso legal (`AVISO_BOLAO`).

## Infra
- Código: GitHub `Mandigo10/deixa-comigo-site`, branch `main`. Site estático sem build (HTML + ES modules) em `public/`.
- Deploy: Cloudflare Workers (static assets, `wrangler.jsonc`), automático a cada push no `main` (~2–3 min). Para saber se terminou: `gh api repos/Mandigo10/deixa-comigo-site/commits/<sha>/check-runs`.
- URL atual: https://deixa-comigo-site.jader-gabriel.workers.dev (domínio próprio ainda não comprado).
- Supabase: projeto `tieenhbhjyybemnjvcfh` ("Deixa Comigo", região sa-east-1). URL e chave publicável em `public/config.js` (a publicável pode ser pública).
- Auth: e-mail e senha, "Confirm email" desligado. SMTP do Resend e URL Configuration (Site URL e Redirect `.../app/`) ainda precisam ser configurados pelo dono.
- Edge functions (código em `supabase/functions/`):
  - `apagar-conta` (verify_jwt true).
  - `resultado-loteria` (verify_jwt false): busca resultado na API da CAIXA (bloqueia nosso servidor, 403) e, como reserva, em `loteriascaixa-api.herokuapp.com` (API comunitária). Guarda em `resultados_loteria`. Aceita `{loteria, concurso?}` ou `{loteria:'todas'}`.
  - `ler-canhoto` (verify_jwt false, checa o usuário por conta própria): lê foto do canhoto com Claude (visão). Precisa do secret `ANTHROPIC_API_KEY` (ainda não configurado); sem ele o app usa OCR no celular (Tesseract.js).
- `pg_net` habilitado: dá para testar edge functions por SQL (`net.http_post` e depois `net._http_response`), porque o terminal não alcança o Supabase.
- **Cuidado:** comandos SQL destrutivos (drop, delete, alterar constraint) disparam confirmação no Supabase que expira. Prefira migrações aditivas: novas colunas, políticas restritivas, funções novas `_v2` em vez de alterar as antigas.

## Estrutura do código
- `public/index.html` landing; `public/autonomos/`, `public/calculadoras/`, `public/termos/`, `public/privacidade/`, `public/ajuda/`, `public/resultados/` (resultados das loterias).
- `public/app/app.js` o app (SPA com rotas por hash): painel, combinados, cobranças, venda, cartela, **bolão** (`telaFormBolao`, `telaBolao`), resumo, calculadoras, conta.
- Páginas públicas por link com token de 32 caracteres hex: `/p/` cobrança, `/topo/` aceitar combinado, `/g/` entrar em lista, `/n/` cartela, `/b/` bolão (`?t=` entrada, `?c=` cota).
- `public/js/`: `util.js` (formatação, máscaras de telefone/CPF/CNPJ), `pix.js` (BR Code + CRC16), `mensagens.js`, `combinados.js`, `cartelas.js`, `boloes.js` (regras das loterias, conferência com prêmio de apostas com mais dezenas, cartela de números, Surpresinha, OCR), `calculadoras.js`, `eventos.js` (métricas de uso na tabela `eventos`).

## Banco (principais)
- `perfis`, `cobrancas` + `participantes`, `combinados` + `combinado_membros` (`gerar_cobrancas_v2`), `cartelas` + `cartela_itens`, `boloes` + `bolao_cotas` + `bolao_jogos` + `bolao_fotos` (bucket público `canhotos`) + `bolao_palpites`, `resultados_loteria`, `eventos`, `feedbacks`, `lista_espera`, `cliques_plano`.
- RLS: dono vê só o que é dele. Páginas públicas só usam funções SECURITY DEFINER por token: `cobranca_publica_v2`, `avisar_pagamento`, `combinado_publico_v2`, `aceitar_combinado`, `grupo_publico`, `entrar_grupo`, `cartela_publica`, `reservar_cartela`, `comprador_cartela`, `avisar_pagamento_cartela`, `bolao_publico_v2`, `entrar_bolao`, `cota_bolao`, `avisar_pagamento_bolao`, `palpites_cota`, `salvar_palpites`.
- Bolão: conferência automática liberada para todos até 31/01/2027 (`conferencia_liberada` no banco e `CONFERENCIA_GRATIS_ATE` em `boloes.js`); depois, só plano pago.

## Dados de teste (apagar antes do lançamento)
- Conta `teste@exemplo.com` ("Teste Claude") com bolões, cartela e cobranças com "TESTE" no nome. O dono apaga em Supabase → Authentication.

## Pendências para o lançamento
1. Domínio próprio (registro.br) → trocar URLs, Site URL/Redirects do Supabase e remetente do Resend.
2. Dono configurar SMTP do Resend no Supabase e a URL Configuration.
3. Imagem de prévia dos links (og:image).
4. Dono testar no celular as telas do dono do bolão (criar, lista para a lotérica, foto do canhoto) — só foram testadas as páginas públicas.
5. (Opcional) chave Anthropic para a leitura do canhoto por IA.
6. Apagar dados de teste.
7. **Integração Mercado Pago** (abaixo).

## Próximo grande passo: Mercado Pago (pedido do dono em 20/11/2026)
Objetivo: o botão "Já paguei" deixa de ser manual. Quando o Pix é pago, o webhook do Mercado Pago confirma e o status muda sozinho para quem paga e para quem recebe.
Plano combinado (ainda não feito):
- Para o dinheiro continuar indo **direto para quem organiza** (o app não pode virar intermediário de pagamento), cada organizador conecta a **própria conta Mercado Pago** por OAuth. Guardar tokens só no servidor (tabela com RLS fechada ou cofre), nunca no navegador.
- Ao abrir a página de pagamento, uma edge function cria a cobrança Pix na conta do organizador (Payments API, com `external_reference` = token da cota/participante/item e `notification_url` do webhook) e devolve o copia-e-cola e o QR.
- Edge function `webhook-mercadopago`: valida a assinatura (`x-signature`), consulta o pagamento na API com o token do organizador (nunca confiar só no corpo do webhook) e, se aprovado, marca como pago em `participantes` / `cartela_itens` / `bolao_cotas` (pago_em, valor_pago). Precisa ser idempotente (o mesmo aviso pode chegar mais de uma vez).
- Atualização ao vivo: Supabase Realtime (ou nova consulta a cada poucos segundos) na página do pagador e no app do organizador.
- Manter o Pix direto (sem Mercado Pago) como opção para quem não conectar a conta.
- Antes de construir: conferir na documentação atual do Mercado Pago o OAuth, os webhooks e as tarifas do Pix, e decidir com o dono se é recurso do plano pago.

### Ideia do dono (20/11/2026): dinheiro reservado até fechar a lista
O dono quer que o dinheiro pago fique retido (nem o organizador mexe) e só seja liberado de uma vez quando a lista enche ou quando ele encerra; se cancelar, devolve. Conclusão da conversa:
- O app **não pode** guardar o dinheiro na conta dele (isso é serviço de pagamento regulado pelo Banco Central, Lei 12.865/2013).
- Caminho viável: provedor com custódia para subcontas, por exemplo a **Conta Escrow do Asaas** (retém o valor até a liberação manual pela API ou até o prazo configurado; mensalidade por subconta). Cada organizador teria uma subconta (cadastro com documentos).
- A conferir antes: se o provedor aceita bolão/loteria, se exige CNPJ da plataforma, tarifas, prazo máximo de retenção, como devolver. Comparar com o Mercado Pago.
