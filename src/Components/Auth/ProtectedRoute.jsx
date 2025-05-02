import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading, token } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  // Ajouter des logs pour déboguer
  useEffect(() => {
    console.log("ProtectedRoute - user:", user);
    console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
    console.log("ProtectedRoute - requiredRole:", requiredRole);
    console.log("ProtectedRoute - token exists:", !!token);
    console.log("ProtectedRoute - loading:", loading);

    // Marquer l'authentification comme vérifiée une fois que le chargement est terminé
    if (!loading) {
      setAuthChecked(true);
    }
  }, [user, isAuthenticated, requiredRole, token, loading]);

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading || !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-blue-500">
          Vérification de l'authentification...
        </p>
      </div>
    );
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated || !user) {
    console.log(
      "Utilisateur non authentifié - Redirection vers la page de connexion"
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur est approuvé
  // Cette vérification doit être faite avant la vérification du rôle
  if (user.isApproved === false) {
    console.log(
      "Utilisateur non approuvé - Redirection vers la page d'accès non autorisé"
    );
    return <Navigate to="/unauthorized" replace />;
  }

  // Vérifier le rôle si nécessaire
  if (requiredRole && (!user.roles || !user.roles.includes(requiredRole))) {
    console.log(
      `Utilisateur sans le rôle requis (${requiredRole}) - Redirection vers la page d'accès non autorisé`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  // Rendre le composant enfant si l'utilisateur est authentifié, approuvé et a le rôle requis
  return children;
};

export default ProtectedRoute;
