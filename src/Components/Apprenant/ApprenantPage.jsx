import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";
import Layout from "./Layout/Layout";
import Dashboard from "./Dashboard/Dashboard";
import Cours from "./Cours/Cours";
import CourseDetails from "./Cours/CourseDetails";
import Messagerie from "./Messagerie/Messagerie";
import Reclamation from "./Reclamation/Reclamation";
import Profile from "./Profile/Profile";
import ChatbotWidget from "./Chatbot/ChatbotWidget";
import { Routes, Route } from "react-router-dom";
import { useMediaQuery } from "@uidotdev/usehooks";
import { cn } from "../../utils/cn";
import { useAuth } from "../../contexts/auth-context";

import notificationService from "../../services/notificationService";

const ApprenantPage = () => {
  const { user, isAuthenticated } = useAuth();
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const sidebarRef = useRef(null);

  // Vérifier si l'utilisateur est connecté et stocker ses données dans localStorage
  useEffect(() => {
    console.log("🔍 [ApprenantPage] Vérification de l'authentification");
    console.log("- isAuthenticated:", isAuthenticated);

    if (user) {
      console.log("🔍 [ApprenantPage] Utilisateur connecté:", user);
      console.log("- ID:", user.id);
      console.log("- Email:", user.email);
      console.log("- Role:", user.role);

      // Stocker les données utilisateur dans localStorage
      localStorage.setItem("user", JSON.stringify(user));
      console.log(
        "✅ [ApprenantPage] Données utilisateur stockées dans localStorage"
      );

      // Vérifier que les données ont bien été stockées
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log(
            "✅ [ApprenantPage] Données utilisateur récupérées du localStorage:",
            parsedUser
          );
        } catch (e) {
          console.error(
            "❌ [ApprenantPage] Erreur lors de la récupération des données utilisateur:",
            e
          );
        }
      }
    } else {
      console.warn("⚠️ [ApprenantPage] Aucun utilisateur connecté");
    }
  }, [user, isAuthenticated]);

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

  const markAsRead = useCallback(
    async (id, updatedNotifications = null) => {
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
    },
    [notifications]
  );

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
        <Layout>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="cours" element={<Cours />} />
            <Route path="cours/:courseId" element={<CourseDetails />} />
            <Route path="messagerie" element={<Messagerie />} />
            <Route path="reclamation" element={<Reclamation />} />
            <Route path="profile" element={<Profile />} />
            {/* Redirection pour les routes non trouvées */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      </div>

      {/* Widget de chatbot AI */}
      <ChatbotWidget userData={user} />
    </div>
  );
};

export default ApprenantPage;
