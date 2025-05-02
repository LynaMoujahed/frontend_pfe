import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import {
  Camera,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  UserPlus,
  Shield,
  ChevronRight,
  Home,
} from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "apprenant",
    profileImage: null,
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Générer des noms aléatoires pour les champs pour tromper les gestionnaires de mots de passe
  const randomEmailName = useRef(
    `email_${Math.random().toString(36).substring(2, 15)}`
  );
  const randomPasswordName = useRef(
    `pwd_${Math.random().toString(36).substring(2, 15)}`
  );
  const randomConfirmPasswordName = useRef(
    `cpwd_${Math.random().toString(36).substring(2, 15)}`
  );

  // Effect pour désactiver l'autofill et les mots de passe enregistrés
  useEffect(() => {
    // Désactiver le gestionnaire de mots de passe du navigateur
    const disablePasswordManager = () => {
      // Créer un style qui masque les suggestions de mots de passe
      const style = document.createElement("style");
      style.textContent = `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          transition: background-color 5000s ease-in-out 0s;
          -webkit-text-fill-color: inherit !important;
        }
      `;
      document.head.appendChild(style);

      // Modifier les attributs des champs pour tromper le gestionnaire de mots de passe
      if (emailInputRef.current) {
        emailInputRef.current.setAttribute("autocomplete", "off");
        emailInputRef.current.setAttribute("readonly", "readonly");
        setTimeout(() => {
          if (emailInputRef.current) {
            emailInputRef.current.removeAttribute("readonly");
          }
        }, 100);
      }

      if (passwordInputRef.current) {
        passwordInputRef.current.setAttribute("autocomplete", "off");
        passwordInputRef.current.setAttribute("readonly", "readonly");
        setTimeout(() => {
          if (passwordInputRef.current) {
            passwordInputRef.current.removeAttribute("readonly");
          }
        }, 100);
      }

      if (confirmPasswordInputRef.current) {
        confirmPasswordInputRef.current.setAttribute("autocomplete", "off");
        confirmPasswordInputRef.current.setAttribute("readonly", "readonly");
        setTimeout(() => {
          if (confirmPasswordInputRef.current) {
            confirmPasswordInputRef.current.removeAttribute("readonly");
          }
        }, 100);
      }
    };

    disablePasswordManager();

    // Répéter après un court délai pour s'assurer que les modifications prennent effet
    const timeoutId = setTimeout(() => {
      disablePasswordManager();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("L'image ne doit pas dépasser 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Fonction pour effacer les mots de passe enregistrés lorsque l'utilisateur clique sur le champ email
  const handleEmailFocus = () => {
    if (emailInputRef.current) {
      const currentValue = emailInputRef.current.value;
      emailInputRef.current.value = "";
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.value = currentValue;
        }
      }, 10);
    }
  };

  // Fonction pour effacer les mots de passe enregistrés lorsque l'utilisateur clique sur le champ mot de passe
  const handlePasswordFocus = () => {
    if (passwordInputRef.current) {
      const currentValue = passwordInputRef.current.value;
      passwordInputRef.current.value = "";
      setTimeout(() => {
        if (passwordInputRef.current) {
          passwordInputRef.current.value = currentValue;
        }
      }, 10);
    }
  };

  // Fonction pour effacer les mots de passe enregistrés lorsque l'utilisateur clique sur le champ confirmation mot de passe
  const handleConfirmPasswordFocus = () => {
    if (confirmPasswordInputRef.current) {
      const currentValue = confirmPasswordInputRef.current.value;
      confirmPasswordInputRef.current.value = "";
      setTimeout(() => {
        if (confirmPasswordInputRef.current) {
          confirmPasswordInputRef.current.value = currentValue;
        }
      }, 10);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setFormError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Les mots de passe ne correspondent pas");
      return;
    }

    const userData = {
      ...formData,
      phone: parseInt(formData.phone, 10),
    };
    delete userData.confirmPassword;

    const result = await register(userData);

    if (result.success) {
      // Vérifier si l'utilisateur est approuvé automatiquement ou non
      if (result.user && result.user.isApproved) {
        setSuccessMessage(
          "Inscription réussie ! Vous pouvez maintenant vous connecter avec vos identifiants."
        );
      } else {
        setSuccessMessage(
          "Inscription réussie ! Votre compte est en attente d'approbation par un administrateur. Vous recevrez un email lorsque votre compte sera approuvé. Si votre demande est rejetée, vous recevrez également un email avec la raison du rejet."
        );
      }
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setFormError(
        Array.isArray(result.error) ? result.error.join(", ") : result.error
      );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      {/* Home button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        title="Retour à l'accueil"
      >
        <Home className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
      </Link>

      {/* Centered Registration form */}
      <div className="w-full h-screen overflow-y-auto py-8 px-4 sm:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Card header with subtle gradient */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/50 p-6 text-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Créer un compte
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Remplissez le formulaire pour vous inscrire
              </p>
            </div>

            <div className="p-8 sm:p-10">
              {formError && (
                <div
                  className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start"
                  role="alert"
                >
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div
                  className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-start"
                  role="alert"
                >
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Photo de profil */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    {imagePreview ? (
                      <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-900/50 shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
                        <img
                          src={imagePreview}
                          alt="Aperçu de la photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-blue-100 dark:border-blue-900/50 shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
                        <User
                          size={40}
                          className="text-gray-400 dark:text-gray-500"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      <Camera size={16} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 -mt-4 mb-4">
                  Photo de profil (optionnel) - JPG, PNG (max 2MB)
                </p>

                <div className="space-y-5">
                  {/* Nom complet */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Nom complet
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre nom complet"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Adresse email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="email"
                        name={randomEmailName.current}
                        type="email"
                        autoComplete="chrome-off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="email"
                        data-lpignore="true"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre adresse email"
                        value={formData.email}
                        onChange={(e) =>
                          handleChange({
                            ...e,
                            target: { ...e.target, name: "email" },
                          })
                        }
                        onFocus={handleEmailFocus}
                        onClick={handleEmailFocus}
                        ref={emailInputRef}
                        onfocus="this.setAttribute('autocomplete', 'nope')"
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Téléphone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre numéro de téléphone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="password"
                        name={randomPasswordName.current}
                        type={showPassword ? "text" : "password"}
                        autoComplete="chrome-off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="password"
                        data-lpignore="true"
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre mot de passe"
                        value={formData.password}
                        onChange={(e) =>
                          handleChange({
                            ...e,
                            target: { ...e.target, name: "password" },
                          })
                        }
                        onFocus={handlePasswordFocus}
                        onClick={handlePasswordFocus}
                        ref={passwordInputRef}
                        onfocus="this.setAttribute('autocomplete', 'nope')"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="confirmPassword"
                        name={randomConfirmPasswordName.current}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="chrome-off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="password"
                        data-lpignore="true"
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Confirmez votre mot de passe"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleChange({
                            ...e,
                            target: { ...e.target, name: "confirmPassword" },
                          })
                        }
                        onFocus={handleConfirmPasswordFocus}
                        onClick={handleConfirmPasswordFocus}
                        ref={confirmPasswordInputRef}
                        onfocus="this.setAttribute('autocomplete', 'nope')"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Rôle */}
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Rôle
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <select
                        id="role"
                        name="role"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                        value={formData.role}
                        onChange={handleChange}
                      >
                        <option value="apprenant">Apprenant</option>
                        <option value="formateur">Formateur</option>
                        <option value="administrateur">Administrateur</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 transform rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <UserPlus className="h-5 w-5 text-blue-300 group-hover:text-blue-200" />
                    </span>
                    {loading ? "Inscription en cours..." : "S'inscrire"}
                  </button>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        Déjà inscrit ?
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous avez déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center hover:underline"
                >
                  Se connecter
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
