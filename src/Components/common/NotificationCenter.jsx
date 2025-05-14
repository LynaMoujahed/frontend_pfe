import { useState, useEffect, useRef, useCallback } from "react";
import notificationService, {
  NOTIFICATION_TYPES,
  getNotificationType,
} from "../../services/notificationService";
import {
  Bell,
  MessageSquare,
  AlertCircle,
  Award,
  ClipboardCheck,
  Calendar,
  Trash2,
} from "lucide-react";

/**
 * Composant de centre de notifications réutilisable
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onNotificationClick - Fonction appelée lors du clic sur une notification
 * @param {boolean} props.showBadgeOnly - Si true, affiche uniquement le badge sans le dropdown
 * @param {string} props.buttonClassName - Classes CSS pour le bouton de notification
 * @param {string} props.iconClassName - Classes CSS pour l'icône de notification
 * @param {string} props.badgeClassName - Classes CSS pour le badge de notification
 * @returns {JSX.Element} - Composant NotificationCenter
 */
const NotificationCenter = ({
  onNotificationClick,
  showBadgeOnly = false,
  buttonClassName = "relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700",
  iconClassName = "w-5 h-5 text-gray-700 dark:text-gray-300",
  badgeClassName = "",
}) => {
  // Définir l'animation de pulsation directement dans le composant
  const pulseAnimation = {
    "@keyframes customPulse": {
      "0%": {
        transform: "scale(0.95)",
        boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.7)",
      },
      "70%": {
        transform: "scale(1)",
        boxShadow: "0 0 0 4px rgba(239, 68, 68, 0)",
      },
      "100%": {
        transform: "scale(0.95)",
        boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)",
      },
    },
    animation: "customPulse 2s infinite",
  };
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  // Always use "all" filter since filter buttons have been removed
  const activeFilter = "all";
  const notificationsRef = useRef(null);

  // Aucune initialisation audio n'est nécessaire

  // Charger les notifications au chargement du composant
  useEffect(() => {
    fetchNotifications();

    // Initialiser les notifications en temps réel via WebSocket
    const unsubscribe = notificationService.initializeRealTimeNotifications(
      (newNotification) => {
        console.log("Nouvelle notification reçue:", newNotification);

        // Ajouter la nouvelle notification à la liste
        setNotifications((prevNotifications) => [
          newNotification,
          ...prevNotifications,
        ]);

        // Mettre à jour le compteur de notifications non lues
        if (!newNotification.read) {
          setUnreadCount((prevCount) => prevCount + 1);
        }
      }
    );

    // Rafraîchir les notifications toutes les 30 secondes (fallback)
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Fermer le dropdown lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications();
      if (result && result.notifications) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Basculer l'affichage des notifications
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Marquer une notification comme lue
  const handleNotificationClick = async (notification) => {
    try {
      await notificationService.markAsRead(notification.id);

      // Mettre à jour l'état local
      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );

      // Mettre à jour le compteur de notifications non lues
      if (!notification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }

      // Appeler la fonction de callback si elle existe
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification comme lue:",
        error
      );
    }
  };

  // Supprimer une notification
  const handleDeleteNotification = async (event, notification) => {
    // Empêcher la propagation pour éviter de déclencher le handleNotificationClick
    event.stopPropagation();

    try {
      const result = await notificationService.deleteNotification(
        notification.id
      );

      if (result.success) {
        // Mettre à jour l'état local en supprimant la notification
        setNotifications(notifications.filter((n) => n.id !== notification.id));

        // Si la notification n'était pas lue, mettre à jour le compteur
        if (!notification.read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result && result.success) {
        // Mettre à jour l'état local
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage des notifications comme lues:",
        error
      );
    }
  };

  // Fonction simplifiée pour obtenir les notifications (sans filtrage)
  const getFilteredNotifications = () => {
    if (!notifications || notifications.length === 0) {
      return [];
    }
    return notifications;
  };

  // Obtenir l'icône pour un type de notification
  const getIconComponent = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return <MessageSquare size={16} />;
      case NOTIFICATION_TYPES.RECLAMATION:
        return <AlertCircle size={16} />;
      case NOTIFICATION_TYPES.CERTIFICAT:
        return <Award size={16} />;
      case NOTIFICATION_TYPES.EVALUATION:
        return <ClipboardCheck size={16} />;
      case NOTIFICATION_TYPES.EVENEMENT:
        return <Calendar size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  // Si on affiche uniquement le badge
  if (showBadgeOnly) {
    return (
      <div className="relative">
        <Bell className={iconClassName} />
        {unreadCount > 0 && (
          <span
            className={`absolute top-0 right-0 h-5 w-5 rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white text-xs flex items-center justify-center shadow-md ${badgeClassName}`}
            style={pulseAnimation}
          >
            {unreadCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={notificationsRef}>
      <button
        className={buttonClassName}
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        <Bell className={iconClassName} />
        {unreadCount > 0 && (
          <span
            className={`absolute top-0 right-0 h-5 w-5 rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white text-xs flex items-center justify-center shadow-md ${badgeClassName}`}
            style={pulseAnimation}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-[slideInDown_0.3s_ease-out]">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-900/20">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-blue-500" />
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                  title="Marquer toutes les notifications comme lues"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Chargement des notifications...
                </p>
              </div>
            ) : getFilteredNotifications().length > 0 ? (
              getFilteredNotifications().map((notification) => {
                const type = getNotificationType(notification);
                const iconClass = notificationService.getClassForType(type);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-slate-700 cursor-pointer transition-all hover:shadow-inner group ${
                      !notification.read
                        ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 relative">
                      <div
                        className={`flex-shrink-0 p-2 rounded-full ${
                          iconClass === "message"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : iconClass === "alert"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : iconClass === "success"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        }`}
                      >
                        {getIconComponent(type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-800 dark:text-gray-200">
                          {notification.Description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.createdAt
                            ? notificationService.formatRelativeTime(
                                notification.createdAt
                              )
                            : "Date inconnue"}
                        </div>
                      </div>
                      <div
                        className="ml-auto flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) =>
                          handleDeleteNotification(e, notification)
                        }
                      >
                        <Trash2
                          size={16}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Aucune notification
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
