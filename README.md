# LD Barber: agendamento, planos e gestão da casa

O sistema da LD Barber (Studio). O cliente vê os dias com vaga, marca o horário e assina um plano mensal. A equipe cuida da agenda, dos clientes, dos planos e do caixa no painel.

O app é **só da LD Barber**: a marca e o design system (tema escuro, UnifrakturCook, Oswald e Inter, azul neon) ficam no código. Os dados da casa ficam no painel (endereço, WhatsApp, aviso, chave Pix, regras da agenda).

## Como funciona

**Cliente** (site, primeiro para o celular):

1. Vê os **dias disponíveis** do mês e quantos horários livres cada barbeiro tem. Não precisa de conta.
2. **Marca o horário**: serviço → barbeiro (ou "tanto faz") → dia e hora → confirma. Precisa de conta (e-mail, senha e WhatsApp).
3. Vê e cancela os próprios horários em **Meus horários**. O cancelamento pelo site vai até N horas antes.
4. Pede um **plano** (Essencial, Soul, Black...), mensal ou trimestral com desconto. O pagamento é **na barbearia**: o plano vale quando a casa registra o primeiro pagamento.
5. Com o plano em dia, os serviços cobertos saem por R$ 0 até acabar a cota do mês, e a agenda abre com mais antecedência.

**Equipe** (painel em `/painel`):

- **Agenda** do dia (colunas por barbeiro) e da semana, com encaixe, bloqueio (folga, feriado), remarcar, falta, cancelar e "concluir e receber" (forma de pagamento e valor).
- **Lembrete pelo WhatsApp**: um botão abre o `wa.me` do cliente com a mensagem pronta.
- **Clientes**: plano, situação do pagamento, última visita, ficha da casa (apelido, barbeiro preferido, preferências) e histórico.
- **Planos e mensalidades**: abrir plano, registrar pagamento, trocar, encerrar, estornar.
- **Barbeiros**, **Serviços**, **Planos** e **Financeiro** (o caixa: atendimentos concluídos e mensalidades).

**Quem garante as regras é o banco.**

- O navegador manda só cliente, barbeiro, serviço e início.
- O trigger `agendamentos_criar` confere grade, expediente, pausa, antecedência e limite de horários abertos, e decide se o horário entra no plano (cota do mês) ou é cobrado. Grava o horário como um retrato.
- A tabela `ocupacoes`, com uma exclusão `gist`, garante que **dois horários do mesmo barbeiro nunca se sobrepõem**, mesmo com duas pessoas marcando ao mesmo tempo.
- Mensalidade: valor e vencimento são do `mensalidades_criar`. "Em dia / pendente / atrasado" é calculado, nunca gravado.

## Papéis

| Papel | Pode |
|---|---|
| `cliente` | Marcar e cancelar os próprios horários, pedir e cancelar o próprio plano, editar os próprios dados |
| `barbeiro` | Só a **própria agenda**: ver, encaixar, bloquear, remarcar no próprio horário, concluir, marcar falta, cancelar |
| `gerente` | A agenda de todos, clientes, fichas, planos e mensalidades, barbeiros, serviços e o caixa |
| `admin` | Tudo do gerente, mais **Ajustes** (dados da casa, regras da agenda) e os papéis da equipe |

- Todo cadastro nasce `cliente`. O admin promove em Ajustes → Equipe.
- O barbeiro precisa da conta ligada à agenda: a gerência informa o e-mail em Barbeiros.
- Ninguém muda o próprio papel. O primeiro admin é promovido por SQL.
- Todo cliente tem conta: não há cadastro de balcão. O encaixe é para quem já criou conta no site.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript.
- Tailwind v4 e shadcn (base-rhea, sobre Base UI).
- TanStack Query, zustand (estado de tela), react-hook-form + zod.
- Supabase: Auth, Postgres com RLS, triggers e Realtime.
- Sem Edge Function, sem service role e sem Storage.

O padrão de código é o do workspace (`../CLAUDE.md`). O que muda por causa do Next e o que é só deste app está em `../docs/ldbarber-web.md`.

## Setup

### 1. Supabase

1. Crie um projeto no Supabase (região `sa-east-1`).
2. No **SQL Editor**, rode `supabase/schema.sql` inteiro. Ele cria tabelas, triggers e policies e liga o Realtime em `agendamentos` e `ocupacoes`.
3. (Opcional) Rode `supabase/seed.sql`: os serviços e os planos do design system, editáveis no painel.
4. Em **Authentication → URL Configuration**:
   - em *Site URL*, coloque o endereço do site;
   - em *Redirect URLs*, adicione `https://SEU-DOMINIO/entrar` e `https://SEU-DOMINIO/redefinir-senha`, e os mesmos com `http://localhost:3000`.
5. **Confirm email**: sem SMTP próprio, o Supabase só manda e-mail para os membros do projeto. Deixe desligado até configurar um SMTP (Authentication → Emails → SMTP). O SMTP também é o que faz "recuperar senha" chegar ao cliente.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (ou a anon key legada). É pública: quem protege os dados é o RLS |
| `APP_URL` | Endereço público do site (`https://...`), só no servidor. Base do sitemap e da prévia do link |

### 3. Rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run build` e `npm run lint` precisam passar antes de terminar qualquer tarefa.

### 4. Primeiro admin

1. Crie a conta em `/cadastrar`. Toda conta nasce **cliente**.
2. No SQL Editor:

   ```sql
   update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
   ```

3. Saia e entre de novo: o menu da conta mostra **Painel da casa**.

### 5. Montar a casa

1. **Ajustes → Casa**: WhatsApp, Instagram, endereço, chave Pix e aviso.
2. **Ajustes → Agenda**: grade (30 min), antecedência do avulso e do assinante, janela de cancelamento, limite de horários abertos, tolerância da mensalidade e desconto do trimestral.
3. **Ajustes → Equipe**: promova as contas dos barbeiros (e do gerente, se houver).
4. **Barbeiros**: cadastre cada um com o expediente da semana (e a pausa do almoço) e ligue a conta pelo e-mail.
5. **Serviços** e **Planos**: confira os do seed ou cadastre. A cota do plano é por categoria (corte, barba, pigmentação) e por mês.

### 6. Deploy (Vercel)

1. Importe o repositório na Vercel, framework Next.js. A região `gru1` (São Paulo) vem do `vercel.json`.
2. Cadastre as três variáveis. `APP_URL` é o domínio definitivo.
3. Atualize as *Redirect URLs* do Supabase com o domínio.
4. Cada push na branch de produção (`develop`) publica sozinho.

## Regras

**Agenda**

- A grade começa na abertura do expediente, de `intervalo_min` em `intervalo_min`.
- O horário precisa caber no expediente sem cruzar a pausa.
- O cliente marca até `antecedencia_avulso_dias` à frente; com plano em dia ou pendente, até `antecedencia_assinante_dias`.
- Cada cliente tem no máximo `max_agendamentos_abertos` horários futuros, sem dois no mesmo período.
- O encaixe da equipe pula grade, expediente e antecedência, mas **nunca** a sobreposição.
- O cliente cancela até `cancelamento_min_horas` antes. A equipe cancela, remarca, conclui e marca falta.
- Concluído, falta e cancelado são finais. Ninguém apaga horário.

**Plano**

- O serviço entra no plano quando **todas** as categorias dele têm cota no mês do horário. "Corte + Barba" gasta um corte e uma barba. Fora da cota, é cobrado o preço.
- **Situação**: em dia até o vencimento; pendente até `tolerancia_atraso_dias` depois; atrasado depois disso. Atrasado não cobre.
- **Pagamento**:
  - O primeiro pagamento vale até o dia de vencimento depois de 1 (ou 3) meses.
  - Os seguintes continuam do vencimento anterior.
  - O trimestral tem `desconto_trimestral`.
  - Estorno só do último pagamento, e ele devolve o vencimento anterior.
- **Cancelamento**: pelo cliente, o plano vale até o fim do período pago; pela gerência, na hora.
- **Preço**: cada assinatura guarda o preço do dia em que foi aberta. Mudar o preço do plano vale para quem assinar depois.

## Testar

### O banco

Num Postgres local (Docker), sem projeto Supabase:

```bash
docker run -d --name ldbarber-pg -e POSTGRES_PASSWORD=test -p 55434:5432 postgres:17-alpine
supabase/tests/rodar.sh     # recria o banco, aplica o schema e roda o roteiro; termina em "TUDO OK"
```

O roteiro (`supabase/tests/regras.sql`) confere:

- **Valores do servidor:** o preço, o plano e o status vindos do navegador são ignorados.
- **Regras da agenda do cliente:**
  - horário passado, fora da grade, fora do expediente e na pausa;
  - antecedência, com a do assinante maior;
  - limite de horários abertos;
  - dois horários do mesmo cliente no mesmo período.
- **Sobreposição:** é barrada entre clientes, no encaixe, no remarcar e no bloqueio.
- **Plano:**
  - a cota do mês (o 5º corte do Soul é cobrado) e a barba ilimitada;
  - pendente ainda cobre; atrasado não;
  - mensalidade mensal e trimestral (com desconto), estorno só do último e cancelamento agendado pelo cliente.
- **Permissões:**
  - o barbeiro só vê e mexe na própria agenda e não vê planos nem pagamentos;
  - o gerente não mexe em Ajustes nem em papéis;
  - ninguém muda o próprio papel;
  - quem sai da equipe perde a agenda;
  - `anon` lê só o que é público.

### O app

Com um projeto Supabase de teste no `.env.local`, depois do seed e de um barbeiro cadastrado:

1. Em uma aba anônima, veja `/disponibilidade` e `/planos` sem login.
2. Crie uma conta, marque um horário e veja o horário sumir da grade em outra aba.
3. Tente o mesmo horário em duas abas: a segunda recebe "Esse horário já está ocupado".
4. Peça o plano Soul.
   1. No painel, abra o cliente e registre o pagamento.
   2. Marque "Corte + Barba": sai "Incluso no plano Soul".
5. Com uma conta barbeiro ligada a uma agenda, a agenda mostra só a coluna dele. Conclua um atendimento e confira no Financeiro, com a conta do gerente.

## Estrutura

```
src/
  app/
    layout.tsx  opengraph-image.tsx  robots.ts  sitemap.ts
    (app)/layout.tsx          providers
      (auth)/                 entrar, cadastrar, recuperar-senha
      redefinir-senha/
      (site)/                 início, disponibilidade, agendar, planos, meus-horarios, perfil
      painel/                 agenda (+ novo), clientes, barbeiros, servicos, planos, financeiro, ajustes
  components/
    site/                     cabeçalho, barra de baixo, aviso, rodapé
    app-sidebar/              lateral do painel
    forms/                    um arquivo por formulário
    ui/                       primitivos shadcn (com o visual do design system)
  hooks/                      sessão, configuração, agenda pública, meu plano, realtime
  lib/                        agenda.ts, plano.ts (prévia das regras do banco), caixa, mensagem, constants, errors, queries
  services/                   acesso ao Supabase, um arquivo por recurso
supabase/
  schema.sql                  instalação completa
  seed.sql                    serviços e planos do design system
  tests/                      stub do Supabase + roteiro das regras
```
