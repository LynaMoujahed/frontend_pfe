/**
 * Fonction utilitaire pour générer les en-têtes d'authentification
 * Utilisée par les services pour les requêtes API authentifiées
 * @returns {Object} En-têtes HTTP avec le token d'authentification si disponible
 */
export default function authHeader() {
  const token = localStorage.getItem("token");

  // Ajouter des logs pour le débogage
  console.log("🔑 [authHeader] Token récupéré:", token ? "Présent" : "Absent");

  if (token) {
    // Ajouter des en-têtes CORS pour les requêtes authentifiées
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  } else {
    console.warn("⚠️ [authHeader] Aucun token trouvé dans localStorage");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }
}
