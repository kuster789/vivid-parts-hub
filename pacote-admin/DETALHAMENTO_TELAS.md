# Detalhamento Completo das Telas: Leads, Usuários e Auditoria

> Documento de referência para reimplementação em outro projeto.

---

## Índice

1. [Pré-requisitos (SQL, Tabelas, Enums)](#1-pré-requisitos)
2. [Tela AdminLeads](#2-tela-adminleads)
3. [Tela AdminUsers](#3-tela-adminusers)
4. [Tela AdminAuditLogs](#4-tela-adminauditlogs)
5. [AuthContext (Autenticação e Roles)](#5-authcontext)
6. [Hook usePermissions](#6-hook-usepermissions)
7. [Edge Function admin-create-user](#7-edge-function-admin-create-user)
8. [Dependências NPM](#8-dependências-npm)

---

## 1. Pré-requisitos

### Enums necessários

```sql
CREATE TYPE public.app_role AS ENUM ('admin_master', 'supervisor', 'operator', 'admin', 'employee');
```

### Tabelas necessárias

#### profiles
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

#### user_roles
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

#### role_permissions
```sql
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
```

#### user_permission_overrides
```sql
CREATE TABLE public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
```

#### audit_logs
```sql
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid NOT NULL,
  action text NOT NULL,
  target_user uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

#### leads
```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text DEFAULT 'popup',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
```

#### page_views (para enriquecimento de leads)
```sql
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  region text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
```

### Função has_role (OBRIGATÓRIA)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND (
      role = _role
      OR (_role = 'admin' AND role = 'admin_master')
      OR (_role = 'employee' AND role IN ('supervisor', 'operator'))
    )
  )
$$;
```

> **Importante:** A função `has_role` trata hierarquia. `admin_master` automaticamente satisfaz checks de `admin`. `supervisor` e `operator` satisfazem checks de `employee`.

### Função para proteção do último Admin Master

```sql
CREATE OR REPLACE FUNCTION public.prevent_last_admin_master_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.role = 'admin_master' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin_master' AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último Admin Master';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_last_admin_master
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_master_delete();
```

### Trigger para criar perfil automático

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### RLS Policies

```sql
-- profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

-- user_roles
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can view all roles" ON user_roles FOR SELECT USING (has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Supervisors can insert operator roles" ON user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'supervisor') AND role = 'operator');
CREATE POLICY "Supervisors can delete operator roles" ON user_roles FOR DELETE USING (has_role(auth.uid(), 'supervisor') AND role = 'operator');

-- role_permissions
CREATE POLICY "Authenticated can view role_permissions" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Admin master can manage role_permissions" ON role_permissions FOR ALL USING (has_role(auth.uid(), 'admin_master'));

-- user_permission_overrides
CREATE POLICY "Users can view own overrides" ON user_permission_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin master can manage overrides" ON user_permission_overrides FOR ALL USING (has_role(auth.uid(), 'admin_master'));

-- audit_logs
CREATE POLICY "Admin master can view audit logs" ON audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Staff can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- leads
CREATE POLICY "Anyone can submit a lead" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view leads" ON leads FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- page_views
CREATE POLICY "Anyone can insert page views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view page views" ON page_views FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
```

### Dados iniciais de permissões por cargo

```sql
-- Admin Master: acesso total
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('admin_master', 'dashboard', true, true, true, true),
  ('admin_master', 'products', true, true, true, true),
  ('admin_master', 'orders', true, true, true, true),
  ('admin_master', 'sales', true, true, true, true),
  ('admin_master', 'leads', true, true, true, true),
  ('admin_master', 'users', true, true, true, true),
  ('admin_master', 'notifications', true, true, true, true),
  ('admin_master', 'audit_logs', true, true, true, true);

-- Supervisor: gestão operacional
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('supervisor', 'dashboard', true, false, false, false),
  ('supervisor', 'products', true, true, true, false),
  ('supervisor', 'orders', true, true, true, false),
  ('supervisor', 'sales', true, true, true, false),
  ('supervisor', 'leads', true, false, false, false),
  ('supervisor', 'users', true, true, false, false),
  ('supervisor', 'notifications', true, true, false, false),
  ('supervisor', 'audit_logs', false, false, false, false);

-- Operator: acesso restrito
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('operator', 'dashboard', true, false, false, false),
  ('operator', 'products', true, true, true, false),
  ('operator', 'orders', true, false, true, false),
  ('operator', 'sales', false, false, false, false),
  ('operator', 'leads', false, false, false, false),
  ('operator', 'users', false, false, false, false),
  ('operator', 'notifications', true, false, false, false),
  ('operator', 'audit_logs', false, false, false, false);
```

---

## 2. Tela AdminLeads

### Layout Visual

```
┌──────────────────────────────────────────────────────────┐
│ "X lead(s) total"          [Todos|Recorrentes|Novos] [📥 Exportar] │
├──────────────────────────────────────────────────────────┤
│ Email          │ Fonte  │ Visitas         │ Páginas        │ Data    │ 🗑 │
│ ex@mail.com    │ popup  │ 👁 5 [Recorrente]│ /catalogo +2   │ 01/01/26│ X  │
│ outro@mail.com │ popup  │ 👁 1            │ Início         │ 28/02/26│ X  │
└──────────────────────────────────────────────────────────┘
Se vazio: ícone de envelope + "Nenhum lead encontrado."
```

### Fluxo de Dados Detalhado

```
1. CARREGAR LEADS
   Query: SELECT * FROM leads ORDER BY created_at DESC
   Resultado: array de { id, email, source, session_id, created_at }

2. ENRIQUECER COM VISITAS
   a) Extrair session_ids únicos dos leads (filtrar nulls)
   b) Query: SELECT session_id, path FROM page_views WHERE session_id IN (session_ids)
   c) Construir mapa:
      visitMap = {
        "session_abc": { count: 5, pages: ["/", "/catalogo", "/produto/x"] },
        "session_def": { count: 1, pages: ["/"] }
      }
   d) Para cada lead:
      - lead.visit_count = visitMap[lead.session_id]?.count || 0
      - lead.pages_visited = visitMap[lead.session_id]?.pages || []

3. FILTROS (aplicados no frontend, sem nova query)
   - "Todos": sem filtro
   - "Recorrentes": visit_count > 2
   - "Novos": visit_count <= 2

4. CONTADORES nos botões de filtro
   - returningCount = leads.filter(l => l.visit_count > 2).length
   - newCount = leads.filter(l => l.visit_count <= 2).length
```

### Exportação CSV

```
Cabeçalho: "Email,Fonte,Data,Visitas,Páginas Visitadas\n"
Cada linha: "email","fonte","dd/MM/yyyy",visit_count,"pagina1; pagina2; pagina3"
Nome do arquivo: leads-{filtro_ativo}.csv
Método: Blob -> URL.createObjectURL -> <a>.click()
```

### Exclusão de Lead

```
Query: DELETE FROM leads WHERE id = ?
Frontend: remove do array local sem recarregar
Toast: "Lead removido"
```

### Coluna "Páginas"

```
- Exibe até 3 badges com texto da página
- "/" é exibido como "Início"
- Demais: remove "/" inicial (ex: "/catalogo" → "catalogo")
- Se > 3 páginas: exibe "+N" (onde N = total - 3)
```

### Badge "Recorrente"

```
Condição: visit_count > 2
Componente: <Badge variant="secondary"> com classes bg-primary/10 text-primary
Texto: "Recorrente"
```

### Interface TypeScript

```typescript
interface Lead {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
  session_id?: string | null;
  visit_count?: number;       // Calculado no frontend
  pages_visited?: string[];    // Calculado no frontend
}

type FilterType = "all" | "returning" | "new";
```

### Componentes shadcn utilizados
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Button` (variant="outline" para exportar, variant="ghost" para deletar)
- `Badge` (variant="secondary")

### Ícones (lucide-react)
- `Loader2` (loading spinner)
- `Trash2` (botão deletar)
- `Download` (botão exportar)
- `Mail` (estado vazio)
- `Eye` (coluna visitas)
- `Filter` (importado mas não usado diretamente)

---

## 3. Tela AdminUsers

### Layout Visual

```
┌────────────────────────────────────────────────────────────┐
│ "X usuário(s)"                          [+ Adicionar Usuário] │
├────────────────────────────────────────────────────────────┤
│ [👤] João Silva                                             │
│      ID: a1b2c3d4  📞 11999...  📍 São Paulo, SP            │
│                              [SUPERVISOR]  [select▼]  [▼]    │
├── PAINEL DE PERMISSÕES (expandido, só Admin Master) ─────────┤
│ Permissões (override sobre cargo base: Supervisor)            │
│                                                               │
│ Módulo       │ Ver  │ Criar │ Editar │ Excluir                │
│ Dashboard    │ [✓]  │ [ ]   │ [ ]    │ [ ]                    │
│ Produtos     │ [✓]  │ [✓]●  │ [✓]    │ [ ]                    │
│ Pedidos      │ [✓]  │ [✓]   │ [✓]    │ [✓]●                   │
│ Vendas       │ [✓]  │ [✓]   │ [✓]    │ [ ]                    │
│ Leads        │ [✓]  │ [ ]   │ [ ]    │ [ ]                    │
│ Usuários     │ [✓]  │ [✓]   │ [ ]    │ [ ]                    │
│ Notificações │ [✓]  │ [✓]   │ [ ]    │ [ ]                    │
│ Auditoria    │ [ ]  │ [ ]   │ [ ]    │ [ ]                    │
│ ● = override ativo (diferente do cargo base)                  │
└───────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados Detalhado

```
1. CARREGAR USUÁRIOS (função loadUsers)
   a) SELECT * FROM profiles                    → todos os perfis
   b) SELECT * FROM user_roles                   → todos os cargos
   c) Merge: cada perfil recebe .role do user_roles onde user_id bate
      Se não tem role → .role = null → exibe "Sem cargo"
   d) SELECT * FROM role_permissions             → permissões base por cargo
   e) Organiza em rolePermsMap:
      {
        "admin_master": [{ module: "dashboard", can_view: true, ... }, ...],
        "supervisor": [{ module: "dashboard", can_view: true, ... }, ...],
        "operator": [...]
      }

2. CARREGAR OVERRIDES (função loadOverrides, sob demanda)
   Trigger: quando expande o painel de permissões de um usuário
   Query: SELECT * FROM user_permission_overrides WHERE user_id = ?
   Armazena em: userOverrides[userId] = [{ module, can_view, can_create, can_edit, can_delete }, ...]
```

### Dialog "Adicionar Usuário"

```
Campos:
- Nome completo (input text, placeholder: "João Silva")
- E-mail (input email, placeholder: "joao@exemplo.com")
- Senha (input password, mínimo 8 caracteres)
- Cargo (select)

Validações frontend:
- Todos os campos obrigatórios
- Senha >= 8 caracteres

Cargos disponíveis por quem cria:
- Admin Master → ["admin_master", "supervisor", "operator"]
- Supervisor → ["operator"]

Ação: chama Edge Function "admin-create-user" (ver seção 7)
Após sucesso: fecha dialog, limpa campos, recarrega lista
Após erro: toast.error com mensagem
```

### Alterar Cargo (select inline)

```
Visível quando: canEditUser(targetRole) && userId !== meu_id
Regras canEditUser:
  - Admin Master → pode editar qualquer um
  - Supervisor → só pode editar "operator"

Fluxo:
1. DELETE FROM user_roles WHERE user_id = target_id
2. INSERT INTO user_roles (user_id, role) VALUES (target_id, novo_cargo)
3. INSERT INTO audit_logs (performed_by, action, target_user, details)
   VALUES (meu_id, 'change_role', target_id, { from: cargo_antigo, to: cargo_novo })
4. toast.success("Cargo atualizado!")
5. Recarrega lista

Validações:
- Não pode alterar a si mesmo (select não aparece)
- Se current role = admin_master e eu não sou admin_master → bloqueado
- Se eu sou supervisor e novo cargo ≠ operator → bloqueado
```

### Painel de Permissões (expandível)

```
Visibilidade: somente isAdminMaster = true
Toggle: botão com ChevronDown (rotaciona 180° quando expandido)

Ao expandir pela primeira vez:
  → loadOverrides(userId) busca SELECT * FROM user_permission_overrides WHERE user_id = ?

Módulos exibidos (8 total):
  dashboard, products, orders, sales, leads, users, notifications, audit_logs

Labels dos módulos:
  dashboard → "Dashboard", products → "Produtos", orders → "Pedidos",
  sales → "Vendas", leads → "Leads", users → "Usuários",
  notifications → "Notificações", audit_logs → "Auditoria"

Para cada célula da tabela (módulo × permissão):
  baseValue = rolePermsMap[user.role]?.find(rp => rp.module === mod)?.[field] ?? false
  overrideValue = userOverrides[userId]?.find(o => o.module === mod)?.[field]
  effective = overrideValue ?? baseValue
  hasOverride = overrideValue !== null && overrideValue !== undefined

Checkbox: checked = effective
Indicador ●: aparece quando hasOverride = true (cor primary)
```

### Salvar Override de Permissão

```
Ao clicar checkbox:
1. Se já existe override para aquele módulo:
   UPDATE user_permission_overrides SET {field} = valor, updated_at = now() WHERE id = existing.id
2. Se não existe:
   INSERT INTO user_permission_overrides (user_id, module, {field}) VALUES (...)
3. INSERT INTO audit_logs:
   { performed_by: meu_id, action: 'update_permissions', target_user: userId, details: { module, field, value } }
4. Recarrega overrides do usuário
5. toast.success("Permissão atualizada")
```

### Badge de Cargo (cores)

```
admin_master → border-destructive bg-destructive/10 text-destructive (vermelho)
supervisor   → border-primary bg-primary/10 text-primary (azul/primário)
operator     → border-muted-foreground bg-secondary text-muted-foreground (cinza)
Outros       → border-border text-muted-foreground (neutro)
```

### Ícones (lucide-react)
- `Loader2`, `Shield`, `User`, `MapPin`, `Phone`, `Plus`, `ChevronDown`

### Componentes shadcn
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`

---

## 4. Tela AdminAuditLogs

### Layout Visual

```
┌──────────────────────────────────────────────────────────────┐
│ "X registro(s)"                                               │
├──────────┬───────────────────┬──────────┬──────────┬─────────┤
│ Data     │ Ação              │ Por*     │ Alvo*    │ Detalhes*│
│ 01/03/26 │ 📄 Alterou cargo  │ a1b2c3.. │ e5f6g7.. │ {json}  │
│ 28/02/26 │ 📄 Criou usuário  │ a1b2c3.. │ h8i9j0.. │ {json}  │
│ 25/02/26 │ 📄 Atualizou perm.│ a1b2c3.. │ k1l2m3.. │ {json}  │
└──────────┴───────────────────┴──────────┴──────────┴─────────┘
* Colunas com responsividade (ver tabela abaixo)
Se vazio: "Nenhum registro de auditoria."
```

### Query

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200
```

### Mapeamento de Labels

```typescript
const ACTION_LABELS: Record<string, string> = {
  create_user: "Criou usuário",
  change_role: "Alterou cargo",
  update_permissions: "Atualizou permissões",
  delete_user: "Removeu usuário",
};
```

### Responsividade das Colunas

| Coluna | Mobile (< md) | Tablet (md) | Desktop (lg) |
|--------|:-------------:|:-----------:|:------------:|
| Data | ✅ sempre | ✅ | ✅ |
| Ação | ✅ sempre | ✅ | ✅ |
| Executado por | ❌ hidden | ✅ `md:table-cell` | ✅ |
| Alvo | ❌ hidden | ✅ `md:table-cell` | ✅ |
| Detalhes | ❌ hidden | ❌ hidden | ✅ `lg:table-cell` |

### Formatação dos Dados

```
Data: format(new Date(log.created_at), "dd/MM/yyyy HH:mm")  — usando date-fns
UUIDs: log.performed_by?.slice(0, 8) + "…"
Detalhes: JSON.stringify(log.details) — com truncate via CSS (max-w-xs truncate)
Ação: Ícone FileText + label traduzido
```

### RLS

```
Somente admin_master pode fazer SELECT na tabela audit_logs.
Qualquer staff pode INSERT (com auth.uid() = performed_by).
```

### Ícones (lucide-react)
- `Loader2`, `FileText`

### Componentes
- Tabela HTML nativa (não usa shadcn Table)

---

## 5. AuthContext

### Interface exportada

```typescript
interface AuthContextType {
  user: User | null;           // Usuário Supabase autenticado
  session: Session | null;     // Sessão Supabase
  loading: boolean;            // true durante bootstrap e resolução de roles
  isAdmin: boolean;            // true se role = admin_master OU admin
  isEmployee: boolean;         // true se role = supervisor, operator ou employee
  isAdminMaster: boolean;      // true se role = admin_master
  isSupervisor: boolean;       // true se role = supervisor
  isOperator: boolean;         // true se role = operator
  userRole: string | null;     // Nome do cargo principal (por prioridade)
  signUp(email, password, fullName): Promise<{ error: Error | null }>;
  signIn(email, password): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
}
```

### Prioridade de Roles

```typescript
const ROLE_PRIORITY = ["admin_master", "admin", "supervisor", "operator", "employee"];
```

Se o usuário tem múltiplas roles, o `userRole` é o primeiro encontrado nesta ordem.

### Fluxo de Resolução de Roles

```
1. onAuthStateChange dispara com sessão
2. Se não tem sessão → resetRoles() + loading = false
3. Se tem sessão e é mesmo usuário já resolvido → pula resolução
4. Se é novo usuário:
   a) Tenta SELECT role FROM user_roles WHERE user_id = ? (até 3 tentativas com backoff 150ms×attempt)
   b) Se falha: tenta getUser() + nova query
   c) Se ainda falha: tenta RPC has_role() para cada role na prioridade
   d) Se tudo falha e tinha role anterior: preserva
   e) Se tudo falha e não tinha role: resetRoles()
```

### Diagnóstico

```
Ativado em DEV ou com ?authDebug=1 na URL
Logs no console com prefixo [AuthContext]
window.__authDiagnostics disponível para debug
```

---

## 6. Hook usePermissions

### Interface exportada

```typescript
type Module = "dashboard" | "products" | "orders" | "sales" | "leads" | "users" | "notifications" | "audit_logs";

interface ModulePermission {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

// Retorno do hook:
{
  permissions: Record<string, ModulePermission>;
  loading: boolean;
  hasPermission(module: Module, action?: keyof ModulePermission): boolean;
  getModulePerms(module: Module): ModulePermission;
  reload(): Promise<void>;
}
```

### Fluxo de Merge

```
1. Carrega role_permissions WHERE role = userRole
2. Carrega user_permission_overrides WHERE user_id = userId
3. Para cada módulo:
   - Se tem override para o campo → usa override
   - Se não → usa valor base da role
4. hasPermission("orders", "can_edit") → permissions["orders"]?.can_edit ?? false
```

### Uso na Página Admin

```typescript
const { hasPermission } = usePermissions();

// Filtra tabs visíveis
const navItems = allNavItems.filter(item => hasPermission(item.module));

// Se nenhum módulo acessível → redirect para /403
```

---

## 7. Edge Function admin-create-user

### Endpoint
`POST /functions/v1/admin-create-user`

### Headers
```
Authorization: Bearer {token_do_admin_logado}
Content-Type: application/json
```

### Body
```json
{
  "email": "joao@exemplo.com",
  "password": "senha12345",
  "full_name": "João Silva",
  "role": "operator"
}
```

### Fluxo Interno

```
1. AUTENTICAÇÃO
   - Extrai token do header Authorization
   - Valida com supabase.auth.getUser(token)
   - Se inválido → 401

2. VERIFICAÇÃO DE PERMISSÃO
   - Busca role do chamador em user_roles
   - Aceita apenas: admin_master, supervisor
   - Se supervisor tentando criar não-operator → 403

3. VALIDAÇÃO
   - email, password, full_name, role obrigatórios
   - password.length >= 8

4. CRIAÇÃO DO USUÁRIO
   - supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })
   - Usa Service Role Key (SUPABASE_SERVICE_ROLE_KEY)
   - email_confirm: true → usuário já chega confirmado

5. ATRIBUIÇÃO DE CARGO
   - INSERT INTO user_roles (user_id, role) VALUES (new_user_id, role)

6. REGISTRO DE AUDITORIA
   - INSERT INTO audit_logs (performed_by, action, target_user, details)
   - action = 'create_user'
   - details = { email, role, full_name }

7. RESPOSTA
   - Sucesso: { success: true, user_id: "..." }
   - Erro: { error: "mensagem" } com status HTTP apropriado
```

### Configuração necessária (supabase/config.toml)
```toml
[functions.admin-create-user]
verify_jwt = false
```
> **Nota:** `verify_jwt = false` porque a função faz sua própria verificação de auth internamente.

### Secrets necessários
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 8. Dependências NPM

```bash
npm install @supabase/supabase-js
npm install lucide-react
npm install date-fns
npm install sonner
npm install @radix-ui/react-dialog
npm install class-variance-authority clsx tailwind-merge
npm install react-router-dom
```

### Componentes shadcn necessários
- `button`
- `badge`
- `table`
- `dialog`
- `toast` / `toaster` (ou usar `sonner` diretamente)

---

## Resumo de Arquivos para Copiar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/admin/AdminLeads.tsx` | Tela de leads |
| `src/components/admin/AdminUsers.tsx` | Tela de usuários |
| `src/components/admin/AdminAuditLogs.tsx` | Tela de auditoria |
| `src/context/AuthContext.tsx` | Provider de autenticação |
| `src/hooks/usePermissions.ts` | Hook de permissões RBAC |
| `supabase/functions/admin-create-user/index.ts` | Edge function |
| `src/components/ui/table.tsx` | Componente Table |
| `src/components/ui/badge.tsx` | Componente Badge |
| `src/components/ui/button.tsx` | Componente Button |
| `src/components/ui/dialog.tsx` | Componente Dialog |
