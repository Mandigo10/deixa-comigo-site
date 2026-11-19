/* Deixa Comigo — landing pages: formulário da lista de espera, cliques nos planos e partes interativas. */
(function () {
  var cfg = window.DXCMG_CONFIG || {};
  var configurado = cfg.SUPABASE_URL && cfg.SUPABASE_KEY &&
    cfg.SUPABASE_URL.indexOf('COLE_AQUI') === -1 && cfg.SUPABASE_KEY.indexOf('COLE_AQUI') === -1;

  // Origem do anúncio (?utm_source=instagram&utm_campaign=carona ...)
  var params = new URLSearchParams(window.location.search);
  function utm(nome) {
    var v = params.get(nome);
    return v ? v.slice(0, 100) : null;
  }
  var utms = {
    utm_source: utm('utm_source'),
    utm_medium: utm('utm_medium'),
    utm_campaign: utm('utm_campaign'),
    utm_content: utm('utm_content')
  };

  function salvar(tabela, dados) {
    if (!configurado) {
      return Promise.reject(new Error('Supabase ainda não configurado em config.js'));
    }
    var headers = {
      'apikey': cfg.SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
    // Chave "anon" antiga (começa com eyJ) também vai no Authorization; a "publishable" nova não.
    if (cfg.SUPABASE_KEY.indexOf('eyJ') === 0) {
      headers['Authorization'] = 'Bearer ' + cfg.SUPABASE_KEY;
    }
    return fetch(cfg.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + tabela, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(Object.assign({}, dados, utms))
    }).then(function (r) {
      if (!r.ok) { throw new Error('Erro ' + r.status); }
    });
  }

  // Plano em que a pessoa clicou (mede disposição de pagar)
  var planoInteresse = null;
  document.querySelectorAll('[data-plano]').forEach(function (a) {
    a.addEventListener('click', function () {
      planoInteresse = a.getAttribute('data-plano');
      var form = document.querySelector('.lead-form');
      salvar('cliques_plano', {
        plano: planoInteresse,
        origem: form ? form.getAttribute('data-origem') : null
      }).catch(function () {});
      setTimeout(function () {
        var input = document.querySelector('.lead-form input[name="contato"]');
        if (input) { input.focus({ preventScroll: true }); }
      }, 400);
    });
  });

  function contatoValido(v) {
    var digitos = v.replace(/\D/g, '');
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || (digitos.length >= 10 && digitos.length <= 13);
  }

  // Formulários da lista de espera
  document.querySelectorAll('.lead-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var botao = form.querySelector('button[type="submit"]');
    var textoBotao = botao ? botao.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var contato = form.querySelector('input[name="contato"]').value.trim();
      var armadilha = form.querySelector('input[name="empresa"]').value;
      if (armadilha) { return; } // robô

      if (!contatoValido(contato)) {
        status.style.color = '#B42318';
        status.textContent = 'Confere aí: coloque um WhatsApp com DDD ou um e-mail válido.';
        return;
      }

      botao.disabled = true;
      botao.textContent = 'Enviando...';
      salvar('lista_espera', {
        contato: contato,
        origem: form.getAttribute('data-origem'),
        plano_interesse: planoInteresse
      }).then(function () {
        status.style.color = '#16141F';
        status.textContent = 'Pronto! Você está na lista. A gente avisa assim que abrir.';
        form.querySelector('input[name="contato"]').value = '';
        if (typeof window.fbq === 'function') { window.fbq('track', 'Lead'); }
        if (typeof window.gtag === 'function') { window.gtag('event', 'generate_lead'); }
      }).catch(function () {
        status.style.color = '#B42318';
        status.textContent = 'Não conseguimos salvar agora. Tenta de novo em instantes?';
      }).then(function () {
        botao.disabled = false;
        botao.textContent = textoBotao;
      });
    });
  });

  // Seletor de tom (página principal)
  var mensagens = {
    leve: ['Leve', 'Oi, Lucas! Fiz as contas da nossa carona pra ficar justo pros dois. Novembro deu R$ 148,00, o Pix tá no link. Valeu pela companhia!'],
    neutro: ['Neutro', 'Oi, Lucas. Segue o fechamento da carona de novembro: 20 dias, R$ 148,00 no total (combustível e manutenção divididos). O Pix está no link abaixo.'],
    firme: ['Firme', 'Oi, Lucas. A carona de outubro e novembro está em aberto: R$ 296,00 no total. Consegue acertar até sexta? O Pix está no link abaixo.']
  };
  var toneBtns = document.querySelectorAll('.tone-btn');
  if (toneBtns.length) {
    var selStyle = toneBtns[0].getAttribute('style');
    var idleStyle = toneBtns[1].getAttribute('style');
    var escolherTom = function (tom) {
      toneBtns.forEach(function (b) {
        var ativo = b.getAttribute('data-tone') === tom;
        b.setAttribute('aria-pressed', String(ativo));
        b.setAttribute('style', ativo ? selStyle : idleStyle);
      });
      document.getElementById('tone-label').textContent = mensagens[tom][0];
      document.getElementById('tone-msg').textContent = mensagens[tom][1];
    };
    toneBtns.forEach(function (b) {
      b.addEventListener('click', function () { escolherTom(b.getAttribute('data-tone')); });
    });
    escolherTom('leve');
  }

  // Simulador de reajuste (página de autônomos)
  var rateBtns = document.querySelectorAll('.rate-btn');
  if (rateBtns.length) {
    var selR = rateBtns[1].getAttribute('style');
    var idleR = rateBtns[0].getAttribute('style');
    var brl = function (n) { return 'R$ ' + n.toFixed(2).replace('.', ','); };
    var escolherTaxa = function (p) {
      rateBtns.forEach(function (b) {
        var ativo = Number(b.getAttribute('data-rate')) === p;
        b.setAttribute('aria-pressed', String(ativo));
        b.setAttribute('style', ativo ? selR : idleR);
      });
      var novo = Math.round(160 * (1 + p / 100) * 100) / 100;
      var ganho = Math.round((novo - 160) * 4 * 100) / 100;
      document.getElementById('rate-price').textContent = brl(novo);
      document.getElementById('rate-gain').textContent = '+ ' + brl(ganho);
      document.getElementById('rate-msg').textContent =
        'Oi, Dona Marta! Tudo bem? Passando pra avisar com antecedência: a partir de janeiro, a diária passa de R$ 160,00 para ' +
        brl(novo) + ' (reajuste anual de ' + p + '%). Muito obrigada pela confiança de sempre, é um prazer cuidar da sua casa!';
    };
    rateBtns.forEach(function (b) {
      b.addEventListener('click', function () { escolherTaxa(Number(b.getAttribute('data-rate'))); });
    });
    escolherTaxa(8);
  }
})();
