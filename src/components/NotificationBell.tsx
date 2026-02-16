import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<string, string> = {
  order_status: "📦",
  promotion: "🎉",
  new_product: "🆕",
  info: "ℹ️",
};

const NotificationBell = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    permissionGranted,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!permissionGranted) requestPermission();
        }}
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="rounded-md p-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Permission banner */}
          {!permissionGranted && "Notification" in window && (
            <button
              onClick={requestPermission}
              className="w-full border-b border-border bg-primary/10 px-4 py-2 text-xs text-primary hover:bg-primary/20"
            >
              🔔 Ativar notificações do navegador
            </button>
          )}

          {/* Notifications list */}
          <div className="max-h-[50vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationItem = ({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const icon = typeIcons[notification.type] || "ℹ️";
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={`group flex items-start gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-secondary/50 ${
        !notification.read ? "bg-primary/5" : ""
      }`}
    >
      <span className="mt-0.5 text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.read && (
          <button onClick={() => onRead(notification.id)} className="rounded p-1 text-muted-foreground hover:text-primary" title="Marcar como lida">
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => onDelete(notification.id)} className="rounded p-1 text-muted-foreground hover:text-destructive" title="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBell;
