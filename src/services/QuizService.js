const API_BASE_URL = "https://127.0.0.1:8000/api";

/**
 * Service pour gérer les interactions avec l'API Quiz
 */
export const QuizService = {
  /**
   * Récupère tous les quiz pour un cours donné
   * @param {string} token - Token d'authentification
   * @param {number} courseId - ID du cours
   * @returns {Promise<Array>} - Liste des quiz
   */
  getQuizzesByCourse: async (token, courseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz?cours=${courseId}`, {
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
      console.error("Error fetching quizzes:", error);
      throw error;
    }
  },

  /**
   * Récupère un quiz par son IDModule
   * @param {string} token - Token d'authentification
   * @param {string} idModule - IDModule du quiz
   * @returns {Promise<Object>} - Données du quiz
   */
  getQuizByIdModule: async (token, idModule) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/${idModule}`, {
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
      console.error("Error fetching quiz:", error);
      throw error;
    }
  },

  /**
   * Crée un nouveau quiz avec la nouvelle structure
   * @param {string} token - Token d'authentification
   * @param {Object} quizData - Données du quiz à créer
   * @returns {Promise<Object>} - Réponse de l'API
   */
  createQuizNew: async (token, quizData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz-new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating quiz");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating quiz:", error);
      throw error;
    }
  },

  /**
   * Récupère les compétences pour un quiz donné
   * @param {string} token - Token d'authentification
   * @param {number|string} quizIdOrModule - ID du quiz ou IDModule
   * @param {boolean} isIdModule - Indique si quizIdOrModule est un IDModule
   * @returns {Promise<Array>} - Liste des compétences
   */
  getCompetencesByQuiz: async (token, quizIdOrModule, isIdModule = false) => {
    try {
      const paramName = isIdModule ? "idmodule" : "quiz";
      const response = await fetch(
        `${API_BASE_URL}/competences?${paramName}=${quizIdOrModule}`,
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

      return await response.json();
    } catch (error) {
      console.error("Error fetching competences:", error);
      throw error;
    }
  },

  /**
   * Récupère les sous-compétences pour une compétence donnée
   * @param {string} token - Token d'authentification
   * @param {number} competenceId - ID de la compétence
   * @returns {Promise<Array>} - Liste des sous-compétences
   */
  getSousCompetencesByCompetence: async (token, competenceId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sous-competences?competence=${competenceId}`,
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

      return await response.json();
    } catch (error) {
      console.error("Error fetching sous-competences:", error);
      throw error;
    }
  },

  /**
   * Récupère les actions pour un quiz ou une compétence donnée
   * @param {string} token - Token d'authentification
   * @param {Object} params - Paramètres de recherche (quiz_id, idmodule ou competence_id)
   * @returns {Promise<Array>} - Liste des actions
   */
  getActions: async (token, params) => {
    try {
      let url = `${API_BASE_URL}/actions`;
      if (params.idmodule) {
        url += `?idmodule=${params.idmodule}`;
      } else if (params.quiz_id) {
        url += `?quiz=${params.quiz_id}`;
      } else if (params.competence_id) {
        url += `?competence=${params.competence_id}`;
      }

      const response = await fetch(url, {
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
      console.error("Error fetching actions:", error);
      throw error;
    }
  },

  /**
   * Crée une nouvelle compétence
   * @param {string} token - Token d'authentification
   * @param {Object} competenceData - Données de la compétence à créer (avec quiz_id ou idmodule)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  createCompetence: async (token, competenceData) => {
    try {
      // Vérifier si nous avons un IDModule mais pas de quiz_id
      if (competenceData.idmodule && !competenceData.quiz_id) {
        // Utiliser idmodule au lieu de quiz_id
        console.log(
          "Using idmodule instead of quiz_id for competence creation"
        );
      } else if (!competenceData.idmodule && competenceData.quiz_id) {
        // Utiliser quiz_id (comportement existant)
        console.log("Using quiz_id for competence creation");
      } else if (!competenceData.idmodule && !competenceData.quiz_id) {
        throw new Error("Either idmodule or quiz_id must be provided");
      }

      const response = await fetch(`${API_BASE_URL}/competences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(competenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating competence");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating competence:", error);
      throw error;
    }
  },

  /**
   * Crée une nouvelle sous-compétence
   * @param {string} token - Token d'authentification
   * @param {Object} sousCompetenceData - Données de la sous-compétence à créer
   * @returns {Promise<Object>} - Réponse de l'API
   */
  createSousCompetence: async (token, sousCompetenceData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sous-competences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sousCompetenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating sous-competence");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating sous-competence:", error);
      throw error;
    }
  },

  /**
   * Crée une nouvelle action
   * @param {string} token - Token d'authentification
   * @param {Object} actionData - Données de l'action à créer (avec quiz_id ou idmodule)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  createAction: async (token, actionData) => {
    try {
      // Vérifier si nous avons un IDModule mais pas de quiz_id
      if (actionData.idmodule && !actionData.quiz_id) {
        // Utiliser idmodule au lieu de quiz_id
        console.log("Using idmodule instead of quiz_id for action creation");
      } else if (!actionData.idmodule && actionData.quiz_id) {
        // Utiliser quiz_id (comportement existant)
        console.log("Using quiz_id for action creation");
      } else if (!actionData.idmodule && !actionData.quiz_id) {
        throw new Error("Either idmodule or quiz_id must be provided");
      }

      const response = await fetch(`${API_BASE_URL}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating action");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating action:", error);
      throw error;
    }
  },

  /**
   * Met à jour une compétence
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de la compétence
   * @param {Object} competenceData - Données de la compétence à mettre à jour
   * @returns {Promise<Object>} - Réponse de l'API
   */
  updateCompetence: async (token, id, competenceData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/competences/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(competenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating competence");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating competence:", error);
      throw error;
    }
  },

  /**
   * Met à jour une sous-compétence
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de la sous-compétence
   * @param {Object} sousCompetenceData - Données de la sous-compétence à mettre à jour
   * @returns {Promise<Object>} - Réponse de l'API
   */
  updateSousCompetence: async (token, id, sousCompetenceData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sous-competences/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sousCompetenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating sous-competence");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating sous-competence:", error);
      throw error;
    }
  },

  /**
   * Met à jour une action
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de l'action
   * @param {Object} actionData - Données de l'action à mettre à jour
   * @returns {Promise<Object>} - Réponse de l'API
   */
  updateAction: async (token, id, actionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/actions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating action");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating action:", error);
      throw error;
    }
  },

  /**
   * Supprime une compétence
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de la compétence
   * @returns {Promise<Object>} - Réponse de l'API
   */
  deleteCompetence: async (token, id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/competences/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting competence");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting competence:", error);
      throw error;
    }
  },

  /**
   * Supprime une sous-compétence
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de la sous-compétence
   * @returns {Promise<Object>} - Réponse de l'API
   */
  deleteSousCompetence: async (token, id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sous-competences/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting sous-competence");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting sous-competence:", error);
      throw error;
    }
  },

  /**
   * Supprime une action
   * @param {string} token - Token d'authentification
   * @param {number} id - ID de l'action
   * @returns {Promise<Object>} - Réponse de l'API
   */
  deleteAction: async (token, id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/actions/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting action");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting action:", error);
      throw error;
    }
  },
};
