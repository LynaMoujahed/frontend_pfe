import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  MoreVertical,
  Search,
  Smile,
  Paperclip,
  X,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import messagerieService from "../../../services/messagerieService";
import { useAuth } from "../../../contexts/auth-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Messagerie = () => {
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  // Check if the user has the apprenant role
  const isApprenant =
    currentUser?.role === "apprenant" ||
    (currentUser?.roles && currentUser?.roles.includes("ROLE_APPRENANT"));

  // If user is not an apprenant, redirect to the appropriate interface
  useEffect(() => {
    if (currentUser && !isApprenant) {
      console.log(
        "User is not an apprenant, redirecting to appropriate interface"
      );
      if (
        currentUser.role === "formateur" ||
        (currentUser.roles && currentUser.roles.includes("ROLE_FORMATEUR"))
      ) {
        navigate("/formateur/messagerie");
      } else if (
        currentUser.role === "administrateur" ||
        (currentUser.roles && currentUser.roles.includes("ROLE_ADMINISTRATEUR"))
      ) {
        navigate("/admin");
      }
    }
  }, [currentUser, isApprenant, navigate]);

  // Utiliser directement l'ID de l'utilisateur courant au lieu d'un état séparé
  // Cela évite les problèmes de synchronisation entre l'état local et le contexte d'authentification
  const apprenantId = currentUser?.id;

  // Log pour le débogage
  useEffect(() => {
    if (currentUser) {
      console.log("Current user information:", {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      });
    } else {
      console.log("No current user available, waiting for authentication...");
    }
  }, [currentUser]);

  // State
  const [onlineFormateurs, setOnlineFormateurs] = useState([]);
  const [allConversations, setAllConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeFormateurId, setActiveFormateurId] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Set pour stocker les IDs des messages envoyés par l'apprenant
  // Cela nous aidera à identifier les messages envoyés par l'apprenant connecté
  const [sentMessageIds, setSentMessageIds] = useState(new Set());

  // Fetch formateurs and conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wait until authentication is complete
        if (authLoading) {
          console.log("Authentication is still loading, waiting...");
          setLoading(true);
          return; // Exit early and wait for auth to complete
        }

        // Check if apprenantId is available after auth is complete
        if (!apprenantId) {
          console.log("Authentication complete but no apprenantId found");

          // Si l'utilisateur est connecté mais que l'ID est manquant, afficher une erreur
          if (currentUser) {
            console.error("User is logged in but ID is missing in user object");
            setError(
              "ID de l'apprenant non trouvé. Veuillez vous reconnecter."
            );
          } else {
            console.error("User is not logged in or authentication failed");
            setError("Veuillez vous connecter pour accéder à la messagerie.");
          }

          setLoading(false);
          return;
        }

        setLoading(true);
        console.log("Fetching data for apprenant ID:", apprenantId);

        // Fetch formateurs
        const formateurResponse =
          await messagerieService.getFormateursForApprenant(apprenantId);

        if (
          !formateurResponse.formateurs ||
          !Array.isArray(formateurResponse.formateurs)
        ) {
          console.error("Invalid formateurs response:", formateurResponse);
          setOnlineFormateurs([]);
        } else {
          const formateurs = formateurResponse.formateurs.map((formateur) => ({
            id: formateur.id,
            name: formateur.name,
            avatar: formateur.profileImage
              ? `${process.env.PUBLIC_URL}/uploads/profile/${formateur.profileImage}`
              : "https://i.pravatar.cc/150?img=60",
            status: "online", // Simuler le statut en ligne
          }));
          console.log("Formateurs loaded:", formateurs.length);
          setOnlineFormateurs(formateurs);
        }

        // Fetch conversations
        try {
          const conversationsResponse =
            await messagerieService.getApprenantConversations(apprenantId);

          if (
            !conversationsResponse.conversations ||
            !Array.isArray(conversationsResponse.conversations)
          ) {
            console.error(
              "Invalid conversations response:",
              conversationsResponse
            );
            setAllConversations([]);
          } else {
            const conversations = conversationsResponse.conversations.map(
              (conv) => ({
                id: conv.formateur_id,
                name: conv.formateur_name,
                avatar: conv.formateur_image
                  ? `${process.env.PUBLIC_URL}/uploads/profile/${conv.formateur_image}`
                  : "https://i.pravatar.cc/150?img=60",
                lastMessage: conv.message,
                time: formatTime(conv.date),
                unread: parseInt(conv.unread_count),
                type:
                  conv.message && conv.message.includes("Pièce jointe:")
                    ? "file"
                    : "text",
              })
            );
            console.log("Conversations loaded:", conversations.length);
            setAllConversations(conversations);

            // Set active conversation if there are any
            if (conversations.length > 0 && !activeFormateurId) {
              console.log("Setting active conversation:", conversations[0].id);
              setActiveFormateurId(conversations[0].id);
              fetchMessages(conversations[0].id, apprenantId);
            }
          }
        } catch (convErr) {
          console.error("Error fetching conversations:", convErr);
          setAllConversations([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Erreur lors du chargement des données");
        setLoading(false);
      }
    };

    fetchData();

    // Polling for new messages every 10 seconds
    const interval = setInterval(() => {
      if (apprenantId && activeFormateurId) {
        fetchMessages(activeFormateurId, apprenantId, false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [apprenantId, activeFormateurId, authLoading, currentUser]);

  // Fetch messages for a conversation
  const fetchMessages = async (formateurId, apprenantId, setActive = true) => {
    // Vérifier que les deux IDs sont disponibles
    if (!formateurId) {
      console.error("Missing formateurId", { formateurId });
      setError("Erreur: ID du formateur manquant pour charger les messages");
      return;
    }

    if (!apprenantId) {
      console.error("Missing apprenantId", { apprenantId });
      setError(
        "Erreur: ID de l'apprenant manquant. Veuillez vous reconnecter."
      );
      return;
    }

    try {
      console.log(
        `Fetching messages between formateur ${formateurId} and apprenant ${apprenantId}`
      );

      // Réinitialiser l'erreur avant de faire l'appel API
      setError(null);

      const response = await messagerieService.getConversation(
        formateurId,
        apprenantId
      );

      console.log("Messages response:", response);

      if (!response.messages || !Array.isArray(response.messages)) {
        console.error("Invalid messages response:", response);
        setMessages((prev) => ({
          ...prev,
          [formateurId]: [],
        }));

        if (setActive) {
          setActiveConversation(formateurId);
        }

        return;
      }

      const formattedMessages = response.messages.map((msg) => {
        // Méthode alternative pour déterminer l'expéditeur du message
        // Puisque les objets formateur et apprenant peuvent être des tableaux vides
        // Nous utilisons une logique plus robuste pour déterminer l'expéditeur

        // Dans le backend, quand un apprenant envoie un message:
        // 1. Le message est créé avec setFormateur(formateur)
        // 2. Le message est créé avec setApprenant(apprenant)
        // 3. Le message est créé avec setLu(false) par défaut

        // Quand un formateur envoie un message:
        // 1. Le message est créé avec setFormateur(formateur)
        // 2. Le message est créé avec setApprenant(apprenant)
        // 3. Le message est créé avec setLu(false) par défaut

        // La différence est que l'apprenant est l'expéditeur dans le premier cas
        // et le formateur est l'expéditeur dans le second cas

        // Puisque les objets formateur et apprenant sont des tableaux vides dans la réponse API,
        // nous ne pouvons pas utiliser ces objets pour déterminer l'expéditeur

        // Nous allons utiliser une approche plus fiable basée sur les endpoints API utilisés
        // Quand un apprenant envoie un message via apprenantSendMessage, le message est créé avec l'apprenant comme expéditeur
        // Quand un formateur envoie un message via formateurSendMessage, le message est créé avec le formateur comme expéditeur

        // Dans le backend, les messages sont créés avec:
        // - apprenantEnvoyerMessage: message->setApprenant(apprenant) est appelé en premier
        // - formateurEnvoyerMessage: message->setFormateur(formateur) est appelé en premier

        // Nous pouvons donc déterminer l'expéditeur en examinant l'ordre des paramètres dans l'URL de l'API
        // Si l'URL contient "apprenant/{apprenantId}/formateur/{formateurId}/envoyer", l'apprenant est l'expéditeur
        // Si l'URL contient "formateur/{formateurId}/apprenant/{apprenantId}/envoyer", le formateur est l'expéditeur

        // Pour cette implémentation, nous allons utiliser une approche basée sur le contenu du message
        // et l'ID du message pour déterminer l'expéditeur

        // Nous savons que les messages envoyés par l'apprenant ont été créés via apprenantSendMessage
        // et les messages envoyés par le formateur ont été créés via formateurSendMessage

        // Puisque nous sommes dans l'interface apprenant, les messages envoyés par l'apprenant
        // doivent être affichés à droite (isMe = true) et les messages envoyés par le formateur
        // doivent être affichés à gauche (isMe = false)

        // Analyse des logs montre que les messages avec ID impair (73, 75, 77) sont de l'apprenant
        // et les messages avec ID pair (74, 76) sont du formateur
        // Cela correspond à l'ordre d'insertion dans la base de données

        // Utiliser directement le champ sentByFormateur de l'API
        // Ce champ indique explicitement si le message a été envoyé par le formateur
        // Pour l'apprenant, nous inversons la valeur car nous voulons savoir si le message a été envoyé par l'apprenant
        let sentByApprenant = false; // Déclarer la variable ici

        if (msg.sentByFormateur !== undefined) {
          // Si sentByFormateur est true, alors le message vient du formateur, donc sentByApprenant est false
          // Si sentByFormateur est false, alors le message vient de l'apprenant, donc sentByApprenant est true
          sentByApprenant = !msg.sentByFormateur;
        } else {
          // Fallback au cas où le champ n'est pas disponible (anciens messages)
          // Par défaut, considérer que le message vient de l'apprenant connecté
          sentByApprenant = true;

          // Utiliser le Set des messages envoyés comme fallback
          if (sentMessageIds.has(msg.id)) {
            sentByApprenant = true;
          }
        }

        // Ajouter un log pour voir les détails du message
        console.log("Message:", {
          id: msg.id,
          message: msg.message,
          sentByApprenant: sentByApprenant,
          formateur: msg.formateur,
          formateurId: activeFormateurId, // ID du formateur dans la conversation
          apprenant: msg.apprenant,
          apprenantId: apprenantId, // ID de l'apprenant connecté
          lu: msg.lu,
        });

        return {
          id: msg.id,
          sender: sentByApprenant ? "Moi" : getFormateurName(activeFormateurId),
          content: msg.message,
          time: formatTime(msg.date),
          isMe: sentByApprenant,
          isFile: msg.message && msg.message.includes("Pièce jointe:"),
          lu: msg.lu,
        };
      });

      console.log("Formatted messages:", formattedMessages.length);

      setMessages((prev) => ({
        ...prev,
        [formateurId]: formattedMessages,
      }));

      if (setActive) {
        setActiveConversation(formateurId);

        // Mark unread messages as read
        const unreadMessages = formattedMessages.filter(
          (msg) => !msg.isMe && !msg.lu
        );

        console.log("Unread messages to mark as read:", unreadMessages.length);

        unreadMessages.forEach((msg) => {
          messagerieService.markAsRead(msg.id);
        });

        // Update unread count in conversations
        setAllConversations((prev) =>
          prev.map((conv) =>
            conv.id === formateurId ? { ...conv, unread: 0 } : conv
          )
        );
      }

      // Scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);

      // Afficher un message d'erreur plus détaillé si disponible
      if (err.response && err.response.data) {
        console.error("Server error details:", err.response.data);
        setError(
          `Erreur: ${err.response.data.message || err.response.data.error || "Erreur lors du chargement des messages"}`
        );
      } else {
        setError(err.message || "Erreur lors du chargement des messages");
      }

      // Set empty messages array for this conversation
      setMessages((prev) => ({
        ...prev,
        [formateurId]: [],
      }));

      if (setActive) {
        setActiveConversation(formateurId);
      }

      // Afficher un message dans la console pour aider au débogage
      console.log("État actuel après erreur:", {
        apprenantId,
        formateurId,
        activeFormateurId,
        conversationsCount: allConversations.length,
      });
    }
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return format(date, "HH:mm", { locale: fr });
      } else if (diffInDays === 1) {
        return "Hier";
      } else if (diffInDays < 7) {
        return format(date, "EEEE", { locale: fr });
      } else {
        return format(date, "dd/MM/yyyy", { locale: fr });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Helper function to get formateur name
  const getFormateurName = (formateurId) => {
    const formateur = allConversations.find((f) => f.id === formateurId);
    return formateur ? formateur.name : "Formateur";
  };

  // Send message
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (newMessage.trim() || selectedFile) {
        try {
          // Vérifier que les deux IDs sont disponibles avant de tenter d'envoyer le message
          if (!apprenantId) {
            console.error("Missing apprenantId", { apprenantId });
            setError(
              "Erreur: ID de l'apprenant manquant. Veuillez vous reconnecter."
            );
            return;
          }

          if (!activeFormateurId) {
            console.error("Missing activeFormateurId", { activeFormateurId });
            setError(
              "Erreur: Veuillez sélectionner un formateur pour envoyer un message."
            );
            return;
          }

          console.log(
            `Sending message from apprenant ${apprenantId} to formateur ${activeFormateurId}`
          );

          const messageContent = selectedFile
            ? `Pièce jointe: ${selectedFile.name}`
            : newMessage;

          console.log("Message content:", messageContent);

          const response = await messagerieService.apprenantSendMessage(
            apprenantId,
            activeFormateurId,
            messageContent
          );

          console.log("Message sent successfully:", response);

          // Ajouter l'ID du message envoyé au Set des messages envoyés par l'apprenant
          // Cela nous aidera à identifier les messages envoyés par l'apprenant connecté
          if (response.data && response.data.id) {
            setSentMessageIds((prev) => {
              const newSet = new Set(prev);
              newSet.add(response.data.id);
              return newSet;
            });
          }

          // Refresh messages
          fetchMessages(activeFormateurId, apprenantId);

          // Update conversation list
          const updatedConversations = allConversations.map((conv) => {
            if (conv.id === activeFormateurId) {
              return {
                ...conv,
                lastMessage: messageContent,
                time: "À l'instant",
                type: selectedFile ? "file" : "text",
              };
            }
            return conv;
          });
          setAllConversations(updatedConversations);

          setNewMessage("");
          setSelectedFile(null);
        } catch (err) {
          console.error("Error sending message:", err);
          setError("Erreur lors de l'envoi du message");

          // Try to show more detailed error
          if (err.response && err.response.data) {
            console.error("Server error details:", err.response.data);
            setError(
              `Erreur: ${err.response.data.message || err.response.data.error || "Erreur inconnue"}`
            );
          }
        }
      }
    },
    [newMessage, activeFormateurId, apprenantId, selectedFile, allConversations]
  );

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const filteredConversations = allConversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If loading
  if ((loading && !activeFormateurId) || authLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
            {authLoading
              ? "Vérification de l'authentification..."
              : "Chargement de la messagerie..."}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {authLoading
              ? "Veuillez patienter pendant que nous vérifions votre identité."
              : "Récupération des conversations..."}
          </p>
        </div>
      </div>
    );
  }

  // If error
  if (error) {
    // Vérifier si l'erreur est liée à l'ID manquant
    const isIdMissingError = error.includes("ID de l'apprenant non trouvé");

    return (
      <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
            {error}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
            {isIdMissingError
              ? "Votre session semble avoir un problème. Veuillez vous reconnecter pour résoudre ce problème."
              : "Une erreur s'est produite lors du chargement de la messagerie."}
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
            {isIdMissingError && (
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Se reconnecter
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Afficher l'interface Messenger complète même sans conversations
  // Cela permet d'éviter l'écran "Aucune conversation" qui bloque l'utilisateur

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg">
      {/* Sidebar - Style Messenger */}
      <div className="w-1/3 border-r border-gray-200 dark:border-slate-800 flex flex-col">
        {/* Header - Style Messenger */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Discussions
            </h2>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
            <button className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Online formateurs */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {onlineFormateurs.map((formateur) => (
              <div
                key={formateur.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => {
                  setActiveFormateurId(formateur.id);
                  fetchMessages(formateur.id, apprenantId);
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                    {formateur.avatar ? (
                      <img
                        src={formateur.avatar}
                        alt={formateur.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          // En cas d'erreur de chargement de l'image, afficher les initiales
                          e.target.style.display = "none";
                          e.target.parentNode.innerHTML =
                            formateur.name?.charAt(0) || "F";
                        }}
                      />
                    ) : (
                      // Afficher les initiales si pas d'avatar
                      <span className="text-lg font-semibold">
                        {formateur.name?.charAt(0) || "F"}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>
                <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">
                  {formateur.name.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search - Style Messenger */}
        <div className="px-4 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Rechercher dans Messenger"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list - Style Messenger */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${
                activeFormateurId === conv.id
                  ? "bg-blue-50 dark:bg-slate-700"
                  : ""
              }`}
              onClick={() => {
                setActiveFormateurId(conv.id);
                fetchMessages(conv.id, apprenantId);
              }}
            >
              <div className="relative mr-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-700 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="w-14 h-14 rounded-full object-cover"
                        onError={(e) => {
                          // En cas d'erreur de chargement de l'image, afficher les initiales
                          e.target.style.display = "none";
                          e.target.parentNode.innerHTML =
                            conv.name?.charAt(0) || "F";
                        }}
                      />
                    ) : (
                      // Afficher les initiales si pas d'avatar
                      <span className="text-xl font-semibold">
                        {conv.name?.charAt(0) || "F"}
                      </span>
                    )}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${onlineFormateurs.some((f) => f.id === conv.id) ? "bg-green-500" : "bg-gray-300"} rounded-full border-2 border-white dark:border-slate-700`}
                  ></div>
                </div>
                {conv.unread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {conv.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                    {conv.name}
                  </h3>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {conv.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <p
                    className={`text-sm truncate ${conv.unread > 0 ? "font-medium text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {conv.type === "file" ? (
                      <span className="flex items-center">
                        <Paperclip size={12} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{conv.lastMessage}</span>
                      </span>
                    ) : (
                      <span className="truncate">{conv.lastMessage}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Si la liste est vide après filtrage */}
          {filteredConversations.length === 0 && searchTerm && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Aucun résultat pour "{searchTerm}"
            </div>
          )}

          {/* Si aucune conversation n'est disponible */}
          {allConversations.length === 0 && !searchTerm && !loading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="mb-2">
                <MessageSquare className="h-10 w-10 mx-auto text-blue-500 mb-2" />
              </div>
              <p className="font-medium">Aucune conversation</p>
              <p className="text-xs mt-1">
                Vous n'avez pas encore de conversations avec des formateurs.
              </p>
            </div>
          )}

          {/* Affichage pendant le chargement */}
          {loading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Chargement des conversations...</p>
            </div>
          )}
        </div>
      </div>

      {/* Main chat area - Style Messenger */}
      <div className="flex-1 flex flex-col">
        {/* Chat header - Style Messenger */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800 shadow-sm">
          <div className="flex items-center">
            <div className="relative mr-3">
              <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                {allConversations.find((c) => c.id === activeFormateurId)
                  ?.avatar ? (
                  <img
                    src={
                      allConversations.find((c) => c.id === activeFormateurId)
                        ?.avatar
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // En cas d'erreur de chargement de l'image, afficher les initiales
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML =
                        allConversations
                          .find((c) => c.id === activeFormateurId)
                          ?.name?.charAt(0) || "F";
                    }}
                  />
                ) : (
                  // Afficher les initiales si pas d'avatar
                  <span className="text-lg font-semibold">
                    {allConversations
                      .find((c) => c.id === activeFormateurId)
                      ?.name?.charAt(0) || "F"}
                  </span>
                )}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 ${
                  onlineFormateurs.some((f) => f.id === activeFormateurId)
                    ? "bg-green-500"
                    : "bg-gray-300"
                } rounded-full border-2 border-white dark:border-slate-800`}
              ></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {allConversations.find((c) => c.id === activeFormateurId)
                  ?.name || ""}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {onlineFormateurs.some((f) => f.id === activeFormateurId)
                  ? "Actif(ve) maintenant"
                  : "Inactif(ve)"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
            <button className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </button>
            <button className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages - Style Messenger */}
        <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-slate-900/30">
          {activeFormateurId && messages[activeFormateurId]?.length > 0 ? (
            messages[activeFormateurId].map((msg, index) => {
              // Vérifier si le message précédent est du même expéditeur
              const prevMsg =
                index > 0 ? messages[activeFormateurId][index - 1] : null;
              const isSameUser = prevMsg && prevMsg.isMe === msg.isMe;
              const showAvatar = !msg.isMe && (!isSameUser || index === 0);

              // Ajouter un log pour voir la valeur de isMe pour chaque message
              console.log(
                `Message ID ${msg.id} - isMe: ${msg.isMe} - Content: ${msg.content.substring(0, 20)}...`
              );

              // Utiliser directement la propriété isMe du message
              // Cette propriété est définie lors du formatage des messages dans fetchMessages
              // Nous nous assurons que c'est un booléen pour éviter des problèmes de rendu
              const isFromApprenant = Boolean(msg.isMe);

              return (
                <div
                  key={msg.id}
                  className={`flex max-w-[80%] w-full ${isSameUser ? "mt-1" : "mt-4"} ${
                    isFromApprenant
                      ? "ml-auto justify-end self-end flex-row-reverse" /* 📌 Message aligné à droite (envoyeur) */
                      : "mr-auto justify-start self-start" /* 📌 Message aligné à gauche (receveur) */
                  }`}
                >
                  {/* Avatar pour les messages reçus uniquement */}
                  {showAvatar && !isFromApprenant ? (
                    // Vérifier si l'avatar existe, sinon afficher un avatar par défaut
                    <div className="w-8 h-8 rounded-full mx-2 self-end flex-shrink-0 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                      {allConversations.find((c) => c.id === activeFormateurId)
                        ?.avatar ? (
                        <img
                          src={
                            allConversations.find(
                              (c) => c.id === activeFormateurId
                            )?.avatar
                          }
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            // En cas d'erreur de chargement de l'image, afficher les initiales
                            e.target.style.display = "none";
                            e.target.parentNode.innerHTML =
                              allConversations
                                .find((c) => c.id === activeFormateurId)
                                ?.name?.charAt(0) || "F";
                          }}
                        />
                      ) : (
                        // Afficher les initiales si pas d'avatar
                        <span>
                          {allConversations
                            .find((c) => c.id === activeFormateurId)
                            ?.name?.charAt(0) || "F"}
                        </span>
                      )}
                    </div>
                  ) : (
                    !isFromApprenant && (
                      <div className="w-8 mx-2 flex-shrink-0"></div>
                    )
                  )}

                  {/* Bulle de message */}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 shadow-sm ${
                      isFromApprenant
                        ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm ml-auto self-end text-right" /* 👉 Couleur: bleu pour messages envoyés */
                        : "bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-2xl rounded-tl-sm mr-auto self-start text-left" /* 👉 Couleur: blanc pour messages reçus */
                    }`}
                  >
                    {/* Contenu du message */}
                    {msg.isFile ? (
                      <div className="flex items-center">
                        <Paperclip size={16} className="mr-2 flex-shrink-0" />
                        <span
                          className={
                            isFromApprenant ? "text-right" : "text-left"
                          }
                        >
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <p
                        className={`text-sm ${isFromApprenant ? "text-right" : "text-left"}`}
                      >
                        {msg.content}
                      </p>
                    )}

                    {/* Horodatage */}
                    <p
                      className={`text-xs mt-1 opacity-70 ${isFromApprenant ? "text-right" : "text-left"}`}
                    >
                      {msg.time}
                    </p>
                  </div>

                  {/* Espace réservé pour l'avatar côté droit (messages envoyés) */}
                  {isFromApprenant && (
                    <div className="w-8 h-8 mx-2 flex-shrink-0"></div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  {activeFormateurId
                    ? "Aucun message"
                    : "Bienvenue sur Messenger"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {activeFormateurId
                    ? "Commencez la conversation en envoyant un message."
                    : "Sélectionnez un formateur dans la liste ou recherchez un formateur pour commencer une conversation."}
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input - Style Messenger */}
        {activeFormateurId ? (
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 relative"
          >
            {selectedFile && (
              <div className="flex items-center justify-between mb-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <div className="flex items-center flex-1 truncate">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500 mr-2"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  <span className="text-sm truncate">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-white bg-gray-200 dark:bg-slate-600 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center">
              <div className="flex space-x-1">
                <div className="relative">
                  <button
                    type="button"
                    className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile size={24} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-10 shadow-lg rounded-lg overflow-hidden">
                      <Picker
                        data={data}
                        onEmojiSelect={addEmoji}
                        theme={
                          localStorage.getItem("theme") === "dark"
                            ? "dark"
                            : "light"
                        }
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  onClick={() => fileInputRef.current.click()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                    <path d="M16.5 9.4 7.55 4.24"></path>
                    <polyline points="3.29 7 12 12 20.71 7"></polyline>
                    <line x1="12" y1="22" x2="12" y2="12"></line>
                    <circle cx="18.5" cy="15.5" r="2.5"></circle>
                    <path d="M20.27 17.27 22 19"></path>
                  </svg>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </button>
              </div>

              <div className="flex-1 mx-2 relative">
                <input
                  type="text"
                  className="w-full p-3 pl-4 pr-10 border border-gray-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white"
                  placeholder="Aa"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  required={!selectedFile}
                />
              </div>

              <button
                type="submit"
                className={`p-2 rounded-full ${
                  newMessage.trim() || selectedFile
                    ? "text-blue-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                    : "text-gray-400 cursor-not-allowed"
                } transition-colors`}
                disabled={!newMessage.trim() && !selectedFile}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-center text-gray-500 dark:text-gray-400">
            Sélectionnez une conversation pour envoyer un message
          </div>
        )}
      </div>
    </div>
  );
};

export default Messagerie;
