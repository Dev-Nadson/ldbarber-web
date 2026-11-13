-- Roteiro de teste das regras do banco (RLS e triggers), num Postgres local.
-- Veja "Testar o banco" no README. Para no primeiro resultado inesperado ("FALHOU").
-- Termina com "TUDO OK". As datas são relativas a hoje (fuso de São Paulo).

\set ON_ERROR_STOP 1

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@x.com', '{"nome":"Léo Duarte","telefone":"(81) 99999-0000"}'),
  ('00000000-0000-0000-0000-00000000000b', 'gerente@x.com', '{"nome":"Gina"}'),
  ('00000000-0000-0000-0000-00000000000c', 'rafa@x.com', '{"nome":"Rafa Costa"}'),
  ('00000000-0000-0000-0000-00000000000d', 'teo@x.com', '{"nome":"Téo Alves"}'),
  ('00000000-0000-0000-0000-00000000000e', 'cli1@x.com', '{"nome":"Rafael Nunes","telefone":"81998124410"}'),
  ('00000000-0000-0000-0000-00000000000f', 'cli2@x.com', '{"nome":"Lucas Moura","telefone":"123"}'),
  ('00000000-0000-0000-0000-000000000010', 'cli3@x.com', '{"nome":"Bruno Leal"}');
update public.profiles set role = 'admin' where email = 'admin@x.com';
update public.profiles set role = 'gerente' where email = 'gerente@x.com';
update public.profiles set role = 'barbeiro' where email in ('rafa@x.com', 'teo@x.com');

create or replace function pg_temp.espera_erro(sql text, trecho text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'FALHOU: esperava erro com "%"', trecho;
exception when others then
  if sqlerrm like 'FALHOU%' then raise; end if;
  if position(trecho in sqlerrm) = 0 then
    raise exception 'FALHOU: erro inesperado "%" (esperava "%")', sqlerrm, trecho;
  end if;
  raise notice 'ok: % → %', left(sql, 60), sqlerrm;
end $$;

create or replace function pg_temp.confere(condicao boolean, descricao text) returns void language plpgsql as $$
begin
  if not coalesce(condicao, false) then raise exception 'FALHOU: %', descricao; end if;
  raise notice 'ok: %', descricao;
end $$;

-- Dia `dias` a partir de hoje, na hora local `hora` (São Paulo).
create or replace function pg_temp.em(dias integer, hora text) returns timestamptz language sql stable as $$
  select ((public.hoje() + dias) + hora::time) at time zone 'America/Sao_Paulo'
$$;

-- cadastro: papel cliente e telefone normalizado; inválido vira null
select pg_temp.confere(
  (select telefone from public.profiles where email = 'admin@x.com') = '81999990000'
  and (select telefone from public.profiles where email = 'cli2@x.com') is null
  and (select role from public.profiles where email = 'cli1@x.com') = 'cliente',
  'handle_new_user: papel cliente e telefone normalizado');

set role authenticated;

-- ---------------------------------------------------------------- gerente monta a casa
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.barbeiros (id, nome, especialidade, profile_id, ordem) values
  ('b0000000-0000-0000-0000-000000000001', 'Léo Duarte', 'Fundador', '00000000-0000-0000-0000-00000000000a', 1),
  ('b0000000-0000-0000-0000-000000000002', 'Rafa Costa', 'Barba e navalha', '00000000-0000-0000-0000-00000000000c', 2),
  ('b0000000-0000-0000-0000-000000000003', 'Téo Alves', null, null, 3);
-- todo dia, 09–19h, almoço 12–13 (o teste não depende do dia da semana)
insert into public.expedientes (barbeiro_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim)
select b.id, d, '09:00', '19:00', '12:00', '13:00'
  from public.barbeiros b cross join generate_series(0, 6) d;
insert into public.servicos (id, nome, duracao_min, preco, categorias) values
  ('50000000-0000-0000-0000-000000000001', 'Corte degradê', 40, 45, array['corte']),
  ('50000000-0000-0000-0000-000000000002', 'Corte + Barba', 60, 70, array['corte', 'barba']),
  ('50000000-0000-0000-0000-000000000003', 'Barba navalhada', 30, 35, array['barba']),
  ('50000000-0000-0000-0000-000000000004', 'Oculto', 30, 10, '{}');
update public.servicos set ativo = false where id = '50000000-0000-0000-0000-000000000004';
insert into public.planos (id, nome, preco_mensal, destaque) values
  ('60000000-0000-0000-0000-000000000001', 'Essencial', 89, false),
  ('60000000-0000-0000-0000-000000000002', 'Soul', 149, true);
insert into public.plano_cotas (plano_id, categoria, limite) values
  ('60000000-0000-0000-0000-000000000001', 'corte', 2),
  ('60000000-0000-0000-0000-000000000002', 'corte', 4),
  ('60000000-0000-0000-0000-000000000002', 'barba', null);
select pg_temp.espera_erro($$insert into public.planos (nome, preco_mensal, destaque) values ('Black', 219, true)$$, 'planos_um_destaque_idx');
select pg_temp.espera_erro($$insert into public.servicos (nome, duracao_min, preco, categorias) values ('X', 30, 10, array['sobrancelha'])$$, 'servicos_categorias_check');
select pg_temp.espera_erro($$insert into public.expedientes (barbeiro_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim) values ('b0000000-0000-0000-0000-000000000003', 0, '10:00', '18:00', null, null)$$, 'duplicate key');
-- gerente não mexe em Ajustes nem em papéis
update public.configuracoes set intervalo_min = 15 where id = 1;
select pg_temp.confere((select intervalo_min from public.configuracoes) = 30, 'gerente não altera a configuração (0 linhas)');
update public.profiles set role = 'gerente' where email = 'cli1@x.com';
select pg_temp.confere((select role from public.profiles where email = 'cli1@x.com') = 'cliente', 'gerente não muda papel (0 linhas)');

-- ---------------------------------------------------------------- público
reset role;
set role anon;
set request.jwt.claim.sub = '';
select pg_temp.confere((select count(*) from public.servicos) = 3, 'anon vê só os 3 serviços ativos');
select pg_temp.confere((select count(*) from public.planos) = 2 and (select count(*) from public.barbeiros) = 3, 'anon vê planos e barbeiros ativos');
select pg_temp.confere((select count(*) from public.configuracoes) = 1 and (select count(*) from public.expedientes) = 21, 'anon lê configuração e expedientes');
select pg_temp.confere((select count(*) from public.profiles) = 0 and (select count(*) from public.agendamentos) = 0
  and (select count(*) from public.assinaturas) = 0 and (select count(*) from public.bloqueios) = 0, 'anon não lê perfis, agendamentos, planos de cliente nem bloqueios');
select pg_temp.espera_erro($$select count(*) from public.clientes_resumo$$, 'permission denied');
select pg_temp.espera_erro($$insert into public.agendamentos (barbeiro_id, servico_id, inicio) values ('b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', now() + interval '1 day')$$, 'Entre na sua conta');
reset role;
set role authenticated;

-- ---------------------------------------------------------------- cliente 1 marca
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select pg_temp.espera_erro($$update public.profiles set role = 'admin' where email = 'cli1@x.com'$$, 'próprio papel');
select pg_temp.confere((select count(*) from public.profiles) = 1, 'cliente só vê o próprio perfil');

-- valor, plano e status vindos do navegador são ignorados
insert into public.agendamentos (id, cliente_id, barbeiro_id, servico_id, inicio, valor, preco, incluso_plano, status, cliente_nome, barbeiro_nome, servico_nome, duracao_min)
values ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001', pg_temp.em(1, '10:00'), 1, 1, true, 'concluido', 'X', 'X', 'X', 1);
select pg_temp.confere(
  (select valor = 45 and preco = 45 and not incluso_plano and status = 'confirmado' and not encaixe
      and fim = pg_temp.em(1, '10:40') and cliente_nome = 'Rafael Nunes' and cliente_telefone = '81998124410'
      and barbeiro_nome = 'Léo Duarte' and servico_nome = 'Corte degradê' and categorias = array['corte']
     from public.agendamentos where id = '70000000-0000-0000-0000-000000000001'),
  'horário calculado no servidor (R$ 45, 40 min, retrato)');
select pg_temp.confere((select count(*) from public.ocupacoes where agendamento_id = '70000000-0000-0000-0000-000000000001') = 1, 'horário marcado ocupa a agenda');

-- regras da agenda do cliente
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(3, '10:00')), 'só pode marcar horários para você');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(1, '10:00')), 'já tem um horário marcado nesse período');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(-1, '10:00')), 'ainda não passou');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(3, '10:15')), 'horários da agenda');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', %L)$$, pg_temp.em(3, '11:30')), 'intervalo de Rafa');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', %L)$$, pg_temp.em(3, '18:30')), 'fora do expediente');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(3, '08:00')), 'fora do expediente');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(16, '10:00')), 'até 15 dias');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', %L)$$, pg_temp.em(3, '10:00')), 'serviço não está disponível');

-- limite de horários abertos (4)
insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values
  ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', pg_temp.em(3, '10:00')),
  ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', pg_temp.em(4, '10:00')),
  ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', pg_temp.em(5, '10:00'));
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(6, '10:00')), 'já tem 4 horários');

-- o cliente não remarca; cancela o seu (libera a agenda)
select pg_temp.espera_erro(format($$update public.agendamentos set inicio = %L where id = '70000000-0000-0000-0000-000000000001'$$, pg_temp.em(1, '11:00')), 'cancele e marque de novo');
update public.agendamentos set status = 'cancelado' where cliente_id = '00000000-0000-0000-0000-00000000000e' and inicio = pg_temp.em(5, '10:00');
select pg_temp.confere((select count(*) from public.ocupacoes o join public.agendamentos a on a.id = o.agendamento_id where a.status = 'cancelado') = 0, 'cancelado libera a agenda');
select pg_temp.espera_erro($$update public.agendamentos set status = 'confirmado' where status = 'cancelado'$$, 'já foi cancelado');
select pg_temp.espera_erro($$update public.agendamentos set status = 'concluido' where id = '70000000-0000-0000-0000-000000000001'$$, 'Só a barbearia conclui');

-- cliente 2 não consegue o mesmo horário do Léo
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(1, '10:30')), 'já está ocupado');
select pg_temp.confere((select count(*) from public.agendamentos) = 0, 'cliente 2 não vê os horários do cliente 1');
select pg_temp.confere((select count(*) from public.ocupacoes) = 3, 'mas vê as ocupações (sem dado do cliente)');

-- ---------------------------------------------------------------- planos
-- cliente pede o plano; só um em andamento; cancela a solicitação
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select pg_temp.espera_erro($$insert into public.assinaturas (cliente_id, plano_id) values ('00000000-0000-0000-0000-00000000000f', '60000000-0000-0000-0000-000000000002')$$, 'para você');
insert into public.assinaturas (id, cliente_id, plano_id, valor_mensal, status, vence_em, dia_vencimento)
values ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000e', '60000000-0000-0000-0000-000000000002', 1, 'ativa', '2099-01-01', 5);
select pg_temp.confere(
  (select status = 'solicitada' and valor_mensal = 149 and plano_nome = 'Soul' and vence_em is null and dia_vencimento is null
     from public.assinaturas where id = '80000000-0000-0000-0000-000000000001'),
  'assinatura nasce solicitada, com o preço do plano');
select pg_temp.espera_erro($$insert into public.assinaturas (cliente_id, plano_id) values ('00000000-0000-0000-0000-00000000000e', '60000000-0000-0000-0000-000000000001')$$, 'Já existe um plano em andamento');
select pg_temp.espera_erro($$insert into public.mensalidades (assinatura_id, forma_pagamento, valor) values ('80000000-0000-0000-0000-000000000001', 'pix', 1)$$, 'Só a gerência');
update public.assinaturas set status = 'cancelada' where id = '80000000-0000-0000-0000-000000000001';
select pg_temp.confere((select status from public.assinaturas where id = '80000000-0000-0000-0000-000000000001') = 'cancelada', 'cliente cancela a solicitação');

-- gerência abre o Soul do cliente 2 e registra a mensalidade
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.assinaturas (id, cliente_id, plano_id, dia_vencimento)
values ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000f', '60000000-0000-0000-0000-000000000002', 10);
insert into public.mensalidades (id, assinatura_id, forma_pagamento, valor)
values ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002', 'pix', 1);
select pg_temp.confere(
  (select m.valor = 149 and m.meses = 1 and m.cliente_nome = 'Lucas Moura' and m.periodo_inicio = public.hoje()
      and a.status = 'ativa' and a.vence_em = (date_trunc('month', public.hoje()::timestamp) + interval '1 month')::date + 9
      and public.situacao_assinatura(a.status, a.vence_em, a.encerra_em) = 'em_dia'
     from public.mensalidades m join public.assinaturas a on a.id = m.assinatura_id
    where m.id = '90000000-0000-0000-0000-000000000001'),
  'mensalidade: R$ 149, ativa e vence no dia 10 do mês que vem');

-- cota: Corte + Barba entra no plano até o 4º corte do mês; barba é ilimitada (encaixe do gerente)
insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio)
select '00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', pg_temp.em(2, h)
  from unnest(array['09:00', '10:00', '11:00', '13:00', '14:00']) h;
select pg_temp.confere(
  (select count(*) filter (where incluso_plano and valor = 0 and plano_nome = 'Soul') = 4
      and count(*) filter (where not incluso_plano and valor = 70) = 1
      and bool_and(encaixe)
     from public.agendamentos where cliente_id = '00000000-0000-0000-0000-00000000000f'),
  'Soul cobre 4 cortes no mês; o 5º é cobrado');
insert into public.agendamentos (id, cliente_id, barbeiro_id, servico_id, inicio)
values ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', pg_temp.em(2, '15:00'));
select pg_temp.confere((select incluso_plano and valor = 0 from public.agendamentos where id = '70000000-0000-0000-0000-000000000002'), 'barba ilimitada continua no plano');
select pg_temp.confere(
  (select situacao = 'em_dia' and plano_nome = 'Soul' and proximo_horario = pg_temp.em(2, '09:00')
     from public.clientes_resumo where id = '00000000-0000-0000-0000-00000000000f'),
  'clientes_resumo: plano, situação e próximo horário');

-- pendente (dentro da tolerância) ainda cobre; atrasado não. (Os encaixes contam no limite de
-- horários abertos do cliente: o teste sobe o limite para seguir marcando.)
reset role;
set request.jwt.claim.sub = '';
update public.configuracoes set max_agendamentos_abertos = 10 where id = 1;
update public.assinaturas set vence_em = public.hoje() - 3 where id = '80000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
insert into public.agendamentos (id, cliente_id, barbeiro_id, servico_id, inicio)
values ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', pg_temp.em(2, '16:00'));
select pg_temp.confere((select incluso_plano from public.agendamentos where id = '70000000-0000-0000-0000-000000000003'), 'pendente: o plano ainda cobre');
-- assinante marca mais longe que o avulso (30 dias)
insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio)
values ('00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', pg_temp.em(20, '10:00'));
reset role;
set request.jwt.claim.sub = '';
update public.assinaturas set vence_em = public.hoje() - 10 where id = '80000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
select pg_temp.confere(
  (select public.situacao_assinatura(status, vence_em, encerra_em) = 'atrasado' from public.assinaturas where id = '80000000-0000-0000-0000-000000000002'),
  'situação atrasado');
insert into public.agendamentos (id, cliente_id, barbeiro_id, servico_id, inicio)
values ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', pg_temp.em(2, '17:00'));
select pg_temp.confere((select not incluso_plano and valor = 35 from public.agendamentos where id = '70000000-0000-0000-0000-000000000004'), 'atrasado: o plano não cobre');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', %L)$$, pg_temp.em(20, '11:00')), 'Assinantes marcam com até 30 dias');

-- trimestral com desconto; estorno só do último; cancelamento agendado pelo cliente
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.assinaturas (id, cliente_id, plano_id, periodicidade, dia_vencimento)
values ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000001', 'trimestral', 10);
insert into public.mensalidades (id, assinatura_id, forma_pagamento) values ('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000003', 'dinheiro');
insert into public.mensalidades (id, assinatura_id, forma_pagamento) values ('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 'pix');
select pg_temp.confere(
  (select valor = 240.30 and meses = 3 from public.mensalidades where id = '90000000-0000-0000-0000-000000000002')
  and (select vence_em = (date_trunc('month', public.hoje()::timestamp) + interval '6 months')::date + 9
         from public.assinaturas where id = '80000000-0000-0000-0000-000000000003'),
  'trimestral: 3 × 89 − 10% = R$ 240,30; dois pagamentos = 6 meses');
select pg_temp.espera_erro($$update public.mensalidades set estornada = true where id = '90000000-0000-0000-0000-000000000002'$$, 'último pagamento');
update public.mensalidades set estornada = true where id = '90000000-0000-0000-0000-000000000003';
select pg_temp.confere(
  (select vence_em = (date_trunc('month', public.hoje()::timestamp) + interval '3 months')::date + 9 and status = 'ativa'
     from public.assinaturas where id = '80000000-0000-0000-0000-000000000003'),
  'estorno devolve o vencimento anterior');
select pg_temp.espera_erro($$update public.mensalidades set estornada = false where id = '90000000-0000-0000-0000-000000000003'$$, 'já foi estornado');
update public.mensalidades set valor = 1, forma_pagamento = 'credito' where id = '90000000-0000-0000-0000-000000000002';
select pg_temp.confere((select valor = 240.30 and forma_pagamento = 'dinheiro' from public.mensalidades where id = '90000000-0000-0000-0000-000000000002'), 'mensalidade lançada não muda');
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';
update public.assinaturas set status = 'cancelada' where id = '80000000-0000-0000-0000-000000000003';
select pg_temp.confere(
  (select status = 'ativa' and encerra_em = vence_em from public.assinaturas where id = '80000000-0000-0000-0000-000000000003'),
  'cliente cancela o plano ativo: vale até o fim do período pago');
select pg_temp.espera_erro($$update public.assinaturas set status = 'cancelada' where id = '80000000-0000-0000-0000-000000000003'$$, 'já está agendado');
select pg_temp.confere((select count(*) from public.mensalidades) = 2, 'cliente vê as próprias mensalidades (inclusive a estornada)');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.espera_erro($$insert into public.mensalidades (assinatura_id, forma_pagamento) values ('80000000-0000-0000-0000-000000000003', 'pix')$$, 'cancelamento deste plano está agendado');
update public.assinaturas set encerra_em = null where id = '80000000-0000-0000-0000-000000000003';
select pg_temp.confere((select encerra_em is null from public.assinaturas where id = '80000000-0000-0000-0000-000000000003'), 'gerência desfaz o cancelamento agendado');

-- ---------------------------------------------------------------- barbeiro: só a própria agenda
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.confere(
  (select count(*) > 0 and bool_and(barbeiro_id = 'b0000000-0000-0000-0000-000000000002') from public.agendamentos),
  'Rafa vê só a agenda dele');
select pg_temp.confere((select count(*) from public.assinaturas) = 0 and (select count(*) from public.mensalidades) = 0, 'barbeiro não vê planos nem pagamentos');
select pg_temp.confere((select count(*) from public.profiles) = 7, 'barbeiro vê os perfis (para o encaixe)');
select pg_temp.espera_erro($$insert into public.fichas (profile_id, apelido) values ('00000000-0000-0000-0000-00000000000e', 'Rafa')$$, 'row-level security');
update public.agendamentos set status = 'cancelado' where id = '70000000-0000-0000-0000-000000000001';
select pg_temp.confere((select status from public.agendamentos where id = '70000000-0000-0000-0000-000000000001' and true) is null, 'Rafa nem enxerga o horário do Léo');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(6, '15:00')), 'sua própria agenda');
select pg_temp.espera_erro(format($$insert into public.bloqueios (barbeiro_id, inicio, fim) values ('b0000000-0000-0000-0000-000000000001', %L, %L)$$, pg_temp.em(6, '15:00'), pg_temp.em(6, '16:00')), 'sua própria agenda');
select pg_temp.espera_erro(format($$insert into public.bloqueios (barbeiro_id, inicio, fim) values ('b0000000-0000-0000-0000-000000000002', %L, %L)$$, pg_temp.em(3, '09:30'), pg_temp.em(3, '10:30')), 'Já há horário marcado');
insert into public.bloqueios (barbeiro_id, inicio, fim, motivo) values ('b0000000-0000-0000-0000-000000000002', pg_temp.em(6, '14:00'), pg_temp.em(6, '16:00'), 'Médico');
-- encaixe na própria agenda, fora da grade e do expediente
insert into public.agendamentos (id, cliente_id, barbeiro_id, servico_id, inicio)
values ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', pg_temp.em(6, '19:10'));
select pg_temp.confere((select encaixe and incluso_plano and valor = 0 and plano_nome = 'Essencial' from public.agendamentos where id = '70000000-0000-0000-0000-000000000005'), 'encaixe do barbeiro na própria agenda (o Essencial do cliente cobre o corte)');
select pg_temp.espera_erro(format($$insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, inicio) values ('00000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', %L)$$, pg_temp.em(6, '15:00')), 'já está ocupado');
select pg_temp.espera_erro(format($$update public.agendamentos set inicio = %L where id = '70000000-0000-0000-0000-000000000005'$$, pg_temp.em(6, '15:30')), 'já está ocupado');
select pg_temp.espera_erro($$update public.agendamentos set barbeiro_id = 'b0000000-0000-0000-0000-000000000003' where id = '70000000-0000-0000-0000-000000000005'$$, 'Só a gerência passa');
select pg_temp.espera_erro($$update public.agendamentos set status = 'falta' where id = '70000000-0000-0000-0000-000000000005'$$, 'depois do horário');
select pg_temp.espera_erro($$update public.agendamentos set status = 'concluido' where id = '70000000-0000-0000-0000-000000000005'$$, 'de outro dia');

-- ---------------------------------------------------------------- concluir e cancelar em cima da hora
reset role;
set request.jwt.claim.sub = '';
insert into public.agendamentos (id, cliente_id, barbeiro_id, servico_id, inicio) values
  ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', now() - interval '1 minute'),
  ('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', now() + interval '1 hour');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';
select pg_temp.espera_erro($$update public.agendamentos set status = 'cancelado' where id = '70000000-0000-0000-0000-000000000007'$$, 'menos de 2 horas');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.espera_erro($$update public.agendamentos set status = 'concluido' where id = '70000000-0000-0000-0000-000000000006'$$, 'forma de pagamento');
update public.agendamentos set status = 'concluido', forma_pagamento = 'pix', valor_recebido = 40, valor = 0, servico_nome = 'X'
 where id = '70000000-0000-0000-0000-000000000006';
select pg_temp.confere(
  (select status = 'concluido' and forma_pagamento = 'pix' and valor_recebido = 40 and valor = 45 and servico_nome = 'Corte degradê'
      and concluido_em is not null and fim = inicio + interval '40 minutes'
     from public.agendamentos where id = '70000000-0000-0000-0000-000000000006'),
  'barbeiro conclui com forma e valor (com desconto); o retrato não muda');
select pg_temp.espera_erro($$update public.agendamentos set status = 'cancelado' where id = '70000000-0000-0000-0000-000000000006'$$, 'já foi concluído');

-- caixa da gerência: atendimento + mensalidades não estornadas
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.confere(
  (select count(*) = 3 and sum(valor) = 40 + 149 + 240.30 from public.caixa where data = public.hoje()),
  'caixa do dia: R$ 40 de atendimento + R$ 149 + R$ 240,30 de planos');
-- a gerência passa o horário do Léo para o Téo (a ocupação vai junto)
update public.agendamentos set barbeiro_id = 'b0000000-0000-0000-0000-000000000003' where id = '70000000-0000-0000-0000-000000000001';
select pg_temp.confere(
  (select a.barbeiro_nome = 'Téo Alves' and o.barbeiro_id = a.barbeiro_id
     from public.agendamentos a join public.ocupacoes o on o.agendamento_id = a.id
    where a.id = '70000000-0000-0000-0000-000000000001'),
  'remarcar para outro barbeiro move a ocupação');
insert into public.fichas (profile_id, apelido, observacoes) values ('00000000-0000-0000-0000-00000000000e', 'Rafa', 'Pente 2 nas laterais');
select pg_temp.confere((select apelido from public.clientes_resumo where id = '00000000-0000-0000-0000-00000000000e') = 'Rafa', 'ficha aparece no resumo do cliente');
select pg_temp.confere((select count(*) from public.clientes_resumo) = 3, 'resumo lista só os clientes');
select pg_temp.espera_erro($$delete from public.barbeiros where id = 'b0000000-0000-0000-0000-000000000003'$$, 'foreign key');

-- ---------------------------------------------------------------- admin
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.espera_erro($$update public.profiles set role = 'cliente' where email = 'admin@x.com'$$, 'próprio papel');
update public.profiles set role = 'barbeiro', nome = 'Hacker' where email = 'cli3@x.com';
select pg_temp.confere((select role = 'barbeiro' and nome = 'Bruno Leal' from public.profiles where email = 'cli3@x.com'), 'admin muda o papel, mas não o nome dos outros');
update public.profiles set role = 'cliente' where email = 'cli3@x.com';
update public.configuracoes set intervalo_min = 15, antecedencia_avulso_dias = 7 where id = 1;
select pg_temp.confere((select intervalo_min = 15 from public.configuracoes), 'admin altera as regras da agenda');
select pg_temp.espera_erro($$update public.configuracoes set antecedencia_assinante_dias = 3 where id = 1$$, 'configuracoes_check');
-- Rafa saiu da equipe: a conta continua ligada, mas a agenda some para ele
update public.profiles set role = 'cliente' where email = 'rafa@x.com';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.confere((select count(*) from public.agendamentos) = 0 and (select count(*) from public.bloqueios) = 0, 'quem sai da equipe perde a agenda');

reset role;
select 'TUDO OK' as resultado;
