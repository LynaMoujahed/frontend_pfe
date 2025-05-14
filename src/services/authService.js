import { API_URL } from "../config";
import authHeader from "./authHeader";

/**
 * Service pour gérer l'authentification et les opérations liées aux utilisateurs
 */
const authService = {
  /**
   * Récupère l'utilisateur actuellement connecté depuis le localStorage
   * @returns {Object|null} Données de l'utilisateur ou null si non connecté
   */
  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} True si l'utilisateur est authentifié
   */
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  /**
   * Récupère le token d'authentification
   * @returns {string|null} Token d'authentification ou null
   */
  getToken: () => {
    return localStorage.getItem("token");
  },

  /**
   * Déconnecte l'utilisateur en supprimant les données de session
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
  },

  /**
   * Connecte l'utilisateur avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} Résultat de la connexion
   */
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Stocker le rôle de l'utilisateur pour une utilisation ultérieure
        if (data.user && data.user.role) {
          localStorage.setItem("userRole", data.user.role);
        }
        return { success: true, user: data.user };
      } else {
        return {
          success: false,
          error: data.message || "Identifiants invalides",
        };
      }
    } catch (error) {
      console.error("Error during login:", error);
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  },

  /**
   * Récupère les informations de l'utilisateur connecté
   * @returns {Promise<Object>} Informations de l'utilisateur
   */
  getUserInfo: async () => {
    try {
      const response = await fetch(`${API_URL}/user/me`, {
        headers: authHeader(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Mettre à jour les informations utilisateur dans le localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Mettre à jour le rôle de l'utilisateur
      if (data.user && data.user.role) {
        localStorage.setItem("userRole", data.user.role);
      }

      return data.user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }
  },

  /**
   * Met à jour le profil de l'utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  updateProfile: async (userId, userData) => {
    try {
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Mettre à jour les informations utilisateur dans le localStorage
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));

        // Mettre à jour le rôle de l'utilisateur si présent
        if (data.user.role) {
          localStorage.setItem("userRole", data.user.role);
        }
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de la mise à jour du profil",
      };
    }
  },
};

export default authService;
