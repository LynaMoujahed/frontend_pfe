import { API_URL } from "../config";

// Utiliser l'URL de l'API depuis le fichier de configuration
const API_BASE_URL = API_URL;

/**
 * Service pour gérer les interactions avec l'API Reclamation
 */
export const ReclamationService = {
  /**
   * Récupère toutes les réclamations (pour administrateur)
   * @param {string} token - Token d'authentification
   * @returns {Promise<Array>} - Liste des réclamations
   */
  getAllReclamations: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reclamation`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching reclamations:", error);
      throw error;
    }
  },

  /**
   * Récupère les réclamations de l'utilisateur connecté (pour apprenant)
   * @param {string} token - Token d'authentification
   * @returns {Promise<Array>} - Liste des réclamations de l'utilisateur
   */
  getUserReclamations: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reclamation/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user reclamations:", error);
      throw error;
    }
  },

  /**
   * Récupère une réclamation spécifique
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de la réclamation
   * @returns {Promise<Object>} - Détails de la réclamation
   */
  getReclamation: async (token, id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reclamation/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching reclamation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crée une nouvelle réclamation
   * @param {string} token - Token d'authentification
   * @param {Object} reclamation - Données de la réclamation
   * @returns {Promise<Object>} - Réclamation créée
   */
  createReclamation: async (token, reclamation) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reclamation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reclamation),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating reclamation:", error);
      throw error;
    }
  },

  /**
   * Répond à une réclamation (pour administrateur)
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de la réclamation
   * @param {string} response - Réponse à la réclamation
   * @returns {Promise<Object>} - Réclamation mise à jour
   */
  replyToReclamation: async (token, id, response) => {
    try {
      const apiResponse = await fetch(
        `${API_BASE_URL}/reclamation/${id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      return await apiResponse.json();
    } catch (error) {
      console.error(`Error replying to reclamation ${id}:`, error);
      throw error;
    }
  },
};
