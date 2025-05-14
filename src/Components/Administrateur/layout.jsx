import { Outlet } from "react-router-dom";

import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "../../hooks/use-click-outside";

import { Sidebar } from "./layouts/sidebar";
import { Header } from "./layouts/header";

import { cn } from "../../utils/cn";
import { useEffect, useRef, useState } from "react";
import notificationService from "../../services/notificationService";

const Layout = () => {
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarRef = useRef(null);

  // Charger les notifications au chargement de la page
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const result = await notificationService.getNotifications();
        if (result && result.notifications) {
          setNotifications(result.notifications || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        // En cas d'erreur, utiliser un tableau vide
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await notificationService.getNotifications();
        if (result && result.notifications) {
          setNotifications(result.notifications || []);
        }
      } catch (error) {
        console.error(
          "Erreur lors du rafraîchissement des notifications:",
          error
        );
        // Ne pas modifier l'état en cas d'erreur pour conserver les notifications existantes
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = async (id, updatedNotifications = null) => {
    try {
      // Si c'est une demande de rafraîchissement des notifications
      if (id === "refresh" && updatedNotifications) {
        console.log(
          "Rafraîchissement des notifications avec les données fournies"
        );
        setNotifications(updatedNotifications);
        return;
      }

      // Si c'est une demande de marquer toutes les notifications comme lues
      if (id === "all") {
        if (updatedNotifications) {
          // Utiliser les notifications mises à jour fournies
          setNotifications(updatedNotifications);
        } else {
          // Marquer toutes les notifications comme lues
          await notificationService.markAllAsRead();
          setNotifications(notifications.map((n) => ({ ...n, read: true })));
        }
      } else {
        // Marquer une seule notification comme lue
        await notificationService.markAsRead(id);
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification comme lue:",
        error
      );
    }
  };

  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
          !collapsed &&
            "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30"
        )}
      />
      <Sidebar ref={sidebarRef} collapsed={collapsed} />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 top-0 transition-[margin] duration-300",
          collapsed ? "md:ml-[70px]" : "md:ml-[240px]"
        )}
      >
        <Header
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          notifications={notifications}
          onNotificationRead={markAsRead}
        />
        <main className="custom-scrollbar h-[calc(100vh-60px)] overflow-y-auto p-6">
          <div className="transition-all duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
