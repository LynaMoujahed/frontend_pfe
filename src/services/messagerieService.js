import axios from "axios";
import { API_URL } from "../config";
import authHeader from "./authHeader";

// Helper function to validate IDs
const validateIds = (formateurId, apprenantId) => {
  if (!formateurId) {
    console.error("Missing formateurId in API call");
    throw new Error("ID du formateur manquant. Veuillez vous reconnecter.");
  }
  if (!apprenantId) {
    console.error("Missing apprenantId in API call");
    throw new Error("ID de l'apprenant manquant. Veuillez vous reconnecter.");
  }
};

const getConversation = async (formateurId, apprenantId) => {
  try {
    // Validate IDs
    validateIds(formateurId, apprenantId);

    console.log(
      `API call: Getting conversation between formateur ${formateurId} and apprenant ${apprenantId}`
    );
    const response = await axios.get(
      `${API_URL}/messagerie/formateur/${formateurId}/apprenant/${apprenantId}`,
      { headers: authHeader() }
    );

    // Le backend fournit maintenant le champ sentByFormateur
    // Nous n'avons plus besoin d'ajouter ce champ manuellement
    // Mais nous allons vérifier qu'il existe bien pour la rétrocompatibilité
    if (response.data && response.data.messages) {
      response.data.messages = response.data.messages.map((msg) => {
        // Si le champ sentByFormateur n'existe pas, on utilise la valeur par défaut
        if (msg.sentByFormateur === undefined) {
          console.warn(
            "Le champ sentByFormateur n'existe pas pour le message ID:",
            msg.id
          );
          // Utiliser l'attribut sentByFormateur du backend s'il existe
          return {
            ...msg,
            sentByFormateur: false, // Par défaut, considérer que le message vient de l'apprenant
          };
        }
        return msg;
      });
    }

    console.log("Conversation data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error ||
          "Erreur lors de la récupération de la conversation"
      );
    }
    throw error;
  }
};

const getFormateurConversations = async (formateurId) => {
  try {
    if (!formateurId) {
      console.error("Missing formateurId in getFormateurConversations");
      throw new Error("ID du formateur manquant. Veuillez vous reconnecter.");
    }

    console.log(`API call: Getting conversations for formateur ${formateurId}`);
    const response = await axios.get(
      `${API_URL}/messagerie/formateur/${formateurId}/conversations`,
      { headers: authHeader() }
    );
    console.log("Formateur conversations received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching formateur conversations:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error ||
          "Erreur lors de la récupération des conversations"
      );
    }
    throw error;
  }
};

const getApprenantConversations = async (apprenantId) => {
  try {
    if (!apprenantId) {
      console.error("Missing apprenantId in getApprenantConversations");
      throw new Error("ID de l'apprenant manquant. Veuillez vous reconnecter.");
    }

    console.log(`API call: Getting conversations for apprenant ${apprenantId}`);
    const response = await axios.get(
      `${API_URL}/messagerie/apprenant/${apprenantId}/conversations`,
      { headers: authHeader() }
    );
    console.log("Apprenant conversations received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching apprenant conversations:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error ||
          "Erreur lors de la récupération des conversations"
      );
    }
    throw error;
  }
};

const formateurSendMessage = async (formateurId, apprenantId, message) => {
  try {
    // Validate IDs
    validateIds(formateurId, apprenantId);

    if (!message || message.trim() === "") {
      throw new Error("Le message ne peut pas être vide");
    }

    console.log(
      `API call: Sending message from formateur ${formateurId} to apprenant ${apprenantId}`
    );
    const response = await axios.post(
      `${API_URL}/messagerie/formateur/${formateurId}/apprenant/${apprenantId}/envoyer`,
      { message },
      { headers: authHeader() }
    );

    // Ajouter le champ sentByFormateur au message envoyé
    if (response.data && response.data.data) {
      response.data.data = {
        ...response.data.data,
        sentByFormateur: true, // Message envoyé par le formateur
      };
    }

    console.log("Message sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending message from formateur:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error || "Erreur lors de l'envoi du message"
      );
    }
    throw error;
  }
};

const apprenantSendMessage = async (apprenantId, formateurId, message) => {
  try {
    // Validate IDs
    validateIds(formateurId, apprenantId);

    if (!message || message.trim() === "") {
      throw new Error("Le message ne peut pas être vide");
    }

    console.log(
      `API call: Sending message from apprenant ${apprenantId} to formateur ${formateurId}`
    );
    const response = await axios.post(
      `${API_URL}/messagerie/apprenant/${apprenantId}/formateur/${formateurId}/envoyer`,
      { message },
      { headers: authHeader() }
    );

    // Ajouter le champ sentByFormateur au message envoyé
    if (response.data && response.data.data) {
      response.data.data = {
        ...response.data.data,
        sentByFormateur: false, // Message envoyé par l'apprenant
      };
    }

    console.log("Message sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending message from apprenant:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error || "Erreur lors de l'envoi du message"
      );
    }
    throw error;
  }
};

const markAsRead = async (messageId) => {
  try {
    if (!messageId) {
      console.error("Missing messageId in markAsRead");
      throw new Error("ID du message manquant");
    }

    console.log(`API call: Marking message ${messageId} as read`);
    const response = await axios.put(
      `${API_URL}/messagerie/${messageId}/marquer-lu`,
      {},
      { headers: authHeader() }
    );
    console.log("Message marked as read:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error marking message as read:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error ||
          "Erreur lors du marquage du message comme lu"
      );
    }
    throw error;
  }
};

const getFormateursForApprenant = async (apprenantId) => {
  try {
    if (!apprenantId) {
      console.error("Missing apprenantId in getFormateursForApprenant");
      throw new Error("ID de l'apprenant manquant. Veuillez vous reconnecter.");
    }

    console.log(`API call: Getting formateurs for apprenant ${apprenantId}`);
    const response = await axios.get(
      `${API_URL}/messagerie/apprenant/${apprenantId}/formateurs`,
      { headers: authHeader() }
    );
    console.log("Formateurs for apprenant received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching formateurs for apprenant:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error ||
          "Erreur lors de la récupération des formateurs"
      );
    }
    throw error;
  }
};

const getApprenantsForFormateur = async (formateurId) => {
  try {
    if (!formateurId) {
      console.error("Missing formateurId in getApprenantsForFormateur");
      throw new Error("ID du formateur manquant. Veuillez vous reconnecter.");
    }

    console.log(`API call: Getting apprenants for formateur ${formateurId}`);
    const response = await axios.get(
      `${API_URL}/messagerie/formateur/${formateurId}/apprenants`,
      { headers: authHeader() }
    );
    console.log("Apprenants for formateur received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching apprenants for formateur:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(
        error.response.data.error ||
          "Erreur lors de la récupération des apprenants"
      );
    }
    throw error;
  }
};

const messagerieService = {
  getConversation,
  getFormateurConversations,
  getApprenantConversations,
  formateurSendMessage,
  apprenantSendMessage,
  markAsRead,
  getFormateursForApprenant,
  getApprenantsForFormateur,
};

export default messagerieService;
