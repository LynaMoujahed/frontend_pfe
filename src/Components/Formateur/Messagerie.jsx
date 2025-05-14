import { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  MoreVertical,
  Search,
  ArrowLeft,
  Smile,
  Paperclip,
  X,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./formateur-styles.css";
import messagerieService from "../../services/messagerieService";
import { useAuth } from "../../contexts/auth-context";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Messagerie = () => {
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  // Check if the user has the formateur role
  const isFormateur =
    currentUser?.role === "formateur" ||
    (currentUser?.roles && currentUser?.roles.includes("ROLE_FORMATEUR"));

  // If user is not a formateur, redirect to the appropriate interface
  useEffect(() => {
    if (currentUser && !isFormateur) {
      console.log(
        "User is not a formateur, redirecting to appropriate interface"
      );
      if (
        currentUser.role === "apprenant" ||
        (currentUser.roles && currentUser.roles.includes("ROLE_APPRENANT"))
      ) {
        navigate("/apprenant/messagerie");
      } else if (
        currentUser.role === "administrateur" ||
        (currentUser.roles && currentUser.roles.includes("ROLE_ADMINISTRATEUR"))
      ) {
        navigate("/admin");
      }
    }
  }, [currentUser, isFormateur, navigate]);

  // Utiliser directement l'ID de l'utilisateur connecté au lieu d'un état séparé
  // Cela évite les problèmes de synchronisation entre l'état local et le contexte d'authentification
  const formateurId = currentUser?.id;

  // Log pour le débogage
  useEffect(() => {
    if (currentUser) {
      console.log("Current user information:", {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role || currentUser.roles,
      });
    } else {
      console.log("No current user available, waiting for authentication...");
    }
  }, [currentUser]);

  // State
  const [onlineApprenants, setOnlineApprenants] = useState([]);
  const [allConversations, setAllConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeApprenantId, setActiveApprenantId] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Set pour stocker les IDs des messages envoyés par le formateur
  // Cela nous aidera à identifier les messages envoyés par le formateur connecté
  const [sentMessageIds, setSentMessageIds] = useState(new Set());

  // Fetch apprenants and conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wait until authentication is complete
        if (authLoading) {
          console.log("Authentication is still loading, waiting...");
          setLoading(true);
          return; // Exit early and wait for auth to complete
        }

        // Vérification plus robuste de l'ID du formateur
        if (!formateurId) {
          console.log("Authentication complete but no formateurId found");

          // Vérifier si l'utilisateur est connecté mais que l'ID est manquant
          if (currentUser) {
            console.error(
              "User is logged in but ID is missing in user object:",
              currentUser
            );
            setError("ID du formateur non trouvé. Veuillez vous reconnecter.");
          } else {
            console.error("User is not logged in or authentication failed");
            setError("Veuillez vous connecter pour accéder à la messagerie.");
          }

          setLoading(false);
          return;
        }

        setLoading(true);
        console.log("Fetching data for formateur ID:", formateurId);

        // Fetch apprenants
        const apprenantResponse =
          await messagerieService.getApprenantsForFormateur(formateurId);

        if (
          !apprenantResponse.apprenants ||
          !Array.isArray(apprenantResponse.apprenants)
        ) {
          console.error("Invalid apprenants response:", apprenantResponse);
          setOnlineApprenants([]);
        } else {
          const apprenants = apprenantResponse.apprenants.map((apprenant) => ({
            id: apprenant.id,
            name: apprenant.name,
            avatar: apprenant.profileImage
              ? `${process.env.PUBLIC_URL}/uploads/profile/${apprenant.profileImage}`
              : "https://i.pravatar.cc/150?img=60",
            status: "online", // Simuler le statut en ligne
          }));
          console.log("Apprenants loaded:", apprenants.length);
          setOnlineApprenants(apprenants);
        }

        // Fetch conversations
        try {
          const conversationsResponse =
            await messagerieService.getFormateurConversations(formateurId);

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
                id: conv.apprenant_id,
                name: conv.apprenant_name,
                avatar: conv.apprenant_image
                  ? `${process.env.PUBLIC_URL}/uploads/profile/${conv.apprenant_image}`
                  : "https://i.pravatar.cc/150?img=60",
                lastMessage: conv.message,
                time: formatTime(conv.date),
                unread: parseInt(conv.unread_count),
                type: "text",
              })
            );
            console.log("Conversations loaded:", conversations.length);
            setAllConversations(conversations);

            // Set active conversation if there are any
            if (conversations.length > 0 && !activeApprenantId) {
              console.log("Setting active conversation:", conversations[0].id);
              setActiveApprenantId(conversations[0].id);
              fetchMessages(formateurId, conversations[0].id);
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

    // Polling optimisé pour les nouveaux messages
    // Utiliser un intervalle plus long (20 secondes) pour réduire la charge serveur
    // et ajouter une vérification pour éviter les appels inutiles
    const interval = setInterval(() => {
      if (formateurId && activeApprenantId) {
        // Vérifier s'il y a de nouveaux messages sans recharger toute la conversation
        checkNewMessages(formateurId, activeApprenantId);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [formateurId, activeApprenantId, authLoading, currentUser]);

  // Vérifier s'il y a de nouveaux messages sans recharger toute la conversation
  const checkNewMessages = async (formateurId, apprenantId) => {
    try {
      // Obtenir l'ID du dernier message dans la conversation actuelle
      const currentMessages = messages[apprenantId] || [];
      const lastMessageId =
        currentMessages.length > 0
          ? Math.max(...currentMessages.map((msg) => msg.id))
          : 0;

      // Appeler une version optimisée du service qui vérifie seulement les nouveaux messages
      const response = await messagerieService.getConversation(
        formateurId,
        apprenantId
      );

      if (response.messages && Array.isArray(response.messages)) {
        // Filtrer pour ne garder que les nouveaux messages
        const newMessages = response.messages.filter(
          (msg) => msg.id > lastMessageId
        );

        if (newMessages.length > 0) {
          console.log(`${newMessages.length} nouveaux messages trouvés`);
          // Mettre à jour la conversation avec les nouveaux messages
          fetchMessages(formateurId, apprenantId, false);

          // Mettre à jour la liste des conversations pour refléter le dernier message
          updateConversationsList(formateurId);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des nouveaux messages:",
        error
      );
    }
  };

  // Mettre à jour la liste des conversations
  const updateConversationsList = async (formateurId) => {
    try {
      const conversationsResponse =
        await messagerieService.getFormateurConversations(formateurId);

      if (
        conversationsResponse.conversations &&
        Array.isArray(conversationsResponse.conversations)
      ) {
        const conversations = conversationsResponse.conversations.map(
          (conv) => ({
            id: conv.apprenant_id,
            name: conv.apprenant_name,
            avatar: conv.apprenant_image
              ? `${process.env.PUBLIC_URL}/uploads/profile/${conv.apprenant_image}`
              : "https://i.pravatar.cc/150?img=60",
            lastMessage: conv.message,
            time: formatTime(conv.date),
            unread: parseInt(conv.unread_count),
            type: "text",
          })
        );
        setAllConversations(conversations);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la liste des conversations:",
        error
      );
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (formateurId, apprenantId, setActive = true) => {
    try {
      console.log(
        `Fetching messages between formateur ${formateurId} and apprenant ${apprenantId}`
      );

      const response = await messagerieService.getConversation(
        formateurId,
        apprenantId
      );

      console.log("Messages response:", response);

      if (!response.messages || !Array.isArray(response.messages)) {
        console.error("Invalid messages response:", response);
        setMessages((prev) => ({
          ...prev,
          [apprenantId]: [],
        }));

        if (setActive) {
          setActiveConversation(apprenantId);
        }

        return;
      }

      // Afficher la structure complète des messages pour le débogage
      if (response.messages && response.messages.length > 0) {
        console.log(
          "Message structure example:",
          JSON.stringify(response.messages[0], null, 2)
        );
      }

      // Afficher la structure complète des messages pour le débogage
      console.log("Raw messages from API:", response.messages);

      const formattedMessages = response.messages.map((msg) => {
        // Utiliser directement le champ sentByFormateur fourni par l'API
        // Ce champ indique explicitement si le message a été envoyé par le formateur
        let isFromFormateur = false;

        if (msg.sentByFormateur !== undefined) {
          // Utiliser la valeur fournie par le backend
          isFromFormateur = msg.sentByFormateur;
        } else {
          // Fallback pour les anciens messages sans cet attribut
          // Utiliser le Set des messages envoyés comme fallback
          isFromFormateur = sentMessageIds.has(msg.id);
        }

        // Afficher la structure du message pour le débogage (version simplifiée)
        console.log("Message:", {
          id: msg.id,
          message: msg.message,
          isFromFormateur: isFromFormateur,
          lu: msg.lu,
        });

        return {
          id: msg.id,
          sender: isFromFormateur ? "Moi" : getApprenantName(apprenantId),
          content: msg.message,
          time: formatTime(msg.date),
          isMe: isFromFormateur,
          isFile: msg.message && msg.message.includes("Pièce jointe:"),
          lu: msg.lu,
        };
      });

      console.log("Formatted messages:", formattedMessages.length);

      setMessages((prev) => ({
        ...prev,
        [apprenantId]: formattedMessages,
      }));

      if (setActive) {
        setActiveConversation(apprenantId);

        // Mark unread messages as read
        const unreadMessages = formattedMessages.filter(
          (msg) => !msg.isMe && !msg.lu
        );

        console.log("Unread messages to mark as read:", unreadMessages.length);

        // Optimisation: marquer tous les messages non lus en une seule requête
        if (unreadMessages.length > 0) {
          // Créer un tableau des IDs de messages à marquer comme lus
          const unreadIds = unreadMessages.map((msg) => msg.id);

          // Marquer les messages comme lus en parallèle pour améliorer les performances
          Promise.all(unreadIds.map((id) => messagerieService.markAsRead(id)))
            .then(() => {
              console.log(`${unreadIds.length} messages marqués comme lus`);

              // Mettre à jour l'état local des messages pour refléter qu'ils sont lus
              setMessages((prev) => {
                const updatedMessages = [...prev[apprenantId]];
                updatedMessages.forEach((msg) => {
                  if (unreadIds.includes(msg.id)) {
                    msg.lu = true;
                  }
                });
                return {
                  ...prev,
                  [apprenantId]: updatedMessages,
                };
              });

              // Update unread count in conversations
              setAllConversations((prev) =>
                prev.map((conv) =>
                  conv.id === apprenantId ? { ...conv, unread: 0 } : conv
                )
              );
            })
            .catch((error) => {
              console.error(
                "Erreur lors du marquage des messages comme lus:",
                error
              );
            });
        } else {
          // Si aucun message non lu, mettre simplement à jour le compteur
          setAllConversations((prev) =>
            prev.map((conv) =>
              conv.id === apprenantId ? { ...conv, unread: 0 } : conv
            )
          );
        }
      }

      // Scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Erreur lors du chargement des messages");

      // Set empty messages array for this conversation
      setMessages((prev) => ({
        ...prev,
        [apprenantId]: [],
      }));

      if (setActive) {
        setActiveConversation(apprenantId);
      }
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

  // Helper function to get apprenant name
  const getApprenantName = (apprenantId) => {
    const apprenant = allConversations.find((a) => a.id === apprenantId);
    return apprenant ? apprenant.name : "Apprenant";
  };

  // Send message avec optimistic UI update
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (newMessage.trim() || selectedFile) {
        try {
          console.log(
            `Sending message from formateur ${formateurId} to apprenant ${activeApprenantId}`
          );

          const messageContent = selectedFile
            ? `Pièce jointe: ${selectedFile.name}`
            : newMessage;

          console.log("Message content:", messageContent);

          if (!formateurId || !activeApprenantId) {
            console.error("Missing formateurId or activeApprenantId", {
              formateurId,
              activeApprenantId,
            });
            setError("Erreur: Identifiants manquants");
            return;
          }

          // Optimistic UI update - ajouter le message immédiatement dans l'interface
          // avant même que la requête API soit terminée
          const tempId = `temp-${Date.now()}`;
          const optimisticMessage = {
            id: tempId,
            sender: "Moi",
            content: messageContent,
            time: "À l'instant",
            isMe: true,
            isFile: messageContent.includes("Pièce jointe:"),
            lu: true,
            isPending: true, // Indicateur que le message est en cours d'envoi
          };

          // Ajouter le message optimiste à la conversation
          setMessages((prev) => ({
            ...prev,
            [activeApprenantId]: [
              ...(prev[activeApprenantId] || []),
              optimisticMessage,
            ],
          }));

          // Mettre à jour la liste des conversations
          setAllConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeApprenantId
                ? {
                    ...conv,
                    lastMessage: messageContent,
                    time: "À l'instant",
                    type: selectedFile ? "file" : "text",
                  }
                : conv
            )
          );

          // Vider le champ de message et réinitialiser le fichier sélectionné
          setNewMessage("");
          setSelectedFile(null);

          // Scroll to bottom
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }

          // Envoyer le message au serveur
          const response = await messagerieService.formateurSendMessage(
            formateurId,
            activeApprenantId,
            messageContent
          );

          console.log("Message sent successfully:", response);

          // Ajouter l'ID du message envoyé au Set des messages envoyés par le formateur
          if (response.data && response.data.id) {
            setSentMessageIds((prev) => {
              const newSet = new Set(prev);
              newSet.add(response.data.id);
              return newSet;
            });

            // Remplacer le message optimiste par le message réel
            setMessages((prev) => {
              const updatedMessages = prev[activeApprenantId].map((msg) =>
                msg.id === tempId
                  ? {
                      id: response.data.id,
                      sender: "Moi",
                      content: messageContent,
                      time: formatTime(response.data.date || new Date()),
                      isMe: true,
                      isFile: messageContent.includes("Pièce jointe:"),
                      lu: true,
                      isPending: false,
                    }
                  : msg
              );

              return {
                ...prev,
                [activeApprenantId]: updatedMessages,
              };
            });
          }
        } catch (err) {
          console.error("Error sending message:", err);

          // Marquer le message optimiste comme ayant échoué
          setMessages((prev) => {
            const updatedMessages = prev[activeApprenantId].map((msg) =>
              msg.isPending
                ? { ...msg, isPending: false, hasFailed: true }
                : msg
            );

            return {
              ...prev,
              [activeApprenantId]: updatedMessages,
            };
          });

          // Afficher l'erreur
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
    [newMessage, activeApprenantId, formateurId, selectedFile, allConversations]
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
  if ((loading && !activeApprenantId) || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8 animate-slideInLeft">
          <button
            onClick={() => navigate("/formateur")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-3 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:text-white flex items-center">
              <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
              Messagerie
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Communiquez avec les apprenants
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
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
    const isIdMissingError = error.includes("ID du formateur non trouvé");

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8 animate-slideInLeft">
          <button
            onClick={() => navigate("/formateur")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-3 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:text-white flex items-center">
              <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
              Messagerie
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Communiquez avec les apprenants
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-red-600 dark:text-red-400" />
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

  // Nous n'utilisons plus de page "Aucune conversation" séparée
  // Nous allons plutôt afficher l'interface Messenger complète même sans conversations

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-4 animate-slideInLeft">
        <button
          onClick={() => navigate("/formateur")}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-3 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:text-white flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
            Messagerie
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Communiquez avec les apprenants
          </p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-150px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-slate-700 animate-fadeIn">
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

          {/* Online apprenants */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-800">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {onlineApprenants.map((apprenant) => (
                <div
                  key={apprenant.id}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => {
                    setActiveApprenantId(apprenant.id);
                    fetchMessages(formateurId, apprenant.id);
                  }}
                >
                  <div className="relative">
                    <img
                      src={apprenant.avatar}
                      alt={apprenant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  </div>
                  <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">
                    {apprenant.name.split(" ")[0]}
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
                  activeApprenantId === conv.id
                    ? "bg-blue-50 dark:bg-slate-700"
                    : ""
                }`}
                onClick={() => {
                  setActiveApprenantId(conv.id);
                  fetchMessages(formateurId, conv.id);
                }}
              >
                <div className="relative mr-3">
                  <div className="relative">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${onlineApprenants.some((a) => a.id === conv.id) ? "bg-green-500" : "bg-gray-300"} rounded-full border-2 border-white dark:border-slate-700`}
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
          </div>
        </div>

        {/* Main chat area - Style Messenger */}
        <div className="flex-1 flex flex-col">
          {/* Chat header - Style Messenger */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex items-center">
              <div className="relative mr-3">
                <img
                  src={
                    allConversations.find((c) => c.id === activeApprenantId)
                      ?.avatar || ""
                  }
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 ${
                    onlineApprenants.some((a) => a.id === activeApprenantId)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  } rounded-full border-2 border-white dark:border-slate-800`}
                ></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  {allConversations.find((c) => c.id === activeApprenantId)
                    ?.name || ""}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {onlineApprenants.some((a) => a.id === activeApprenantId)
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
            {activeApprenantId && messages[activeApprenantId]?.length > 0 ? (
              messages[activeApprenantId].map((msg, index) => {
                // Vérifier si le message précédent est du même expéditeur
                const prevMsg =
                  index > 0 ? messages[activeApprenantId][index - 1] : null;
                const isSameUser = prevMsg && prevMsg.isMe === msg.isMe;
                const showAvatar = !msg.isMe && (!isSameUser || index === 0);

                // Ajouter un log pour voir la valeur de isMe pour chaque message
                console.log(
                  `Message ID ${msg.id} - isMe: ${msg.isMe} - Content: ${msg.content.substring(0, 20)}...`
                );

                // Utiliser directement la propriété isMe du message
                // Cette propriété est définie lors du formatage des messages dans fetchMessages
                // Nous nous assurons que c'est un booléen pour éviter des problèmes de rendu
                const isFromFormateur = Boolean(msg.isMe);

                return (
                  <div
                    key={msg.id}
                    className={`flex max-w-[80%] w-full ${isSameUser ? "mt-1" : "mt-4"} ${
                      isFromFormateur
                        ? "ml-auto justify-end self-end flex-row-reverse" /* 📌 Message aligné à droite (envoyeur) */
                        : "mr-auto justify-start self-start" /* 📌 Message aligné à gauche (receveur) */
                    }`}
                  >
                    {/* Avatar pour les messages reçus uniquement */}
                    {showAvatar ? (
                      // Vérifier si l'avatar existe, sinon afficher un avatar par défaut
                      <div className="w-8 h-8 rounded-full mx-2 self-end flex-shrink-0 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                        {allConversations.find(
                          (c) => c.id === activeApprenantId
                        )?.avatar ? (
                          <img
                            src={
                              allConversations.find(
                                (c) => c.id === activeApprenantId
                              )?.avatar
                            }
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              // En cas d'erreur de chargement de l'image, afficher les initiales
                              e.target.style.display = "none";
                              e.target.parentNode.innerHTML =
                                allConversations
                                  .find((c) => c.id === activeApprenantId)
                                  ?.name?.charAt(0) || "A";
                            }}
                          />
                        ) : (
                          // Afficher les initiales si pas d'avatar
                          <span>
                            {allConversations
                              .find((c) => c.id === activeApprenantId)
                              ?.name?.charAt(0) || "A"}
                          </span>
                        )}
                      </div>
                    ) : (
                      !msg.isMe && (
                        <div className="w-8 mx-2 flex-shrink-0"></div>
                      )
                    )}

                    {/* Bulle de message avec indicateurs d'état */}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 shadow-sm ${
                        isFromFormateur
                          ? `bg-blue-500 text-white rounded-2xl rounded-tr-sm ml-auto self-end text-right ${
                              msg.isPending ? "opacity-70" : ""
                            } ${msg.hasFailed ? "bg-red-500" : ""}`
                          : "bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-2xl rounded-tl-sm mr-auto self-start text-left"
                      }`}
                    >
                      {/* Contenu du message */}
                      {msg.isFile ? (
                        <div className="flex items-center">
                          <Paperclip size={16} className="mr-2 flex-shrink-0" />
                          <span
                            className={
                              isFromFormateur ? "text-right" : "text-left"
                            }
                          >
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        <p
                          className={`text-sm ${isFromFormateur ? "text-right" : "text-left"}`}
                        >
                          {msg.content}
                        </p>
                      )}

                      {/* Horodatage et indicateurs d'état */}
                      <div
                        className={`flex items-center mt-1 text-xs opacity-70 ${
                          isFromFormateur ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Indicateur d'état pour les messages envoyés */}
                        {isFromFormateur && (
                          <>
                            {msg.isPending && (
                              <span className="mr-1 flex items-center">
                                <svg
                                  className="animate-spin h-3 w-3 mr-1"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Envoi...
                              </span>
                            )}
                            {msg.hasFailed && (
                              <span className="mr-1 flex items-center text-red-200">
                                <svg
                                  className="h-3 w-3 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Échec
                              </span>
                            )}
                            {!msg.isPending && !msg.hasFailed && (
                              <span className="mr-1">
                                <svg
                                  className="h-3 w-3 inline"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </span>
                            )}
                          </>
                        )}

                        {/* Horodatage */}
                        <span>{msg.time}</span>
                      </div>
                    </div>

                    {/* Espace réservé pour l'avatar côté droit (messages envoyés) */}
                    {isFromFormateur && (
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
                    {activeApprenantId
                      ? "Aucun message"
                      : "Bienvenue sur Messenger"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {activeApprenantId
                      ? "Commencez la conversation en envoyant un message."
                      : "Sélectionnez un apprenant dans la liste ou recherchez un apprenant pour commencer une conversation."}
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input - Style Messenger */}
          {activeApprenantId ? (
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
                    <span className="text-sm truncate">
                      {selectedFile.name}
                    </span>
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
    </div>
  );
};

export default Messagerie;
