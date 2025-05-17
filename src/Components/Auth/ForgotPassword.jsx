import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Home } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Effect pour désactiver l'autofill
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

      return () => {
        // Nettoyer le style lors du démontage du composant
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    };

    return disablePasswordManager();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!email) {
      setFormError("Veuillez entrer votre adresse email");
      return;
    }

    // Validation simple de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });

      setSuccessMessage(
        "Si votre email est associé à un compte, vous recevrez un lien de réinitialisation de mot de passe."
      );

      // Réinitialiser le formulaire
      setEmail("");

      // Rediriger vers la page de connexion après 5 secondes
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);

      // Même en cas d'erreur, afficher un message générique pour des raisons de sécurité
      setSuccessMessage(
        "Si votre email est associé à un compte, vous recevrez un lien de réinitialisation de mot de passe."
      );
    } finally {
      setLoading(false);
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

      {/* Centered form */}
      <div className="w-full h-screen flex items-center justify-center overflow-y-auto py-8 px-4 sm:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Card header with subtle gradient */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/50 p-6 text-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Mot de passe oublié
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Réinitialisez votre mot de passe
              </p>
            </div>

            <div className="p-8">
              {successMessage ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <p className="text-green-700 dark:text-green-400">
                    {successMessage}
                  </p>
                  <p className="text-green-600 dark:text-green-500 mt-2 text-sm">
                    Vous allez être redirigé vers la page de connexion...
                  </p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {formError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <p className="text-red-700 dark:text-red-400">
                        {formError}
                      </p>
                    </div>
                  )}

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
                        name="email"
                        type="email"
                        autoComplete="off"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre adresse email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Entrez l'adresse email associée à votre compte pour
                      recevoir un lien de réinitialisation.
                    </p>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Envoi en cours...
                        </>
                      ) : (
                        "Envoyer le lien de réinitialisation"
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center mt-4">
                    <Link
                      to="/login"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Retour à la connexion
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
