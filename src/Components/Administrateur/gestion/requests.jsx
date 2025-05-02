import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserPlus,
  Search,
  ChevronDown,
  Check,
  X as XIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  Shield,
  GraduationCap,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../../contexts/auth-context";
import { toast } from "react-toastify";
import DialogModal from "../../Common/DialogModal";
import RejectDialog from "../../Common/RejectDialog";

const RegistrationRequestsPage = () => {
  // États
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 5;
  const { getPendingUsers, approveUser, rejectUser } = useAuth();

  // État pour la boîte de dialogue de confirmation
  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "info", // 'info', 'success', 'error', 'confirm'
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Annuler",
    userId: null, // Pour stocker l'ID de l'utilisateur à traiter
    role: null, // Pour stocker le rôle lors de l'approbation
  });

  // État et référence pour la raison de rejet
  const [rejectReason, setRejectReason] = useState("");
  const rejectReasonInputRef = useRef(null);

  // Utiliser un état local pour stocker les données mises en cache
  const [cachedRequests, setCachedRequests] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const CACHE_DURATION = 60000; // 1 minute en millisecondes

  // Charger les utilisateurs en attente d'approbation
  useEffect(() => {
    const fetchPendingUsers = async () => {
      // Vérifier si les données en cache sont encore valides
      const now = Date.now();
      if (
        cachedRequests.length > 0 &&
        lastFetchTime &&
        now - lastFetchTime < CACHE_DURATION
      ) {
        console.log("Utilisation des données en cache");
        return;
      }

      setLoading(true);
      console.log("Début de la récupération des utilisateurs en attente...");
      try {
        console.log("Appel de getPendingUsers()...");
        const result = await getPendingUsers();
        console.log("Résultat de getPendingUsers():", result);

        if (result && result.success) {
          // Transformer les données pour correspondre à la structure attendue
          console.log(`${result.users.length} utilisateurs en attente trouvés`);
          console.log(
            "Rôles des utilisateurs:",
            result.users.map((user) => user.role)
          );

          const formattedRequests = result.users.map((user) => {
            console.log(
              `Utilisateur ${user.id} (${user.name}) a le rôle: ${user.role}`
            );
            return {
              id: user.id,
              fullName: user.name,
              email: user.email,
              requestedRole: user.role,
              status: "pending",
              requestDate: new Date().toISOString(), // Date actuelle car non fournie par l'API
              additionalInfo: `Téléphone: ${user.phone}`,
              profileImage: user.profileImage,
            };
          });

          setRequests(formattedRequests);
          // Mettre à jour le cache
          setCachedRequests(result.users);
          setLastFetchTime(now);
        } else {
          const errorMsg = result
            ? result.error || "Erreur inconnue"
            : "Réponse vide du serveur";
          console.error("Erreur API:", errorMsg);
          toast.error("Erreur lors du chargement des demandes: " + errorMsg);
        }
      } catch (error) {
        console.error("Exception lors du chargement des demandes:", error);
        toast.error(
          "Erreur de connexion au serveur: " +
            (error.message || "Erreur inconnue")
        );
      } finally {
        console.log("Fin de la récupération des utilisateurs en attente");
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []); // Supprimer la dépendance pour éviter les rendus multiples

  // Filtrage des demandes
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(
    indexOfFirstRequest,
    indexOfLastRequest
  );
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Changement de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Actions sur les demandes
  const approveRequest = (requestId, role) => {
    if (!role) {
      toast.error("Veuillez sélectionner un rôle avant d'accepter la demande");
      return;
    }

    // Trouver l'utilisateur pour afficher son nom dans la confirmation
    const userToApprove = requests.find((request) => request.id === requestId);

    if (!userToApprove) {
      toast.error("Utilisateur non trouvé");
      return;
    }

    // Formater le nom du rôle pour l'affichage
    const displayRole =
      role === "administrateur"
        ? "Administrateur"
        : role === "formateur"
          ? "Formateur"
          : "Apprenant";

    // Afficher la boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation d'approbation",
      message: `Êtes-vous sûr de vouloir approuver la demande de "${userToApprove.fullName}" avec le rôle ${displayRole} ?

Cette action enverra un email à l'utilisateur pour l'informer que son compte a été approuvé, avec un lien pour se connecter.`,
      type: "confirm",
      confirmText: "Approuver",
      cancelText: "Annuler",
      userId: requestId,
      role: role,
      onConfirm: async () => {
        try {
          // Fermer la boîte de dialogue
          setDialog((prev) => ({ ...prev, show: false }));

          // Afficher un indicateur de chargement
          setLoading(true);

          const result = await approveUser(requestId);

          if (result.success) {
            toast.success("Utilisateur approuvé avec succès");

            // Mettre à jour l'interface utilisateur immédiatement
            setRequests(requests.filter((request) => request.id !== requestId));

            // Recharger les demandes après un court délai pour s'assurer que les données sont à jour
            setTimeout(async () => {
              try {
                const result = await getPendingUsers();
                if (result.success) {
                  console.log(
                    "Rechargement - Rôles des utilisateurs:",
                    result.users.map((user) => user.role)
                  );

                  const formattedRequests = result.users.map((user) => {
                    console.log(
                      `Rechargement - Utilisateur ${user.id} (${user.name}) a le rôle: ${user.role}`
                    );
                    return {
                      id: user.id,
                      fullName: user.name,
                      email: user.email,
                      requestedRole: user.role,
                      status: "pending",
                      requestDate: new Date().toISOString(),
                      additionalInfo: `Téléphone: ${user.phone}`,
                      profileImage: user.profileImage,
                    };
                  });

                  setRequests(formattedRequests);
                }
              } catch (error) {
                console.error(
                  "Erreur lors du rechargement des demandes:",
                  error
                );
              } finally {
                setLoading(false);
              }
            }, 500);
          } else {
            setLoading(false);
            toast.error(
              "Erreur lors de l'approbation: " +
                (result.error || "Erreur inconnue")
            );

            // Afficher une boîte de dialogue d'erreur
            setDialog({
              show: true,
              title: "Erreur",
              message: `Erreur lors de l'approbation : ${result.error || "Erreur inconnue"}`,
              type: "error",
              confirmText: "OK",
              onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            });
          }
        } catch (error) {
          setLoading(false);
          console.error("Erreur lors de l'approbation:", error);
          toast.error("Erreur de connexion au serveur");

          // Afficher une boîte de dialogue d'erreur
          setDialog({
            show: true,
            title: "Erreur",
            message: `Erreur de connexion au serveur : ${error.message || "Erreur inconnue"}`,
            type: "error",
            confirmText: "OK",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
          });
        }
      },
    });
  };

  // État pour la boîte de dialogue de rejet
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);

  const rejectRequest = (requestId) => {
    // Trouver l'utilisateur pour afficher son nom dans la confirmation
    const userToReject = requests.find((request) => request.id === requestId);

    if (!userToReject) {
      toast.error("Utilisateur non trouvé");
      return;
    }

    // Stocker l'ID de l'utilisateur à rejeter
    setRejectUserId(requestId);

    // Afficher la boîte de dialogue de rejet avec un message personnalisé
    setShowRejectDialog(true);
  };

  // Fonction pour gérer la confirmation du rejet
  const handleRejectConfirm = async (reason) => {
    if (!reason || !rejectUserId) return;

    try {
      // Fermer la boîte de dialogue
      setShowRejectDialog(false);

      // Afficher un indicateur de chargement
      setLoading(true);

      const result = await rejectUser(rejectUserId, reason);

      if (result.success) {
        toast.success("Utilisateur rejeté avec succès");

        // Mettre à jour l'interface utilisateur immédiatement
        setRequests(requests.filter((request) => request.id !== rejectUserId));

        // Recharger les demandes après un court délai pour s'assurer que les données sont à jour
        setTimeout(async () => {
          try {
            const result = await getPendingUsers();
            if (result.success) {
              console.log(
                "Rechargement après rejet - Rôles des utilisateurs:",
                result.users.map((user) => user.role)
              );

              const formattedRequests = result.users.map((user) => {
                console.log(
                  `Rechargement après rejet - Utilisateur ${user.id} (${user.name}) a le rôle: ${user.role}`
                );
                return {
                  id: user.id,
                  fullName: user.name,
                  email: user.email,
                  requestedRole: user.role,
                  status: "pending",
                  requestDate: new Date().toISOString(),
                  additionalInfo: `Téléphone: ${user.phone}`,
                  profileImage: user.profileImage,
                };
              });

              setRequests(formattedRequests);
            }
          } catch (error) {
            console.error("Erreur lors du rechargement des demandes:", error);
          } finally {
            setLoading(false);
          }
        }, 500);
      } else {
        setLoading(false);
        toast.error(
          "Erreur lors du rejet: " + (result.error || "Erreur inconnue")
        );

        // Afficher une boîte de dialogue d'erreur
        setDialog({
          show: true,
          title: "Erreur",
          message: `Erreur lors du rejet : ${result.error || "Erreur inconnue"}`,
          type: "error",
          confirmText: "OK",
          onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Erreur lors du rejet:", error);
      toast.error("Erreur de connexion au serveur");

      // Afficher une boîte de dialogue d'erreur
      setDialog({
        show: true,
        title: "Erreur",
        message: `Erreur de connexion au serveur : ${error.message || "Erreur inconnue"}`,
        type: "error",
        confirmText: "OK",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
      });
    }
  };

  // Rendu des icônes de rôle
  const renderRoleIcon = (role) => {
    switch (role) {
      case "administrateur":
        return <Shield className="inline mr-1" size={16} />;
      case "formateur":
        return <GraduationCap className="inline mr-1" size={16} />;
      case "apprenant":
        return <User className="inline mr-1" size={16} />;
      default:
        return <User className="inline mr-1" size={16} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 dark:bg-gray-900 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
            <UserPlus className="text-blue-600 dark:text-blue-400" size={24} />
            Demandes d'Inscription
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {filteredRequests.length} demande(s) trouvée(s)
          </p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filtre par statut */}
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500"
                size={18}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center dark:text-gray-300">
            Chargement en cours...
          </div>
        ) : (
          <>
            <div className="rounded-lg overflow-hidden shadow">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Demandeur
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Rôle
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentRequests.length > 0 ? (
                    currentRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {request.profileImage ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={`https://127.0.0.1:8000/uploads/profile_images/${request.profileImage}`}
                                  alt={request.fullName}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                  <User
                                    className="text-gray-500 dark:text-gray-400"
                                    size={20}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {request.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {request.additionalInfo}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {request.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="mr-1" size={12} />
                            Email vérifié
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white flex items-center">
                            {renderRoleIcon(request.requestedRole)}
                            {request.requestedRole === "administrateur"
                              ? "Administrateur"
                              : request.requestedRole === "formateur"
                                ? "Formateur"
                                : "Apprenant"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : request.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {request.status === "pending" ? (
                              <>
                                <Clock className="mr-1" size={12} />
                                En attente
                              </>
                            ) : request.status === "approved" ? (
                              <>
                                <Check className="mr-1" size={12} />
                                Approuvée
                              </>
                            ) : (
                              <>
                                <XIcon className="mr-1" size={12} />
                                Rejetée
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === "pending" ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() =>
                                  approveRequest(
                                    request.id,
                                    request.requestedRole
                                  )
                                }
                                className="p-1 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
                                title="Accepter avec le rôle demandé"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => rejectRequest(request.id)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                title="Refuser"
                              >
                                <XIcon size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                              Traitée
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        Aucune demande trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredRequests.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} sur {totalPages} • Affichage de{" "}
                  <span className="font-medium">{indexOfFirstRequest + 1}</span>{" "}
                  à{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastRequest, filteredRequests.length)}
                  </span>{" "}
                  sur{" "}
                  <span className="font-medium">{filteredRequests.length}</span>{" "}
                  demandes
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md border flex items-center gap-1 ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                        : "bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <ChevronLeft size={18} />
                    Précédent
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`w-8 h-8 rounded-md ${
                          currentPage === i + 1
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md border flex items-center gap-1 ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                        : "bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Suivant
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Boîte de dialogue pour les confirmations et notifications */}
      {dialog.show && (
        <DialogModal
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          onClose={() => setDialog((prev) => ({ ...prev, show: false }))}
          onConfirm={dialog.onConfirm}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
        />
      )}

      {/* Boîte de dialogue pour le rejet avec raison */}
      {showRejectDialog && (
        <RejectDialog
          title="Confirmation de rejet"
          message="Veuillez indiquer la raison du rejet de cette demande. Un email sera envoyé à l'utilisateur avec cette raison et un lien pour s'inscrire à nouveau s'il le souhaite."
          onClose={() => setShowRejectDialog(false)}
          onConfirm={handleRejectConfirm}
          confirmText="Rejeter"
          cancelText="Annuler"
        />
      )}
    </div>
  );
};

export default RegistrationRequestsPage;
