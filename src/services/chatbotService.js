import axios from "axios";
import authHeader from "./authHeader";

/**
 * Service pour gérer les interactions avec le chatbot AI
 */
const chatbotService = {
  /**
   * Envoie un message au chatbot via le backend et récupère la réponse
   * @param {string} message - Message de l'utilisateur
   * @param {Array} history - Historique de la conversation (optionnel)
   * @returns {Promise<Object>} - Réponse du chatbot
   */
  sendMessage: async (message, history = []) => {
    try {
      // Essayer d'abord avec l'authentification normale
      try {
        console.log("🔍 [Chatbot] Tentative d'envoi avec l'endpoint standard");
        console.log("🔑 [Chatbot] Headers:", authHeader());

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/chatbot/message`,
          {
            message,
            context: "interface_apprenant",
          },
          {
            headers: authHeader(),
          }
        );

        console.log(
          "✅ [Chatbot] Réponse de l'endpoint standard:",
          response.data
        );
        return response.data;
      } catch (authError) {
        console.error(
          "❌ [Chatbot] Erreur avec l'endpoint standard:",
          authError
        );
        console.log("🔍 [Chatbot] Status:", authError.response?.status);
        console.log("🔍 [Chatbot] Data:", authError.response?.data);

        // Si l'erreur est due à un problème d'authentification (401)
        if (authError.response && authError.response.status === 401) {
          console.log(
            "⚠️ [Chatbot] Token expiré détecté, utilisation de l'endpoint étendu"
          );

          // Tenter de récupérer l'ID utilisateur
          console.log(
            "🔍 [Chatbot] Tentative de récupération de l'ID utilisateur"
          );
          let userId = null;

          // Essayer d'abord de récupérer depuis le localStorage
          const userStr = localStorage.getItem("user");
          console.log("🔍 [Chatbot] User data from localStorage:", userStr);

          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              userId = userData.id;
              console.log(
                "✅ [Chatbot] ID utilisateur récupéré du localStorage:",
                userId
              );
            } catch (e) {
              console.error(
                "❌ [Chatbot] Erreur lors de la récupération des données utilisateur du localStorage:",
                e
              );
            }
          } else {
            console.error(
              "❌ [Chatbot] Aucune donnée utilisateur trouvée dans le localStorage"
            );

            // Essayer de récupérer l'ID depuis l'URL si disponible
            const urlParams = new URLSearchParams(window.location.search);
            const urlUserId = urlParams.get("userId");
            if (urlUserId) {
              userId = urlUserId;
              console.log(
                "✅ [Chatbot] ID utilisateur récupéré de l'URL:",
                userId
              );
            }
          }

          // Méthode 2: Récupérer l'ID depuis le token JWT si on n'a pas pu le récupérer autrement
          if (!userId) {
            try {
              const token = localStorage.getItem("token");
              if (token) {
                // Décoder le token JWT (format: header.payload.signature)
                const payload = token.split(".")[1];
                const decodedPayload = JSON.parse(atob(payload));
                if (decodedPayload.id) {
                  userId = decodedPayload.id;
                  console.log(
                    "✅ [Chatbot] ID utilisateur récupéré du token JWT:",
                    userId
                  );
                }
              }
            } catch (e) {
              console.error(
                "❌ [Chatbot] Erreur lors du décodage du token JWT:",
                e
              );
            }
          }

          if (!userId) {
            console.error(
              "❌ [Chatbot] Impossible de récupérer l'ID utilisateur"
            );
            return {
              content:
                "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
              role: "assistant",
              isError: true,
              authError: true,
            };
          }

          // Utiliser l'endpoint étendu qui ne nécessite pas de token valide
          console.log("🔍 [Chatbot] Tentative d'envoi avec l'endpoint étendu");
          console.log(
            "🔍 [Chatbot] URL:",
            `${import.meta.env.VITE_API_URL}/chatbot/message-extended`
          );
          console.log("🔍 [Chatbot] Payload:", {
            message,
            context: "interface_apprenant",
            userId: userId,
          });

          try {
            const extendedResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}/chatbot/message-extended`,
              {
                message,
                context: "interface_apprenant",
                userId: userId,
              }
            );

            console.log(
              "✅ [Chatbot] Réponse de l'endpoint étendu:",
              extendedResponse.data
            );
            return extendedResponse.data;
          } catch (extendedError) {
            console.error(
              "❌ [Chatbot] Erreur avec l'endpoint étendu:",
              extendedError
            );
            console.log("🔍 [Chatbot] Status:", extendedError.response?.status);
            console.log("🔍 [Chatbot] Data:", extendedError.response?.data);
            throw extendedError;
          }
        }

        // Si c'est une autre erreur, la relancer
        throw authError;
      }
    } catch (error) {
      console.error(
        "❌ [Chatbot] Erreur lors de la communication avec le chatbot:",
        error
      );

      // Vérifier si l'erreur contient des informations d'authentification
      const isAuthError =
        error.response &&
        (error.response.status === 401 ||
          error.response.status === 403 ||
          (error.response.data && error.response.data.authError));

      console.log("🔍 [Chatbot] isAuthError:", isAuthError);

      // Retourner un message d'erreur formaté
      return {
        content: isAuthError
          ? "Votre session a expiré. Veuillez vous reconnecter pour continuer."
          : "Désolé, je rencontre des difficultés à me connecter. Veuillez réessayer plus tard.",
        role: "assistant",
        isError: true,
        authError: isAuthError,
      };
    }
  },

  /**
   * Récupère l'historique de conversation depuis le backend
   * @returns {Promise<Array>} - Historique de la conversation
   */
  getHistory: async () => {
    try {
      // Essayer d'abord avec l'authentification normale
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/chatbot/history`,
          {
            headers: authHeader(),
          }
        );
        return response.data.conversations || [];
      } catch (authError) {
        // Si l'erreur est due à un problème d'authentification (401)
        if (authError.response && authError.response.status === 401) {
          console.log(
            "Token expiré détecté, utilisation de l'endpoint étendu pour l'historique"
          );

          // Tenter de récupérer l'ID utilisateur
          console.log(
            "🔍 [Chatbot] Tentative de récupération de l'ID utilisateur pour l'historique"
          );
          let userId = null;

          // Essayer d'abord de récupérer depuis le localStorage
          const userStr = localStorage.getItem("user");
          console.log(
            "🔍 [Chatbot] User data from localStorage (historique):",
            userStr
          );

          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              userId = userData.id;
              console.log(
                "✅ [Chatbot] ID utilisateur récupéré du localStorage pour l'historique:",
                userId
              );
            } catch (e) {
              console.error(
                "❌ [Chatbot] Erreur lors de la récupération des données utilisateur pour l'historique:",
                e
              );
              return [];
            }
          } else {
            console.error(
              "❌ [Chatbot] Aucune donnée utilisateur trouvée dans le localStorage pour l'historique"
            );

            // Essayer de récupérer l'ID depuis l'URL si disponible
            const urlParams = new URLSearchParams(window.location.search);
            const urlUserId = urlParams.get("userId");
            if (urlUserId) {
              userId = urlUserId;
              console.log(
                "✅ [Chatbot] ID utilisateur récupéré de l'URL pour l'historique:",
                userId
              );
            } else {
              return [];
            }
          }

          // Méthode 2: Récupérer l'ID depuis le token JWT si on n'a pas pu le récupérer autrement
          if (!userId) {
            try {
              const token = localStorage.getItem("token");
              if (token) {
                // Décoder le token JWT (format: header.payload.signature)
                const payload = token.split(".")[1];
                const decodedPayload = JSON.parse(atob(payload));
                if (decodedPayload.id) {
                  userId = decodedPayload.id;
                  console.log(
                    "✅ [Chatbot] ID utilisateur récupéré du token JWT pour l'historique:",
                    userId
                  );
                }
              }
            } catch (e) {
              console.error(
                "❌ [Chatbot] Erreur lors du décodage du token JWT pour l'historique:",
                e
              );
            }
          }

          if (!userId) {
            console.error("Impossible de récupérer l'ID utilisateur");
            return [];
          }

          // Utiliser l'endpoint étendu qui ne nécessite pas de token valide
          const extendedResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/chatbot/history-extended`,
            {
              userId: userId,
              limit: 20,
            }
          );

          return extendedResponse.data.conversations || [];
        }

        // Si c'est une autre erreur, la relancer
        throw authError;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return [];
    }
  },

  /**
   * Efface l'historique de conversation dans le backend
   */
  clearHistory: async () => {
    try {
      // Essayer d'abord avec l'authentification normale
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/chatbot/history/clear`,
          {},
          {
            headers: authHeader(),
          }
        );
        console.log("Réponse du serveur:", response.data);
        return true;
      } catch (authError) {
        // Pour l'effacement de l'historique, si le token est expiré,
        // on demande simplement à l'utilisateur de se reconnecter
        if (authError.response && authError.response.status === 401) {
          console.log(
            "Token expiré détecté lors de l'effacement de l'historique"
          );

          // Ne pas propager l'erreur mais retourner un objet d'erreur
          return {
            success: false,
            error:
              "Votre session a expiré. Veuillez vous reconnecter pour effacer l'historique.",
            authError: true,
          };
        }

        // Si c'est une autre erreur, la relancer
        throw authError;
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique:", error);

      // Afficher plus de détails sur l'erreur
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui n'est pas dans la plage 2xx
        console.error("Données d'erreur:", error.response.data);
        console.error("Statut:", error.response.status);
        console.error("En-têtes:", error.response.headers);

        // Vérifier si l'erreur est liée à l'authentification
        const isAuthError =
          error.response.status === 401 || error.response.status === 403;
        if (isAuthError) {
          return {
            success: false,
            error:
              "Votre session a expiré. Veuillez vous reconnecter pour effacer l'historique.",
            authError: true,
          };
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Requête sans réponse:", error.request);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration:", error.message);
      }

      throw error; // Propager l'erreur pour permettre une gestion au niveau du composant
    }
  },

  /**
   * Récupère les en-têtes d'authentification pour le débogage
   * @returns {Object} En-têtes d'authentification
   */
  getAuthHeader: () => {
    return authHeader();
  },
};

export default chatbotService;
