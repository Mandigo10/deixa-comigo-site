(function(){
const membros = (n, nomes) => nomes.map((nome, i) => ({ id: 'm'+n+i, nome, telefone: '1190000000'+i, valor: null, ativo: true, aceito_em: i < nomes.length-1 ? '2026-11-10T10:00:00Z' : null, convite_enviado_em: '2026-11-09T10:00:00Z', criado_em: '2026-11-09T10:00:00Z', token: 'a'.repeat(32) }));
const k = (id, modelo, titulo, extra) => Object.assign({ id, user_id: 'u1', modelo, titulo, regra: 'recorrente', frequencia: 'mensal', valor_por_pessoa: 50, parcelas: null, inicio: '2026-12-05', prazo: null, tom: 'leve', detalhes: {}, status: 'ativo', criado_em: '2026-11-0'+id.slice(-1)+'T10:00:00Z', vagas: null, entrada_token: null, entrada_aberta: false, valor_modo: 'fixo', custo_base: null, incluir_organizador: false, cofre_token: null, cofre_nomes: false, chave_id: null }, extra);
const p = (nome, valor, status) => ({ id: crypto.randomUUID(), nome, telefone: '11900000000', valor, valor_pago: status === 'pago' ? valor : 0, status, enviado_em: '2026-11-15T10:00:00Z', lembretes_enviados: 0, criado_em: '2026-11-15T10:00:00Z', pago_em: status === 'pago' ? '2026-11-16T10:00:00Z' : null, token: 'b'.repeat(32) });
window.__DB__ = {
  perfis: [{ id: 'u1', nome: 'Marina Costa', chave_pix: '11987654321', tipo_chave: 'telefone', cidade: 'SAO PAULO', plano: 'gratis' }],
  contatos: [], chaves_pix: [], cartelas: [], boloes: [], cartela_itens: [], participantes: [],
  combinados: [
    k('00000000-0000-4000-8000-000000000001', 'vaquinha', 'Churrasco de fim de ano', { regra: 'unico', prazo: '2026-12-12', detalhes: { meta: 600 }, cofre_token: 'c'.repeat(32), combinado_membros: membros(1, ['Lucas', 'Ana', 'Rafa', 'Bia']) }),
    k('00000000-0000-4000-8000-000000000002', 'carona', 'Carona para o trabalho', { frequencia: 'semanal', valor_por_pessoa: 32.07, vagas: 4, entrada_aberta: true, combinado_membros: membros(2, ['Lucas', 'Ana', 'Rafa']) }),
    k('00000000-0000-4000-8000-000000000003', 'viagem', 'Viagem para Ubatuba', { parcelas: 6, valor_por_pessoa: 180, combinado_membros: membros(3, ['Bia', 'Caio', 'Duda', 'Edu']) }),
    k('00000000-0000-4000-8000-000000000004', 'mensalidade', 'Aulas de inglês', { valor_por_pessoa: 320, detalhes: { categoria: 'aluno', servico: 'Aulas de inglês' }, combinado_membros: membros(4, ['Ana Souza']) }),
    k('00000000-0000-4000-8000-000000000005', 'mensalidade', 'Aulas de inglês', { valor_por_pessoa: 320, detalhes: { categoria: 'aluno', servico: 'Aulas de inglês' }, combinado_membros: membros(5, ['Pedro Alves']) }),
    k('00000000-0000-4000-8000-000000000006', 'mensalidade', 'Personal trainer', { valor_por_pessoa: 450, inicio: '2026-12-10', detalhes: { categoria: 'aluno', servico: 'Personal trainer', reajuste: { valor: 490, a_partir: '2027-01-10', pct: 8 } }, combinado_membros: membros(6, ['Júlia Rocha']) })
  ],
  cobrancas: [
    { id: 'cb1', tipo: 'racha', modelo: 'vaquinha', titulo: 'Churrasco de fim de ano', vencimento: '2026-12-12', status: 'aberta', valor_total: 600, combinado_id: '00000000-0000-4000-8000-000000000001', ciclo: 1, detalhes: { meta: 600 }, tom: 'leve', criado_em: '2026-11-15T10:00:00Z',
      participantes: [p('Lucas', 150, 'pago'), p('Ana', 150, 'pago'), p('Rafa', 150, 'avisou_pago'), p('Bia', 150, 'pendente')] },
    { id: 'cb2', tipo: 'racha', modelo: 'mensalidade', titulo: 'Aulas de inglês · nov/26', vencimento: '2026-11-05', status: 'aberta', valor_total: 320, combinado_id: '00000000-0000-4000-8000-000000000005', ciclo: 1, detalhes: { categoria: 'aluno' }, tom: 'leve', criado_em: '2026-11-03T10:00:00Z',
      participantes: [p('Pedro Alves', 320, 'pendente')] }
  ],
  __rpc: { gerar_cobrancas_v3: 0, meus_cofres: [], cofre_ver: { titulo: 'Churrasco de fim de ano', modelo: 'vaquinha', regra: 'unico', organizador: 'Marina', pessoas: 12, total_cobrado: 600, arrecadado: 450, meta: 600, sou_dono: false, mostrar_nomes: true, ciclo_atual: null,
    lista: [{ nome: 'Lucas M.', pago: 50, devido: 50 }, { nome: 'Ana S.', pago: 50, devido: 50 }, { nome: 'Rafa T.', pago: 25, devido: 50 }, { nome: 'Bia C.', pago: 0, devido: 50 }] } }
};
})();
