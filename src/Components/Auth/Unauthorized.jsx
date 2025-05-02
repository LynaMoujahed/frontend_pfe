import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";

const Unauthorized = () => {
  const { user, logout } = useAuth();

  // Vérifier si l'utilisateur n'est pas approuvé
  const isNotApproved = user && user.isApproved === false;

  // Message à afficher en fonction du statut de l'utilisateur
  const message = isNotApproved
    ? "Votre compte est en attente d'approbation par un administrateur. Vous recevrez un email lorsque votre compte sera approuvé."
    : "Vous n'avez pas les permissions nécessaires pour accéder à cette page.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-red-600 text-6xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Accès non autorisé
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col space-y-3">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retour à l'accueil
          </Link>
          {isNotApproved && (
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Se déconnecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
