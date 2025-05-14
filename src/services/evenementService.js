import axios from "axios";
import authHeader from "./authHeader";

const API_URL = "https://127.0.0.1:8000/api";

// Fonction de débogage pour vérifier l'authentification
export const debugAuthentication = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("Débogage - Token:", token ? "Présent" : "Absent");

    const headers = authHeader();
    console.log("Débogage - En-têtes:", headers);

    const response = await axios.get(`${API_URL}/evenement/debug`, {
      headers: headers,
    });

    console.log("Débogage - Réponse:", response.data);
    return response.data;
  } catch (error) {
    console.error("Débogage - Erreur:", error);

    if (error.response) {
      console.error("Débogage - Statut:", error.response.status);
      console.error("Débogage - Données:", error.response.data);
    }

    throw error;
  }
};

// Récupérer tous les événements (avec filtres optionnels)
export const getEvenements = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Ajouter les filtres aux paramètres de requête
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await axios.get(`${API_URL}/evenement?${queryParams}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    throw error;
  }
};

// Récupérer un événement spécifique
export const getEvenementById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/evenement/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de l'événement ${id}:`,
      error
    );
    throw error;
  }
};

// Créer un nouvel événement
export const createEvenement = async (evenementData) => {
  try {
    // Vérifier si le token est présent
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Erreur: Token d'authentification manquant");
      throw new Error("Vous devez être connecté pour créer un événement");
    }

    // Afficher les en-têtes pour le débogage
    const headers = authHeader();
    console.log("En-têtes d'authentification:", headers);
    console.log("Données de l'événement:", evenementData);

    const response = await axios.post(`${API_URL}/evenement`, evenementData, {
      headers: headers,
      withCredentials: false, // Désactiver l'envoi des cookies
    });

    console.log("Réponse de création d'événement:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);

    // Afficher des informations détaillées sur l'erreur
    if (error.response) {
      console.error("Statut de l'erreur:", error.response.status);
      console.error("Données de l'erreur:", error.response.data);
      console.error("En-têtes de l'erreur:", error.response.headers);
    } else if (error.request) {
      console.error("Erreur de requête (pas de réponse):", error.request);
    } else {
      console.error("Message d'erreur:", error.message);
    }

    throw error;
  }
};

// Mettre à jour un événement existant
export const updateEvenement = async (id, evenementData) => {
  try {
    const response = await axios.put(
      `${API_URL}/evenement/${id}`,
      evenementData,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'événement ${id}:`, error);
    throw error;
  }
};

// Supprimer un événement
export const deleteEvenement = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/evenement/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'événement ${id}:`, error);
    throw error;
  }
};

// Récupérer les événements d'un administrateur
export const getEvenementsByAdministrateur = async (adminId) => {
  try {
    const response = await axios.get(
      `${API_URL}/evenement/administrateur/${adminId}`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des événements de l'administrateur ${adminId}:`,
      error
    );
    throw error;
  }
};

// Récupérer les événements dans une plage de dates
export const getEvenementsByDateRange = async (start, end) => {
  try {
    const response = await axios.get(
      `${API_URL}/evenement/date-range?start=${start}&end=${end}`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des événements par plage de dates:",
      error
    );
    throw error;
  }
};

// Récupérer les prochains événements
export const getUpcomingEvenements = async (limit = 5) => {
  try {
    const response = await axios.get(
      `${API_URL}/evenement/upcoming?limit=${limit}`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des prochains événements:",
      error
    );
    throw error;
  }
};

// Associer un administrateur à un événement
export const addAdministrateurToEvenement = async (evenementId, adminId) => {
  try {
    const response = await axios.post(
      `${API_URL}/evenement/${evenementId}/administrateur/${adminId}`,
      {},
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Erreur lors de l'association de l'administrateur ${adminId} à l'événement ${evenementId}:`,
      error
    );
    throw error;
  }
};

// Dissocier un administrateur d'un événement
export const removeAdministrateurFromEvenement = async (
  evenementId,
  adminId
) => {
  try {
    const response = await axios.delete(
      `${API_URL}/evenement/${evenementId}/administrateur/${adminId}`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Erreur lors de la dissociation de l'administrateur ${adminId} de l'événement ${evenementId}:`,
      error
    );
    throw error;
  }
};
