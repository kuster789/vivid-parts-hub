# Arquivos para copiar SEM alterações do projeto original

Estes arquivos não precisam de adaptação — copie diretamente:

## Componentes Admin
- `src/components/admin/AdminOrders.tsx` ✅
- `src/components/admin/AdminSales.tsx` ✅
- `src/components/admin/AdminLeads.tsx` ✅
- `src/components/admin/AdminUsers.tsx` ✅
- `src/components/admin/AdminNotifications.tsx` ✅
- `src/components/admin/VisitorStats.tsx` ✅
- `src/components/admin/GeoStats.tsx` ✅

## Subcomponentes Dashboard
- `src/components/admin/dashboard/DashboardKPIs.tsx` ✅
- `src/components/admin/dashboard/StatusPipeline.tsx` ✅
- `src/components/admin/dashboard/MonthlyComparisonChart.tsx` ✅
- `src/components/admin/dashboard/RecentOrdersTable.tsx` ✅

## Contexto e Hooks
- `src/context/AuthContext.tsx` ✅
- `src/hooks/useNotifications.ts` ✅

## Componentes UI (shadcn) — copiar todos que estiver usando
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/lib/utils.ts`

## Arquivos ADAPTADOS (usar versão do pacote-admin/)
- `src/pages/Admin.tsx` — removido tab "products"
- `src/components/admin/AdminDashboard.tsx` — removido estoque/produtos
- `src/components/AdminCharts.tsx` — removido "Produtos Mais Vendidos"
