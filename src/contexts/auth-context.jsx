import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour vérifier si le token JWT est expiré
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      // Décoder le token JWT (format: header.payload.signature)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();

      return currentTime >= expirationTime;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de l'expiration du token:",
        error
      );
      return true; // En cas d'erreur, considérer le token comme expiré
    }
  };

  // Fonction pour vérifier si le token est sur le point d'expirer (moins de 5 minutes)
  const isTokenNearExpiration = (token) => {
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();

      // Vérifier si le token expire dans moins de 5 minutes
      return expirationTime - currentTime < 300000;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de l'expiration du token:",
        error
      );
      return false;
    }
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      console.log(
        "Checking authentication with token:",
        token ? "Token exists" : "No token"
      );
      setLoading(true);
      try {
        if (token) {
          // Vérifier si le token est expiré
          if (isTokenExpired(token)) {
            console.log("Token is expired, removing token and user data");
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }

          // Récupérer les informations de l'utilisateur
          try {
            console.log("Fetching user data from API");
            const response = await fetch(`${API_URL}/user/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              mode: "cors",
            });

            if (response.ok) {
              const data = await response.json();
              console.log(
                "User data received:",
                data.user
                  ? `ID: ${data.user.id}, Role: ${data.user.role}`
                  : "No user data"
              );

              // Vérifier que l'ID utilisateur est présent
              if (data.user && !data.user.id) {
                console.error(
                  "User data received but ID is missing:",
                  data.user
                );
                // Essayer de récupérer l'ID à partir d'autres propriétés si possible
                if (data.user.userId) {
                  console.log("Using userId property instead of id");
                  data.user.id = data.user.userId;
                } else if (data.user._id) {
                  console.log("Using _id property instead of id");
                  data.user.id = data.user._id;
                } else {
                  console.error("Could not find any ID property in user data");
                }
              }

              setUser(data.user);

              // Si le token est sur le point d'expirer, on pourrait implémenter un système de rafraîchissement du token ici
              if (isTokenNearExpiration(token)) {
                console.log("Token is near expiration");
                // Logique pour rafraîchir le token ou afficher un avertissement
              }
            } else {
              console.log(
                "Invalid or expired token response:",
                response.status
              );
              // Token invalide ou expiré
              localStorage.removeItem("token");
              setToken(null);
              setUser(null);
            }
          } catch (fetchError) {
            console.error(
              "Erreur lors de la récupération des informations utilisateur:",
              fetchError
            );
            setError("Erreur de connexion au serveur");
            // Ne pas déconnecter l'utilisateur en cas d'erreur réseau temporaire
          }
        } else {
          console.log("No token available, user is not authenticated");
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'authentification:",
          error
        );
        setError("Erreur de connexion au serveur");
      } finally {
        setLoading(false);
        console.log(
          "Authentication check completed, loading state set to false"
        );
      }
    };

    checkAuth();
  }, [token]);

  // Fonction de connexion
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);

        // Vérifier que l'ID utilisateur est présent
        if (data.user && !data.user.id) {
          console.error(
            "User data received during login but ID is missing:",
            data.user
          );
          // Essayer de récupérer l'ID à partir d'autres propriétés si possible
          if (data.user.userId) {
            console.log("Using userId property instead of id");
            data.user.id = data.user.userId;
          } else if (data.user._id) {
            console.log("Using _id property instead of id");
            data.user.id = data.user._id;
          } else {
            console.error(
              "Could not find any ID property in user data during login"
            );
          }
        }

        setUser(data.user);

        return { success: true, user: data.user };
      } else if (response.status === 403 && data.status === "pending") {
        // L'utilisateur est en attente d'approbation
        return {
          success: false,
          error: data.message,
          status: "pending",
        };
      } else {
        setError(data.message || "Identifiants invalides");
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      setError("Erreur de connexion au serveur");
      return { success: false, error: "Erreur de connexion au serveur" };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message,
          user: data.user, // Inclure les informations de l'utilisateur
        };
      } else {
        setError(data.message || "Erreur lors de l'inscription");
        return { success: false, error: data.message || data.errors };
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setError("Erreur de connexion au serveur");
      return { success: false, error: "Erreur de connexion au serveur" };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (userId, userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok) {
        // Mettre à jour l'utilisateur dans le contexte
        setUser((prevUser) => ({ ...prevUser, ...data.user }));
        return { success: true, message: data.message };
      } else {
        // Vérifier si c'est une erreur de conflit (username ou email déjà utilisé)
        if (response.status === 409) {
          // Déterminer si c'est un conflit de nom d'utilisateur ou d'email
          if (data.message && data.message.includes("nom d'utilisateur")) {
            return {
              success: false,
              error: data.message,
              conflictType: "username",
            };
          } else if (data.message && data.message.includes("email")) {
            return {
              success: false,
              error: data.message,
              conflictType: "email",
            };
          }
        }

        setError(data.message || "Erreur lors de la mise à jour du profil");
        return { success: false, error: data.message || data.errors };
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      setError("Erreur de connexion au serveur");
      return { success: false, error: "Erreur de connexion au serveur" };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de suppression de compte
  const deleteAccount = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Tentative de suppression du compte utilisateur ${userId}`);
      console.log(`Token utilisé: ${token ? "Présent" : "Absent"}`);

      // Vérifier si le token est présent
      if (!token) {
        console.error("Tentative de suppression de compte sans token");
        return { success: false, error: "Authentification requise" };
      }

      // Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        console.error("Token expiré lors de la suppression du compte");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      }

      const response = await fetch(`${API_URL}/user/${userId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });

      console.log(`Réponse reçue: Status ${response.status}`);

      // Vérifier si la réponse est au format JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("La réponse n'est pas au format JSON:", contentType);
        const textResponse = await response.text();
        console.error("Contenu de la réponse non-JSON:", textResponse);
        return {
          success: false,
          error: `Réponse non-JSON reçue (${response.status}): ${textResponse.substring(0, 100)}...`,
        };
      }

      const data = await response.json();
      console.log("Données reçues:", data);

      if (response.ok) {
        // Déconnecter l'utilisateur après la suppression du compte
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return { success: true, message: data.message };
      } else if (response.status === 401) {
        // Token expiré ou invalide
        console.error(
          "Token expiré ou invalide lors de la suppression du compte"
        );
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      } else {
        setError(data.message || "Erreur lors de la suppression du compte");
        return { success: false, error: data.message || data.errors };
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error);
      setError("Erreur de connexion au serveur");
      return { success: false, error: "Erreur de connexion au serveur" };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les utilisateurs en attente d'approbation avec gestion du cache
  const getPendingUsers = async () => {
    setLoading(true);
    try {
      // Vérifier si le token est présent
      if (!token) {
        console.error("Tentative d'accès à une ressource protégée sans token");
        return { success: false, error: "Authentification requise" };
      }

      // Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        console.error(
          "Token expiré lors de la récupération des utilisateurs en attente"
        );
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      }

      // Utiliser un cache côté client pour éviter les requêtes répétées
      const cacheKey = "pendingUsers";
      const cachedData = sessionStorage.getItem(cacheKey);
      const now = Date.now();

      if (cachedData) {
        try {
          const { timestamp, data } = JSON.parse(cachedData);
          // Utiliser le cache si les données ont moins de 30 secondes
          if (now - timestamp < 30000) {
            setLoading(false);
            return { success: true, users: data.users, fromCache: true };
          }
        } catch (e) {
          console.error("Erreur lors de la lecture du cache:", e);
          // Continuer avec la requête API en cas d'erreur de cache
        }
      }

      const response = await fetch(`${API_URL}/admin/users/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      // Vérifier si la réponse est au format JSON
      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        console.error("La réponse n'est pas au format JSON:", contentType);
        const textResponse = await response.text();
        console.error("Contenu de la réponse non-JSON:", textResponse);
        return {
          success: false,
          error: `Réponse non-JSON reçue (${response.status}): ${textResponse.substring(0, 100)}...`,
        };
      }

      const data = await response.json();

      if (response.ok) {
        if (!data.users) {
          console.error("La propriété 'users' est manquante dans la réponse");
          return { success: false, error: "Format de réponse invalide" };
        }

        // Mettre en cache les données
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ timestamp: now, data })
          );
        } catch (e) {
          console.error("Erreur lors de la mise en cache des données:", e);
          // Continuer même si la mise en cache échoue
        }

        return { success: true, users: data.users };
      } else if (response.status === 401) {
        // Token expiré ou invalide
        console.error("Token expiré ou invalide");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      } else {
        console.error("Erreur API:", data.message || "Erreur inconnue");
        return { success: false, error: data.message || "Erreur inconnue" };
      }
    } catch (error) {
      console.error(
        "Exception lors de la récupération des utilisateurs en attente:",
        error
      );
      return {
        success: false,
        error: `Erreur de connexion au serveur: ${error.message}`,
      };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour approuver un utilisateur
  const approveUser = async (userId) => {
    setLoading(true);
    try {
      // Vérifier si le token est présent
      if (!token) {
        console.error("Tentative d'approbation sans token");
        return { success: false, error: "Authentification requise" };
      }

      // Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        console.error("Token expiré lors de l'approbation de l'utilisateur");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      }

      const response = await fetch(`${API_URL}/admin/users/approve/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      // Vérifier si la réponse est au format JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(
          "La réponse d'approbation n'est pas au format JSON:",
          contentType
        );
        const textResponse = await response.text();
        console.error("Contenu de la réponse non-JSON:", textResponse);
        return {
          success: false,
          error: `Réponse non-JSON reçue (${response.status})`,
        };
      }

      const data = await response.json();

      if (response.ok) {
        // Invalider le cache des utilisateurs en attente
        try {
          sessionStorage.removeItem("pendingUsers");
        } catch (e) {
          console.error("Erreur lors de l'invalidation du cache:", e);
        }

        return { success: true, message: data.message, user: data.user };
      } else if (response.status === 401) {
        // Token expiré ou invalide
        console.error("Token expiré ou invalide lors de l'approbation");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      } else {
        console.error(
          "Erreur lors de l'approbation:",
          data.message || "Erreur inconnue"
        );
        return { success: false, error: data.message || "Erreur inconnue" };
      }
    } catch (error) {
      console.error("Exception lors de l'approbation de l'utilisateur:", error);
      return {
        success: false,
        error: `Erreur de connexion au serveur: ${error.message}`,
      };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rejeter un utilisateur
  const rejectUser = async (userId, reason) => {
    setLoading(true);
    try {
      // Vérifier si le token est présent
      if (!token) {
        console.error("Tentative de rejet sans token");
        return { success: false, error: "Authentification requise" };
      }

      // Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        console.error("Token expiré lors du rejet de l'utilisateur");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      }

      const response = await fetch(`${API_URL}/admin/users/reject/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
        mode: "cors",
      });

      // Vérifier si la réponse est au format JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(
          "La réponse de rejet n'est pas au format JSON:",
          contentType
        );
        const textResponse = await response.text();
        console.error("Contenu de la réponse non-JSON:", textResponse);
        return {
          success: false,
          error: `Réponse non-JSON reçue (${response.status})`,
        };
      }

      const data = await response.json();

      if (response.ok) {
        // Invalider le cache des utilisateurs en attente
        try {
          sessionStorage.removeItem("pendingUsers");
        } catch (e) {
          console.error("Erreur lors de l'invalidation du cache:", e);
        }

        return { success: true, message: data.message };
      } else if (response.status === 401) {
        // Token expiré ou invalide
        console.error("Token expiré ou invalide lors du rejet");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return {
          success: false,
          error: "Session expirée, veuillez vous reconnecter",
        };
      } else {
        console.error(
          "Erreur lors du rejet:",
          data.message || "Erreur inconnue"
        );
        return { success: false, error: data.message || "Erreur inconnue" };
      }
    } catch (error) {
      console.error("Exception lors du rejet de l'utilisateur:", error);
      return {
        success: false,
        error: `Erreur de connexion au serveur: ${error.message}`,
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    getPendingUsers,
    approveUser,
    rejectUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider"
    );
  }
  return context;
};
