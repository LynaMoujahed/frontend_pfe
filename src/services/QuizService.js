import { API_URL } from "../config";
import { jsPDF } from "jspdf";

const API_BASE_URL = API_URL;

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
      console.log(`Calling API: ${API_BASE_URL}/quiz?cours=${courseId}`);

      // Vérifier que le token est valide
      if (!token) {
        console.error("No authentication token provided");
        throw new Error("Authentification requise");
      }

      const response = await fetch(`${API_BASE_URL}/quiz?cours=${courseId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`API response status: ${response.status}`);

      // Vérifier le type de contenu de la réponse
      const contentType = response.headers.get("content-type");
      console.log(`Response content type: ${contentType}`);

      if (!response.ok) {
        // En cas d'erreur, essayer de lire le corps de la réponse pour plus de détails
        let errorMessage;
        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage =
              errorData.message ||
              errorData.error ||
              `HTTP error! status: ${response.status}`;
          } else {
            const textResponse = await response.text();
            errorMessage = `HTTP error! status: ${response.status}, response: ${textResponse.substring(0, 100)}...`;
          }
        } catch (parseError) {
          errorMessage = `HTTP error! status: ${response.status}, could not parse response`;
        }

        console.error("API error:", errorMessage);
        throw new Error(errorMessage);
      }

      // Traiter la réponse JSON
      try {
        const data = await response.json();
        console.log("API response data:", data);
        return data;
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error(
          `Erreur lors de l'analyse de la réponse: ${jsonError.message}`
        );
      }
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
      if (!idModule) {
        console.warn("idModule is undefined or null");
        // Retourner un quiz fictif au lieu de lancer une exception
        return QuizService.createDemoQuiz("DEMO-QUIZ");
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/quiz/${encodeURIComponent(idModule)}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // Si le quiz n'est pas trouvé, créer un quiz fictif pour la démonstration
          if (response.status === 404) {
            return QuizService.createDemoQuiz(idModule);
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (fetchError) {
        // Retourner un quiz fictif en cas d'erreur pour éviter de bloquer l'affichage
        return QuizService.createDemoQuiz(idModule);
      }
    } catch (error) {
      // Retourner un quiz fictif en cas d'erreur pour éviter de bloquer l'affichage
      return QuizService.createDemoQuiz(idModule || "ERROR-QUIZ");
    }
  },

  /**
   * Crée un quiz fictif pour la démonstration
   * @param {string} idModule - IDModule du quiz
   * @returns {Object} - Quiz fictif
   */
  createDemoQuiz: (idModule) => {
    return {
      id: 999,
      IDModule: idModule,
      Category: "Sterile",
      Type: "Evaluation",
      MainSurface: true,
      Surface: 10,
      Main: 20,
      Nom_FR: "NH - Hand hygiene and garbing (FND1)",
      Nom_EN: "NH - Hand hygiene and garbing (FND1)",
      PointFort_FR: "",
      PointFort_EN: "",
    };
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
      if (!quizIdOrModule) {
        console.warn("quizIdOrModule is undefined or null");
        return [];
      }

      const paramName = isIdModule ? "idmodule" : "quiz";

      try {
        const response = await fetch(
          `${API_BASE_URL}/competence?${paramName}=${encodeURIComponent(quizIdOrModule)}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // En cas d'erreur 404, retourner un tableau vide au lieu de lancer une exception
          if (response.status === 404) {
            return [];
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (fetchError) {
        console.warn("Fetch error:", fetchError);
        // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'affichage
        return [];
      }
    } catch (error) {
      // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'affichage
      return [];
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
      if (!competenceId) {
        console.warn("competenceId is undefined or null");
        return [];
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/sous-competence?competence=${competenceId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // En cas d'erreur 404, retourner un tableau vide au lieu de lancer une exception
          if (response.status === 404) {
            return [];
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (fetchError) {
        console.warn("Fetch error:", fetchError);
        // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'affichage
        return [];
      }
    } catch (error) {
      // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'affichage
      return [];
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
      if (
        !params ||
        (!params.idmodule && !params.quiz_id && !params.competence_id)
      ) {
        console.warn("No valid parameters provided for getActions");
        return [];
      }

      let url = `${API_BASE_URL}/action`;
      if (params.idmodule) {
        url += `?idmodule=${encodeURIComponent(params.idmodule)}`;
      } else if (params.quiz_id) {
        url += `?quiz=${encodeURIComponent(params.quiz_id)}`;
      } else if (params.competence_id) {
        url += `?competence=${encodeURIComponent(params.competence_id)}`;
      }

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // En cas d'erreur 404, retourner un tableau vide au lieu de lancer une exception
          if (response.status === 404) {
            return [];
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (fetchError) {
        // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'affichage
        return [];
      }
    } catch (error) {
      // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'affichage
      return [];
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

      const response = await fetch(`${API_BASE_URL}/competence`, {
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
      const response = await fetch(`${API_BASE_URL}/sous-competence`, {
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

      const response = await fetch(`${API_BASE_URL}/action`, {
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
      const response = await fetch(`${API_BASE_URL}/competence/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/sous-competence/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/action/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/competence/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/sous-competence/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/action/${id}`, {
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

  /**
   * Met à jour les valeurs Main et Surface d'un quiz
   * @param {string} token - Token d'authentification
   * @param {string} idModule - IDModule du quiz
   * @param {Object} data - Données à mettre à jour (Main et Surface)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  updateMainSurface: async (token, idModule, data) => {
    try {
      if (!idModule) {
        throw new Error("IDModule is required");
      }

      console.log("Updating Main/Surface values:", {
        idModule,
        Main: data.main,
        Surface: data.surface,
      });

      const response = await fetch(`${API_BASE_URL}/quiz/${idModule}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Main: data.main || 0,
          Surface: data.surface || 0,
          // Assurez-vous que MainSurface reste à true
          MainSurface: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error updating Main/Surface values"
        );
      }

      const result = await response.json();
      console.log("Update result:", result);
      return result;
    } catch (error) {
      console.error("Error updating Main/Surface values:", error);
      throw error;
    }
  },

  /**
   * Crée une évaluation pour un quiz
   * @param {string} token - Token d'authentification
   * @param {Object} evaluationData - Données de l'évaluation (quizId, apprenantId, statut)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  createEvaluation: async (token, evaluationData) => {
    try {
      if (
        !evaluationData.quizId ||
        !evaluationData.apprenantId ||
        !evaluationData.statut
      ) {
        throw new Error("quizId, apprenantId and statut are required");
      }

      console.log("DEBUG: Création d'une évaluation avec les données:", {
        quizId: evaluationData.quizId,
        apprenantId: evaluationData.apprenantId,
        statut: evaluationData.statut,
        idmodule: evaluationData.idmodule,
      });

      const response = await fetch(`${API_BASE_URL}/evaluation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating evaluation");
      }

      const result = await response.json();
      console.log("DEBUG: Évaluation créée avec succès, réponse:", result);

      // Vérifier si un certificat a été généré
      if (result.certificate) {
        if (result.certificate.certificat_generated) {
          console.log(
            "DEBUG: Un certificat a été généré automatiquement:",
            result.certificate
          );
        } else if (result.certificate.certificat_exists) {
          console.log(
            "DEBUG: Un certificat existe déjà pour ce cours:",
            result.certificate
          );
        }
      } else {
        console.log("DEBUG: Aucune information de certificat dans la réponse");
      }

      return result;
    } catch (error) {
      console.error("Error creating evaluation:", error);
      throw error;
    }
  },

  /**
   * Récupère une évaluation pour un quiz et un apprenant
   * @param {string} token - Token d'authentification
   * @param {number} quizId - ID du quiz
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Object>} - Données de l'évaluation
   */
  getEvaluationByQuizAndApprenant: async (token, quizId, apprenantId) => {
    try {
      if (!quizId || !apprenantId) {
        throw new Error("quizId and apprenantId are required");
      }

      console.log(
        `Fetching evaluation for quiz ${quizId} and apprenant ${apprenantId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/evaluation/quiz/${quizId}/apprenant/${apprenantId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Si l'évaluation n'existe pas, retourner null au lieu de lancer une exception
        if (response.status === 404) {
          console.log("No evaluation found");
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Evaluation found:", result);
      return result.evaluation;
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      return null;
    }
  },

  /**
   * Récupère les détails d'évaluation enregistrés pour un quiz et un apprenant
   * @param {string} token - Token d'authentification
   * @param {number} quizId - ID du quiz
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Object>} - Détails de l'évaluation enregistrés
   */
  getEvaluationDetailByQuizAndApprenant: async (token, quizId, apprenantId) => {
    try {
      if (!quizId || !apprenantId) {
        throw new Error("quizId and apprenantId are required");
      }

      console.log(
        `Fetching saved evaluation details for quiz ${quizId} and apprenant ${apprenantId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/evaluation-detail/quiz/${quizId}/apprenant/${apprenantId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Si aucun détail d'évaluation n'existe, retourner null
        if (response.status === 404) {
          console.log("No evaluation details found");
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Evaluation details found:", result);
      return result.evaluationDetail;
    } catch (error) {
      console.error("Error fetching evaluation details:", error);
      return null;
    }
  },

  /**
   * Enregistre les détails d'une évaluation
   * @param {string} token - Token d'authentification
   * @param {number} evaluationId - ID de l'évaluation
   * @param {Object} detailsData - Données détaillées de l'évaluation
   * @returns {Promise<Object>} - Réponse de l'API
   */
  saveEvaluationDetails: async (token, evaluationId, detailsData) => {
    try {
      if (!evaluationId) {
        throw new Error("evaluationId is required");
      }

      console.log(
        `Saving evaluation details for evaluation ${evaluationId}`,
        detailsData
      );

      const response = await fetch(`${API_BASE_URL}/evaluation-detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          evaluationId,
          ...detailsData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error saving evaluation details");
      }

      const result = await response.json();
      console.log("Evaluation details saved:", result);
      return result;
    } catch (error) {
      console.error("Error saving evaluation details:", error);
      throw error;
    }
  },

  /**
   * Récupère la progression d'un apprenant
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Object>} - Données de progression
   */
  getProgressionByApprenant: async (token, apprenantId) => {
    try {
      if (!apprenantId) {
        throw new Error("apprenantId is required");
      }

      console.log(`Fetching progression for apprenant ${apprenantId}`);

      const response = await fetch(
        `${API_BASE_URL}/progression/apprenant/${apprenantId}`,
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

      const result = await response.json();
      console.log("Progression data:", result);
      return result;
    } catch (error) {
      console.error("Error fetching progression:", error);
      // Retourner des données fictives en cas d'erreur pour éviter de bloquer l'affichage
      return {
        overall_progress: 0,
        total_courses: 0,
        completed_courses: 0,
        total_quizzes: 0,
        passed_quizzes: 0,
        course_progressions: [],
      };
    }
  },

  /**
   * Vérifie si un certificat existe pour un apprenant et un cours
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @param {number} coursId - ID du cours
   * @returns {Promise<Object>} - Informations sur le certificat existant
   */
  checkCertificate: async (token, apprenantId, coursId) => {
    try {
      console.log(
        `DEBUG: Vérification de certificat existant - Apprenant ID: ${apprenantId}, Cours ID: ${coursId}`
      );
      const url = `${API_URL}/certificat/check-and-generate/${apprenantId}/${coursId}`;
      console.log(
        `DEBUG: URL de l'API pour la vérification du certificat: ${url}`
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("DEBUG: Résultat de la vérification de certificat:", data);

      if (data.certificat) {
        console.log("DEBUG: Certificat existant:", data.certificat);
        return data; // Retourner l'objet complet avec la propriété certificat
      } else {
        console.log("DEBUG: Aucun certificat trouvé:", data);
        return data; // Retourner l'objet complet même sans certificat
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du certificat:", error);
      throw error;
    }
  },

  /**
   * Récupère la progression d'un apprenant pour un cours spécifique
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @param {number} coursId - ID du cours
   * @returns {Promise<Object>} - Données de progression pour le cours
   */
  getProgressionByApprenantAndCours: async (token, apprenantId, coursId) => {
    try {
      if (!apprenantId || !coursId) {
        throw new Error("apprenantId and coursId are required");
      }

      console.log(
        `DEBUG: Récupération de la progression - Apprenant ID: ${apprenantId}, Cours ID: ${coursId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/progression/apprenant/${apprenantId}/cours/${coursId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Gérer les différents codes d'erreur HTTP
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(
            `No progression found for apprenant ${apprenantId} and cours ${coursId}`
          );
          // Initialiser une nouvelle progression plutôt que de retourner des données fictives
          return {
            progress_percentage: 0,
            quizzes_total: 0,
            quizzes_passed: 0,
            quiz_evaluations: [],
            is_completed: false,
          };
        }

        // Pour les autres erreurs, lancer une exception
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, body:`,
          errorText
        );
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();
      console.log("DEBUG: Données de progression reçues:", result);

      // Vérifier si la progression est complète
      if (result.is_completed) {
        console.log(
          `DEBUG: Cours ${coursId} complété à 100%, vérification du certificat...`
        );
        try {
          const certificatResponse = await fetch(
            `${API_BASE_URL}/certificat/apprenant/${apprenantId}/cours/${coursId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (certificatResponse.ok) {
            const certificatData = await certificatResponse.json();
            console.log("DEBUG: Réponse de l'API certificat:", certificatData);

            if (certificatData.certificat) {
              console.log(
                `DEBUG: Certificat trouvé - ID: ${certificatData.certificat.id}`
              );

              // S'assurer que toutes les propriétés nécessaires sont présentes
              const certificat = {
                id: certificatData.certificat.id,
                date_obtention: certificatData.certificat.date_obtention,
                isAutoGenerated:
                  certificatData.certificat.isAutoGenerated || false,
                contenu: certificatData.certificat.contenu || null,
              };

              // Si le contenu est une chaîne JSON, essayer de l'analyser
              if (typeof certificat.contenu === "string") {
                try {
                  const contenuObj = JSON.parse(certificat.contenu);

                  // Ajouter les informations de l'apprenant et du cours si elles ne sont pas déjà présentes
                  if (!certificat.apprenant && contenuObj.apprenant) {
                    certificat.apprenant = contenuObj.apprenant;
                  }

                  if (!certificat.cours && contenuObj.cours) {
                    certificat.cours = contenuObj.cours;
                  }
                } catch (e) {
                  console.log(
                    "DEBUG: Erreur lors de l'analyse du contenu JSON:",
                    e
                  );
                }
              }

              // Assigner le certificat au résultat
              result.certificat = certificat;
            } else {
              console.log("DEBUG: Aucun certificat trouvé dans la réponse");
            }
          } else {
            console.log(
              `DEBUG: Pas de certificat trouvé (statut: ${certificatResponse.status})`
            );
          }
        } catch (certificatError) {
          console.error(
            "DEBUG: Erreur lors de la récupération du certificat:",
            certificatError
          );
        }
      }

      return result;
    } catch (error) {
      console.error("Error fetching course progression:", error);
      // Lancer l'erreur pour permettre une meilleure gestion dans le composant
      throw error;
    }
  },

  /**
   * Récupère les certificats d'un apprenant
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Array>} - Liste des certificats
   */
  getCertificatsByApprenant: async (token, apprenantId) => {
    try {
      if (!apprenantId) {
        throw new Error("apprenantId is required");
      }

      console.log(`Fetching certificats for apprenant ${apprenantId}`);

      const response = await fetch(
        `${API_BASE_URL}/certificat/apprenant/${apprenantId}`,
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

      const result = await response.json();
      console.log("Certificats data:", result);
      return result.certificats || [];
    } catch (error) {
      console.error("Error fetching certificats:", error);
      return [];
    }
  },

  /**
   * Génère un certificat pour un apprenant et un cours
   * @param {string} token - Token d'authentification
   * @param {number} apprenantId - ID de l'apprenant
   * @param {number} coursId - ID du cours
   * @returns {Promise<Object>} - Données du certificat généré
   */
  generateCertificat: async (token, apprenantId, coursId) => {
    try {
      if (!apprenantId || !coursId) {
        throw new Error("apprenantId and coursId are required");
      }

      console.log(
        `Generating certificat for apprenant ${apprenantId} and cours ${coursId}`
      );

      // URL de l'API pour générer le certificat
      const apiUrl = `${API_BASE_URL}/certificat/generate-direct`;
      console.log("Calling API URL:", apiUrl);

      // Utiliser la nouvelle méthode directe qui contourne les problèmes d'ORM
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apprenantId,
          coursId,
        }),
      });

      // Gérer les différents codes d'erreur HTTP
      if (!response.ok) {
        const errorData = await response.json();

        // Gérer les erreurs spécifiques en fonction du code de statut
        if (response.status === 403) {
          throw new Error(
            errorData.error ||
              "Vous n'avez pas les permissions nécessaires pour générer ce certificat"
          );
        } else if (response.status === 400) {
          if (errorData.error === "Cannot generate certificate") {
            throw new Error(
              "Tous les quiz du cours doivent être complétés avec succès pour générer un certificat"
            );
          }
          throw new Error(
            errorData.message ||
              "Données invalides pour la génération du certificat"
          );
        } else if (response.status === 404) {
          throw new Error(errorData.error || "Apprenant ou cours introuvable");
        } else if (
          response.status === 409 ||
          (errorData.message && errorData.message.includes("already exists"))
        ) {
          throw new Error("Un certificat existe déjà pour ce cours");
        } else {
          throw new Error(
            errorData.message ||
              errorData.error ||
              "Erreur lors de la génération du certificat"
          );
        }
      }

      const result = await response.json();
      console.log("Certificat generated:", result);
      return result;
    } catch (error) {
      console.error("Error generating certificat:", error);
      throw error;
    }
  },

  /**
   * Récupère les évaluations par idmodule
   * @param {string} token - Token d'authentification
   * @param {string} idmodule - ID du module
   * @returns {Promise<Array>} - Liste des évaluations
   */
  getEvaluationsByIdmodule: async (token, idmodule) => {
    try {
      if (!idmodule) {
        throw new Error("idmodule is required");
      }

      console.log(`Fetching evaluations for idmodule ${idmodule}`);

      const response = await fetch(
        `${API_BASE_URL}/evaluation/idmodule/${idmodule}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Si aucune évaluation n'existe, retourner un tableau vide
        if (response.status === 404) {
          console.log("No evaluations found");
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Evaluations found:", result);
      return result.evaluations || [];
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      return [];
    }
  },

  /**
   * Récupère une évaluation par idmodule et apprenant
   * @param {string} token - Token d'authentification
   * @param {string} idmodule - ID du module
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Object>} - Données de l'évaluation
   */
  getEvaluationByIdmoduleAndApprenant: async (token, idmodule, apprenantId) => {
    try {
      if (!idmodule || !apprenantId) {
        throw new Error("idmodule and apprenantId are required");
      }

      console.log(
        `Fetching evaluation for idmodule ${idmodule} and apprenant ${apprenantId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/evaluation/idmodule/${idmodule}/apprenant/${apprenantId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Si l'évaluation n'existe pas, retourner null au lieu de lancer une exception
        if (response.status === 404) {
          console.log("No evaluation found");
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Evaluation found:", result);
      return result.evaluation;
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      return null;
    }
  },

  /**
   * Récupère les détails d'évaluation pour un quiz (compétences, sous-compétences, actions, Main/Surface)
   * @param {string} token - Token d'authentification
   * @param {number} quizId - ID du quiz
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Object>} - Détails de l'évaluation
   */
  getEvaluationDetails: async (token, quizId, apprenantId) => {
    try {
      if (!quizId || !apprenantId) {
        throw new Error("quizId and apprenantId are required");
      }

      console.log(
        `Fetching evaluation details for quiz ${quizId} and apprenant ${apprenantId}`
      );

      // 1. Récupérer l'évaluation de base
      const evaluation = await QuizService.getEvaluationByQuizAndApprenant(
        token,
        quizId,
        apprenantId
      );

      if (!evaluation) {
        console.log("No evaluation found");
        return null;
      }

      // 2. Essayer de récupérer les détails d'évaluation enregistrés
      try {
        const savedDetails =
          await QuizService.getEvaluationDetailByQuizAndApprenant(
            token,
            quizId,
            apprenantId
          );

        if (savedDetails) {
          console.log("Found saved evaluation details:", savedDetails);

          // 3. Récupérer le quiz pour obtenir les valeurs Main/Surface originales
          const quiz = await QuizService.getQuizByIdModule(
            token,
            evaluation.idmodule || ""
          );

          // 4. Récupérer les compétences du quiz
          const competences = await QuizService.getCompetencesByQuiz(
            token,
            evaluation.idmodule || quizId,
            !!evaluation.idmodule
          );

          // 5. Pour chaque compétence, récupérer ses sous-compétences
          const competencesWithDetails = await Promise.all(
            competences.map(async (competence) => {
              // Récupérer les sous-compétences
              const sousCompetences =
                await QuizService.getSousCompetencesByCompetence(
                  token,
                  competence.id
                );

              // Récupérer l'état d'évaluation de la compétence depuis les détails sauvegardés
              const competenceStatus =
                savedDetails.competenceStatuses &&
                savedDetails.competenceStatuses[competence.id]
                  ? savedDetails.competenceStatuses[competence.id]
                  : evaluation.statut === "Satisfaisant"
                    ? "acquired"
                    : "not_evaluated";

              return {
                ...competence,
                sousCompetences: sousCompetences || [],
                status: competenceStatus,
                evaluation: competenceStatus,
                checkedSousCompetences:
                  savedDetails.checkedSousCompetences || {},
              };
            })
          );

          // 6. Récupérer les actions du quiz
          const actions = await QuizService.getActions(token, {
            idmodule: evaluation.idmodule || "",
            quiz_id: quizId,
          });

          // 7. Préparer les données Main/Surface
          let mainSurfaceData = null;
          if (
            quiz.MainSurface === 1 ||
            quiz.MainSurface === true ||
            quiz.MainSurface === "1" ||
            quiz.MainSurface === "true"
          ) {
            mainSurfaceData = {
              originalMain: savedDetails.originalMainValue || quiz.Main || 0,
              originalSurface:
                savedDetails.originalSurfaceValue || quiz.Surface || 0,
              currentMain: savedDetails.mainValue || quiz.Main || 0,
              currentSurface: savedDetails.surfaceValue || quiz.Surface || 0,
              isModified:
                savedDetails.mainValue !== savedDetails.originalMainValue ||
                savedDetails.surfaceValue !== savedDetails.originalSurfaceValue,
            };
          }

          // 8. Retourner toutes les données d'évaluation
          return {
            evaluation,
            competences: competencesWithDetails,
            actions,
            checkedActions: savedDetails.checkedActions || {},
            mainSurfaceData,
          };
        }
      } catch (detailsError) {
        console.warn(
          "Error fetching saved evaluation details, falling back to simulation:",
          detailsError
        );
      }

      // Si aucun détail sauvegardé n'est trouvé, utiliser la simulation comme avant
      console.log("No saved details found, using simulation");

      // 2. Récupérer le quiz pour obtenir les valeurs Main/Surface originales
      const quiz = await QuizService.getQuizByIdModule(
        token,
        evaluation.idmodule || ""
      );

      // 3. Récupérer les compétences du quiz
      const competences = await QuizService.getCompetencesByQuiz(
        token,
        evaluation.idmodule || quizId,
        !!evaluation.idmodule
      );

      // 4. Pour chaque compétence, récupérer ses sous-compétences
      const competencesWithDetails = await Promise.all(
        competences.map(async (competence) => {
          // Récupérer les sous-compétences
          const sousCompetences =
            await QuizService.getSousCompetencesByCompetence(
              token,
              competence.id
            );

          // Récupérer l'état d'évaluation de la compétence depuis l'évaluation
          // Dans une implémentation réelle, ces données seraient récupérées depuis le backend
          // Pour l'instant, nous utilisons une simulation basée sur le statut global de l'évaluation
          let status = "not_evaluated";

          // Si le quiz est évalué comme "Non Satisfaisant", simuler des statuts variés
          if (evaluation.statut === "Non Satisfaisant") {
            // Utiliser un algorithme déterministe basé sur l'ID de la compétence
            const competenceSeed = (competence.id * 17) % 100;

            if (competenceSeed < 33) {
              status = "not_acquired";
            } else if (competenceSeed < 66) {
              status = "to_improve";
            } else {
              status = "not_evaluated";
            }
          }
          // Si le quiz est évalué comme "Satisfaisant", toutes les compétences sont "acquired"
          else if (evaluation.statut === "Satisfaisant") {
            status = "acquired";
          }

          // Pour les compétences "to_improve", simuler des sous-compétences cochées
          const checkedSousCompetences = {};
          if (
            status === "to_improve" &&
            sousCompetences &&
            sousCompetences.length > 0
          ) {
            sousCompetences.forEach((sousComp) => {
              // Utiliser un algorithme déterministe pour simuler des sous-compétences cochées
              const sousCompSeed = (sousComp.id * 13 + competence.id) % 100;
              checkedSousCompetences[sousComp.id] = sousCompSeed < 50;
            });
          }

          return {
            ...competence,
            sousCompetences: sousCompetences || [],
            status: status,
            evaluation: status,
            checkedSousCompetences,
          };
        })
      );

      // 5. Récupérer les actions du quiz
      const actions = await QuizService.getActions(token, {
        idmodule: evaluation.idmodule || "",
        quiz_id: quizId,
      });

      // 6. Simuler l'état des actions (cochées ou non)
      const checkedActions = {};
      actions.forEach((action) => {
        // Si le quiz est évalué comme "Non Satisfaisant", certaines actions ne sont pas cochées
        if (evaluation.statut === "Non Satisfaisant") {
          // Utiliser un algorithme déterministe pour simuler des actions non cochées
          const actionSeed = (action.id * 31) % 100;
          checkedActions[action.id] = actionSeed >= 30;
        } else {
          // Si le quiz est évalué comme "Satisfaisant", toutes les actions sont cochées
          checkedActions[action.id] = true;
        }
      });

      // 7. Simuler les valeurs Main/Surface
      let mainSurfaceData = null;
      if (
        quiz.MainSurface === 1 ||
        quiz.MainSurface === true ||
        quiz.MainSurface === "1" ||
        quiz.MainSurface === "true"
      ) {
        // Si le quiz est évalué comme "Non Satisfaisant", simuler des valeurs différentes
        if (evaluation.statut === "Non Satisfaisant") {
          // Utiliser un algorithme déterministe pour simuler des valeurs différentes
          const quizSeed =
            parseInt(
              (quiz.idmodule || quiz.IDModule || "0").replace(/\D/g, "")
            ) || 0;
          const mainDiff = (quizSeed % 10) + 1;
          const surfaceDiff = ((quizSeed + 7) % 10) + 1;

          mainSurfaceData = {
            originalMain: quiz.Main || 0,
            originalSurface: quiz.Surface || 0,
            currentMain: (quiz.Main || 0) + mainDiff,
            currentSurface: Math.max(0, (quiz.Surface || 0) - surfaceDiff),
            isModified: true,
          };
        } else {
          mainSurfaceData = {
            originalMain: quiz.Main || 0,
            originalSurface: quiz.Surface || 0,
            currentMain: quiz.Main || 0,
            currentSurface: quiz.Surface || 0,
            isModified: false,
          };
        }
      }

      // 8. Retourner toutes les données d'évaluation
      return {
        evaluation,
        competences: competencesWithDetails,
        actions,
        checkedActions,
        mainSurfaceData,
      };
    } catch (error) {
      console.error("Error fetching evaluation details:", error);
      return null;
    }
  },

  /**
   * Récupère les détails d'évaluation enregistrés pour un quiz et un apprenant
   * @param {string} token - Token d'authentification
   * @param {number} quizId - ID du quiz
   * @param {number} apprenantId - ID de l'apprenant
   * @returns {Promise<Object>} - Détails de l'évaluation enregistrés
   */
  getEvaluationDetailByQuizAndApprenant: async (token, quizId, apprenantId) => {
    try {
      if (!quizId || !apprenantId) {
        throw new Error("quizId and apprenantId are required");
      }

      console.log(
        `Fetching saved evaluation details for quiz ${quizId} and apprenant ${apprenantId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/evaluation-detail/quiz/${quizId}/apprenant/${apprenantId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Si aucun détail d'évaluation n'existe, retourner null
        if (response.status === 404) {
          console.log("No evaluation details found");
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Evaluation details found:", result);
      return result.evaluationDetail;
    } catch (error) {
      console.error("Error fetching evaluation details:", error);
      return null;
    }
  },

  /**
   * Enregistre les détails d'une évaluation
   * @param {string} token - Token d'authentification
   * @param {number} evaluationId - ID de l'évaluation
   * @param {Object} detailsData - Données détaillées de l'évaluation
   * @returns {Promise<Object>} - Réponse de l'API
   */
  saveEvaluationDetails: async (token, evaluationId, detailsData) => {
    try {
      if (!evaluationId) {
        throw new Error("evaluationId is required");
      }

      console.log(
        `Saving evaluation details for evaluation ${evaluationId}`,
        detailsData
      );

      const response = await fetch(`${API_BASE_URL}/evaluation-detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          evaluationId,
          ...detailsData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error saving evaluation details");
      }

      const result = await response.json();
      console.log("Evaluation details saved:", result);
      return result;
    } catch (error) {
      console.error("Error saving evaluation details:", error);
      throw error;
    }
  },

  /**
   * Récupère les données d'un certificat
   * @param {string} token - Token d'authentification
   * @param {number} certificatId - ID du certificat
   * @returns {Promise<Object>} - Données du certificat
   */
  getCertificatData: async (token, certificatId) => {
    try {
      if (!certificatId) {
        throw new Error("certificatId is required");
      }

      console.log(`Fetching certificat data for certificat ${certificatId}`);

      const response = await fetch(
        `${API_BASE_URL}/certificat/${certificatId}/data`,
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

      const result = await response.json();
      console.log("Certificat data:", result);
      return result.certificat;
    } catch (error) {
      console.error("Error fetching certificat data:", error);
      throw error;
    }
  },

  /**
   * Génère un PDF du certificat côté client
   * @param {Object} certificatData - Données du certificat
   * @returns {Promise<void>} - Télécharge le PDF
   */
  downloadCertificatPDF: (certificatData) => {
    return new Promise((resolve, reject) => {
      try {
        if (!certificatData) {
          throw new Error("certificatData is required");
        }

        console.log("Génération du PDF avec les données:", certificatData);

        // Vérifier que les données essentielles sont présentes
        if (!certificatData.apprenant || !certificatData.apprenant.name) {
          console.error("Données d'apprenant manquantes dans le certificat");
        }

        if (!certificatData.cours || !certificatData.cours.titre) {
          console.error("Données de cours manquantes dans le certificat");
        }

        try {
          console.log("Création du document PDF");

          // Créer un nouveau document PDF au format A4 paysage
          const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
          });

          // Définir les couleurs exactes comme dans l'interface
          const marronFonce = "#92400e"; // amber-900
          const marronClair = "#78350f"; // amber-800
          const marronMoyen = "#b45309"; // amber-700
          const beigeClair = "#fef3c7"; // amber-100
          const beigeHighlight = "#fde68a"; // amber-200
          const gris = "#6b7280"; // gray-500

          // Ajouter un fond blanc
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, 297, 210, "F");

          // Ajouter un fond beige clair comme dans l'interface
          doc.setFillColor(254, 243, 199); // amber-100
          doc.rect(10, 10, 277, 190, "F");

          // Ajouter une bordure décorative double comme dans l'interface
          doc.setDrawColor(146, 64, 14, 0.2); // amber-900 avec opacité
          doc.setLineWidth(0.5);
          doc.rect(10, 10, 277, 190);

          // Fond blanc pour le contenu principal
          doc.setFillColor(255, 255, 255);
          doc.rect(20, 20, 257, 170, "F");

          // Ajouter les coins décoratifs
          doc.setDrawColor(146, 64, 14);
          doc.setLineWidth(0.5);
          // Coin supérieur gauche
          doc.line(20, 20, 40, 20);
          doc.line(20, 20, 20, 40);
          // Coin supérieur droit
          doc.line(257, 20, 277, 20);
          doc.line(277, 20, 277, 40);
          // Coin inférieur gauche
          doc.line(20, 170, 20, 190);
          doc.line(20, 190, 40, 190);
          // Coin inférieur droit
          doc.line(257, 190, 277, 190);
          doc.line(277, 170, 277, 190);

          // Titre du certificat - utiliser la même police times (équivalent à serif) que dans l'interface
          doc.setFont("times", "normal");
          doc.setTextColor(marronFonce);
          doc.setFontSize(32);
          doc.text("CERTIFICAT", 148.5, 50, { align: "center" });

          // Sous-titre - utiliser la même police et taille que dans l'interface
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.text("D'ACCOMPLISSEMENT", 148.5, 60, { align: "center" });

          // Ligne de séparation
          doc.setDrawColor(marronFonce);
          doc.setLineWidth(1);
          doc.line(118.5, 65, 178.5, 65);

          // Nom du destinataire - utiliser la même police que pour le titre du cours
          doc.setFont("helvetica", "normal");
          doc.setFontSize(14);
          doc.setTextColor(marronMoyen); // amber-700
          doc.text("Ce certificat est fièrement présenté à :", 148.5, 80, {
            align: "center",
          });

          // Utiliser la police times en gras comme dans l'interface
          doc.setFont("times", "bold");
          doc.setFontSize(20);
          doc.setTextColor(marronClair);

          // Nom de l'apprenant avec surlignage
          const apprenantName =
            certificatData?.apprenant?.name || "Nom de l'apprenant";
          doc.text(apprenantName, 148.5, 90, { align: "center" });

          // Surlignage sous le nom (rectangle beige) - utiliser amber-200 comme dans l'interface
          const textWidth = doc.getTextWidth(apprenantName);
          doc.setFillColor(253, 230, 138); // amber-200
          doc.rect(148.5 - textWidth / 2 - 5, 92, textWidth + 10, 3, "F");

          // Titre du cours - utiliser amber-700 comme dans l'interface
          doc.setFont("helvetica", "normal");
          doc.setFontSize(14);
          doc.setTextColor(marronMoyen); // amber-700
          doc.text("Pour avoir complété avec succès le cours :", 148.5, 105, {
            align: "center",
          });

          // Utiliser exactement la même police que pour le nom de l'apprenant (times, bold)
          doc.setFont("times", "bold");
          doc.setFontSize(20);
          doc.setTextColor(marronClair);

          // Titre du cours avec surlignage
          const coursTitle = certificatData?.cours?.titre || "Titre du cours";
          doc.text(coursTitle, 148.5, 115, { align: "center" });

          // Surlignage sous le titre du cours - utiliser amber-200 comme dans l'interface
          const coursWidth = doc.getTextWidth(coursTitle);
          doc.setFillColor(253, 230, 138); // amber-200
          doc.rect(148.5 - coursWidth / 2 - 5, 117, coursWidth + 10, 3, "F");

          // Description - utiliser la même police et couleur que dans l'interface
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          doc.setTextColor(gris); // gray-700
          const description =
            "Ce certificat atteste que l'apprenant a acquis toutes les compétences et connaissances requises pour ce cours, démontrant ainsi son engagement et sa maîtrise du sujet.";
          doc.text(description, 148.5, 130, {
            align: "center",
            maxWidth: 180,
          });

          // Signature - reproduire exactement le style de l'interface
          doc.setDrawColor(marronFonce);
          doc.setLineWidth(0.5);
          doc.line(50, 160, 100, 160);

          doc.setFontSize(10);
          doc.setTextColor(marronFonce);
          doc.setFont("helvetica", "bold");
          doc.text("PharmaLearn", 50, 165);
          doc.setFont("helvetica", "normal");
          doc.text("Certification officielle", 50, 170);

          // Date - reproduire exactement le style de l'interface
          doc.setTextColor(marronFonce);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text("Date de délivrance", 247, 160, { align: "right" });
          doc.setFont("helvetica", "bold");

          // Formater la date
          const formatDate = (dateString) => {
            if (!dateString) return "Date";
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(date);
          };

          doc.text(formatDate(certificatData?.date_obtention), 247, 165, {
            align: "right",
          });

          // Nettoyer le nom du fichier pour éviter les caractères spéciaux
          const sanitizeFileName = (str) => {
            if (!str) return "";
            return str
              .replace(/[^a-zA-Z0-9_\u00C0-\u00FF]/g, "_") // Remplacer les caractères spéciaux par des underscores
              .replace(/_+/g, "_") // Remplacer les underscores multiples par un seul
              .trim();
          };

          const coursNameSafe = sanitizeFileName(
            certificatData?.cours?.titre || "cours"
          );
          const apprenantNameSafe = sanitizeFileName(
            certificatData?.apprenant?.name || "apprenant"
          );
          const dateStr = new Date().toISOString().slice(0, 10);

          // Télécharger le PDF avec un nom de fichier propre
          const fileName = `certificat_${coursNameSafe}_${apprenantNameSafe}_${dateStr}.pdf`;
          console.log("Téléchargement du PDF avec le nom:", fileName);

          // Utiliser un blob pour forcer le téléchargement
          const pdfBlob = doc.output("blob");
          const url = URL.createObjectURL(pdfBlob);

          // Créer un lien de téléchargement et le cliquer automatiquement
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();

          // Nettoyer
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(link);
          }, 100);

          console.log("PDF généré et téléchargé avec succès");
          resolve();
        } catch (pdfError) {
          console.error("Erreur lors de la génération du PDF:", pdfError);
          reject(
            new Error(
              "Erreur lors de la génération du PDF: " + pdfError.message
            )
          );
        }
      } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        reject(
          new Error("Erreur lors de la génération du PDF: " + error.message)
        );
      }
    });
  },
};
