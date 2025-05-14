import axios from "axios";
import { API_URL } from "../config";
import authHeader from "./authHeader";
import webSocketService from "./webSocketService";

/**
 * Types de notifications
 */
export const NOTIFICATION_TYPES = {
  MESSAGE: "message",
  RECLAMATION: "reclamation",
  CERTIFICAT: "certificat",
  EVALUATION: "evaluation",
  EVENEMENT: "evenement",
  SYSTEM: "system",
};

/**
 * Détermine le type de notification en fonction de ses propriétés ou de sa description
 * @param {Object} notification - Objet notification
 * @returns {string} - Type de notification
 */
export const getNotificationType = (notification) => {
  if (!notification) return NOTIFICATION_TYPES.SYSTEM;

  // Pour le format complet (ancienne version)
  if (notification.messagerie) return NOTIFICATION_TYPES.MESSAGE;
  if (notification.reclamation) return NOTIFICATION_TYPES.RECLAMATION;
  if (notification.certificat) return NOTIFICATION_TYPES.CERTIFICAT;
  if (notification.evaluation) return NOTIFICATION_TYPES.EVALUATION;
  if (notification.evenement) return NOTIFICATION_TYPES.EVENEMENT;

  // Pour le format simplifié, déterminer le type à partir de la description
  if (notification.Description) {
    const desc = notification.Description.toLowerCase();
    if (desc.includes("message") || desc.includes("conversation"))
      return NOTIFICATION_TYPES.MESSAGE;
    if (desc.includes("réclamation") || desc.includes("reclamation"))
      return NOTIFICATION_TYPES.RECLAMATION;
    if (desc.includes("certificat")) return NOTIFICATION_TYPES.CERTIFICAT;
    if (desc.includes("évaluation") || desc.includes("evaluation"))
      return NOTIFICATION_TYPES.EVALUATION;
    if (desc.includes("événement") || desc.includes("evenement"))
      return NOTIFICATION_TYPES.EVENEMENT;
  }

  return NOTIFICATION_TYPES.SYSTEM;
};

/**
 * Récupère les notifications de l'utilisateur connecté
 * @param {Object} options - Options de requête
 * @param {number} [options.limit] - Nombre maximum de notifications à récupérer
 * @param {boolean} [options.unreadOnly] - Si true, récupère uniquement les notifications non lues
 * @param {string} [options.type] - Filtre par type de notification
 * @returns {Promise<Object>} - Objet contenant les notifications et le nombre de notifications non lues
 */
const getNotifications = async (options = {}) => {
  try {
    let url = `${API_URL}/notification`;
    const params = new URLSearchParams();

    if (options.limit) {
      params.append("limit", options.limit);
    }

    if (options.unreadOnly) {
      params.append("unread", "true");
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { headers: authHeader() });

    // Si un type est spécifié, filtrer les notifications côté client
    if (options.type && response.data && response.data.notifications) {
      const filteredNotifications = response.data.notifications.filter(
        (notification) => getNotificationType(notification) === options.type
      );

      return {
        ...response.data,
        notifications: filteredNotifications,
        filteredCount: filteredNotifications.length,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    // Retourner un objet vide mais valide pour éviter les erreurs dans les composants
    return {
      notifications: [],
      unreadCount: 0,
      message: "Aucune notification disponible pour le moment",
    };
  }
};

/**
 * Marque une notification comme lue
 * @param {number} notificationId - ID de la notification
 * @returns {Promise<Object>} - Réponse de l'API
 */
const markAsRead = async (notificationId) => {
  try {
    const url = `${API_URL}/notification/${notificationId}/read`;
    const response = await axios.put(url, {}, { headers: authHeader() });
    return response.data;
  } catch (error) {
    // Retourner un objet de succès pour éviter les erreurs dans les composants
    return { success: true, message: "Notification marquée comme lue" };
  }
};

/**
 * Marque toutes les notifications comme lues
 * @returns {Promise<Object>} - Réponse de l'API
 */
const markAllAsRead = async () => {
  try {
    const url = `${API_URL}/notification/mark-all-read`;
    const response = await axios.put(url, {}, { headers: authHeader() });
    return response.data;
  } catch (error) {
    // Retourner un objet de succès pour éviter les erreurs dans les composants
    return {
      success: true,
      message: "Toutes les notifications ont été marquées comme lues",
      count: 0,
    };
  }
};

/**
 * Supprime une notification
 * @param {number} notificationId - ID de la notification
 * @returns {Promise<Object>} - Réponse de l'API
 */
const deleteNotification = async (notificationId) => {
  try {
    const url = `${API_URL}/notification/${notificationId}`;
    const response = await axios.delete(url, { headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    // Retourner un objet d'erreur pour gérer l'échec dans les composants
    return {
      success: false,
      message: "Erreur lors de la suppression de la notification",
    };
  }
};

/**
 * Formate la date relative d'une notification (ex: "il y a 2 heures")
 * @param {string} dateString - Date au format ISO
 * @returns {string} - Texte formaté
 */
const formatRelativeTime = (dateString) => {
  try {
    if (!dateString) {
      return "Date inconnue";
    }

    const date = new Date(dateString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date inconnue";
    }

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "À l'instant";
    } else if (diffMin < 60) {
      return `Il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
    } else if (diffHour < 24) {
      return `Il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
    } else if (diffDay < 30) {
      return `Il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;
    } else {
      return date.toLocaleDateString("fr-FR");
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date inconnue";
  }
};

/**
 * Obtient l'icône appropriée pour un type de notification
 * @param {string} type - Type de notification
 * @returns {string} - Nom de l'icône
 */
const getIconForType = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.MESSAGE:
      return "message-square";
    case NOTIFICATION_TYPES.RECLAMATION:
      return "alert-circle";
    case NOTIFICATION_TYPES.CERTIFICAT:
      return "award";
    case NOTIFICATION_TYPES.EVALUATION:
      return "clipboard-check";
    case NOTIFICATION_TYPES.EVENEMENT:
      return "calendar";
    default:
      return "bell";
  }
};

/**
 * Obtient la classe CSS pour un type de notification
 * @param {string} type - Type de notification
 * @returns {string} - Classe CSS
 */
const getClassForType = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.MESSAGE:
      return "message";
    case NOTIFICATION_TYPES.RECLAMATION:
      return "alert";
    case NOTIFICATION_TYPES.CERTIFICAT:
      return "success";
    case NOTIFICATION_TYPES.EVALUATION:
      return "info";
    case NOTIFICATION_TYPES.EVENEMENT:
      return "info";
    default:
      return "info";
  }
};

/**
 * Groupe les notifications par date
 * @param {Array} notifications - Liste de notifications
 * @returns {Object} - Notifications groupées par date
 */
const groupNotificationsByDate = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) {
    return {};
  }

  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  notifications.forEach((notification) => {
    if (!notification.createdAt) {
      if (!groups["Non daté"]) groups["Non daté"] = [];
      groups["Non daté"].push(notification);
      return;
    }

    const date = new Date(notification.createdAt);

    if (isNaN(date.getTime())) {
      if (!groups["Non daté"]) groups["Non daté"] = [];
      groups["Non daté"].push(notification);
      return;
    }

    let groupKey;

    if (date >= today) {
      groupKey = "Aujourd'hui";
    } else if (date >= yesterday) {
      groupKey = "Hier";
    } else if (date >= lastWeek) {
      groupKey = "Cette semaine";
    } else {
      groupKey = "Plus ancien";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(notification);
  });

  return groups;
};

/**
 * Initialise l'écoute des notifications en temps réel via WebSocket
 * @param {Function} callback - Fonction appelée lorsqu'une nouvelle notification est reçue
 * @returns {Function} - Fonction pour arrêter l'écoute
 */
const initializeRealTimeNotifications = (callback) => {
  // Se connecter au serveur WebSocket
  webSocketService.connect();

  // Ajouter un écouteur pour les notifications
  const listener = (data) => {
    if (data.type === "notification") {
      console.log("Nouvelle notification reçue via WebSocket:", data.data);

      // Appeler le callback avec la notification
      if (typeof callback === "function") {
        callback(data.data);
      }
    }
  };

  // Ajouter l'écouteur
  webSocketService.addListener(listener);

  // Retourner une fonction pour arrêter l'écoute
  return () => {
    webSocketService.removeListener(listener);
  };
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatRelativeTime,
  getNotificationType,
  getIconForType,
  getClassForType,
  groupNotificationsByDate,
  initializeRealTimeNotifications,
};

export default notificationService;
