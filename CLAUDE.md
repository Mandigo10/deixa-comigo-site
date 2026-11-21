# Deixa Comigo (DX CMG) — contexto do projeto

Leia este arquivo inteiro antes de mexer em qualquer coisa. Ele resume o que foi construído e decidido até 21/11/2026.

## Quem é o dono e como trabalhar
- Dono: Jader (fala português, mora no Brasil). É um negócio paralelo dele: um app que tira o constrangimento de cobrar as pessoas.
- Responda e escreva tudo em **português do Brasil**, em linguagem simples (ele não é programador).
- Ele pediu para **não pedir autorização a cada comando**: rode, teste e publique sozinho. Pergunte antes só de: gastar dinheiro, criar contas, apagar dados reais de usuários, ou decisões de produto que mudam regra de negócio.
- **Nunca** publique ou guarde o CPF do dono (foi tirado de propósito dos termos). **Nunca** digite senhas em sites. Chaves de API (Resend, Anthropic, Mercado Pago) quem cola é ele, no painel; não peça a chave no chat.

## Ideia do produto
"Combinou antes, deixa que o app cobra." A pessoa combina regras antes (carona, vaquinha, viagem parcelada, mensalidade, venda parcelada, cartela, bolão) e o app manda as cobranças pelo WhatsApp com Pix na data. O app **não recebe nem guarda dinheiro**: o Pix vai direto para quem organiza (BR Code gerado no navegador).
- Planos: Grátis (assinatura "enviado por dx cmg" nas mensagens, limites), Plus R$ 9,90 e Autônomo R$ 24,90 "em breve" (sem cobrança implementada; coluna `perfis.plano`, protegida por trigger `proteger_plano`).
- **Reposicionamento para profissionais (feito em 21/11/2026):** público profissional = quem cobra mensalidade de alunos/clientes (professor, personal, instrutor, terapeuta, nutricionista, coach). "Pedreiro" saiu do site.
  - Planos em duas linhas: **Pessoa física** (Grátis, Plus R$ 9,90/mês) e **Profissional** (no banco continua `perfis.plano = 'autonomo'` e `origem='autonomo'` em `lista_espera`/`cliques_plano`, por causa das constraints). Profissional: mensal R$ 24,90, semestral R$ 126,90 (−15%), anual R$ 224,10 (−25%). **Preços provisórios, a confirmar com o dono.** Fonte única: `public/js/planos.js` (`PLANOS`, `PERIODOS_PRO`, `ligarPeriodos`, `nomePlano`, `LIBERADO_ATE`). Cobrança da assinatura ainda não existe (precisa decidir o meio: Mercado Pago/Asaas).
  - Site: `public/profissionais/` (página nova; `/autonomos/` só redireciona), seção de planos da landing com seletor de período, card "Alunos e clientes" na landing. Simulador de reajuste em `public/app.js` lê `data-base/data-qtd/data-aluno/data-item` da seção `#reajuste`.
  - Calculadoras: `aula` (preço da aula/sessão) e `pacote` (mensalidade/pacote, usa 4,33 semanas/mês) no lugar de `pedreiro`. O botão "Combinar" usa `combinar.rota` (`/aluno/novo`).
  - App, aluno = combinado `modelo 'mensalidade'`, `regra 'recorrente'`, `frequencia 'mensal'`, `detalhes.categoria = 'aluno'`, `detalhes.servico`, 1 membro. Telas: `#/alunos` (lista, atraso, total/mês), `#/aluno/novo` (com "salvar e cadastrar outro"), `#/alunos/reajuste`, `#/recibo/<participante_id>` (valor por extenso `valorPorExtenso` em util.js, imprimir/WhatsApp), `#/relatorio[/AAAA-MM]` (recebidos do mês, CSV com ; e BOM). Na tela do combinado do aluno: cartão "Mensalidade" (mudar valor, aviso/cancelar reajuste). Painel mostra card "Alunos e clientes" e tira os alunos da lista de combinados.
  - **Reajuste agendado:** `combinados.detalhes.reajuste = {valor, a_partir, pct, criado_em, avisado_em}`. Função `aplicar_reajustes()` aplica quando `a_partir - 2 <= hoje` e guarda `ultimo_reajuste`; `gerar_cobrancas_v3()` = aplicar_reajustes + v2. **O app agora chama v3 em todo lugar.** Mensagem: `avisoReajuste` em mensagens.js.
  - Reajuste, recibo e relatório ficam liberados para todos até 31/01/2027 (`conferenciaLiberada`); depois, só plano pago (`bloqueioPro`). Cadastrar alunos continua grátis.
  - Dados de teste: combinado "TESTE Aulas de inglês" (aluno "Ana TESTE") na conta de teste, com reajuste agendado para 22/01/2027.
  - **Não testado logado** (Claude não tem a senha da conta de teste): telas do app `#/alunos`, `#/aluno/novo`, reajuste, recibo e relatório. Testado: banco (reajuste aplicado e cobrança com valor novo), páginas públicas, calculadoras, `/topo/` do aluno.
  - Próximos passos sugeridos: pacotes de aulas com controle de presença, aula avulsa/reposição, regra de faltas, página pública do profissional (vitrine), teste grátis quando houver cobrança da assinatura.
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
- `perfis`, `cobrancas` + `participantes`, `combinados` + `combinado_membros` (`gerar_cobrancas_v2`), `cartelas` + `cartela_itens`, `boloes` + `bolao_cotas` + `bolao_jogos` + `bolao_fotos` (bucket público `canhotos`) + `bolao_palpites`, `resultados_loteria`, `contatos` (preenchida sozinha por trigger `guardar_contato` ao cadastrar pessoas em cobranças/combinados; importação de CSV/vCard do Google Contatos e da agenda do Android em `js/contatos.js`, tela `#/contatos`), `eventos`, `feedbacks`, `lista_espera`, `cliques_plano`.
- Vitrine (fotos do que se oferece): tabela `vitrine_fotos` (alvo combinado/cartela/bolão, até 8 fotos, bucket público `vitrine`), RPC `vitrine_publica(tipo, token)`; painel do dono montado por `render()` quando existe `#vitrine-dono`; páginas públicas usam `.vitrine-slot` (`js/vitrine.js`).
- Editar nome/WhatsApp de quem já foi cadastrado: botões `data-editar` (participantes, membro de combinado, cartela, bolão), tratados num ouvinte global em `app.js`.
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
- Comparação feita em 20/11/2026: na documentação pública, o Mercado Pago **não** oferece retenção com liberação sob comando do app. Tem Split 1:1 via OAuth (dinheiro cai na conta do vendedor, plataforma pode cobrar comissão), `money_release_date` (pending/released, prazo definido pelo próprio Mercado Pago) e retenção só em disputas. Modelo 1:N e ajustes de data de liberação só via time comercial ("carteira assessorada"). Conclusão: Mercado Pago serve para **confirmar pagamento automático**; para **dinheiro reservado**, Asaas (Conta Escrow) ou negociar com o comercial do Mercado Pago.

## Feito em 20/11/2026 (recursos do plano pago, liberados para todos até 31/01/2027 junto com a conferência do bolão)
- **Agenda** (`#/agenda`): tabela `compromissos` + RPC `minha_agenda_v2` (junta compromissos, cobranças em aberto por vencimento, sorteios de bolão e prazos de cartela via `agenda_itens`).
- **Link do Google Agenda**: tabela `agenda_links` (token 64 hex) + edge function `agenda-ics` (GET `?t=`), o usuário assina "Do URL" no Google Agenda.
- **Alertas (Web Push)**: tabela `push_inscricoes`; edge function `notificar` (gera as chaves VAPID sozinha na 1ª vez e guarda em `privado.config`, que só o servidor lê via `config_interna()`; exige header `x-segredo`); gatilhos `gatilho_alertas` (avisou que pagou, entrou no bolão, confirmou combinado) chamam `avisar_dono` via pg_net; pg_cron `lembretes-diarios` às 12h UTC chama `disparar_lembretes()` → `lembretes_do_dia()`. Cartão `#alertas-card` (Agenda e Conta), push e clique tratados em `app/sw.js`.
- Nunca exibir no chat as chaves de `privado.config`.

## Ideias do plano pago (pedido do dono em 20/11/2026; itens 1, 2 e 4 já feitos, ver acima)
1. **Agenda no app** (tela com vencimentos, compromissos e valores a receber por dia/semana). Sem Google: tudo no nosso banco.
2. **Ver na Agenda do Google sem login do Google:** gerar um link privado de calendário (.ics, um por usuário, com token) que a pessoa assina no Google Agenda. Só leitura, e o Google atualiza sozinho de tempos em tempos (pode levar horas). Evita a verificação do Google para o escopo de agenda.
3. **Integração completa com o Google Agenda (criar e editar eventos lá):** precisa de projeto no Google Cloud, tela de consentimento e verificação do Google (escopo sensível) — deixar para depois.
4. **Alertas:** notificações push do próprio app (PWA + service worker + chaves VAPID + função agendada com pg_cron): "Fulano avisou que pagou", "vence amanhã", "cobrança enviada". No iPhone só funciona com o app instalado na tela inicial.
5. **Cobrança automática no WhatsApp:** só pela API oficial (WhatsApp Business Platform da Meta): conta Meta Business verificada, número próprio do app, modelos de mensagem aprovados (categoria utilidade), custo por mensagem entregue pago pelo dono do app. As mensagens saem do número do Deixa Comigo, não do WhatsApp pessoal do usuário. **Não usar** APIs não oficiais que conectam o WhatsApp pessoal por QR (contra as regras do WhatsApp, risco de banimento do número do usuário). Alternativa grátis: e-mail automático pelo Resend.
