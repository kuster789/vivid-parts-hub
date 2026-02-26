# Pacote Admin — Painel Administrativo (sem Produtos)

## Estrutura de Arquivos

```
src/
├── context/
│   └── AuthContext.tsx          # Autenticação + roles
├── hooks/
│   └── useNotifications.ts     # Notificações em tempo real
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.tsx   # Dashboard principal (adaptado)
│   │   ├── AdminOrders.tsx      # Gestão de pedidos
│   │   ├── AdminSales.tsx       # Controle de vendas
│   │   ├── AdminLeads.tsx       # Gestão de leads
│   │   ├── AdminUsers.tsx       # Gestão de usuários
│   │   ├── AdminNotifications.tsx # Envio de notificações
│   │   ├── VisitorStats.tsx     # Estatísticas de visitantes
│   │   ├── GeoStats.tsx         # Distribuição geográfica
│   │   └── dashboard/
│   │       ├── DashboardKPIs.tsx
│   │       ├── StatusPipeline.tsx
│   │       ├── MonthlyComparisonChart.tsx
│   │       └── RecentOrdersTable.tsx
│   ├── AdminCharts.tsx          # Gráficos gerais (adaptado)
│   └── ui/                     # Componentes shadcn necessários
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── textarea.tsx
├── pages/
│   └── Admin.tsx               # Página principal (adaptada)
└── database/
    └── schema.sql              # SQL completo para recriar o banco
```

## Dependências NPM Necessárias

```bash
npm install @supabase/supabase-js recharts lucide-react date-fns sonner
npm install @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
npm install react-router-dom react-day-picker
```

## Configuração

1. Crie um projeto Supabase (ou use Lovable Cloud)
2. Execute o `database/schema.sql` no SQL Editor
3. Configure o client Supabase com suas credenciais
4. Copie os arquivos para seu projeto
5. Ajuste os imports `@/` conforme sua estrutura

## Módulos Removidos

- ❌ AdminProducts (gestão de produtos)
- ❌ StockAlerts (alertas de estoque)
- ❌ InventorySection (valor do estoque)
- ❌ StockEditDialog (edição de estoque)

## Módulos Incluídos

- ✅ Dashboard com KPIs (receita, pedidos, vendas externas, clientes, leads)
- ✅ Pipeline de status de pedidos
- ✅ Gestão completa de pedidos (status, rastreio, produção)
- ✅ Controle financeiro de vendas externas
- ✅ Gestão de leads com filtros e exportação CSV
- ✅ Gestão de usuários e permissões
- ✅ Sistema de notificações (manuais + automáticas)
- ✅ Estatísticas de visitantes em tempo real
- ✅ Distribuição geográfica
- ✅ Gráficos de receita e pedidos
