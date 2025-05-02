import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, Home } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Effet pour désactiver l'autocomplétion et les suggestions de mots de passe
  useEffect(() => {
    // Ajouter un style pour désactiver les suggestions de mots de passe
    const style = document.createElement("style");
    style.textContent = `
      /* Masquer les suggestions de mots de passe */
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        transition: background-color 5000s ease-in-out 0s;
        -webkit-text-fill-color: inherit !important;
      }

      /* Masquer les boutons de gestion des mots de passe */
      input::-webkit-credentials-auto-fill-button,
      input::-webkit-contacts-auto-fill-button {
        visibility: hidden !important;
        display: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Nettoyer le style lors du démontage du composant
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password) {
      setFormError("Veuillez remplir tous les champs");
      return;
    }

    // Utiliser les valeurs email et password pour l'authentification
    const result = await login(email, password, rememberMe);

    if (result.success) {
      navigate("/admin");
    } else if (result.status === "pending") {
      setFormError(
        "Votre compte est en attente d'approbation par un administrateur. Vous recevrez un email lorsque votre compte sera approuvé ou rejeté."
      );
    } else {
      setFormError(result.error || "Erreur de connexion");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

      {/* Centered Login form */}
      <div className="w-full h-screen flex items-center justify-center overflow-y-auto py-8 px-4 sm:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Card header with subtle gradient */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/50 p-6 text-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Connexion
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Accédez à votre espace personnel
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

              <form
                className="space-y-6"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                {/* Champs cachés pour tromper l'autocomplétion du navigateur */}
                <div style={{ display: "none" }}>
                  <input type="text" name="fakeusernameremembered" />
                  <input type="password" name="fakepasswordremembered" />
                </div>

                <div className="space-y-5">
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
                        required
                        autoComplete="off"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre adresse email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

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
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Se souvenir de moi
                    </label>
                  </div>
                  <div className="text-sm">
                    <Link
                      to="/forgot-password"
                      className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-200" />
                    </span>
                    {loading ? "Connexion en cours..." : "Se connecter"}
                  </button>
                </div>
              </form>
            </div>
            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pas encore de compte ?{" "}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center hover:underline"
                >
                  S'inscrire
                  <UserPlus className="ml-1 h-4 w-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
