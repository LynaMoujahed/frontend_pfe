import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  X,
  Minimize,
  Maximize,
  Trash2,
  RefreshCw,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../../contexts/auth-context";
import chatbotService from "../../../services/chatbotService";
import { toast } from "react-toastify";

/**
 * Widget flottant de chatbot AI pour l'interface apprenant
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.userData - Les données de l'utilisateur connecté (optionnel)
 */
const ChatbotWidget = ({ userData }) => {
  const { user, login } = useAuth();

  // Utiliser les données utilisateur du prop si disponibles, sinon utiliser celles du contexte
  const currentUser = userData || user;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [authError, setAuthError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Stocker les données utilisateur dans localStorage si elles ne sont pas déjà présentes
  useEffect(() => {
    if (currentUser) {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        console.log(
          "🔄 [ChatbotWidget] Stockage des données utilisateur dans localStorage:",
          currentUser
        );
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    }
  }, [currentUser]);

  // Charger l'historique de conversation au démarrage
  useEffect(() => {
    const loadHistory = async () => {
      if (currentUser?.id) {
        try {
          const conversations = await chatbotService.getHistory();

          // Si l'historique existe, reconstruire les messages pour l'affichage
          if (conversations.length > 0) {
            const displayMessages = [];

            // Parcourir les conversations et extraire les messages
            conversations.forEach((conv) => {
              displayMessages.push({
                id: `user-${conv.id}`,
                sender: "user",
                content: conv.userMessage.content,
                time: new Date(conv.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });

              displayMessages.push({
                id: `bot-${conv.id}`,
                sender: "bot",
                content: conv.aiResponse.content,
                time: new Date(conv.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });
            });

            // Trier les messages par date
            displayMessages.sort(
              (a, b) => a.id.split("-")[1] - b.id.split("-")[1]
            );

            setMessages(displayMessages);
          } else {
            // Message d'accueil par défaut
            setMessages([
              {
                id: 1,
                sender: "bot",
                content:
                  "Bonjour ! Je suis l'assistant PharmaLearn. Comment puis-je vous aider dans votre formation pharmaceutique aujourd'hui ?",
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'historique:", error);
          // Message d'accueil par défaut en cas d'erreur
          setMessages([
            {
              id: 1,
              sender: "bot",
              content:
                "Bonjour ! Je suis l'assistant PharmaLearn. Comment puis-je vous aider dans votre formation pharmaceutique aujourd'hui ?",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
      }
    };

    loadHistory();
  }, [currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Focus sur l'input quand le chat est ouvert
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    console.log("🚀 [ChatbotWidget] Envoi d'un nouveau message:", newMessage);

    // Réinitialiser l'état d'erreur d'authentification
    setAuthError(false);

    const userMessage = {
      id: Date.now(),
      sender: "user",
      content: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Ajouter le message de l'utilisateur à l'affichage
    setMessages((prev) => [...prev, userMessage]);
    console.log("✅ [ChatbotWidget] Message utilisateur ajouté à l'affichage");

    // Réinitialiser l'input et afficher l'indicateur de chargement
    setNewMessage("");
    setIsLoading(true);
    console.log("🔄 [ChatbotWidget] Indicateur de chargement activé");

    try {
      // Vérifier si les données utilisateur sont disponibles
      if (currentUser) {
        console.log(
          "🔍 [ChatbotWidget] Données utilisateur disponibles:",
          currentUser
        );
        console.log("🔍 [ChatbotWidget] ID utilisateur:", currentUser.id);

        // S'assurer que les données utilisateur sont dans localStorage
        localStorage.setItem("user", JSON.stringify(currentUser));
      } else {
        // Récupérer les informations utilisateur du localStorage pour le débogage
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log(
              "🔍 [ChatbotWidget] Données utilisateur du localStorage:",
              userData
            );
            console.log(
              "🔍 [ChatbotWidget] ID utilisateur du localStorage:",
              userData.id
            );
          } catch (e) {
            console.error(
              "❌ [ChatbotWidget] Erreur lors de la récupération des données utilisateur:",
              e
            );
          }
        } else {
          console.warn(
            "⚠️ [ChatbotWidget] Aucune donnée utilisateur trouvée dans le contexte ou localStorage"
          );
        }
      }

      // Ajouter l'ID utilisateur à l'URL si disponible pour faciliter la récupération en cas de perte de session
      if (currentUser?.id && !window.location.search.includes("userId")) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("userId", currentUser.id);
          window.history.replaceState({}, "", url);
          console.log(
            "✅ [ChatbotWidget] ID utilisateur ajouté à l'URL:",
            currentUser.id
          );
        } catch (e) {
          console.error(
            "❌ [ChatbotWidget] Erreur lors de l'ajout de l'ID à l'URL:",
            e
          );
        }
      }

      // Envoyer le message au service de chatbot avec l'ID utilisateur si disponible
      console.log("🔄 [ChatbotWidget] Appel du service chatbot...");
      // Passer l'ID utilisateur directement au service
      const userId = currentUser?.id;
      console.log("🔍 [ChatbotWidget] ID utilisateur pour l'envoi:", userId);
      const response = await chatbotService.sendMessage(newMessage);
      console.log(
        "✅ [ChatbotWidget] Réponse reçue du service chatbot:",
        response
      );

      // Vérifier si la réponse indique une erreur d'authentification
      if (response.authError) {
        console.log(
          "⚠️ [ChatbotWidget] Erreur d'authentification détectée dans la réponse"
        );
        setAuthError(true);
      }

      // Créer le message de réponse du bot
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        content: response.content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: response.isError,
        authError: response.authError,
      };
      console.log("📝 [ChatbotWidget] Message bot créé:", botMessage);

      // Ajouter la réponse du bot à l'affichage
      setMessages((prev) => [...prev, botMessage]);
      console.log("✅ [ChatbotWidget] Message bot ajouté à l'affichage");
    } catch (error) {
      console.error(
        "❌ [ChatbotWidget] Erreur lors de l'envoi du message:",
        error
      );

      // Afficher plus de détails sur l'erreur
      if (error.response) {
        console.error(
          "🔍 [ChatbotWidget] Données d'erreur:",
          error.response.data
        );
        console.error("🔍 [ChatbotWidget] Statut:", error.response.status);
      } else if (error.request) {
        console.error(
          "🔍 [ChatbotWidget] Requête sans réponse:",
          error.request
        );
      } else {
        console.error("🔍 [ChatbotWidget] Message d'erreur:", error.message);
      }

      // Vérifier si l'erreur est liée à l'authentification
      const isAuthError =
        error.response &&
        (error.response.status === 401 || error.response.status === 403);

      console.log("🔍 [ChatbotWidget] isAuthError:", isAuthError);

      if (isAuthError) {
        setAuthError(true);
        console.log(
          "⚠️ [ChatbotWidget] État d'erreur d'authentification activé"
        );
        toast.error("Session expirée. Veuillez vous reconnecter.");
      } else {
        toast.error("Erreur lors de la communication avec l'assistant");
      }

      // Ajouter un message d'erreur
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        content: isAuthError
          ? "Votre session a expiré. Veuillez vous reconnecter pour continuer la conversation."
          : "Désolé, une erreur est survenue. Veuillez réessayer plus tard.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
        authError: isAuthError,
      };

      console.log("📝 [ChatbotWidget] Message d'erreur créé:", errorMessage);

      setMessages((prev) => [...prev, errorMessage]);
      console.log("✅ [ChatbotWidget] Message d'erreur ajouté à l'affichage");
    } finally {
      setIsLoading(false);
      console.log("🔄 [ChatbotWidget] Indicateur de chargement désactivé");
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const clearConversation = async () => {
    try {
      console.log("Tentative d'effacement de l'historique...");

      // Effacer l'historique dans le backend
      const result = await chatbotService.clearHistory();

      // Vérifier si le résultat indique une erreur d'authentification
      if (result && typeof result === "object" && result.authError) {
        console.log(
          "Erreur d'authentification détectée lors de l'effacement de l'historique"
        );
        setAuthError(true);

        // Afficher un message d'erreur d'authentification
        toast.error(
          result.error || "Session expirée. Veuillez vous reconnecter."
        );

        // Ajouter un message d'erreur dans la conversation
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            content:
              "Votre session a expiré. Veuillez vous reconnecter pour effacer l'historique.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isError: true,
            authError: true,
          },
        ]);

        return;
      }

      console.log("Historique effacé avec succès");

      // Message d'accueil par défaut
      setMessages([
        {
          id: Date.now(),
          sender: "bot",
          content:
            "Conversation réinitialisée. Comment puis-je vous aider aujourd'hui ?",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      // Réinitialiser l'historique local
      setConversationHistory([]);

      // Réinitialiser l'état d'erreur d'authentification
      setAuthError(false);

      toast.info("Conversation réinitialisée");
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation de la conversation:",
        error
      );

      // Vérifier si l'erreur est liée à l'authentification
      const isAuthError =
        error.response &&
        (error.response.status === 401 || error.response.status === 403);

      if (isAuthError) {
        setAuthError(true);
      }

      // Afficher un message d'erreur plus détaillé
      let errorMessage = isAuthError
        ? "Session expirée. Veuillez vous reconnecter."
        : "Erreur lors de la réinitialisation de la conversation";

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += `: ${error.response.data.error}`;
      }

      toast.error(errorMessage);

      // Ajouter un message d'erreur dans la conversation
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          content: isAuthError
            ? "Votre session a expiré. Veuillez vous reconnecter pour effacer l'historique."
            : "Désolé, je n'ai pas pu réinitialiser la conversation. Veuillez réessayer plus tard.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isError: true,
          authError: isAuthError,
        },
      ]);
    }
  };

  // Afficher des informations de débogage dans la console
  useEffect(() => {
    console.log("🔍 [ChatbotWidget] État de l'authentification:");
    console.log("- currentUser:", currentUser);
    console.log("- localStorage user:", localStorage.getItem("user"));
    console.log(
      "- authHeader:",
      JSON.stringify(chatbotService.getAuthHeader())
    );
  }, [currentUser]);

  // Ajouter un log de débogage pour vérifier l'état des données utilisateur
  console.log("- currentUser:", currentUser);
  console.log("- localStorage user:", localStorage.getItem("user"));
  console.log(
    "- localStorage token:",
    localStorage.getItem("token") ? "Présent" : "Absent"
  );
  console.log("- authHeader:", JSON.stringify(chatbotService.getAuthHeader()));

  // S'assurer que les données utilisateur sont dans localStorage si disponibles
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
      console.log(
        "✅ [ChatbotWidget] Données utilisateur mises à jour dans localStorage"
      );
    }
  }, [currentUser]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-lg transition-all duration-300 ${
        isMinimized ? "w-16 h-16" : "w-80 h-[450px]"
      }`}
    >
      {/* Chatbot Header */}
      <div
        className={`flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg ${isMinimized ? "rounded-b-lg" : ""}`}
      >
        {!isMinimized && (
          <>
            <div className="flex items-center">
              <Bot size={20} className="mr-2" />
              <h3 className="font-medium">Assistant PharmaLearn</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearConversation}
                className="text-white hover:text-gray-200 transition-colors"
                title="Réinitialiser la conversation"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={toggleMinimize}
                className="text-white hover:text-gray-200 transition-colors"
                title="Réduire"
              >
                <Minimize size={16} />
              </button>
              <button
                onClick={toggleMinimize}
                className="text-white hover:text-gray-200 transition-colors"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </>
        )}
        {isMinimized && (
          <button
            onClick={toggleMinimize}
            className="w-full h-full flex items-center justify-center"
            title="Ouvrir l'assistant"
          >
            <Bot size={24} />
          </button>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            {authError && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-2">
                  Votre session a expiré. Veuillez vous reconnecter pour
                  continuer la conversation.
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  <LogIn className="w-3 h-3 mr-1" />
                  Se reconnecter
                </a>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : message.isError
                        ? message.authError
                          ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                        : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <span className="text-xs mt-1 opacity-70 block text-right">
                    {message.time}
                  </span>

                  {message.authError && (
                    <div className="mt-2 text-center">
                      <a
                        href="/login"
                        className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      >
                        <LogIn className="w-3 h-3 mr-1" />
                        Se reconnecter
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  authError
                    ? "Session expirée. Veuillez vous reconnecter..."
                    : "Posez votre question..."
                }
                className="flex-1 p-2 border rounded-l-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                disabled={isLoading || authError}
              />
              {authError ? (
                <a
                  href="/login"
                  className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <LogIn size={18} />
                </a>
              ) : (
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  disabled={isLoading || !newMessage.trim()}
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatbotWidget;
