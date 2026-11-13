-- =====================================================================
-- LD Barber: agendamento, planos e gestão da casa (instalação do zero)
-- Rode no SQL Editor do Supabase, uma única vez. Depois, se quiser, o `seed.sql`.
--
-- Quem escreve o quê:
--   tudo → navegador, com a sessão do usuário. Não há service role nem Edge Function: o RLS
--          e os triggers abaixo valem sempre.
--
-- Aberto para `anon` (só leitura): a configuração da casa, barbeiros, expedientes, serviços,
-- planos ativos e as ocupações da agenda (só barbeiro e intervalo, nada do cliente). É o que
-- a página de disponibilidade e a de planos mostram sem login.
--
-- Preço, cobertura do plano e as regras da agenda são decididos só aqui
-- (`agendamentos_criar`). O `src/lib/agenda.ts` e o `src/lib/plano.ts` mostram a prévia com
-- a mesma regra: mudou um, muda o outro.
--
-- Horário: tudo é `timestamptz`; o dia e a hora da casa são os de America/Sao_Paulo
-- (`hoje()`), nunca `current_date`.
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- 1) Perfis  (cliente | barbeiro | gerente | admin)
-- ---------------------------------------------------------------------
-- Todo cadastro é cliente. O admin muda o papel de alguém em Ajustes → Equipe.
--   barbeiro: só a própria agenda (a linha de `barbeiros` ligada à conta);
--   gerente:  a agenda de todos, clientes, barbeiros, serviços, planos e caixa;
--   admin:    tudo do gerente, mais Ajustes (casa e regras) e Equipe.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text check (nome is null or length(trim(nome)) between 1 and 80),
  email text,
  -- Só dígitos, com DDD. É o WhatsApp do lembrete.
  telefone text check (telefone is null or telefone ~ '^\d{10,11}$'),
  nascimento date check (nascimento is null or nascimento >= date '1900-01-01'),
  -- O cliente quer o lembrete do horário pelo WhatsApp. Hoje a equipe manda pelo botão do
  -- painel (wa.me); a preferência já fica gravada para automatizar depois.
  lembrete_whatsapp boolean not null default true,
  role text not null default 'cliente'
    check (role in ('cliente', 'barbeiro', 'gerente', 'admin')),
  criado_em timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (lower(email));
create index profiles_role_nome_idx on public.profiles (role, nome);

create or replace function public.papel_atual()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Barbeiro, gerente ou admin: quem entra no painel.
create or replace function public.is_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() in ('barbeiro', 'gerente', 'admin'), false);
$$;

-- Gerente ou admin: a agenda de todos, clientes, cadastros, planos e caixa.
create or replace function public.is_gestao()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() in ('gerente', 'admin'), false);
$$;

-- Só o admin mexe em Ajustes (casa e regras da agenda) e nos papéis da equipe.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() = 'admin', false);
$$;

-- "Hoje" na barbearia, e não no fuso do servidor (UTC).
create or replace function public.hoje()
returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- "R$ 70,00" nas mensagens dos triggers (chegam prontas na tela).
create or replace function public.formatar_real(valor numeric)
returns text language sql immutable set search_path = public as $$
  select 'R$ ' || replace(to_char(valor, 'FM9999999990.00'), '.', ',');
$$;

-- O metadado do cadastro é só uma dica para nome e telefone: nenhuma policy lê
-- `user_metadata`. Valor fora do formato vira null, para não derrubar o cadastro.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  telefone text := regexp_replace(coalesce(new.raw_user_meta_data->>'telefone', ''), '\D', '', 'g');
begin
  insert into public.profiles (id, nome, email, telefone)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), split_part(new.email, '@', 1)), 80),
    new.email,
    case when telefone ~ '^\d{10,11}$' then telefone end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Ninguém muda o próprio papel (o admin não se tranca fora). O admin muda o papel dos outros,
-- mas não os dados pessoais deles. E-mail e data de cadastro não mudam pelo navegador.
create or replace function public.profiles_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;

  new.id := old.id;
  new.email := old.email;
  new.criado_em := old.criado_em;

  if new.role is distinct from old.role then
    if old.id = auth.uid() then
      raise exception 'Você não pode mudar o próprio papel.';
    end if;
    if not public.is_admin() then
      raise exception 'Só o admin muda o papel de alguém.';
    end if;
  end if;

  if old.id <> auth.uid() then
    new.nome := old.nome;
    new.telefone := old.telefone;
    new.nascimento := old.nascimento;
    new.lembrete_whatsapp := old.lembrete_whatsapp;
  end if;

  return new;
end $$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.profiles_protect();

-- ---------------------------------------------------------------------
-- 2) Configurações da casa (linha única, pública)
-- ---------------------------------------------------------------------
-- Tudo aqui aparece no site, então tudo é público (o RLS filtra linhas, não colunas): não
-- guarde nada sigiloso nesta tabela. Só o admin altera.
create table public.configuracoes (
  id integer primary key default 1 check (id = 1),
  endereco text check (endereco is null or length(endereco) <= 160),
  -- Só dígitos, com o 55 do Brasil: é o número do link wa.me.
  whatsapp text check (whatsapp is null or whatsapp ~ '^55\d{10,11}$'),
  instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  -- Faixa no topo do site ("Fechado no feriado de 15/11").
  aviso text check (aviso is null or length(aviso) <= 200),
  -- Aparece no perfil do assinante, para pagar a mensalidade.
  chave_pix text check (chave_pix is null or length(chave_pix) <= 100),
  -- Grade da agenda, a partir da abertura do expediente: 09:00, 09:30, 10:00...
  intervalo_min integer not null default 30 check (intervalo_min in (10, 15, 20, 30, 60)),
  -- Até quantos dias à frente o cliente marca. O assinante tem prioridade.
  antecedencia_avulso_dias integer not null default 15 check (antecedencia_avulso_dias between 1 and 90),
  antecedencia_assinante_dias integer not null default 30 check (antecedencia_assinante_dias between 1 and 90),
  -- O cliente cancela sozinho até N horas antes. Depois disso, só falando com a casa.
  cancelamento_min_horas integer not null default 2 check (cancelamento_min_horas between 0 and 72),
  -- Horários futuros que um cliente pode ter ao mesmo tempo (segura spam e quem reservaria a
  -- semana inteira).
  max_agendamentos_abertos integer not null default 4 check (max_agendamentos_abertos between 1 and 20),
  -- Dias depois do vencimento em que a mensalidade fica "pendente" e o plano ainda vale.
  -- Passou disso, "atrasado": o plano para de cobrir até pagar.
  tolerancia_atraso_dias integer not null default 5 check (tolerancia_atraso_dias between 0 and 30),
  desconto_trimestral numeric(5, 2) not null default 10 check (desconto_trimestral between 0 and 50),
  atualizado_em timestamptz not null default now(),
  check (antecedencia_assinante_dias >= antecedencia_avulso_dias)
);

insert into public.configuracoes (id) values (1);

create or replace function public.configuracoes_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  new.id := old.id;
  new.atualizado_em := now();
  return new;
end $$;

create trigger configuracoes_protect
  before update on public.configuracoes
  for each row execute function public.configuracoes_protect();

-- ---------------------------------------------------------------------
-- 3) Barbeiros, expediente e bloqueios
-- ---------------------------------------------------------------------
-- O barbeiro é a agenda. A conta (`profile_id`) é opcional: é quem entra no painel e vê esta
-- agenda. Quem é admin ou gerente também pode ter agenda (o dono que corta).
create table public.barbeiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 60),
  especialidade text check (especialidade is null or length(especialidade) <= 60),
  profile_id uuid unique references public.profiles(id) on delete set null,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

-- A agenda do usuário logado, se ele for da equipe e tiver uma. Tirar alguém da equipe corta o
-- acesso mesmo que a conta continue ligada ao barbeiro.
create or replace function public.meu_barbeiro_id()
returns uuid language sql stable security definer set search_path = public as $$
  select b.id
    from public.barbeiros b
    join public.profiles p on p.id = b.profile_id
   where b.profile_id = auth.uid() and p.role in ('barbeiro', 'gerente', 'admin');
$$;

-- Uma linha por dia da semana em que o barbeiro atende. Dia sem linha = não atende.
-- `dia_semana` segue o `extract(dow)` do Postgres e o `getDay()` do JavaScript: 0 = domingo.
-- A pausa é o almoço: a agenda mostra hachurado e ninguém marca nela.
create table public.expedientes (
  id uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null,
  fecha time not null,
  pausa_inicio time,
  pausa_fim time,
  unique (barbeiro_id, dia_semana),
  check (abre < fecha),
  check ((pausa_inicio is null) = (pausa_fim is null)),
  check (pausa_inicio is null or (abre < pausa_inicio and pausa_inicio < pausa_fim and pausa_fim < fecha))
);

-- Folga, feriado, compromisso: tira um período da agenda. Para fechar a casa num dia, o
-- painel cria um bloqueio para cada barbeiro. O motivo só a equipe vê; o público vê só a
-- ocupação (seção 8).
create table public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text check (motivo is null or length(motivo) <= 80),
  criado_por uuid default auth.uid() references public.profiles(id) on delete set null,
  criado_em timestamptz not null default now(),
  check (inicio < fim),
  check (fim - inicio <= interval '31 days')
);

create index bloqueios_barbeiro_idx on public.bloqueios (barbeiro_id, inicio);

-- O barbeiro só bloqueia a própria agenda; a gestão, qualquer uma.
create or replace function public.bloqueios_validar()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_gestao()
     and new.barbeiro_id is distinct from public.meu_barbeiro_id() then
    raise exception 'Você só pode bloquear a sua própria agenda.';
  end if;

  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
    new.criado_em := now();
  else
    new.id := old.id;
    new.criado_por := old.criado_por;
    new.criado_em := old.criado_em;
  end if;

  return new;
end $$;

create trigger bloqueios_validar
  before insert or update on public.bloqueios
  for each row execute function public.bloqueios_validar();

-- Anotações da casa sobre o cliente (apelido, barbeiro preferido, "pente 2 nas laterais").
-- Ficam fora de `profiles` porque o cliente lê o próprio perfil inteiro, e estas são só da
-- equipe (o RLS filtra linhas, não colunas).
create table public.fichas (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  apelido text check (apelido is null or length(trim(apelido)) between 1 and 40),
  barbeiro_preferido_id uuid references public.barbeiros(id) on delete set null,
  observacoes text check (observacoes is null or length(observacoes) <= 500),
  atualizado_em timestamptz not null default now()
);

create or replace function public.fichas_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then new.profile_id := old.profile_id; end if;
  new.atualizado_em := now();
  return new;
end $$;

create trigger fichas_protect
  before insert or update on public.fichas
  for each row execute function public.fichas_protect();

-- ---------------------------------------------------------------------
-- 4) Serviços
-- ---------------------------------------------------------------------
-- `categorias` diz o que o serviço consome da cota do plano: "Corte + Barba" é
-- {corte, barba}. Serviço sem categoria nunca entra no plano.
create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 60),
  descricao text check (descricao is null or length(descricao) <= 200),
  duracao_min integer not null check (duracao_min between 5 and 480 and duracao_min % 5 = 0),
  preco numeric(10, 2) not null check (preco >= 0),
  categorias text[] not null default '{}'
    check (categorias <@ array['corte', 'barba', 'pigmentacao']),
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5) Planos, assinaturas e mensalidades
-- ---------------------------------------------------------------------
-- O plano é a vitrine (nome, preço, benefícios) mais as cotas por categoria. `beneficios` e
-- `nao_inclui` são só texto do card; o que vale de verdade são as `plano_cotas`.
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (length(trim(nome)) between 2 and 40),
  -- Resumo de uma linha ("Cortes ilimitados"), usado na lista compacta do celular.
  resumo text check (resumo is null or length(resumo) <= 60),
  preco_mensal numeric(10, 2) not null check (preco_mensal > 0),
  beneficios text[] not null default '{}' check (cardinality(beneficios) <= 10),
  -- As linhas riscadas: o que os planos de cima têm e este não.
  nao_inclui text[] not null default '{}' check (cardinality(nao_inclui) <= 10),
  -- O "Mais escolhido". Um só.
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index planos_um_destaque_idx on public.planos (destaque) where destaque;

create or replace function public.planos_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  new.id := old.id;
  new.criado_em := old.criado_em;
  new.atualizado_em := now();
  return new;
end $$;

create trigger planos_protect
  before update on public.planos
  for each row execute function public.planos_protect();

-- Quanto de cada categoria o plano cobre por mês do calendário. Sem linha = não cobre.
-- `limite` null = ilimitado.
create table public.plano_cotas (
  plano_id uuid not null references public.planos(id) on delete cascade,
  categoria text not null check (categoria in ('corte', 'barba', 'pigmentacao')),
  limite integer check (limite is null or limite between 1 and 99),
  primary key (plano_id, categoria)
);

-- A assinatura de um cliente. Nasce `solicitada` (o cliente tocou em "Assinar" ou a gerência
-- abriu) e vira `ativa` no primeiro pagamento registrado. O pagamento é na casa: não há
-- gateway. `vence_em` é o dia em que a próxima mensalidade vence; só os triggers de
-- `mensalidades` mexem nele.
create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles(id) on delete cascade,
  plano_id uuid not null references public.planos(id) on delete restrict,
  -- Retrato do plano na assinatura: mudar o preço do plano não muda o de quem já assina.
  plano_nome text not null,
  valor_mensal numeric(10, 2) not null check (valor_mensal > 0),
  periodicidade text not null default 'mensal' check (periodicidade in ('mensal', 'trimestral')),
  -- Dia do mês em que vence. Até o dia 28, para existir em todo mês.
  dia_vencimento smallint check (dia_vencimento is null or dia_vencimento between 1 and 28),
  status text not null default 'solicitada' check (status in ('solicitada', 'ativa', 'cancelada')),
  vence_em date,
  -- Cancelamento agendado pelo cliente: o plano vale até o fim do período pago.
  encerra_em date,
  criado_em timestamptz not null default now(),
  ativada_em timestamptz,
  cancelada_em timestamptz,
  check (status <> 'ativa' or vence_em is not null)
);

create unique index assinaturas_uma_por_cliente_idx on public.assinaturas (cliente_id) where status <> 'cancelada';
create index assinaturas_plano_idx on public.assinaturas (plano_id);

-- Situação do pagamento, calculada (nunca gravada). Igual a `situacaoAssinatura` em
-- `src/lib/plano.ts`. Em dia e pendente dão direito ao plano; atrasado e encerrado, não.
create or replace function public.situacao_assinatura(p_status text, p_vence_em date, p_encerra_em date)
returns text language sql stable set search_path = public as $$
  select case
    when p_status = 'cancelada' then 'cancelada'
    when p_status = 'solicitada' then 'solicitada'
    when p_encerra_em is not null and public.hoje() > p_encerra_em then 'encerrada'
    when public.hoje() <= p_vence_em then 'em_dia'
    when public.hoje() <= p_vence_em + (select tolerancia_atraso_dias from public.configuracoes where id = 1)
      then 'pendente'
    else 'atrasado'
  end;
$$;

-- Assinar: o cliente pede para si; a gerência abre para qualquer cliente. Sempre nasce
-- `solicitada`, com o retrato do plano.
create or replace function public.assinaturas_criar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  plano public.planos%rowtype;
begin
  if auth.uid() is not null and not public.is_gestao() and new.cliente_id is distinct from auth.uid() then
    raise exception 'Você só pode assinar um plano para você.';
  end if;

  select * into plano from public.planos where id = new.plano_id;

  if not found or not plano.ativo then
    raise exception 'Este plano não está disponível.';
  end if;

  if exists (select 1 from public.assinaturas where cliente_id = new.cliente_id and status <> 'cancelada') then
    raise exception 'Já existe um plano em andamento para esta conta. Cancele o atual antes de assinar outro.';
  end if;

  if auth.uid() is not null and not public.is_gestao() then
    new.dia_vencimento := null;
  end if;

  new.plano_nome := plano.nome;
  new.valor_mensal := plano.preco_mensal;
  new.status := 'solicitada';
  new.vence_em := null;
  new.encerra_em := null;
  new.criado_em := now();
  new.ativada_em := null;
  new.cancelada_em := null;

  return new;
end $$;

create trigger assinaturas_criar
  before insert on public.assinaturas
  for each row execute function public.assinaturas_criar();

-- O que muda numa assinatura:
--   cliente: cancela a própria. A `solicitada` cancela na hora; a `ativa` só agenda o fim
--            (`encerra_em = vence_em`), porque o período já está pago.
--   gestão:  troca o plano (refaz o retrato), a periodicidade e o dia de vencimento, desfaz o
--            cancelamento agendado e cancela na hora.
-- `vence_em` e a ativação só mudam pelos triggers de `mensalidades` (pg_trigger_depth > 1).
-- Cancelada é final.
create or replace function public.assinaturas_protect()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pedido public.assinaturas%rowtype := new;
  plano public.planos%rowtype;
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;

  new := old;

  if old.status = 'cancelada' then
    raise exception 'Este plano já foi cancelado.';
  end if;

  if not public.is_gestao() then
    if old.cliente_id is distinct from auth.uid() then
      raise exception 'Você não pode alterar este plano.';
    end if;

    if pedido.status = 'cancelada' then
      if old.status = 'solicitada' then
        new.status := 'cancelada';
        new.cancelada_em := now();
      elsif old.encerra_em is not null then
        raise exception 'O cancelamento já está agendado para %.', to_char(old.encerra_em, 'DD/MM/YYYY');
      else
        new.encerra_em := old.vence_em;
      end if;
    end if;

    return new;
  end if;

  -- Gestão.
  if pedido.status = 'cancelada' then
    new.status := 'cancelada';
    new.cancelada_em := now();
    return new;
  end if;

  if pedido.plano_id is distinct from old.plano_id then
    select * into plano from public.planos where id = pedido.plano_id;
    if not found or not plano.ativo then
      raise exception 'Este plano não está disponível.';
    end if;
    new.plano_id := plano.id;
    new.plano_nome := plano.nome;
    new.valor_mensal := plano.preco_mensal;
  end if;

  new.periodicidade := pedido.periodicidade;
  new.dia_vencimento := pedido.dia_vencimento;

  -- Desfazer o cancelamento agendado (o cliente mudou de ideia no balcão).
  if pedido.encerra_em is null then new.encerra_em := null; end if;

  return new;
end $$;

create trigger assinaturas_protect
  before update on public.assinaturas
  for each row execute function public.assinaturas_protect();

-- Cada pagamento de plano registrado pela gerência. O valor é calculado aqui (mensal, ou o
-- trimestre com desconto) e o pagamento empurra o `vence_em` da assinatura. Ninguém apaga:
-- lançamento errado é estornado (só o último), o que devolve o vencimento anterior.
create table public.mensalidades (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas(id) on delete cascade,
  cliente_id uuid references public.profiles(id) on delete set null,
  cliente_nome text not null,
  plano_nome text not null,
  meses smallint not null check (meses in (1, 3)),
  periodo_inicio date not null,
  periodo_fim date not null,
  vence_em_anterior date,
  valor numeric(10, 2) not null check (valor > 0),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'credito', 'debito', 'dinheiro')),
  recebido_por uuid default auth.uid() references public.profiles(id) on delete set null,
  recebido_em timestamptz not null default now(),
  estornada boolean not null default false,
  estornada_em timestamptz,
  check (periodo_inicio < periodo_fim)
);

create index mensalidades_assinatura_idx on public.mensalidades (assinatura_id, recebido_em desc);
create index mensalidades_recebido_idx on public.mensalidades (recebido_em);

-- Primeiro pagamento: vale até o dia de vencimento depois de N meses (os dias até lá saem de
-- brinde). Os seguintes continuam do vencimento anterior, mesmo pagos com atraso.
create or replace function public.mensalidades_criar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ass public.assinaturas%rowtype;
  cfg public.configuracoes%rowtype;
  dia integer;
  base date;
  novo_vencimento date;
begin
  if auth.uid() is not null and not public.is_gestao() then
    raise exception 'Só a gerência registra pagamento de plano.';
  end if;

  select * into ass from public.assinaturas where id = new.assinatura_id for update;

  if not found then
    raise exception 'Plano não encontrado.';
  end if;
  if ass.status = 'cancelada' then
    raise exception 'Este plano foi cancelado. Abra um novo para registrar pagamento.';
  end if;
  if ass.encerra_em is not null then
    raise exception 'O cancelamento deste plano está agendado. Desfaça o cancelamento antes de registrar o pagamento.';
  end if;

  select * into cfg from public.configuracoes where id = 1;

  new.meses := case ass.periodicidade when 'trimestral' then 3 else 1 end;
  new.valor := round(
    ass.valor_mensal * new.meses
      * case when new.meses = 3 then (1 - cfg.desconto_trimestral / 100) else 1 end,
    2);

  dia := coalesce(ass.dia_vencimento, least(extract(day from public.hoje())::integer, 28));
  base := coalesce(ass.vence_em, public.hoje());
  novo_vencimento := (date_trunc('month', base::timestamp) + make_interval(months => new.meses))::date + (dia - 1);

  new.cliente_id := ass.cliente_id;
  new.cliente_nome := coalesce((select nome from public.profiles where id = ass.cliente_id), 'Cliente');
  new.plano_nome := ass.plano_nome;
  new.periodo_inicio := base;
  new.periodo_fim := novo_vencimento;
  new.vence_em_anterior := ass.vence_em;
  new.recebido_por := auth.uid();
  new.recebido_em := now();
  new.estornada := false;
  new.estornada_em := null;

  update public.assinaturas
     set vence_em = novo_vencimento,
         dia_vencimento = dia,
         status = 'ativa',
         ativada_em = coalesce(ativada_em, now())
   where id = ass.id;

  return new;
end $$;

create trigger mensalidades_criar
  before insert on public.mensalidades
  for each row execute function public.mensalidades_criar();

-- Da mensalidade só muda o estorno, e só na última não estornada do plano. Estornar devolve o
-- vencimento anterior; estornar o primeiro pagamento volta o plano para `solicitada`.
create or replace function public.mensalidades_protect()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  estornar boolean := new.estornada;
begin
  new := old;

  if not estornar or old.estornada then
    if estornar is distinct from old.estornada then
      raise exception 'Este pagamento já foi estornado.';
    end if;
    return new;
  end if;

  if auth.uid() is not null and not public.is_gestao() then
    raise exception 'Só a gerência estorna pagamento de plano.';
  end if;

  perform 1 from public.assinaturas where id = old.assinatura_id for update;

  if exists (
    select 1 from public.mensalidades
     where assinatura_id = old.assinatura_id and not estornada and recebido_em > old.recebido_em
  ) then
    raise exception 'Só dá para estornar o último pagamento do plano.';
  end if;

  update public.assinaturas
     set vence_em = old.vence_em_anterior,
         status = case when old.vence_em_anterior is null then 'solicitada' else status end,
         ativada_em = case when old.vence_em_anterior is null then null else ativada_em end
   where id = old.assinatura_id and status <> 'cancelada';

  new.estornada := true;
  new.estornada_em := now();

  return new;
end $$;

create trigger mensalidades_protect
  before update on public.mensalidades
  for each row execute function public.mensalidades_protect();

-- ---------------------------------------------------------------------
-- 6) Agendamentos
-- ---------------------------------------------------------------------
-- O horário marcado é um retrato: nome do cliente, barbeiro, serviço, preço e se entrou no
-- plano ficam copiados e não mudam mais. O navegador manda só cliente, barbeiro, serviço e
-- início; o `agendamentos_criar` decide o resto. Ninguém apaga: cancela.
create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  -- Conta apagada não apaga o histórico do caixa.
  cliente_id uuid default auth.uid() references public.profiles(id) on delete set null,
  barbeiro_id uuid not null references public.barbeiros(id) on delete restrict,
  servico_id uuid references public.servicos(id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz not null,
  status text not null default 'confirmado'
    check (status in ('confirmado', 'concluido', 'falta', 'cancelado')),
  cliente_nome text not null,
  cliente_telefone text,
  barbeiro_nome text not null,
  servico_nome text not null,
  categorias text[] not null default '{}',
  duracao_min integer not null,
  preco numeric(10, 2) not null,
  incluso_plano boolean not null default false,
  assinatura_id uuid references public.assinaturas(id) on delete set null,
  plano_nome text,
  -- O que cobrar: zero quando entra no plano, senão o preço do serviço.
  valor numeric(10, 2) not null,
  -- Marcado pela equipe para outra pessoa (fora das regras de grade e antecedência).
  encaixe boolean not null default false,
  observacao text check (observacao is null or length(observacao) <= 200),
  -- Preenchidos ao concluir: o que entrou no caixa.
  forma_pagamento text check (forma_pagamento is null or forma_pagamento in ('pix', 'credito', 'debito', 'dinheiro')),
  valor_recebido numeric(10, 2) check (valor_recebido is null or valor_recebido >= 0),
  concluido_em timestamptz,
  cancelado_em timestamptz,
  cancelado_por uuid references public.profiles(id) on delete set null,
  criado_por uuid default auth.uid() references public.profiles(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (inicio < fim)
);

create index agendamentos_barbeiro_idx on public.agendamentos (barbeiro_id, inicio);
create index agendamentos_cliente_idx on public.agendamentos (cliente_id, inicio desc);
create index agendamentos_inicio_idx on public.agendamentos (inicio);
create index agendamentos_concluido_idx on public.agendamentos (concluido_em) where status = 'concluido';

-- A regra que vale para marcar horário (a prévia é `src/lib/agenda.ts` + `src/lib/plano.ts`).
--
-- Cliente marcando para si:
--   horário futuro, na grade (a partir da abertura, de `intervalo_min` em `intervalo_min`),
--   dentro do expediente e fora da pausa, até a antecedência (maior para quem tem plano em
--   dia), até o limite de horários abertos e sem outro horário dele no mesmo período.
-- Equipe marcando para outra pessoa (encaixe):
--   pula grade, expediente e antecedência. O barbeiro só marca na própria agenda.
-- Os dois:
--   serviço e barbeiro ativos; sobreposição barrada na `ocupacoes` (seção 7).
--
-- Plano: se a assinatura está em dia ou pendente e todas as categorias do serviço têm cota no
-- mês do horário, o atendimento entra no plano (`valor = 0`). Senão, é cobrado o preço. A
-- assinatura é travada para dois horários simultâneos não gastarem a mesma cota.
create or replace function public.agendamentos_criar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fuso constant text := 'America/Sao_Paulo';
  cfg public.configuracoes%rowtype;
  srv public.servicos%rowtype;
  barb public.barbeiros%rowtype;
  cli public.profiles%rowtype;
  expd public.expedientes%rowtype;
  ass public.assinaturas%rowtype;
  modo_equipe boolean;
  inicio_local timestamp;
  fim_local timestamp;
  dia date;
  beneficio boolean := false;
  coberto boolean := false;
  cat text;
  cota public.plano_cotas%rowtype;
  usados integer;
  abertos integer;
  limite_dias integer;
begin
  if new.cliente_id is null then
    raise exception 'Entre na sua conta para marcar um horário.';
  end if;

  -- Quem marca para si segue as regras de cliente, mesmo sendo da equipe.
  modo_equipe := auth.uid() is null or (public.is_equipe() and new.cliente_id <> auth.uid());

  if auth.uid() is not null and not modo_equipe and new.cliente_id <> auth.uid() then
    raise exception 'Você só pode marcar horários para você.';
  end if;

  select * into cfg from public.configuracoes where id = 1;

  select * into srv from public.servicos where id = new.servico_id;
  if not found or not srv.ativo then
    raise exception 'Este serviço não está disponível.';
  end if;

  select * into barb from public.barbeiros where id = new.barbeiro_id;
  if not found or not barb.ativo then
    raise exception 'Este barbeiro não está atendendo.';
  end if;

  if modo_equipe and auth.uid() is not null and not public.is_gestao()
     and barb.id is distinct from public.meu_barbeiro_id() then
    raise exception 'Você só pode marcar horários na sua própria agenda.';
  end if;

  select * into cli from public.profiles where id = new.cliente_id;
  if not found then
    raise exception 'Cliente não encontrado.';
  end if;

  new.fim := new.inicio + make_interval(mins => srv.duracao_min);
  inicio_local := new.inicio at time zone fuso;
  fim_local := new.fim at time zone fuso;
  dia := inicio_local::date;

  select * into ass from public.assinaturas
   where cliente_id = new.cliente_id and status = 'ativa'
   for update;

  if found then
    beneficio := public.situacao_assinatura(ass.status, ass.vence_em, ass.encerra_em) in ('em_dia', 'pendente')
      and (ass.encerra_em is null or dia <= ass.encerra_em);
  end if;

  if not modo_equipe then
    if new.inicio <= now() then
      raise exception 'Escolha um horário que ainda não passou.';
    end if;

    select * into expd from public.expedientes
     where barbeiro_id = barb.id and dia_semana = extract(dow from dia);

    if not found then
      raise exception '% não atende neste dia.', barb.nome;
    end if;

    if fim_local::date <> dia or inicio_local::time < expd.abre or fim_local::time > expd.fecha then
      raise exception 'Esse horário está fora do expediente de %.', barb.nome;
    end if;

    if expd.pausa_inicio is not null and inicio_local::time < expd.pausa_fim and fim_local::time > expd.pausa_inicio then
      raise exception 'Esse horário cai no intervalo de %. Escolha outro.', barb.nome;
    end if;

    if extract(second from inicio_local) <> 0
       or (extract(epoch from inicio_local::time - expd.abre)::integer / 60) % cfg.intervalo_min <> 0 then
      raise exception 'Escolha um dos horários da agenda.';
    end if;

    limite_dias := case when beneficio then cfg.antecedencia_assinante_dias else cfg.antecedencia_avulso_dias end;
    if dia > public.hoje() + limite_dias then
      raise exception 'Dá para marcar com até % dias de antecedência.%', limite_dias,
        case when not beneficio and cfg.antecedencia_assinante_dias > cfg.antecedencia_avulso_dias
          then format(' Assinantes marcam com até %s dias.', cfg.antecedencia_assinante_dias)
          else '' end;
    end if;

    select count(*) into abertos from public.agendamentos
     where cliente_id = new.cliente_id and status = 'confirmado' and inicio > now();
    if abertos >= cfg.max_agendamentos_abertos then
      raise exception 'Você já tem % horários marcados. Espere um passar ou cancele um para marcar outro.', abertos;
    end if;

    if exists (
      select 1 from public.agendamentos
       where cliente_id = new.cliente_id and status = 'confirmado'
         and inicio < new.fim and fim > new.inicio
    ) then
      raise exception 'Você já tem um horário marcado nesse período.';
    end if;
  end if;

  if beneficio and cardinality(srv.categorias) > 0 then
    coberto := true;

    foreach cat in array srv.categorias loop
      select * into cota from public.plano_cotas c where c.plano_id = ass.plano_id and c.categoria = cat;

      if not found then
        coberto := false;
        exit;
      end if;

      if cota.limite is not null then
        select count(*) into usados from public.agendamentos a
         where a.cliente_id = new.cliente_id
           and a.incluso_plano
           and a.status <> 'cancelado'
           and cat = any (a.categorias)
           and date_trunc('month', a.inicio at time zone fuso) = date_trunc('month', inicio_local);

        if usados >= cota.limite then
          coberto := false;
          exit;
        end if;
      end if;
    end loop;
  end if;

  new.cliente_nome := coalesce(nullif(trim(cli.nome), ''), split_part(cli.email, '@', 1), 'Cliente');
  new.cliente_telefone := cli.telefone;
  new.barbeiro_nome := barb.nome;
  new.servico_nome := srv.nome;
  new.categorias := srv.categorias;
  new.duracao_min := srv.duracao_min;
  new.preco := srv.preco;
  new.incluso_plano := coberto;
  new.assinatura_id := case when coberto then ass.id end;
  new.plano_nome := case when coberto then ass.plano_nome end;
  new.valor := case when coberto then 0 else srv.preco end;
  new.encaixe := modo_equipe;
  new.observacao := nullif(trim(new.observacao), '');
  new.status := 'confirmado';
  new.forma_pagamento := null;
  new.valor_recebido := null;
  new.concluido_em := null;
  new.cancelado_em := null;
  new.cancelado_por := null;
  new.criado_por := auth.uid();
  new.criado_em := now();
  new.atualizado_em := now();

  return new;
end $$;

create trigger agendamentos_criar
  before insert on public.agendamentos
  for each row execute function public.agendamentos_criar();

-- Do horário marcado mudam só:
--   status: o cliente cancela o próprio até `cancelamento_min_horas` antes; a equipe cancela,
--           conclui (com forma de pagamento e valor, zero se entrou no plano) e marca falta;
--   remarcar (equipe): início e, para a gestão, o barbeiro. O preço e o plano ficam os do
--           dia em que foi marcado;
--   observação (equipe).
-- Concluído, falta e cancelado são finais. O barbeiro só mexe na própria agenda.
create or replace function public.agendamentos_protect()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pedido public.agendamentos%rowtype := new;
  cfg public.configuracoes%rowtype;
  barb public.barbeiros%rowtype;
  gestao boolean;
  da_agenda boolean;
  dono boolean;
  recebido numeric(10, 2);
begin
  if auth.uid() is null then return new; end if;

  new := old;

  gestao := public.is_gestao();
  da_agenda := public.is_equipe() and old.barbeiro_id = public.meu_barbeiro_id();
  dono := old.cliente_id = auth.uid();

  if not (gestao or da_agenda or dono) then
    raise exception 'Você não pode alterar este horário.';
  end if;

  if old.status <> 'confirmado' then
    raise exception 'Este horário já foi %.', case old.status
      when 'concluido' then 'concluído'
      when 'falta' then 'marcado como falta'
      else 'cancelado' end;
  end if;

  select * into cfg from public.configuracoes where id = 1;

  if pedido.inicio is distinct from old.inicio or pedido.barbeiro_id is distinct from old.barbeiro_id then
    if not (gestao or da_agenda) then
      raise exception 'Para trocar o horário, cancele e marque de novo.';
    end if;
    if pedido.barbeiro_id is distinct from old.barbeiro_id then
      if not gestao then
        raise exception 'Só a gerência passa o horário para outro barbeiro.';
      end if;
      select * into barb from public.barbeiros where id = pedido.barbeiro_id;
      if not found or not barb.ativo then
        raise exception 'Este barbeiro não está atendendo.';
      end if;
      new.barbeiro_id := barb.id;
      new.barbeiro_nome := barb.nome;
    end if;
    new.inicio := pedido.inicio;
    new.fim := pedido.inicio + make_interval(mins => old.duracao_min);
  end if;

  if pedido.observacao is distinct from old.observacao and (gestao or da_agenda) then
    new.observacao := nullif(trim(pedido.observacao), '');
  end if;

  if pedido.status is distinct from old.status then
    if pedido.status = 'cancelado' then
      if not (gestao or da_agenda) and old.inicio - now() < make_interval(hours => cfg.cancelamento_min_horas) then
        raise exception 'Faltam menos de % horas para o horário. Para cancelar, fale com a barbearia pelo WhatsApp.',
          cfg.cancelamento_min_horas;
      end if;
      new.status := 'cancelado';
      new.cancelado_em := now();
      new.cancelado_por := auth.uid();

    elsif pedido.status = 'concluido' then
      if not (gestao or da_agenda) then
        raise exception 'Só a barbearia conclui o atendimento.';
      end if;
      if (old.inicio at time zone 'America/Sao_Paulo')::date > public.hoje() then
        raise exception 'Este atendimento é de outro dia. Conclua no dia do horário.';
      end if;
      recebido := coalesce(pedido.valor_recebido, old.valor);
      if recebido < 0 then
        raise exception 'O valor recebido não pode ser negativo.';
      end if;
      if recebido > 0 and pedido.forma_pagamento is null then
        raise exception 'Informe a forma de pagamento.';
      end if;
      new.status := 'concluido';
      new.valor_recebido := recebido;
      new.forma_pagamento := case when recebido > 0 then pedido.forma_pagamento end;
      new.concluido_em := now();

    elsif pedido.status = 'falta' then
      if not (gestao or da_agenda) then
        raise exception 'Só a barbearia marca falta.';
      end if;
      if old.inicio > now() then
        raise exception 'Só dá para marcar falta depois do horário.';
      end if;
      new.status := 'falta';

    else
      raise exception 'Mudança de status inválida.';
    end if;
  end if;

  new.atualizado_em := now();

  return new;
end $$;

create trigger agendamentos_protect
  before update on public.agendamentos
  for each row execute function public.agendamentos_protect();

-- ---------------------------------------------------------------------
-- 7) Ocupações (a agenda pública, sem dado de cliente)
-- ---------------------------------------------------------------------
-- Cada horário confirmado e cada bloqueio ocupa um intervalo na agenda do barbeiro. A
-- exclusão abaixo garante que **dois intervalos do mesmo barbeiro nunca se sobrepõem**, sem
-- corrida entre duas pessoas marcando ao mesmo tempo.
--
-- É desta tabela (pública, só barbeiro e horário) que o navegador calcula os horários livres,
-- sem ler os agendamentos dos outros e sem `.rpc()`. Só os triggers escrevem nela.
create table public.ocupacoes (
  id uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  periodo tstzrange generated always as (tstzrange(inicio, fim)) stored,
  agendamento_id uuid unique references public.agendamentos(id) on delete cascade,
  bloqueio_id uuid unique references public.bloqueios(id) on delete cascade,
  check (inicio < fim),
  check (num_nonnulls(agendamento_id, bloqueio_id) = 1),
  constraint ocupacoes_sem_sobreposicao exclude using gist (barbeiro_id with =, periodo with &&)
);

create index ocupacoes_inicio_idx on public.ocupacoes (inicio);

-- Horário marcado ocupa; cancelado libera; remarcado move. Concluído e falta continuam
-- ocupando (o tempo passou de qualquer jeito).
create or replace function public.agendamentos_ocupar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ocupacoes (barbeiro_id, inicio, fim, agendamento_id)
    values (new.barbeiro_id, new.inicio, new.fim, new.id);
  elsif new.status = 'cancelado' then
    delete from public.ocupacoes where agendamento_id = new.id;
  elsif new.inicio is distinct from old.inicio or new.barbeiro_id is distinct from old.barbeiro_id then
    update public.ocupacoes
       set barbeiro_id = new.barbeiro_id, inicio = new.inicio, fim = new.fim
     where agendamento_id = new.id;
  end if;

  return null;
exception when exclusion_violation then
  raise exception 'Esse horário já está ocupado. Escolha outro.';
end $$;

create trigger agendamentos_ocupar
  after insert or update on public.agendamentos
  for each row execute function public.agendamentos_ocupar();

create or replace function public.bloqueios_ocupar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ocupacoes (barbeiro_id, inicio, fim, bloqueio_id)
    values (new.barbeiro_id, new.inicio, new.fim, new.id);
  else
    update public.ocupacoes
       set barbeiro_id = new.barbeiro_id, inicio = new.inicio, fim = new.fim
     where bloqueio_id = new.id;
  end if;

  return null;
exception when exclusion_violation then
  raise exception 'Já há horário marcado nesse período. Cancele ou remarque antes de bloquear.';
end $$;

create trigger bloqueios_ocupar
  after insert or update on public.bloqueios
  for each row execute function public.bloqueios_ocupar();

-- ---------------------------------------------------------------------
-- 8) Views (valem as policies de quem consulta)
-- ---------------------------------------------------------------------
-- Lista de clientes do painel: plano, situação do pagamento, última visita e próximo horário.
create view public.clientes_resumo with (security_invoker = true) as
select
  p.id,
  p.nome,
  p.email,
  p.telefone,
  p.nascimento,
  p.lembrete_whatsapp,
  p.criado_em,
  f.apelido,
  a.id as assinatura_id,
  a.plano_id,
  a.plano_nome,
  a.status as assinatura_status,
  a.periodicidade,
  a.vence_em,
  a.encerra_em,
  case when a.id is not null then public.situacao_assinatura(a.status, a.vence_em, a.encerra_em) end as situacao,
  (select max(g.inicio) from public.agendamentos g
    where g.cliente_id = p.id and g.status = 'concluido') as ultima_visita,
  (select min(g.inicio) from public.agendamentos g
    where g.cliente_id = p.id and g.status = 'confirmado' and g.inicio > now()) as proximo_horario
from public.profiles p
left join public.fichas f on f.profile_id = p.id
left join public.assinaturas a on a.cliente_id = p.id and a.status <> 'cancelada'
where p.role = 'cliente';

-- O caixa: atendimentos concluídos e mensalidades não estornadas, um lançamento por linha.
create view public.caixa with (security_invoker = true) as
select
  g.id,
  'atendimento'::text as tipo,
  (g.concluido_em at time zone 'America/Sao_Paulo')::date as data,
  g.concluido_em as momento,
  g.barbeiro_id,
  g.barbeiro_nome,
  g.cliente_id,
  g.cliente_nome,
  g.servico_nome as descricao,
  g.forma_pagamento,
  g.valor_recebido as valor,
  g.incluso_plano
from public.agendamentos g
where g.status = 'concluido'
union all
select
  m.id,
  'mensalidade'::text,
  (m.recebido_em at time zone 'America/Sao_Paulo')::date,
  m.recebido_em,
  null::uuid,
  null::text,
  m.cliente_id,
  m.cliente_nome,
  'Plano ' || m.plano_nome || case when m.meses = 3 then ' (trimestre)' else '' end,
  m.forma_pagamento,
  m.valor,
  false
from public.mensalidades m
where not m.estornada;

revoke all on public.clientes_resumo from anon;
revoke all on public.caixa from anon;

-- ---------------------------------------------------------------------
-- 9) RLS
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.configuracoes enable row level security;
alter table public.barbeiros     enable row level security;
alter table public.expedientes   enable row level security;
alter table public.bloqueios     enable row level security;
alter table public.fichas        enable row level security;
alter table public.servicos      enable row level security;
alter table public.planos        enable row level security;
alter table public.plano_cotas   enable row level security;
alter table public.assinaturas   enable row level security;
alter table public.mensalidades  enable row level security;
alter table public.agendamentos  enable row level security;
alter table public.ocupacoes     enable row level security;

-- Os helpers vão dentro de `(select ...)` para o Postgres avaliar uma vez por consulta, e
-- não uma vez por linha.

-- profiles: cada um vê e edita o seu; a equipe vê todos (encaixe, agenda, lista de clientes);
-- o admin muda papéis. O que cada um pode alterar está no profiles_protect.
create policy "perfis: o proprio ou a equipe ve" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_equipe()));
create policy "perfis: o proprio ou o admin altera" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- configuracoes: o site inteiro lê; só o admin altera. A linha vem deste arquivo.
create policy "configuracoes: todos veem" on public.configuracoes
  for select to anon, authenticated using (true);
create policy "configuracoes: admin altera" on public.configuracoes
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- barbeiros, expedientes, serviços e planos: o público vê os ativos (para escolher); a gestão
-- vê e mexe em tudo.
create policy "barbeiros: todos veem os ativos, a gestao todos" on public.barbeiros
  for select to anon, authenticated using (ativo or (select public.is_gestao()));
create policy "barbeiros: gestao cadastra" on public.barbeiros
  for insert to authenticated with check ((select public.is_gestao()));
create policy "barbeiros: gestao edita" on public.barbeiros
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));
create policy "barbeiros: gestao apaga" on public.barbeiros
  for delete to authenticated using ((select public.is_gestao()));

create policy "expedientes: todos veem" on public.expedientes
  for select to anon, authenticated using (true);
create policy "expedientes: gestao cadastra" on public.expedientes
  for insert to authenticated with check ((select public.is_gestao()));
create policy "expedientes: gestao edita" on public.expedientes
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));
create policy "expedientes: gestao apaga" on public.expedientes
  for delete to authenticated using ((select public.is_gestao()));

-- bloqueios: o barbeiro cuida da própria agenda; a gestão, de todas. O público não vê o
-- motivo, só a ocupação.
create policy "bloqueios: o barbeiro ve os seus, a gestao todos" on public.bloqueios
  for select to authenticated
  using ((select public.is_gestao()) or barbeiro_id = (select public.meu_barbeiro_id()));
create policy "bloqueios: o barbeiro cria os seus, a gestao todos" on public.bloqueios
  for insert to authenticated
  with check ((select public.is_gestao()) or barbeiro_id = (select public.meu_barbeiro_id()));
create policy "bloqueios: o barbeiro edita os seus, a gestao todos" on public.bloqueios
  for update to authenticated
  using ((select public.is_gestao()) or barbeiro_id = (select public.meu_barbeiro_id()))
  with check ((select public.is_gestao()) or barbeiro_id = (select public.meu_barbeiro_id()));
create policy "bloqueios: o barbeiro apaga os seus, a gestao todos" on public.bloqueios
  for delete to authenticated
  using ((select public.is_gestao()) or barbeiro_id = (select public.meu_barbeiro_id()));

-- fichas: a equipe lê (o barbeiro vê as preferências de quem vai atender); a gestão escreve.
create policy "fichas: a equipe ve" on public.fichas
  for select to authenticated using ((select public.is_equipe()));
create policy "fichas: gestao cadastra" on public.fichas
  for insert to authenticated with check ((select public.is_gestao()));
create policy "fichas: gestao edita" on public.fichas
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));

create policy "servicos: todos veem os ativos, a gestao todos" on public.servicos
  for select to anon, authenticated using (ativo or (select public.is_gestao()));
create policy "servicos: gestao cadastra" on public.servicos
  for insert to authenticated with check ((select public.is_gestao()));
create policy "servicos: gestao edita" on public.servicos
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));
create policy "servicos: gestao apaga" on public.servicos
  for delete to authenticated using ((select public.is_gestao()));

create policy "planos: todos veem os ativos, a gestao todos" on public.planos
  for select to anon, authenticated using (ativo or (select public.is_gestao()));
create policy "planos: gestao cadastra" on public.planos
  for insert to authenticated with check ((select public.is_gestao()));
create policy "planos: gestao edita" on public.planos
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));
create policy "planos: gestao apaga" on public.planos
  for delete to authenticated using ((select public.is_gestao()));

create policy "cotas: todos veem" on public.plano_cotas
  for select to anon, authenticated using (true);
create policy "cotas: gestao cadastra" on public.plano_cotas
  for insert to authenticated with check ((select public.is_gestao()));
create policy "cotas: gestao edita" on public.plano_cotas
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));
create policy "cotas: gestao apaga" on public.plano_cotas
  for delete to authenticated using ((select public.is_gestao()));

-- assinaturas e mensalidades: o cliente vê as suas; a gestão vê e registra todas. Sem delete.
-- As regras finas ficam nos triggers.
create policy "assinaturas: o cliente ve as suas, a gestao todas" on public.assinaturas
  for select to authenticated
  using (cliente_id = (select auth.uid()) or (select public.is_gestao()));
create policy "assinaturas: o cliente pede a sua, a gestao abre" on public.assinaturas
  for insert to authenticated
  with check (cliente_id = (select auth.uid()) or (select public.is_gestao()));
create policy "assinaturas: o cliente cancela a sua, a gestao altera" on public.assinaturas
  for update to authenticated
  using (cliente_id = (select auth.uid()) or (select public.is_gestao()))
  with check (cliente_id = (select auth.uid()) or (select public.is_gestao()));

create policy "mensalidades: o cliente ve as suas, a gestao todas" on public.mensalidades
  for select to authenticated
  using (cliente_id = (select auth.uid()) or (select public.is_gestao()));
create policy "mensalidades: gestao registra" on public.mensalidades
  for insert to authenticated with check ((select public.is_gestao()));
create policy "mensalidades: gestao estorna" on public.mensalidades
  for update to authenticated
  using ((select public.is_gestao())) with check ((select public.is_gestao()));

-- agendamentos: o cliente vê e marca os seus; o barbeiro, os da própria agenda; a gestão,
-- todos. Sem delete. O que cada um pode mudar fica no agendamentos_criar/_protect.
create policy "agendamentos: cliente, barbeiro da agenda ou gestao ve" on public.agendamentos
  for select to authenticated
  using (
    cliente_id = (select auth.uid())
    or (select public.is_gestao())
    or barbeiro_id = (select public.meu_barbeiro_id())
  );
create policy "agendamentos: o cliente marca o seu, a equipe encaixa" on public.agendamentos
  for insert to authenticated
  with check (cliente_id = (select auth.uid()) or (select public.is_equipe()));
create policy "agendamentos: cliente, barbeiro da agenda ou gestao altera" on public.agendamentos
  for update to authenticated
  using (
    cliente_id = (select auth.uid())
    or (select public.is_gestao())
    or barbeiro_id = (select public.meu_barbeiro_id())
  )
  with check (
    cliente_id = (select auth.uid())
    or (select public.is_gestao())
    or barbeiro_id = (select public.meu_barbeiro_id())
    -- A gestão remarca para outro barbeiro; o barbeiro, só dentro da própria agenda.
  );

-- ocupacoes: pública e só de leitura. Quem escreve são os triggers (security definer).
create policy "ocupacoes: todos veem" on public.ocupacoes
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 10) Realtime (a agenda da equipe e os horários livres se atualizam sozinhos)
-- ---------------------------------------------------------------------
-- O Realtime respeita o RLS acima: cada um só recebe os agendamentos que pode ver.
alter publication supabase_realtime add table public.agendamentos, public.ocupacoes;

-- ---------------------------------------------------------------------
-- 11) Primeiro admin (depois de se cadastrar em /cadastrar)
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin'
--  where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
