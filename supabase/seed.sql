-- =====================================================================
-- Dados iniciais (opcional): os serviços e os planos do design system da LD Barber.
-- Rode depois do `schema.sql`. Tudo aqui se edita depois no painel (Serviços e Planos).
-- Os barbeiros e o expediente são cadastrados no painel (Barbeiros).
-- =====================================================================

insert into public.servicos (nome, duracao_min, preco, categorias, ordem) values
  ('Corte degradê', 40, 45, array['corte'], 1),
  ('Corte + Barba', 60, 70, array['corte', 'barba'], 2),
  ('Barba navalhada', 30, 35, array['barba'], 3),
  ('Pigmentação', 45, 60, array['pigmentacao'], 4);

insert into public.planos (nome, resumo, preco_mensal, beneficios, nao_inclui, destaque, ordem) values
  ('Essencial', '2 cortes por mês', 89,
    array['2 cortes por mês', 'Agendamento prioritário'],
    array['Barba', 'Produtos com desconto'], false, 1),
  ('Soul', '4 cortes por mês e barba ilimitada', 149,
    array['4 cortes por mês', 'Barba ilimitada', 'Agendamento prioritário', '10% em produtos'],
    array[]::text[], true, 2),
  ('Black', 'Cortes ilimitados', 219,
    array['Cortes ilimitados', 'Barba ilimitada', 'Pigmentação mensal', 'Bebida por conta da casa'],
    array[]::text[], false, 3);

-- Cotas por mês do calendário (sem linha = o plano não cobre; limite vazio = ilimitado).
insert into public.plano_cotas (plano_id, categoria, limite)
select p.id, c.categoria, c.limite
  from public.planos p
  join (values
    ('Essencial', 'corte', 2),
    ('Soul', 'corte', 4),
    ('Soul', 'barba', null),
    ('Black', 'corte', null),
    ('Black', 'barba', null),
    ('Black', 'pigmentacao', 1)
  ) as c(plano, categoria, limite) on c.plano = p.nome;
