import { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  XCircle,
  Camera,
  Shield,
  Key,
  Bell,
  Smartphone,
  CheckCircle,
  AlertCircle,
  UserCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../contexts/auth-context";
import { toast } from "react-toastify";

// Styles pour l'animation
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes autofill {
      from {/**/}
      to {/**/}
    }
    input:-webkit-autofill {
      animation-name: autofill;
      animation-fill-mode: both;
    }
  `,
};

const ProfilePage = () => {
  const { user, updateProfile, deleteAccount, loading } = useAuth();

  // Générer un nom aléatoire pour le champ de mot de passe pour éviter l'auto-remplissage
  const randomPasswordFieldName = useRef(
    `pwd_${Math.random().toString(36).substring(2, 10)}`
  );

  // États pour les données du profil
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // États pour la sécurité
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Référence pour suivre si le champ a été modifié par l'utilisateur
  const userModifiedPassword = useRef(false);

  // États pour l'interface - contrôle individuel de l'affichage des mots de passe
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [activeSection, setActiveSection] = useState("personal");
  const [profileImage, setProfileImage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // États pour les notifications
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // État pour la boîte de dialogue de confirmation
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  // Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone ? String(user.phone) : "",
      });

      // Définir l'image de profil seulement si elle existe
      if (user.profileImage) {
        setProfileImage(`https://127.0.0.1:8000${user.profileImage}`);
      } else {
        setProfileImage(""); // Pas d'image par défaut
      }
    }
  }, [user]);

  // Gestion des changements
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecurityChange = (e) => {
    // Si l'utilisateur modifie le champ du mot de passe actuel, marquer comme modifié
    if (e.target.name === randomPasswordFieldName.current) {
      // Marquer comme modifié seulement si l'utilisateur a réellement saisi quelque chose
      if (e.target.value !== "") {
        userModifiedPassword.current = true;
      }
      // Mettre à jour le champ currentPassword même si le nom du champ est différent
      setSecurity({
        ...security,
        currentPassword: e.target.value,
      });
    } else {
      setSecurity({
        ...security,
        [e.target.name]: e.target.value,
      });
    }
  };

  // Fonction pour basculer la visibilité d'un champ de mot de passe spécifique
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field],
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 2MB");
        setNotification({
          show: true,
          type: "error",
          message: "L'image ne doit pas dépasser 2MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileImage = async () => {
    if (imagePreview && user) {
      setFormSubmitting(true);
      try {
        const result = await updateProfile(user.id, {
          profileImage: imagePreview,
        });
        if (result.success) {
          toast.success("Photo de profil mise à jour avec succès");
          setProfileImage(imagePreview);
          setImagePreview(null);
          setNotification({
            show: true,
            type: "success",
            message: "Photo de profil mise à jour avec succès",
          });
        } else {
          // Vérifier si c'est un conflit de nom d'utilisateur ou d'email
          if (result.conflictType === "username") {
            toast.error("Ce nom d'utilisateur est déjà utilisé");
          } else if (result.conflictType === "email") {
            toast.error("Cet email est déjà utilisé");
          } else {
            // Autre type d'erreur
            toast.error(
              result.error || "Erreur lors de la mise à jour de la photo"
            );
            setNotification({
              show: true,
              type: "error",
              message:
                result.error || "Erreur lors de la mise à jour de la photo",
            });
          }
        }
      } catch (error) {
        toast.error("Erreur de connexion au serveur");
        setNotification({
          show: true,
          type: "error",
          message: "Erreur de connexion au serveur",
        });
      } finally {
        setFormSubmitting(false);
      }
    }
  };

  // Fonction pour afficher la boîte de dialogue de confirmation pour la photo de profil
  const showDeleteConfirmation = () => {
    setConfirmDialog({
      show: true,
      title: "Supprimer la photo de profil",
      message:
        "Êtes-vous sûr de vouloir supprimer votre photo de profil ? Cette action est irréversible.",
      onConfirm: () => {
        // Fermer la boîte de dialogue et exécuter la suppression
        setConfirmDialog((prev) => ({ ...prev, show: false }));
        performDeleteProfileImage();
      },
      onCancel: () => {
        // Fermer simplement la boîte de dialogue
        setConfirmDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // Fonction pour afficher la boîte de dialogue de confirmation pour la suppression de compte
  const showDeleteAccountConfirmation = () => {
    setConfirmDialog({
      show: true,
      title: "Supprimer le compte",
      message:
        "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.",
      onConfirm: () => {
        // Fermer la boîte de dialogue et exécuter la suppression
        setConfirmDialog((prev) => ({ ...prev, show: false }));
        performDeleteAccount();
      },
      onCancel: () => {
        // Fermer simplement la boîte de dialogue
        setConfirmDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // Fonction pour effectuer la suppression du compte
  const performDeleteAccount = async () => {
    if (!user) return;

    setFormSubmitting(true);
    try {
      console.log("Tentative de suppression du compte utilisateur:", user.id);
      const result = await deleteAccount(user.id);
      console.log("Résultat de la suppression:", result);

      if (result.success) {
        // La redirection sera gérée automatiquement par le contexte d'authentification
        // car nous avons déjà supprimé le token et l'utilisateur dans la fonction deleteAccount
        toast.success("Compte supprimé avec succès");
        setNotification({
          show: true,
          type: "success",
          message: "Compte supprimé avec succès",
        });
      } else {
        // Message d'erreur plus détaillé
        let errorMessage =
          result.error || "Erreur lors de la suppression du compte";

        // Si l'erreur contient des informations sur des contraintes de clé étrangère
        if (
          errorMessage.includes("REFERENCES") ||
          errorMessage.includes("constraint")
        ) {
          errorMessage =
            "Impossible de supprimer le compte car il est lié à d'autres données. Veuillez contacter un administrateur.";
        } else if (errorMessage.includes("Session expirée")) {
          errorMessage =
            "Votre session a expiré. Veuillez vous reconnecter pour effectuer cette action.";
        }

        toast.error(errorMessage);
        setNotification({
          show: true,
          type: "error",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Exception lors de la suppression du compte:", error);
      toast.error("Erreur de connexion au serveur");
      setNotification({
        show: true,
        type: "error",
        message: "Erreur de connexion au serveur",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fonction pour effectuer la suppression de l'image de profil
  const performDeleteProfileImage = async () => {
    if (!user) return;

    setFormSubmitting(true);
    try {
      const result = await updateProfile(user.id, {
        deleteProfileImage: true,
      });

      if (result.success) {
        toast.success("Photo de profil supprimée avec succès");
        setProfileImage("");
        setImagePreview(null);
        setNotification({
          show: true,
          type: "success",
          message: "Photo de profil supprimée avec succès",
        });
      } else {
        // Vérifier si c'est un conflit de nom d'utilisateur ou d'email
        if (result.conflictType === "username") {
          toast.error("Ce nom d'utilisateur est déjà utilisé");
        } else if (result.conflictType === "email") {
          toast.error("Cet email est déjà utilisé");
        } else {
          // Autre type d'erreur
          toast.error(
            result.error || "Erreur lors de la suppression de la photo"
          );
          setNotification({
            show: true,
            type: "error",
            message:
              result.error || "Erreur lors de la suppression de la photo",
          });
        }
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      setNotification({
        show: true,
        type: "error",
        message: "Erreur de connexion au serveur",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Soumission du formulaire de profil
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setFormSubmitting(true);
    try {
      // Convertir le numéro de téléphone en nombre
      const userData = {
        ...profileData,
        phone: parseInt(profileData.phone, 10),
      };

      const result = await updateProfile(user.id, userData);

      if (result.success) {
        // Afficher une notification de succès
        toast.success("Profil mis à jour avec succès");
        setNotification({
          show: true,
          type: "success",
          message: "Profil mis à jour avec succès",
        });
      } else {
        // Vérifier si c'est un conflit de nom d'utilisateur ou d'email
        if (result.conflictType === "username") {
          toast.error("Ce nom d'utilisateur est déjà utilisé");
        } else if (result.conflictType === "email") {
          toast.error("Cet email est déjà utilisé");
        } else {
          // Autre type d'erreur
          toast.error(
            result.error || "Erreur lors de la mise à jour du profil"
          );
          setNotification({
            show: true,
            type: "error",
            message: result.error || "Erreur lors de la mise à jour du profil",
          });
        }
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      setNotification({
        show: true,
        type: "error",
        message: "Erreur de connexion au serveur",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Soumission du formulaire de sécurité
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validation des mots de passe
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setNotification({
        show: true,
        type: "error",
        message: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    if (security.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      setNotification({
        show: true,
        type: "error",
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }

    setFormSubmitting(true);
    try {
      const result = await updateProfile(user.id, {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });

      if (result.success) {
        toast.success("Mot de passe mis à jour avec succès");
        setNotification({
          show: true,
          type: "success",
          message: "Mot de passe mis à jour avec succès",
        });
        // Réinitialiser le formulaire
        setSecurity({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Réinitialiser manuellement le champ de mot de passe actuel
        const passwordField = document.getElementsByName(
          randomPasswordFieldName.current
        )[0];
        if (passwordField) {
          passwordField.value = "";
        }
      } else {
        // Vérifier si c'est un conflit de nom d'utilisateur ou d'email
        if (result.conflictType === "username") {
          toast.error("Ce nom d'utilisateur est déjà utilisé");
        } else if (result.conflictType === "email") {
          toast.error("Cet email est déjà utilisé");
        } else {
          // Autre type d'erreur
          toast.error(
            result.error || "Erreur lors de la mise à jour du mot de passe"
          );
          setNotification({
            show: true,
            type: "error",
            message:
              result.error || "Erreur lors de la mise à jour du mot de passe",
          });
        }

        // Réinitialiser uniquement le mot de passe actuel en cas d'erreur
        setSecurity((prevState) => ({
          ...prevState,
          currentPassword: "",
        }));

        // Réinitialiser manuellement le champ de mot de passe actuel
        const passwordField = document.getElementsByName(
          randomPasswordFieldName.current
        )[0];
        if (passwordField) {
          passwordField.value = "";
        }
      }

      // Réinitialiser le flag
      userModifiedPassword.current = false;
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      setNotification({
        show: true,
        type: "error",
        message: "Erreur de connexion au serveur",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fermer la notification après 5 secondes
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Effet pour réinitialiser le mot de passe actuel uniquement lors du changement de section
  useEffect(() => {
    // Réinitialiser le mot de passe actuel uniquement lors du changement de section
    setSecurity((prevState) => ({
      ...prevState,
      currentPassword: "",
    }));

    // Réinitialiser le flag
    userModifiedPassword.current = false;
  }, [activeSection]);

  // Réinitialiser le champ de mot de passe actuel uniquement au montage du composant
  useEffect(() => {
    // Fonction pour effacer le champ de mot de passe uniquement au montage initial
    const clearPasswordField = () => {
      const passwordField = document.getElementsByName(
        randomPasswordFieldName.current
      )[0];
      if (passwordField) {
        // Effacer uniquement si l'utilisateur n'a pas commencé à saisir
        if (!userModifiedPassword.current) {
          passwordField.value = "";
          setSecurity((prevState) => ({
            ...prevState,
            currentPassword: "",
          }));
        }
      }
    };

    // Effacer uniquement au montage initial
    clearPasswordField();

    // Ajouter un écouteur d'événements pour détecter l'auto-remplissage
    const passwordField = document.getElementsByName(
      randomPasswordFieldName.current
    )[0];
    if (passwordField) {
      const handleAutofill = (e) => {
        if (
          e.animationName === "autofill" ||
          e.animationName === "onAutoFillStart"
        ) {
          // Le navigateur a auto-rempli le champ, mais l'utilisateur n'a pas encore interagi
          if (!userModifiedPassword.current) {
            setTimeout(() => {
              passwordField.value = "";
              setSecurity((prevState) => ({
                ...prevState,
                currentPassword: "",
              }));
            }, 10);
          }
        }
      };

      passwordField.addEventListener("animationstart", handleAutofill);

      return () => {
        passwordField.removeEventListener("animationstart", handleAutofill);
      };
    }
  }, [randomPasswordFieldName, activeSection]);

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      {/* Ajouter les styles d'animation */}
      <style>{styles.fadeIn}</style>
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec photo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            {profileImage ? (
              <>
                <img
                  src={profileImage}
                  alt="Profil"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900/50 shadow-lg group-hover:shadow-xl transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </>
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 border-4 border-blue-100 dark:border-blue-900/50">
                <UserCircle
                  size={40}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text dark:text-white text-transparent">
            Gestion du Profil
          </h1>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="flex-shrink-0" size={20} />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation latérale */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveSection("personal")}
              className={`w-full p-3 text-left rounded-xl flex items-center gap-2 transition-all duration-300 ${
                activeSection === "personal"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md"
              }`}
            >
              <User
                size={18}
                className={`flex-shrink-0 ${activeSection === "personal" ? "text-white" : "text-blue-500 dark:text-blue-400"}`}
              />
              <span>Informations Personnelles</span>
            </button>
            <button
              onClick={() => setActiveSection("security")}
              className={`w-full p-3 text-left rounded-xl flex items-center gap-2 transition-all duration-300 ${
                activeSection === "security"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md"
              }`}
            >
              <Lock
                size={18}
                className={`flex-shrink-0 ${activeSection === "security" ? "text-white" : "text-blue-500 dark:text-blue-400"}`}
              />
              <span>Sécurité</span>
            </button>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Section Informations Personnelles */}
            {activeSection === "personal" && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User
                    size={20}
                    className="text-blue-500 dark:text-blue-400"
                  />
                  <span>Profil Public</span>
                </h2>

                <form className="space-y-6" onSubmit={handleProfileSubmit}>
                  {/* Photo de profil */}
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                    <div className="relative group">
                      {imagePreview || profileImage ? (
                        <>
                          <img
                            src={imagePreview || profileImage}
                            alt="Photo de profil"
                            className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900/50 shadow-lg group-hover:shadow-xl transition-all duration-300"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 border-4 border-blue-100 dark:border-blue-900/50">
                          <UserCircle
                            size={64}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                          title="Changer la photo"
                        >
                          <Camera size={16} />
                        </button>
                        {(profileImage || imagePreview) && (
                          <button
                            type="button"
                            onClick={showDeleteConfirmation}
                            disabled={formSubmitting}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-full hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                            title="Supprimer la photo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
                        Photo de profil
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Formats supportés: JPG, PNG (max 2MB)
                      </p>
                      {imagePreview && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveProfileImage}
                            disabled={formSubmitting}
                            className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {formSubmitting
                              ? "Enregistrement..."
                              : "Enregistrer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations personnelles */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom Complet
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
                        <User
                          size={18}
                          className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                        />
                        <input
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
                        <Mail
                          size={18}
                          className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                        />
                        <input
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Téléphone
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
                        <Smartphone
                          size={18}
                          className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                        />
                        <input
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting || loading}
                    className="mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {formSubmitting
                      ? "Enregistrement..."
                      : "Enregistrer les modifications"}
                  </button>
                </form>
              </div>
            )}

            {/* Section Sécurité */}
            {activeSection === "security" && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Lock
                    size={20}
                    className="text-blue-500 dark:text-blue-400"
                  />
                  <span>Sécurité du Compte</span>
                </h2>

                <form
                  onSubmit={handleSecuritySubmit}
                  className="space-y-6"
                  autoComplete="off"
                >
                  {/* Changement de mot de passe */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Key
                        size={18}
                        className="text-blue-500 dark:text-blue-400"
                      />
                      <span>Changer le mot de passe</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Mot de passe actuel
                        </label>
                        <div className="relative">
                          <input
                            type={
                              passwordVisibility.currentPassword
                                ? "text"
                                : "password"
                            }
                            name={randomPasswordFieldName.current}
                            value={security.currentPassword}
                            onChange={handleSecurityChange}
                            autoComplete="new-password"
                            className="w-full bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePasswordVisibility("currentPassword")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                            aria-label={
                              passwordVisibility.currentPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                            title={
                              passwordVisibility.currentPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                          >
                            {passwordVisibility.currentPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={
                              passwordVisibility.newPassword
                                ? "text"
                                : "password"
                            }
                            name="newPassword"
                            value={security.newPassword}
                            onChange={handleSecurityChange}
                            autoComplete="new-password"
                            className="w-full bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePasswordVisibility("newPassword")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                            aria-label={
                              passwordVisibility.newPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                            title={
                              passwordVisibility.newPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                          >
                            {passwordVisibility.newPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Confirmer le nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={
                              passwordVisibility.confirmPassword
                                ? "text"
                                : "password"
                            }
                            name="confirmPassword"
                            value={security.confirmPassword}
                            onChange={handleSecurityChange}
                            autoComplete="new-password"
                            className="w-full bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePasswordVisibility("confirmPassword")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                            aria-label={
                              passwordVisibility.confirmPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                            title={
                              passwordVisibility.confirmPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                          >
                            {passwordVisibility.confirmPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={formSubmitting || loading}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {formSubmitting
                            ? "Mise à jour..."
                            : "Mettre à jour le mot de passe"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Suppression de compte */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={showDeleteAccountConfirmation}
                      disabled={formSubmitting}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={18} />
                      <span>Supprimer le compte</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Boîte de dialogue de confirmation */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
