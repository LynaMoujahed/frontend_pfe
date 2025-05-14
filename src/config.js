/**
 * Configuration globale de l'application
 */

// URL de base de l'API
// Utiliser l'URL de l'API depuis les variables d'environnement ou une valeur par défaut
export const API_URL =
  import.meta.env.VITE_API_URL || "https://127.0.0.1:8000/api";

// Délai d'expiration des requêtes en millisecondes
export const REQUEST_TIMEOUT = 30000;

// Durée de mise en cache des données en millisecondes (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000;

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};
