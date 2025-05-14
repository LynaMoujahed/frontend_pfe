import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  Search,
  Filter,
  ChevronDown,
  X,
  ArrowLeft,
  Send,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import PropTypes from "prop-types";
import { ReclamationService } from "../../../services/ReclamationService";
import { useAuth } from "../../../contexts/auth-context";
import { toast } from "react-toastify";

const ReclamationItem = ({ reclamation, onClick, isSelected }) => (
  <div
    className={`border rounded-xl overflow-hidden dark:border-slate-700 cursor-pointer transition-all transform hover:scale-[1.01] ${
      isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    }`}
    onClick={() => onClick(reclamation)}
  >
    <div
      className={`p-5 ${
        reclamation.status === "resolved"
          ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10"
          : "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-full ${
              reclamation.status === "resolved"
                ? "bg-green-200 dark:bg-green-800"
                : "bg-yellow-200 dark:bg-yellow-800"
            }`}
          >
            {reclamation.status === "resolved" ? (
              <Check className="text-green-700 dark:text-green-300" size={16} />
            ) : (
              <Clock
                className="text-yellow-700 dark:text-yellow-300"
                size={16}
              />
            )}
          </div>
          <h4 className="font-medium text-gray-800 dark:text-white">
            {reclamation.subject}
          </h4>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar size={14} />
          {new Date(reclamation.date).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-3 pl-10">
        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 italic">
          "{reclamation.message}"
        </p>
      </div>
    </div>

    {reclamation.responses && reclamation.responses.length > 0 ? (
      <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-800">
            <User className="text-blue-600 dark:text-blue-300" size={14} />
          </div>
          <h5 className="font-medium text-gray-800 dark:text-white">
            {reclamation.responses.length > 1
              ? `${reclamation.responses.length} réponses de l'administrateur`
              : "Réponse de l'administrateur"}
          </h5>
        </div>
        <p className="mt-1 text-gray-600 dark:text-gray-300 line-clamp-2 pl-8 italic">
          "{reclamation.responses[reclamation.responses.length - 1].content}"
        </p>
      </div>
    ) : reclamation.response ? (
      <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-800">
            <User className="text-blue-600 dark:text-blue-300" size={14} />
          </div>
          <h5 className="font-medium text-gray-800 dark:text-white">
            Réponse de l'administrateur
          </h5>
        </div>
        <p className="mt-1 text-gray-600 dark:text-gray-300 line-clamp-2 pl-8 italic">
          "{reclamation.response}"
        </p>
      </div>
    ) : null}

    <div
      className={`h-1.5 w-full ${
        reclamation.status === "resolved" ? "bg-green-500" : "bg-yellow-500"
      }`}
    ></div>
  </div>
);

ReclamationItem.propTypes = {
  reclamation: PropTypes.shape({
    id: PropTypes.number.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    response: PropTypes.string,
    responses: PropTypes.array,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

const Reclamation = () => {
  const { token } = useAuth();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [newReclamation, setNewReclamation] = useState({
    subject: "",
    message: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [messageLength, setMessageLength] = useState(0);
  const messageRef = useRef(null);

  // Charger les réclamations de l'utilisateur
  useEffect(() => {
    const fetchReclamations = async () => {
      setLoading(true);
      try {
        const result = await ReclamationService.getUserReclamations(token);
        if (result && result.reclamations) {
          setReclamations(result.reclamations);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des réclamations:", error);
        toast.error(
          "Impossible de charger vos réclamations. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReclamations();
    }
  }, [token]);

  // Filtrer les réclamations
  const filteredReclamations = reclamations
    .filter((rec) => {
      if (filterStatus === "all") return true;
      return rec.status === filterStatus;
    })
    .filter((rec) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        rec.subject.toLowerCase().includes(term) ||
        rec.message.toLowerCase().includes(term) ||
        (rec.response && rec.response.toLowerCase().includes(term))
      );
    });

  // Gérer le changement du message avec compteur de caractères
  const handleMessageChange = (e) => {
    const message = e.target.value;
    setMessageLength(message.length);
    setNewReclamation({
      ...newReclamation,
      message: message,
    });
  };

  // Ouvrir la boîte de dialogue de confirmation
  const handleOpenConfirmDialog = (e) => {
    e.preventDefault();
    if (newReclamation.subject && newReclamation.message) {
      setShowConfirmDialog(true);
    } else {
      // Mettre en évidence les champs requis
      if (!newReclamation.subject) {
        document
          .getElementById("reclamation-subject")
          .classList.add("ring-2", "ring-red-500");
      }
      if (!newReclamation.message) {
        messageRef.current.classList.add("ring-2", "ring-red-500");
      }
    }
  };

  // Fermer la boîte de dialogue de confirmation
  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  // Soumettre une nouvelle réclamation
  const handleSubmit = async () => {
    setShowConfirmDialog(false);
    try {
      const result = await ReclamationService.createReclamation(
        token,
        newReclamation
      );
      if (result && result.reclamation) {
        setReclamations([result.reclamation, ...reclamations]);
        setNewReclamation({ subject: "", message: "" });
        setMessageLength(0);
        toast.success("Votre réclamation a été envoyée avec succès.");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réclamation:", error);
      toast.error(
        "Impossible d'envoyer votre réclamation. Veuillez réessayer plus tard."
      );
    }
  };

  // Sélectionner une réclamation pour voir les détails
  const handleSelectReclamation = (reclamation) => {
    setSelectedReclamation(reclamation);
  };

  // Retourner à la liste des réclamations
  const handleBackToList = () => {
    setSelectedReclamation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header avec titre et bouton de retour */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <MessageSquare
              className="text-blue-600 dark:text-blue-400"
              size={24}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Réclamations
          </h2>
        </div>
        {selectedReclamation && (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à la liste
          </button>
        )}
      </div>

      {!selectedReclamation ? (
        <>
          {/* Formulaire de nouvelle réclamation */}
          <div className="relative bg-white dark:bg-slate-800 p-0 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 transform transition-all hover:shadow-2xl overflow-hidden">
            {/* Bande décorative supérieure */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            {/* En-tête avec effet de fond */}
            <div className="relative p-8 pb-6 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-gray-100 dark:border-slate-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full -mt-16 -mr-16 opacity-50"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-md flex items-center justify-center">
                  <Send
                    className="text-blue-600 dark:text-blue-400"
                    size={22}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Nouvelle réclamation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Nous traiterons votre demande dans les plus brefs délais
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleOpenConfirmDialog}
              className="p-8 pt-6 space-y-6"
            >
              <div className="relative">
                <label className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-medium bg-white dark:bg-slate-800 px-2 -ml-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Sujet de la réclamation
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <input
                    id="reclamation-subject"
                    type="text"
                    className="relative w-full p-4 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    value={newReclamation.subject}
                    onChange={(e) => {
                      setNewReclamation({
                        ...newReclamation,
                        subject: e.target.value,
                      });
                      // Réinitialiser la mise en évidence d'erreur
                      e.target.classList.remove("ring-2", "ring-red-500");
                    }}
                    placeholder="Entrez le sujet de votre réclamation"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageSquare size={16} />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between mb-2">
                  <label className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium bg-white dark:bg-slate-800 px-2 -ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Détails de la réclamation
                  </label>
                  <span
                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                      messageLength > 500
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : messageLength > 0
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {messageLength > 0 && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          messageLength > 500 ? "bg-orange-500" : "bg-blue-500"
                        }`}
                      ></div>
                    )}
                    {messageLength} caractères
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <textarea
                    ref={messageRef}
                    className="relative w-full p-4 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    rows={6}
                    value={newReclamation.message}
                    onChange={handleMessageChange}
                    onFocus={() =>
                      messageRef.current.classList.remove(
                        "ring-2",
                        "ring-red-500"
                      )
                    }
                    placeholder="Décrivez votre problème en détail..."
                    required
                  />
                </div>

                <div className="mt-3 flex items-start gap-2">
                  <div className="text-blue-500 dark:text-blue-400 mt-0.5">
                    <AlertCircle size={14} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Veuillez fournir tous les détails pertinents pour nous aider
                    à traiter votre réclamation efficacement. Plus votre
                    description est précise, plus nous pourrons vous répondre
                    rapidement.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                <button
                  type="submit"
                  className="relative overflow-hidden w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                  <Send size={18} className="group-hover:animate-pulse" />
                  <span>Envoyer la réclamation</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filtres et recherche */}
          <div className="relative bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Bande décorative latérale */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center pl-2">
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                <div className="relative flex items-center w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher dans vos réclamations..."
                    className="pl-10 w-full p-3.5 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600 hover:scale-110 transition-all" />
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <button
                  className={`flex items-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-800 border-2 ${
                    filterStatus !== "all"
                      ? "border-blue-400 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                      : "border-gray-300 text-gray-700 dark:border-slate-600 dark:text-gray-300"
                  } rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 min-w-[140px] justify-center font-medium transition-all`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter
                    className={`h-5 w-5 ${
                      filterStatus !== "all"
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                  <span>
                    {filterStatus === "all"
                      ? "Filtrer"
                      : filterStatus === "pending"
                        ? "En attente"
                        : "Résolues"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 ${
                      filterStatus !== "all"
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    } transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden animate-scaleIn">
                    <div className="p-1">
                      <button
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${filterStatus === "all" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-slate-700"} transition-colors`}
                        onClick={() => {
                          setFilterStatus("all");
                          setShowFilters(false);
                        }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${filterStatus === "all" ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
                        ></div>
                        <span>Toutes les réclamations</span>
                      </button>
                      <button
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${filterStatus === "pending" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-slate-700"} transition-colors`}
                        onClick={() => {
                          setFilterStatus("pending");
                          setShowFilters(false);
                        }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${filterStatus === "pending" ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"}`}
                        ></div>
                        <span>En attente</span>
                        <Clock
                          className={`ml-auto h-4 w-4 ${filterStatus === "pending" ? "text-yellow-500" : "text-gray-400"}`}
                        />
                      </button>
                      <button
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${filterStatus === "resolved" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-slate-700"} transition-colors`}
                        onClick={() => {
                          setFilterStatus("resolved");
                          setShowFilters(false);
                        }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${filterStatus === "resolved" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                        ></div>
                        <span>Résolues</span>
                        <Check
                          className={`ml-auto h-4 w-4 ${filterStatus === "resolved" ? "text-green-500" : "text-gray-400"}`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Liste des réclamations */}
          <div className="space-y-4 mt-8">
            <div className="relative bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
              {/* Bande décorative latérale */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>

              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <span>Historique</span>
                      {filterStatus !== "all" && (
                        <span className="ml-2 text-sm font-normal px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {filterStatus === "pending"
                            ? "En attente"
                            : "Résolues"}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {filteredReclamations.length > 0
                        ? `${filteredReclamations.length} réclamation${filteredReclamations.length > 1 ? "s" : ""} trouvée${filteredReclamations.length > 1 ? "s" : ""}`
                        : "Aucune réclamation trouvée"}
                    </p>
                  </div>
                </div>

                {filteredReclamations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        filterStatus === "pending"
                          ? "bg-yellow-500"
                          : filterStatus === "resolved"
                            ? "bg-green-500"
                            : "bg-blue-500"
                      }`}
                    ></div>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      {filteredReclamations.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500 animate-pulse"></div>
                <div className="text-center py-16">
                  <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto"></div>
                  <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">
                    Chargement des réclamations...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                    Veuillez patienter pendant que nous récupérons vos
                    réclamations
                  </p>
                </div>
              </div>
            ) : filteredReclamations.length > 0 ? (
              <div className="grid gap-4">
                {filteredReclamations.map((rec) => (
                  <ReclamationItem
                    key={rec.id}
                    reclamation={rec}
                    onClick={handleSelectReclamation}
                    isSelected={selectedReclamation?.id === rec.id}
                  />
                ))}
              </div>
            ) : (
              <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600"></div>
                <div className="text-center py-16 px-4">
                  <div className="relative mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    <div className="absolute -bottom-1 -right-1 bg-gray-200 dark:bg-slate-600 rounded-full p-1.5">
                      <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-800 dark:text-white">
                    Aucune réclamation
                  </h3>
                  <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {searchTerm
                      ? "Aucune réclamation ne correspond à votre recherche. Essayez de modifier vos critères de recherche."
                      : filterStatus !== "all"
                        ? `Vous n'avez pas de réclamations ${filterStatus === "pending" ? "en attente" : "résolues"} pour le moment.`
                        : "Vous n'avez pas encore soumis de réclamation. Utilisez le formulaire ci-dessus pour en créer une."}
                  </p>

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-5 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors inline-flex items-center gap-2"
                    >
                      <X size={16} />
                      Effacer la recherche
                    </button>
                  )}

                  {filterStatus !== "all" && (
                    <button
                      onClick={() => setFilterStatus("all")}
                      className="mt-5 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors inline-flex items-center gap-2"
                    >
                      <Filter size={16} />
                      Afficher toutes les réclamations
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // Vue détaillée d'une réclamation
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-xl">
          {/* Bande décorative supérieure */}
          <div
            className={`absolute top-0 left-0 right-0 h-2 ${
              selectedReclamation.status === "resolved"
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-yellow-500 to-amber-500"
            }`}
          ></div>

          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full shadow-md ${
                  selectedReclamation.status === "resolved"
                    ? "bg-green-100 dark:bg-green-800/30"
                    : "bg-yellow-100 dark:bg-yellow-800/30"
                }`}
              >
                {selectedReclamation.status === "resolved" ? (
                  <Check
                    className="text-green-600 dark:text-green-400"
                    size={22}
                  />
                ) : (
                  <Clock
                    className="text-yellow-600 dark:text-yellow-400"
                    size={22}
                  />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {selectedReclamation.subject}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar size={14} />
                  Soumis le{" "}
                  {new Date(
                    selectedReclamation.date
                  ).toLocaleDateString()} à{" "}
                  {new Date(selectedReclamation.date).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div>
              {selectedReclamation.status === "resolved" ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shadow-sm">
                  <Check className="mr-1.5 h-4 w-4" />
                  Résolu
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 shadow-sm">
                  <Clock className="mr-1.5 h-4 w-4" />
                  En attente
                </span>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <MessageSquare
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                  Votre message
                </h4>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-slate-700 whitespace-pre-wrap shadow-inner relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                <div className="pl-3">{selectedReclamation.message}</div>
              </div>
            </div>

            {selectedReclamation.responses &&
            selectedReclamation.responses.length > 0 ? (
              <div className="mt-10 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <User
                      size={18}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                      {selectedReclamation.responses.length > 1
                        ? `Réponses de l'administrateur (${selectedReclamation.responses.length})`
                        : "Réponse de l'administrateur"}
                    </h4>
                    {selectedReclamation.responseDate && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={14} />
                        Dernière réponse le{" "}
                        {new Date(
                          selectedReclamation.responseDate
                        ).toLocaleDateString()}{" "}
                        à{" "}
                        {new Date(
                          selectedReclamation.responseDate
                        ).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                {selectedReclamation.responses.map((response, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 whitespace-pre-wrap shadow-inner relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl"></div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {response.sender || "Administrateur"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(response.date).toLocaleDateString()} à{" "}
                          {new Date(response.date).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="pl-3 pt-2 border-t border-green-100 dark:border-green-900/20">
                        {response.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedReclamation.response ? (
              <div className="mt-10 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <User
                      size={18}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                      Réponse de l'administrateur
                    </h4>
                    {selectedReclamation.responseDate && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={14} />
                        Répondu le{" "}
                        {new Date(
                          selectedReclamation.responseDate
                        ).toLocaleDateString()}{" "}
                        à{" "}
                        {new Date(
                          selectedReclamation.responseDate
                        ).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 whitespace-pre-wrap shadow-inner relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl"></div>
                  <div className="pl-3">{selectedReclamation.response}</div>
                </div>
              </div>
            ) : (
              <div className="mt-10 p-8 border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-xl text-center bg-yellow-50 dark:bg-yellow-900/10">
                <div className="bg-yellow-100 dark:bg-yellow-800/30 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="h-10 w-10 text-yellow-500 dark:text-yellow-400" />
                </div>
                <h4 className="mt-4 text-lg font-bold text-gray-800 dark:text-white">
                  En attente de réponse
                </h4>
                <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  Votre réclamation a été soumise avec succès. Un administrateur
                  vous répondra dans les plus brefs délais.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boîte de dialogue de confirmation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-slate-700 animate-scaleIn overflow-hidden">
            {/* Bande décorative supérieure */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            {/* En-tête avec effet de fond */}
            <div className="relative p-8 pb-6 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-gray-100 dark:border-slate-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full -mt-16 -mr-16 opacity-50"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-md flex items-center justify-center">
                  <Send
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Confirmer l'envoi
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Vérifiez votre réclamation avant de l'envoyer
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                    size={18}
                  />
                  <p className="text-gray-700 dark:text-gray-300">
                    Êtes-vous sûr de vouloir envoyer cette réclamation ? Une
                    fois envoyée, vous ne pourrez plus la modifier.
                  </p>
                </div>
              </div>

              {/* Résumé de la réclamation */}
              {newReclamation.subject && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Résumé de votre réclamation :
                  </h4>
                  <p className="font-medium text-gray-800 dark:text-white mb-2">
                    {newReclamation.subject}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 italic">
                    "{newReclamation.message.substring(0, 100)}
                    {newReclamation.message.length > 100 ? "..." : ""}"
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                <button
                  onClick={handleCloseConfirmDialog}
                  className="px-5 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="relative overflow-hidden px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                  <Send size={18} className="group-hover:animate-pulse" />
                  <span>Confirmer l'envoi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reclamation;
