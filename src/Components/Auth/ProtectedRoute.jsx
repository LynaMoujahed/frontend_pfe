import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading, token } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur est approuvé
  // Cette vérification doit être faite avant la vérification du rôle
  if (user.isApproved === false) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Vérifier le rôle si nécessaire
  if (requiredRole) {
    // Vérifier à la fois user.role (chaîne) et user.roles (tableau)
    const hasRole =
      (user.role &&
        ((requiredRole === "ROLE_APPRENANT" && user.role === "apprenant") ||
          (requiredRole === "ROLE_FORMATEUR" && user.role === "formateur") ||
          (requiredRole === "ROLE_ADMINISTRATEUR" &&
            user.role === "administrateur"))) ||
      (user.roles && user.roles.includes(requiredRole));

    if (!hasRole) {
      // Rediriger vers l'interface appropriée en fonction du rôle de l'utilisateur
      if (
        user.role === "apprenant" ||
        (user.roles && user.roles.includes("ROLE_APPRENANT"))
      ) {
        return <Navigate to="/apprenant" replace />;
      } else if (
        user.role === "formateur" ||
        (user.roles && user.roles.includes("ROLE_FORMATEUR"))
      ) {
        return <Navigate to="/formateur" replace />;
      } else if (
        user.role === "administrateur" ||
        (user.roles && user.roles.includes("ROLE_ADMINISTRATEUR"))
      ) {
        return <Navigate to="/admin" replace />;
      } else {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Rendre le composant enfant si l'utilisateur est authentifié, approuvé et a le rôle requis
  return children;
};

export default ProtectedRoute;
