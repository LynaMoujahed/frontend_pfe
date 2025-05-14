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
import messagerieService from "../services/messagerieService";
import { useAuth } from "../contexts/auth-context";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ApprenantMessagerie = () => {
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

  // Utiliser directement l'ID de l'utilisateur connecté
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

  // Set pour stocker les IDs des messages envoyés par l'apprenant
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

        // Vérification plus robuste de l'ID de l'apprenant
        if (!apprenantId) {
          console.log("Authentication complete but no apprenantId found");
          setError("ID de l'apprenant non trouvé. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }

        setLoading(true);
        console.log("Fetching data for apprenant ID:", apprenantId);

        // Fetch formateurs
        const formateurResponse = await messagerieService.getFormateursForApprenant(apprenantId);

        if (!formateurResponse.formateurs || !Array.isArray(formateurResponse.formateurs)) {
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
          const conversationsResponse = await messagerieService.getApprenantConversations(apprenantId);

          if (!conversationsResponse.conversations || !Array.isArray(conversationsResponse.conversations)) {
            console.error("Invalid conversations response:", conversationsResponse);
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
                type: "text",
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

    // Polling optimisé pour les nouveaux messages
    const interval = setInterval(() => {
      if (apprenantId && activeFormateurId) {
        // Vérifier s'il y a de nouveaux messages sans recharger toute la conversation
        checkNewMessages(activeFormateurId, apprenantId);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [apprenantId, activeFormateurId, authLoading, currentUser]);

  // Vérifier s'il y a de nouveaux messages sans recharger toute la conversation
  const checkNewMessages = async (formateurId, apprenantId) => {
    try {
      // Obtenir l'ID du dernier message dans la conversation actuelle
      const currentMessages = messages[formateurId] || [];
      const lastMessageId = currentMessages.length > 0
        ? Math.max(...currentMessages.map(msg => msg.id))
        : 0;

      // Appeler une version optimisée du service qui vérifie seulement les nouveaux messages
      const response = await messagerieService.getConversation(
        formateurId,
        apprenantId
      );

      if (response.messages && Array.isArray(response.messages)) {
        // Filtrer pour ne garder que les nouveaux messages
        const newMessages = response.messages.filter(msg => msg.id > lastMessageId);

        if (newMessages.length > 0) {
          console.log(`${newMessages.length} nouveaux messages trouvés`);
          // Mettre à jour la conversation avec les nouveaux messages
          fetchMessages(formateurId, apprenantId, false);

          // Mettre à jour la liste des conversations pour refléter le dernier message
          updateConversationsList(apprenantId);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des nouveaux messages:", error);
    }
  };

  // Mettre à jour la liste des conversations
  const updateConversationsList = async (apprenantId) => {
    try {
      const conversationsResponse = await messagerieService.getApprenantConversations(apprenantId);

      if (conversationsResponse.conversations && Array.isArray(conversationsResponse.conversations)) {
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
            type: "text",
          })
        );
        setAllConversations(conversations);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la liste des conversations:", error);
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
          [formateurId]: [],
        }));

        if (setActive) {
          setActiveConversation(formateurId);
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
          isFromFormateur = !sentMessageIds.has(msg.id);
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
          sender: isFromFormateur ? getFormateurName(formateurId) : "Moi",
          content: msg.message,
          time: formatTime(msg.date),
          isMe: !isFromFormateur, // Pour l'apprenant, isMe est l'inverse de isFromFormateur
          isFile: msg.message && msg.message.includes("Pièce jointe:"),
          lu: msg.lu,
        };

  // Send message avec optimistic UI update
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

          if (!apprenantId || !activeFormateurId) {
            console.error("Missing apprenantId or activeFormateurId", {
              apprenantId,
              activeFormateurId,
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
            isPending: true // Indicateur que le message est en cours d'envoi
          };

          // Ajouter le message optimiste à la conversation
          setMessages(prev => ({
            ...prev,
            [activeFormateurId]: [...(prev[activeFormateurId] || []), optimisticMessage]
          }));

          // Mettre à jour la liste des conversations
          setAllConversations(prev =>
            prev.map(conv =>
              conv.id === activeFormateurId
                ? {
                    ...conv,
                    lastMessage: messageContent,
                    time: "À l'instant",
                    type: selectedFile ? "file" : "text"
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
          const response = await messagerieService.apprenantSendMessage(
            apprenantId,
            activeFormateurId,
            messageContent
          );

          console.log("Message sent successfully:", response);

          // Ajouter l'ID du message envoyé au Set des messages envoyés par l'apprenant
          if (response.data && response.data.id) {
            setSentMessageIds(prev => {
              const newSet = new Set(prev);
              newSet.add(response.data.id);
              return newSet;
            });

            // Remplacer le message optimiste par le message réel
            setMessages(prev => {
              const updatedMessages = prev[activeFormateurId].map(msg =>
                msg.id === tempId
                  ? {
                      id: response.data.id,
                      sender: "Moi",
                      content: messageContent,
                      time: formatTime(response.data.date || new Date()),
                      isMe: true,
                      isFile: messageContent.includes("Pièce jointe:"),
                      lu: true,
                      isPending: false
                    }
                  : msg
              );

              return {
                ...prev,
                [activeFormateurId]: updatedMessages
              };
            });
          }
        } catch (err) {
          console.error("Error sending message:", err);

          // Marquer le message optimiste comme ayant échoué
          setMessages(prev => {
            const updatedMessages = prev[activeFormateurId].map(msg =>
              msg.isPending
                ? { ...msg, isPending: false, hasFailed: true }
                : msg
            );

            return {
              ...prev,
              [activeFormateurId]: updatedMessages
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
    [newMessage, activeFormateurId, apprenantId, selectedFile, allConversations]
  );

  // Helper functions
  const formatTime = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        // Today, show time
        return format(date, "HH:mm", { locale: fr });
      } else if (diffInDays === 1) {
        // Yesterday
        return "Hier";
      } else if (diffInDays < 7) {
        // This week, show day name
        return format(date, "EEEE", { locale: fr });
      } else {
        // Older, show date
        return format(date, "dd/MM/yyyy", { locale: fr });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const getFormateurName = (formateurId) => {
    const formateur = allConversations.find((f) => f.id === formateurId);
    return formateur ? formateur.name : "Formateur";
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Filter conversations based on search term
  const filteredConversations = allConversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render component
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900">
      {/* Sidebar */}
      <div
        className={`w-full md:w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleBackClick}
              className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Messagerie
            </h2>
          </div>
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-400"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageSquare size={48} className="text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune conversation trouvée
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 ${
                  activeFormateurId === conv.id
                    ? "bg-blue-50 dark:bg-slate-700"
                    : ""
                }`}
                onClick={() => {
                  setActiveFormateurId(conv.id);
                  fetchMessages(conv.id, apprenantId);
                }}
              >
                <div className="relative">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                      true ? "bg-green-500" : "bg-gray-300"
                    } border-2 border-white dark:border-slate-800`}
                  ></span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {conv.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conv.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-sm ${
                        conv.unread
                          ? "text-gray-800 dark:text-white font-semibold"
                          : "text-gray-500 dark:text-gray-400"
                      } truncate max-w-[150px]`}
                    >
                      {conv.type === "file" ? (
                        <span className="flex items-center">
                          <Paperclip
                            size={14}
                            className="mr-1 flex-shrink-0"
                          />
                          {conv.lastMessage}
                        </span>
                      ) : (
                        conv.lastMessage
                      )}
                    </p>
                    {conv.unread > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-col flex-1 bg-gray-50 dark:bg-slate-900">
        {activeFormateurId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div className="flex items-center">
                <img
                  src={
                    allConversations.find((c) => c.id === activeFormateurId)
                      ?.avatar || "https://i.pravatar.cc/150?img=60"
                  }
                  alt="Contact"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {
                      allConversations.find((c) => c.id === activeFormateurId)
                        ?.name
                    }
                  </h3>
                  <p className="text-xs text-green-500">En ligne</p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : messages[activeFormateurId]?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare
                    size={48}
                    className="text-gray-400 dark:text-gray-600 mb-2"
                  />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun message. Commencez la conversation !
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages[activeFormateurId]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Bulle de message avec indicateurs d'état */}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 shadow-sm ${
                          msg.isMe
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
                                msg.isMe ? "text-right" : "text-left"
                              }
                            >
                              {msg.content}
                            </span>
                          </div>
                        ) : (
                          <p
                            className={`text-sm ${msg.isMe ? "text-right" : "text-left"}`}
                          >
                            {msg.content}
                          </p>
                        )}

                        {/* Horodatage et indicateurs d'état */}
                        <div className={`flex items-center mt-1 text-xs opacity-70 ${
                          msg.isMe ? "justify-end" : "justify-start"
                        }`}>
                          {/* Indicateur d'état pour les messages envoyés */}
                          {msg.isMe && (
                            <>
                              {msg.isPending && (
                                <span className="mr-1 flex items-center">
                                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Envoi...
                                </span>
                              )}
                              {msg.hasFailed && (
                                <span className="mr-1 flex items-center text-red-200">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Échec
                                </span>
                              )}
                              {!msg.isPending && !msg.hasFailed && (
                                <span className="mr-1">
                                  <svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}

                          {/* Horodatage */}
                          <span>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {selectedFile && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Paperclip size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={removeSelectedFile}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <form
                onSubmit={sendMessage}
                className="flex items-center space-x-2"
              >
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={20} />
                </button>
                <div className="relative flex-1">
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-10">
                      <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Tapez votre message..."
                    className="w-full py-2 px-4 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={20} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                  disabled={!newMessage.trim() && !selectedFile}
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare
              size={64}
              className="text-gray-300 dark:text-gray-700 mb-4"
            />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprenantMessagerie;
