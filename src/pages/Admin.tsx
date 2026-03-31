import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { usePermissions, Module } from "@/hooks/usePermissions";
import {
  BarChart3, Package, ShoppingBag, Users, Bell, Loader2, Menu, X, ChevronRight, Mail, DollarSign, FileText, Tag, Warehouse
} from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminSales from "@/components/admin/AdminSales";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminStock from "@/components/admin/AdminStock";
import AdminQuotes from "@/components/admin/AdminQuotes";

type Tab = "dashboard" | "products" | "orders" | "users" | "notifications" | "leads" | "sales" | "audit_logs" | "coupons" | "stock" | "quotes";

const ROLE_LABELS: Record<string, string> = {
  admin_master: "Admin Master",
  supervisor: "Supervisor",
  operator: "Operador",
  admin: "Administrador",
  employee: "Funcionário",
};

const Admin = () => {
  const { user, isAdmin, isEmployee, userRole, loading } = useAuth();
  const { hasPermission, loading: permsLoading } = usePermissions();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!loading && !permsLoading && user && (isAdmin || isEmployee)) {
      setBootstrapped(true);
    }
  }, [loading, permsLoading, user, isAdmin, isEmployee]);

  if (!bootstrapped && (loading || permsLoading)) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && !permsLoading && (!user || (!isAdmin && !isEmployee))) return <Navigate to="/login" replace />;

  const allNavItems: { id: Tab; label: string; icon: any; module: Module }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, module: "dashboard" },
    { id: "products", label: "Produtos", icon: Package, module: "products" },
    { id: "stock", label: "Estoque", icon: Warehouse, module: "stock" },
    { id: "orders", label: "Pedidos", icon: ShoppingBag, module: "orders" },
    { id: "notifications", label: "Notificações", icon: Bell, module: "notifications" },
    { id: "sales", label: "Vendas", icon: DollarSign, module: "sales" },
    { id: "coupons", label: "Cupons", icon: Tag, module: "coupons" },
    { id: "leads", label: "Leads", icon: Mail, module: "leads" },
    { id: "users", label: "Usuários", icon: Users, module: "users" },
    { id: "audit_logs", label: "Auditoria", icon: FileText, module: "audit_logs" },
  ];

  const navItems = allNavItems.filter(item => hasPermission(item.module));

  if (navItems.length === 0) {
    if (!bootstrapped || loading || permsLoading) {
      return (
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return <Navigate to="/403" replace />;
  }

  // Ensure current tab is accessible
  const effectiveTab = navItems.find(n => n.id === tab) ? tab : (navItems[0]?.id || "dashboard");

  const tabTitles: Record<Tab, string> = {
    dashboard: "Dashboard",
    products: "Gerenciar Produtos",
    orders: "Gerenciar Pedidos",
    users: "Gerenciar Usuários",
    notifications: "Notificações",
    leads: "Leads Capturados",
    sales: "Controle de Vendas",
    coupons: "Gerenciar Cupons",
    stock: "Controle de Estoque",
    audit_logs: "Logs de Auditoria",
  };

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="flex">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed left-0 top-[3.5rem] z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Admin</h2>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[userRole || ""] || userRole}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  effectiveTab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {effectiveTab === id && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </button>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <p className="text-[10px] text-muted-foreground">Auto Peças Agrale</p>
            <p className="text-[10px] text-muted-foreground">Painel v3.0 — RBAC</p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="sticky top-[3.5rem] z-30 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur-sm">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">{tabTitles[effectiveTab]}</h1>
            </div>
          </div>

          <div className="p-5 lg:p-8">
            {effectiveTab === "dashboard" && <AdminDashboard onNavigate={(t: string) => setTab(t as Tab)} />}
            {effectiveTab === "products" && <AdminProducts />}
            {effectiveTab === "orders" && <AdminOrders />}
            {effectiveTab === "stock" && <AdminStock />}
            {effectiveTab === "notifications" && <AdminNotifications />}
            {effectiveTab === "leads" && <AdminLeads />}
            {effectiveTab === "sales" && <AdminSales />}
            {effectiveTab === "coupons" && <AdminCoupons />}
            {effectiveTab === "users" && <AdminUsers />}
            {effectiveTab === "audit_logs" && <AdminAuditLogs />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Admin;
