import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  BarChart3, Package, ShoppingBag, Users, Bell, Loader2, Menu, X, ChevronRight, Mail, DollarSign
} from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminSales from "@/components/admin/AdminSales";

type Tab = "dashboard" | "products" | "orders" | "users" | "notifications" | "leads" | "sales";

const Admin = () => {
  const { user, isAdmin, isEmployee, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || (!isAdmin && !isEmployee)) return <Navigate to="/login" replace />;

  const navItems: { id: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "products", label: "Produtos", icon: Package },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "notifications", label: "Notificações", icon: Bell },
    ...(isAdmin ? [
      { id: "sales" as Tab, label: "Vendas", icon: DollarSign },
      { id: "leads" as Tab, label: "Leads", icon: Mail },
      { id: "users" as Tab, label: "Usuários", icon: Users },
    ] : []),
  ];

  const tabTitles: Record<Tab, string> = {
    dashboard: "Dashboard",
    products: "Gerenciar Produtos",
    orders: "Gerenciar Pedidos",
    users: "Gerenciar Usuários",
    notifications: "Notificações",
    leads: "Leads Capturados",
    sales: "Controle de Vendas",
  };

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="flex">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed left-0 top-[3.5rem] z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Admin</h2>
              <p className="text-[10px] text-muted-foreground">{isAdmin ? "Administrador" : "Funcionário"}</p>
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
                  tab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {tab === id && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </button>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <p className="text-[10px] text-muted-foreground">Auto Peças Agrale</p>
            <p className="text-[10px] text-muted-foreground">Painel v2.0</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-[3.5rem] z-30 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur-sm">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">{tabTitles[tab]}</h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 lg:p-8">
            {tab === "dashboard" && <AdminDashboard />}
            {tab === "products" && <AdminProducts />}
            {tab === "orders" && <AdminOrders />}
            {tab === "notifications" && <AdminNotifications />}
            {tab === "leads" && isAdmin && <AdminLeads />}
            {tab === "sales" && isAdmin && <AdminSales />}
            {tab === "users" && isAdmin && <AdminUsers />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Admin;
