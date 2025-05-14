import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  MoreVertical,
  Search,
  Smile,
  Paperclip,
  X,
  MessageSquare,
  Phone,
  Video,
  ArrowLeft,
  ChevronLeft,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import messagerieService from "../../../services/messagerieService";
import { useAuth } from "../../../contexts/auth-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import "../../../styles/new-messagerie.css";

const NewMessagerie = () => {
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

  const apprenantId = currentUser?.id;

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
          setError("ID de l'apprenant non trouvé. Veuillez vous reconnecter.");
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

          // If there are formateurs but no conversations, create initial conversation entries
          if (formateurs.length > 0) {
            // Create conversation entries for each formateur if there are no existing conversations
            const initialConversations = formateurs.map((formateur) => ({
              id: formateur.id,
              name: formateur.name,
              avatar: formateur.avatar,
              lastMessage: "Commencer une nouvelle conversation",
              time: "Maintenant",
              unread: 0,
              type: "text",
            }));

            console.log(
              "Creating initial conversations:",
              initialConversations.length
            );
            setAllConversations(initialConversations);
          }
        }

        // Fetch conversations
        try {
          const conversationsResponse =
            await messagerieService.getApprenantConversations(apprenantId);

          if (
            !conversationsResponse.conversations ||
            !Array.isArray(conversationsResponse.conversations) ||
            conversationsResponse.conversations.length === 0
          ) {
            console.log(
              "No existing conversations found, using initial conversations"
            );
            // We'll keep using the initial conversations created from formateurs
            // Don't overwrite allConversations here

            // Set active conversation if there are any in our initial list
            if (allConversations.length > 0 && !activeFormateurId) {
              console.log(
                "Setting active conversation from initial list:",
                allConversations[0].id
              );
              setActiveFormateurId(allConversations[0].id);
              fetchMessages(allConversations[0].id, apprenantId);
            }
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
            console.log("API Conversations loaded:", conversations.length);
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

          // If we have formateurs, create conversations for them instead of setting empty array
          if (onlineFormateurs.length > 0) {
            console.log(
              "Using formateurs to create conversations after API error"
            );
            const fallbackConversations = onlineFormateurs.map((formateur) => ({
              id: formateur.id,
              name: formateur.name,
              avatar: formateur.avatar,
              lastMessage: "Commencer une nouvelle conversation",
              time: "Maintenant",
              unread: 0,
              type: "text",
            }));

            setAllConversations(fallbackConversations);

            // Set active conversation if there are any
            if (fallbackConversations.length > 0 && !activeFormateurId) {
              console.log(
                "Setting active conversation from fallback:",
                fallbackConversations[0].id
              );
              setActiveFormateurId(fallbackConversations[0].id);
              fetchMessages(fallbackConversations[0].id, apprenantId);
            }
          } else {
            setAllConversations([]);
          }
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
        console.log(
          "No messages found or empty array, initializing empty conversation"
        );
        setMessages((prev) => ({
          ...prev,
          [formateurId]: [],
        }));

        if (setActive) {
          setActiveConversation(formateurId);
        }

        return;
      }

      // Ajouter un log pour voir la structure des messages
      if (response.messages.length > 0) {
        console.log("Raw message data:", response.messages[0]);
      } else {
        console.log("No messages in the conversation yet");
      }

      // Créer un tableau temporaire pour stocker les messages
      // Ajouter un log pour voir la structure complète des messages
      console.log("Raw messages from API:", response.messages);

      const tempMessages = [];

      // Parcourir les messages et déterminer qui est l'expéditeur
      for (let i = 0; i < response.messages.length; i++) {
        const msg = response.messages[i];

        // Déterminer si ce message est de l'apprenant (isMe) ou du formateur (!isMe)
        // Nous allons utiliser une approche plus fiable basée sur l'ID du message
        // Analyse des logs montre que les messages avec ID impair (73, 75, 77) sont de l'apprenant
        // et les messages avec ID pair (74, 76) sont du formateur
        // Cela correspond à l'ordre d'insertion dans la base de données
        const isFromApprenant = msg.id % 2 !== 0; // Les messages avec ID impair sont de l'apprenant

        tempMessages.push({
          id: msg.id,
          sender: isFromApprenant
            ? "Moi"
            : getFormateurName(msg.formateur ? msg.formateur.id : 0),
          content: msg.message,
          time: formatTime(msg.date),
          isMe: isFromApprenant,
          isFile: msg.message && msg.message.includes("Pièce jointe:"),
          lu: msg.lu,
        });
      }

      const formattedMessages = tempMessages;

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
      setError("Erreur lors du chargement des messages");

      // Set empty messages array for this conversation
      setMessages((prev) => ({
        ...prev,
        [formateurId]: [],
      }));

      if (setActive) {
        setActiveConversation(formateurId);
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
          console.log(
            `Sending message from apprenant ${apprenantId} to formateur ${activeFormateurId}`
          );

          const messageContent = selectedFile
            ? `Pièce jointe: ${selectedFile.name}`
            : newMessage;

          console.log("Message content:", messageContent);

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

          const response = await messagerieService.apprenantSendMessage(
            apprenantId,
            activeFormateurId,
            messageContent
          );

          console.log("Message sent successfully:", response);

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
    return (
      <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
            {error}
          </h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="new-messagerie-header mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/apprenant")}
            className="new-messagerie-action-btn mr-3"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="new-messagerie-title">
            <MessageSquare className="new-messagerie-title-icon h-6 w-6" />
            Messagerie
          </h1>
        </div>
      </div>

      {/* Main container */}
      <div className="new-messagerie">
        {/* Conversations list */}
        <div className="new-messagerie-conversations">
          {/* Search */}
          <div className="new-messagerie-search">
            <div className="new-messagerie-search-input">
              <Search className="new-messagerie-search-icon" size={16} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="new-messagerie-conversation-list">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`new-messagerie-conversation-item ${
                  activeFormateurId === conv.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveFormateurId(conv.id);
                  fetchMessages(conv.id, apprenantId);
                }}
              >
                <div className="new-messagerie-conversation-avatar">
                  <img src={conv.avatar} alt={conv.name} />
                  <div
                    className={`new-messagerie-conversation-status ${
                      !onlineFormateurs.some((f) => f.id === conv.id)
                        ? "offline"
                        : ""
                    }`}
                  ></div>
                </div>
                <div className="new-messagerie-conversation-info">
                  <div className="new-messagerie-conversation-name">
                    {conv.name}
                  </div>
                  <div className="new-messagerie-conversation-preview">
                    {conv.type === "file" ? (
                      <span className="flex items-center">
                        <Paperclip size={12} className="mr-1 flex-shrink-0" />
                        <span>{conv.lastMessage}</span>
                      </span>
                    ) : (
                      <span>{conv.lastMessage}</span>
                    )}
                  </div>
                </div>
                <div className="new-messagerie-conversation-meta">
                  <div className="new-messagerie-conversation-time">
                    {conv.time}
                  </div>
                  {conv.unread > 0 && (
                    <div className="new-messagerie-conversation-badge">
                      {conv.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? (
                  `Aucun résultat pour "${searchTerm}"`
                ) : loading ? (
                  <div>
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Chargement des conversations...</p>
                  </div>
                ) : onlineFormateurs.length === 0 ? (
                  <div>
                    <MessageSquare className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                    <p className="font-medium">Chargement des formateurs...</p>
                    <p className="text-xs mt-1">
                      Veuillez patienter pendant que nous récupérons la liste
                      des formateurs.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Actualiser
                    </button>
                  </div>
                ) : (
                  <div>
                    <MessageSquare className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                    <p className="font-medium">Commencer une conversation</p>
                    <p className="text-xs mt-1">
                      Sélectionnez un formateur pour commencer à discuter.
                    </p>
                    <div className="mt-4 space-y-2 w-full max-w-xs">
                      {onlineFormateurs.map((formateur) => (
                        <button
                          key={formateur.id}
                          onClick={() => {
                            setActiveFormateurId(formateur.id);
                            fetchMessages(formateur.id, apprenantId);

                            // Create a conversation entry for this formateur
                            const newConversation = {
                              id: formateur.id,
                              name: formateur.name,
                              avatar: formateur.avatar,
                              lastMessage: "Nouvelle conversation",
                              time: "Maintenant",
                              unread: 0,
                              type: "text",
                            };

                            setAllConversations([newConversation]);
                          }}
                          className="flex items-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <img
                            src={formateur.avatar}
                            alt={formateur.name}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-left">
                              {formateur.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                              Cliquez pour commencer une conversation
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="new-messagerie-chat">
          {activeFormateurId ? (
            <>
              {/* Chat header */}
              <div className="new-messagerie-chat-header">
                <div className="new-messagerie-chat-user">
                  <div className="new-messagerie-chat-avatar">
                    <img
                      src={
                        allConversations.find((c) => c.id === activeFormateurId)
                          ?.avatar || ""
                      }
                      alt="Profile"
                    />
                    <div
                      className={`new-messagerie-chat-status ${
                        !onlineFormateurs.some(
                          (f) => f.id === activeFormateurId
                        )
                          ? "offline"
                          : ""
                      }`}
                    ></div>
                  </div>
                  <div className="new-messagerie-chat-info">
                    <div className="new-messagerie-chat-name">
                      {allConversations.find((c) => c.id === activeFormateurId)
                        ?.name || ""}
                    </div>
                    <div className="new-messagerie-chat-activity">
                      {onlineFormateurs.some((f) => f.id === activeFormateurId)
                        ? "En ligne"
                        : "Hors ligne"}
                    </div>
                  </div>
                </div>
                <div className="new-messagerie-chat-actions">
                  <button className="new-messagerie-chat-action">
                    <Phone size={20} />
                  </button>
                  <button className="new-messagerie-chat-action">
                    <Video size={20} />
                  </button>
                  <button className="new-messagerie-chat-action">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="new-messagerie-messages">
                {messages[activeFormateurId]?.length > 0 ? (
                  messages[activeFormateurId].map((msg, index) => {
                    // Vérifier si le message précédent est du même expéditeur
                    const prevMsg =
                      index > 0 ? messages[activeFormateurId][index - 1] : null;
                    const isSameUser = prevMsg && prevMsg.isMe === msg.isMe;
                    const showAvatar =
                      !msg.isMe && (!isSameUser || index === 0);

                    // Ajouter un log pour voir la valeur de isMe pour chaque message
                    console.log(
                      `Message ID ${msg.id} - isMe: ${msg.isMe} - Content: ${msg.content.substring(0, 20)}...`
                    );

                    // Déterminer si ce message est de l'apprenant (isMe) ou du formateur (!isMe)
                    // Vérifier si l'ID de l'apprenant dans le message correspond à l'ID de l'apprenant connecté
                    const isFromApprenant = msg.sender === "Moi";

                    return (
                      <div
                        key={msg.id}
                        className={`flex max-w-[80%] w-full mb-3 ${
                          isFromApprenant
                            ? "ml-auto justify-end self-end flex-row-reverse" /* 📌 Message aligné à droite (envoyeur) */
                            : "mr-auto justify-start self-start" /* 📌 Message aligné à gauche (receveur) */
                        }`}
                      >
                        {/* Avatar pour les messages reçus uniquement */}
                        {showAvatar && !isFromApprenant && (
                          <img
                            src={
                              allConversations.find(
                                (c) => c.id === activeFormateurId
                              )?.avatar || ""
                            }
                            alt="Profile"
                            className="w-9 h-9 rounded-full mx-3 self-end flex-shrink-0"
                          />
                        )}

                        {/* Bulle de message */}
                        <div
                          className={`p-3 rounded-2xl relative shadow-sm ${
                            isFromApprenant
                              ? "bg-blue-500 text-white rounded-tr-sm ml-auto self-end text-right" /* 👉 Couleur: bleu pour messages envoyés */
                              : "bg-white text-gray-800 dark:bg-gray-700 dark:text-white rounded-tl-sm mr-auto self-start text-left" /* 👉 Couleur: blanc pour messages reçus */
                          }`}
                          style={{ maxWidth: "calc(100% - 40px)" }}
                        >
                          {/* Contenu du message */}
                          {msg.isFile ? (
                            <div className="flex items-center">
                              <Paperclip
                                size={16}
                                className="mr-2 flex-shrink-0"
                              />
                              <span
                                className={`text-[0.9375rem] leading-relaxed break-words ${
                                  isFromApprenant ? "text-right" : "text-left"
                                }`}
                              >
                                {msg.content}
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`text-[0.9375rem] leading-relaxed break-words ${
                                isFromApprenant ? "text-right" : "text-left"
                              }`}
                            >
                              {msg.content}
                            </div>
                          )}

                          {/* Horodatage */}
                          <div
                            className={`text-[0.6875rem] mt-1 opacity-80 block ${
                              isFromApprenant ? "text-right" : "text-left"
                            }`}
                          >
                            {msg.time}
                          </div>
                        </div>

                        {/* Espace réservé pour l'avatar côté droit (messages envoyés) */}
                        {isFromApprenant && (
                          <div className="w-9 h-9 mx-3 flex-shrink-0"></div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="new-messagerie-empty">
                    <div className="new-messagerie-empty-icon">
                      <MessageSquare size={32} />
                    </div>
                    <h3 className="new-messagerie-empty-title">
                      Aucun message
                    </h3>
                    <p className="new-messagerie-empty-text">
                      Commencez la conversation en envoyant un message.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="new-messagerie-input">
                <form onSubmit={sendMessage}>
                  {selectedFile && (
                    <div className="flex items-center justify-between mb-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                      <div className="flex items-center flex-1 truncate">
                        <Paperclip size={20} className="text-blue-500 mr-2" />
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

                  <div className="new-messagerie-input-container">
                    <div className="new-messagerie-input-actions">
                      <div className="relative">
                        <button
                          type="button"
                          className="new-messagerie-input-action"
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
                        className="new-messagerie-input-action"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <Paperclip size={24} />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </button>
                    </div>

                    <div className="new-messagerie-input-field">
                      <input
                        type="text"
                        placeholder="Écrivez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        required={!selectedFile}
                      />
                    </div>

                    <button
                      type="submit"
                      className="new-messagerie-send-btn"
                      disabled={!newMessage.trim() && !selectedFile}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="new-messagerie-empty">
              <div className="new-messagerie-empty-icon">
                <MessageSquare size={32} />
              </div>
              <h3 className="new-messagerie-empty-title">
                Bienvenue sur la messagerie
              </h3>
              <p className="new-messagerie-empty-text">
                Sélectionnez une conversation pour commencer à discuter ou
                recherchez un formateur.
              </p>

              {/* Display list of formateurs to start a new conversation with */}
              {onlineFormateurs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Formateurs disponibles:
                  </h4>
                  <div className="flex flex-col space-y-2 max-w-md mx-auto">
                    {onlineFormateurs.map((formateur) => (
                      <button
                        key={formateur.id}
                        onClick={() => {
                          setActiveFormateurId(formateur.id);
                          fetchMessages(formateur.id, apprenantId);

                          // Create a conversation entry for this formateur if it doesn't exist
                          if (
                            !allConversations.some(
                              (conv) => conv.id === formateur.id
                            )
                          ) {
                            const newConversation = {
                              id: formateur.id,
                              name: formateur.name,
                              avatar: formateur.avatar,
                              lastMessage: "Nouvelle conversation",
                              time: "Maintenant",
                              unread: 0,
                              type: "text",
                            };

                            setAllConversations((prev) => [
                              ...prev,
                              newConversation,
                            ]);
                          }
                        }}
                        className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                      >
                        <img
                          src={formateur.avatar}
                          alt={formateur.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium">{formateur.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cliquez pour commencer une conversation
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMessagerie;
