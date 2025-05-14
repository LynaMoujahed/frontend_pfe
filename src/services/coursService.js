import { API_URL } from "../config";
import authHeader from "./authHeader";
import axios from "axios";

/**
 * Service pour gérer les interactions avec l'API Cours
 */
const coursService = {
  /**
   * Récupère tous les cours disponibles
   * @param {string} token - Token d'authentification
   * @returns {Promise<Array>} - Liste des cours
   */
  getAllCours: async (token) => {
    try {
      const response = await fetch(`${API_URL}/cours`, {
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
      console.error("Error fetching courses:", error);
      throw error;
    }
  },

  /**
   * Récupère les cours d'un apprenant spécifique
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Array>} - Liste des cours de l'apprenant
   */
  getApprenantCours: async (token, apprenantId) => {
    try {
      // Déterminer si l'utilisateur est un formateur ou un apprenant
      const userRole = localStorage.getItem("userRole");
      let url;

      if (userRole === "formateur") {
        // Si c'est un formateur, utiliser l'endpoint formateur
        url = `${API_URL}/formateur/apprenants/${apprenantId}/cours`;
      } else {
        // Si c'est un apprenant, utiliser l'endpoint apprenant
        url = `${API_URL}/apprenant/cours`;
      }

      console.log(`Using API endpoint: ${url}`);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.cours || [];
    } catch (error) {
      console.error("Error fetching apprenant courses:", error);
      throw error;
    }
  },

  /**
   * Récupère les détails d'un cours spécifique
   * @param {string} token - Token d'authentification
   * @param {number} coursId - ID du cours
   * @returns {Promise<Object>} - Détails du cours
   */
  getCoursById: async (token, coursId) => {
    try {
      const response = await fetch(`${API_URL}/cours/${coursId}`, {
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
      console.error(`Error fetching course with ID ${coursId}:`, error);
      throw error;
    }
  },

  /**
   * Récupère les cours d'un apprenant par catégorie
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @param {string} category - Catégorie des cours
   * @returns {Promise<Array>} - Liste des cours filtrés par catégorie
   */
  getApprenantCoursByCategory: async (token, apprenantId, category) => {
    try {
      const response = await fetch(
        `${API_URL}/formateur/apprenants/${apprenantId}/cours/category/${category}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.cours || [];
    } catch (error) {
      console.error("Error fetching apprenant courses by category:", error);
      throw error;
    }
  },
};

export default coursService;
