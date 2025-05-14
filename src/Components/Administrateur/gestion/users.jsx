import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserPlus,
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
  Shield,
  Mail,
  Phone,
  User,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  Settings,
} from "lucide-react";
import { useAuth } from "../../../contexts/auth-context";
import { toast } from "react-toastify";
import DialogModal from "../../Common/DialogModal";
import { API_URL } from "../../../config";

const UsersManagementPage = () => {
  const { token } = useAuth();

  // Générer un nom aléatoire pour le champ de mot de passe pour éviter l'auto-remplissage
  const randomPasswordFieldName = useRef(
    `pwd_${Math.random().toString(36).substring(2, 10)}`
  );

  // États
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const usersPerPage = 10;

  // État pour la boîte de dialogue de confirmation
  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "info", // 'info', 'success', 'error', 'confirm'
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Annuler",
    userId: null, // Pour stocker l'ID de l'utilisateur à supprimer
  });

  // État pour le formulaire
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "apprenant",
    password: "",
  });

  // Récupérer les utilisateurs approuvés depuis l'API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Transformer les données pour correspondre à la structure attendue
      const formattedUsers = data.users.map((user) => ({
        id: user.id,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role, // Garder le rôle tel qu'il est retourné par l'API
        status: "active",
        profileImage: user.profileImage,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Filtrage des utilisateurs
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Changement de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Si c'est le champ de mot de passe avec le nom aléatoire, utiliser "password" comme clé
    const fieldName =
      name === randomPasswordFieldName.current ? "password" : name;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Initialiser le formulaire d'édition
  const initEditForm = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.fullName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "", // Le mot de passe n'est pas récupéré pour des raisons de sécurité
    });
  };

  // Annuler l'ajout/édition
  const cancelForm = () => {
    setIsAddingUser(false);
    setEditingUserId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "apprenant",
      password: "",
    });
  };

  // Sauvegarder l'utilisateur
  const saveUser = async () => {
    console.log("Fonction saveUser appelée");
    console.log("État du formulaire:", formData);

    // Validation des champs obligatoires
    if (!formData.name && !formData.fullName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // S'assurer que nous avons les bonnes propriétés
    const userData = {
      name: formData.name || formData.fullName,
      email: formData.email,
      phone: formData.phone || 0,
      role: formData.role,
      password: formData.password || "",
    };

    console.log("Données à envoyer:", userData);

    // Validation du mot de passe pour un nouvel utilisateur
    if (isAddingUser && !userData.password) {
      toast.error("Le mot de passe est obligatoire pour un nouvel utilisateur");
      return;
    }

    try {
      if (isAddingUser) {
        console.log("Ajout d'un nouvel utilisateur");

        try {
          // Ajouter un nouvel utilisateur
          const response = await fetch(`${API_URL}/admin/users/add`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });

          console.log("Statut de la réponse (ajout):", response.status);
          const responseText = await response.text();
          console.log("Réponse brute (ajout):", responseText);

          if (!response.ok) {
            throw new Error(
              responseText
                ? JSON.parse(responseText).message
                : "Erreur lors de la création de l'utilisateur"
            );
          }

          const responseData = responseText ? JSON.parse(responseText) : {};
          console.log("Données de réponse (ajout):", responseData);

          toast.success("Utilisateur ajouté avec succès");
          setIsAddingUser(false);
        } catch (error) {
          console.error("Erreur lors de l'ajout:", error);
          toast.error(
            error.message || "Une erreur est survenue lors de l'ajout"
          );
          throw error;
        }
      } else if (editingUserId) {
        console.log(
          "Modification d'un utilisateur existant avec ID:",
          editingUserId
        );

        try {
          // Modifier un utilisateur existant
          const response = await fetch(
            `https://127.0.0.1:8000/api/admin/users/edit/${editingUserId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            }
          );

          console.log("Statut de la réponse:", response.status);
          const responseText = await response.text();
          console.log("Réponse brute:", responseText);

          if (!response.ok) {
            throw new Error(
              responseText
                ? JSON.parse(responseText).message
                : "Erreur lors de la modification de l'utilisateur"
            );
          }

          const responseData = responseText ? JSON.parse(responseText) : {};
          console.log("Données de réponse:", responseData);

          // Vérifier si le rôle a été changé
          if (responseData.roleChanged) {
            toast.info(
              "Le rôle de l'utilisateur a été modifié. La liste a été mise à jour."
            );
          } else {
            toast.success("Utilisateur modifié avec succès");
          }
        } catch (error) {
          console.error("Erreur lors de la modification:", error);
          toast.error(
            error.message || "Une erreur est survenue lors de la modification"
          );
          throw error;
        }

        setEditingUserId(null);
      }

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "apprenant",
        password: "",
      });

      // Rafraîchir la liste des utilisateurs
      fetchUsers();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'utilisateur:", error);
      toast.error(error.message || "Une erreur est survenue");
    }
  };

  // Actions
  const deleteUser = (userId) => {
    // Trouver l'utilisateur pour afficher son nom dans la confirmation
    const userToDelete = users.find((user) => user.id === userId);

    if (!userToDelete) {
      toast.error("Utilisateur non trouvé");
      return;
    }

    // Afficher la boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation de suppression",
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete.fullName}" ?

Cette action est irréversible.`,
      type: "confirm",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      onConfirm: async () => {
        try {
          // Fermer la boîte de dialogue
          setDialog((prev) => ({ ...prev, show: false }));

          const response = await fetch(
            `${API_URL}/admin/users/delete/${userId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message ||
                "Erreur lors de la suppression de l'utilisateur"
            );
          }

          toast.success("Utilisateur supprimé avec succès");

          // Rafraîchir la liste des utilisateurs
          fetchUsers();
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'utilisateur:",
            error
          );
          toast.error(error.message || "Une erreur est survenue");

          // Afficher une boîte de dialogue d'erreur
          setDialog({
            show: true,
            title: "Erreur",
            message: `Erreur lors de la suppression : ${error.message || "Une erreur est survenue"}`,
            type: "error",
            confirmText: "OK",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
          });
        }
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 dark:bg-gray-900 min-h-screen">
      {/* En-tête avec design amélioré */}
      <div className="mb-8 animate-fadeIn">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
                Gestion des Utilisateurs
              </h1>
              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <CheckCircle
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                <span className="font-medium">{filteredUsers.length}</span>{" "}
                utilisateur(s) trouvé(s)
              </p>
            </div>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              onClick={() => {
                setIsAddingUser(true);
                setEditingUserId(null);
              }}
              disabled={isAddingUser || editingUserId !== null}
            >
              <UserPlus size={18} />
              Ajouter un utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/édition avec design amélioré */}
      {(isAddingUser || editingUserId !== null) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 animate-scaleIn">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
              {isAddingUser ? (
                <>
                  <UserPlus
                    className="text-blue-600 dark:text-blue-400"
                    size={22}
                  />
                  Ajouter un nouvel utilisateur
                </>
              ) : (
                <>
                  <Settings
                    className="text-blue-600 dark:text-blue-400"
                    size={22}
                  />
                  Modifier les informations de l'utilisateur
                </>
              )}
            </h2>
            <button
              onClick={cancelForm}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-300
                hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Champs cachés pour tromper l'autocomplétion du navigateur */}
          <div style={{ display: "none" }}>
            <input
              type="text"
              name="fakeusernameremembered"
              autoComplete="chrome-off"
            />
            <input
              type="password"
              name="fakepasswordremembered"
              autoComplete="chrome-off"
            />
          </div>

          {/* Formulaire avec attributs pour désactiver l'autocomplétion */}
          <form
            autoComplete="chrome-off"
            data-lpignore="true"
            onSubmit={(e) => {
              e.preventDefault();
              saveUser();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500
                      focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                    placeholder="Entrez le nom complet"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500
                      focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                    placeholder="exemple@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500
                      focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe{" "}
                  {isAddingUser ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (laisser vide pour ne pas modifier)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Shield
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="password"
                    name={randomPasswordFieldName.current}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500
                      focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                    placeholder={
                      isAddingUser
                        ? "Mot de passe"
                        : "Nouveau mot de passe (optionnel)"
                    }
                    required={isAddingUser}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    aria-autocomplete="none"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500
                      focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none transition-all duration-300"
                  >
                    <option value="administrateur">Administrateur</option>
                    <option value="formateur">Formateur</option>
                    <option value="apprenant">Apprenant</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                    size={18}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 hover:bg-gray-50
                  dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700
                  hover:to-indigo-700 flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow font-medium"
              >
                <Save size={18} />
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barre de filtres optimisée */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={16}
            />
            <input
              type="search"
              placeholder="Rechercher par nom ou email."
              className="pl-9 pr-3 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-md
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              autoComplete="off"
            />
          </div>

          {/* Filtre par rôle */}
          <div className="relative w-[180px] flex-shrink-0">
            <select
              className="appearance-none pl-3 pr-8 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-md
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white text-sm"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les rôles</option>
              <option value="administrateur">Administrateurs</option>
              <option value="formateur">Formateurs</option>
              <option value="apprenant">Apprenants</option>
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500"
              size={16}
            />
          </div>
        </div>
      </div>

      {/* Tableau amélioré */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-fadeIn">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Chargement des utilisateurs...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Utilisateur
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Rôle
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900
                              flex items-center justify-center"
                            >
                              <span className="text-blue-600 dark:text-blue-300 font-medium">
                                {user.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-semibold text-gray-900 dark:text-white text-base">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                            <Mail size={14} className="text-gray-400" />
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Phone size={14} className="text-gray-400" />
                            {user.phone || "Non renseigné"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "administrateur"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : user.role === "formateur"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {user.role === "administrateur"
                              ? "Administrateur"
                              : user.role === "formateur"
                                ? "Formateur"
                                : "Apprenant"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            Actif
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => initEditForm(user)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Modifier"
                              disabled={isAddingUser}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Supprimer"
                              disabled={isAddingUser || editingUserId !== null}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <Users size={40} className="mb-3 opacity-40" />
                          <p className="text-lg font-medium">
                            Aucun utilisateur trouvé
                          </p>
                          <p className="text-sm mt-1">
                            Modifiez vos critères de recherche ou ajoutez un
                            nouvel utilisateur
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination améliorée */}
            {filteredUsers.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Page {currentPage}
                  </span>{" "}
                  sur {totalPages} • Affichage de{" "}
                  <span className="font-medium">{indexOfFirstUser + 1}</span> à{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, filteredUsers.length)}
                  </span>{" "}
                  sur{" "}
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {filteredUsers.length}
                  </span>{" "}
                  utilisateurs
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                        : "bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline">Précédent</span>
                  </button>

                  <div className="hidden md:flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logique pour afficher les pages autour de la page courante
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all duration-300 ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                              : "bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 border dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                        : "bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Boîte de dialogue pour les confirmations et notifications - Utilise le composant existant */}
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
    </div>
  );
};

export default UsersManagementPage;
