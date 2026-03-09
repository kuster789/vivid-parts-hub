
## Aba de Cupons no Painel Admin

### O que será construído

Uma nova aba **"Cupons"** no painel administrativo com:
- **Listagem completa** de todos os cupons (automáticos do popup + manuais)
- **Toggle ativar/desativar** por cupom diretamente na tabela
- **Criar cupom manualmente** via dialog com formulário completo
- **Excluir cupom** com confirmação
- **Indicadores visuais**: tipo de desconto, validade, uso (X/máximo), status

---

### Arquivos a criar/modificar

```
src/components/admin/AdminCoupons.tsx   ← NOVO componente completo
src/hooks/usePermissions.ts             ← adicionar "coupons" ao tipo Module
src/pages/Admin.tsx                     ← adicionar aba "coupons" na navegação
```

### Database (sem migração de schema)

A tabela `coupons` já existe com todas as colunas necessárias:
- `code`, `active`, `discount_percent`, `discount_amount`, `min_order_value`, `max_uses`, `used_count`, `expires_at`

Só precisa inserir as permissões do módulo `coupons` na tabela `role_permissions` para os cargos existentes (admin_master, supervisor, operator) via insert de dados.

### Lógica do componente AdminCoupons

**Listagem:**
- Busca `SELECT * FROM coupons ORDER BY created_at DESC`
- Exibe: código, tipo de desconto (% ou R$), uso (`used_count / max_uses`), validade, status (badge verde/cinza)
- Toggle de `active` via `UPDATE coupons SET active = !active WHERE id = ?`

**Formulário de criação (Dialog):**
- Campos: Código (uppercase automático), Tipo de desconto (% ou valor fixo R$), Valor do desconto, Pedido mínimo (opcional), Limite de usos (opcional), Data de expiração (opcional)
- Validação: código único, pelo menos um tipo de desconto > 0

**Permissões RBAC:**
- `admin_master` e `supervisor`: can_view + can_create + can_edit + can_delete
- `operator`: apenas can_view

### Integração com Admin.tsx

Adicionar ao `allNavItems`:
```tsx
{ id: "coupons", label: "Cupons", icon: Tag, module: "coupons" }
```

E renderizar `{effectiveTab === "coupons" && <AdminCoupons />}` no conteúdo.

### Ordem de implementação

1. Inserir permissões do módulo `coupons` na `role_permissions`
2. Criar `src/components/admin/AdminCoupons.tsx`
3. Atualizar `usePermissions.ts` (tipo Module)
4. Atualizar `src/pages/Admin.tsx` (nav + render)
