import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  Book,
  ClipboardCheck,
  FileText,
  Users,
  MessageSquare,
  BookOpen,
  Award,
  Download,
  TrendingUp,
  Activity,
  BarChart2,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useTheme } from "../../contexts/theme-context";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../contexts/auth-context";

// Couleurs utilisées pour les graphiques
const COLORS = ["#0ea5e9", "#10b981", "#1e40af", "#f59e0b", "#ef4444"];

// Composant pour afficher un badge de tendance (hausse/baisse)
const TrendBadge = ({ value }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-300 ${
      value >= 0
        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100" // Style pour valeur positive
        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100" // Style pour valeur négative
    }`}
  >
    {value >= 0 ? (
      <ArrowUp className="mr-1 h-3 w-3" />
    ) : (
      <ArrowDown className="mr-1 h-3 w-3" />
    )}
    {Math.abs(value)}%
  </span>
);

// Fonction pour échapper les valeurs CSV (pour éviter les problèmes avec les virgules)
const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  // Si la valeur contient une virgule, des guillemets ou un saut de ligne, l'entourer de guillemets
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    // Échapper les guillemets en les doublant
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Fonction pour créer une ligne CSV
const createCSVRow = (...values) => {
  return values.map(escapeCSV).join(";") + "\n";
};

// Composant principal du tableau de bord
const FormateurDashboardPage = () => {
  const { theme } = useTheme(); // Hook pour gérer le thème (clair/sombre)
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: { value: 0, growth: 0 },
      totalApprenants: { value: 0, growth: 0 },
      totalCourses: { value: 0, growth: 0 },
      totalQuizzes: { value: 0, growth: 0 },
      evaluationsDone: { value: 0, growth: 0 },
      pendingEvaluations: { value: 0, growth: 0 },
      totalCertificats: { value: 0, growth: 0 },
    },
    userDistribution: [],
    courseStats: [],
    evaluationTrend: [],
    recentEvaluations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Récupération des données du dashboard formateur...");

        // Ajouter un timeout pour éviter les attentes infinies
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout

        const response = await axios.get(
          `${API_URL}/dashboard/formateur/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        // Annuler le timeout si la requête a réussi
        clearTimeout(timeoutId);

        console.log("Données du dashboard reçues:", response.data);

        // Vérifier si les données courseStats sont présentes et valides
        if (
          !response.data.courseStats ||
          !Array.isArray(response.data.courseStats)
        ) {
          console.warn(
            "Données courseStats manquantes ou invalides, initialisation d'un tableau vide"
          );
          // Initialiser un tableau vide si les données courseStats sont manquantes ou invalides
          response.data.courseStats = [];
        }

        // Vérifier si les données recentEvaluations sont présentes et valides
        if (
          !response.data.recentEvaluations ||
          !Array.isArray(response.data.recentEvaluations)
        ) {
          console.warn(
            "Données recentEvaluations manquantes ou invalides, initialisation d'un tableau vide"
          );
          // Initialiser un tableau vide si les données recentEvaluations sont manquantes ou invalides
          response.data.recentEvaluations = [];
        }

        // Log détaillé des données courseStats
        console.log("DÉTAILS DES DONNÉES COURSESSTATS:");
        if (response.data.courseStats && response.data.courseStats.length > 0) {
          response.data.courseStats.forEach((course, index) => {
            console.log(`Cours ${index + 1}:`, {
              Titre: course.course,
              "Nombre d'évaluations": course.evaluationCount,
              "Progression moyenne (%)": course.avgProgress,
              "Nombre de quiz": course.quizCount,
              "Évaluations existantes": course.evalCount,
            });
          });
        } else {
          console.log("Aucune donnée courseStats disponible");
        }

        // Log détaillé des données recentEvaluations
        console.log("DÉTAILS DES DONNÉES RECENTEVALUATIONS:");
        if (
          response.data.recentEvaluations &&
          response.data.recentEvaluations.length > 0
        ) {
          response.data.recentEvaluations.forEach((evaluation, index) => {
            console.log(`Évaluation ${index + 1}:`, {
              ID: evaluation.id,
              Apprenant: evaluation.apprenant,
              Cours: evaluation.cours,
              Statut: evaluation.status,
              Date: evaluation.date,
            });
          });
        } else {
          console.log("Aucune donnée recentEvaluations disponible");
        }

        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des données du dashboard:",
          err
        );

        console.error("Détails de l'erreur:", err.response || err);

        // Déterminer le message d'erreur approprié
        let errorMessage =
          "Impossible de charger les données du dashboard. Veuillez vérifier votre connexion et réessayer.";

        if (err.name === "AbortError") {
          errorMessage =
            "La requête a pris trop de temps. Veuillez vérifier la connexion au serveur et réessayer.";
        } else if (err.response) {
          // Erreur de réponse du serveur
          if (err.response.status === 401) {
            errorMessage =
              "Vous n'êtes pas autorisé à accéder à ces données. Veuillez vous reconnecter.";
          } else if (err.response.status === 403) {
            errorMessage =
              "Vous n'avez pas les permissions nécessaires pour accéder à ces données.";
          } else if (err.response.status === 500) {
            errorMessage =
              "Une erreur est survenue sur le serveur. Veuillez réessayer ultérieurement.";
          }
        } else if (err.request) {
          // Pas de réponse du serveur
          errorMessage =
            "Impossible de communiquer avec le serveur. Veuillez vérifier votre connexion internet.";
        }

        // En cas d'erreur, initialiser avec des structures vides
        // pour éviter les erreurs de rendu
        setDashboardData({
          stats: {
            totalUsers: { value: 0, growth: 0 },
            totalApprenants: { value: 0, growth: 0 },
            totalCourses: { value: 0, growth: 0 },
            totalQuizzes: { value: 0, growth: 0 },
            evaluationsDone: { value: 0, growth: 0 },
            pendingEvaluations: { value: 0, growth: 0 },
            totalCertificats: { value: 0, growth: 0 },
          },
          userDistribution: [],
          courseStats: [],
          evaluationTrend: [],
          recentEvaluations: [],
        });

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Chargement des données...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-y-5 dark:bg-gray-900 dark:text-white">
        {/* Alerte d'erreur */}
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 mb-4">
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-600 dark:text-red-400 mr-2"
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
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
              Erreur de chargement des données
            </h2>
          </div>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Impossible de charger les données du tableau de bord
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Veuillez vérifier votre connexion internet et l'état du serveur,
              puis réessayez.
            </p>
          </div>
          <div className="w-full max-w-md p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Suggestions:
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li>Vérifiez votre connexion internet</li>
              <li>
                Assurez-vous que le serveur backend est en cours d'exécution
              </li>
              <li>
                Vérifiez que vous êtes bien connecté avec les droits d'accès
                appropriés
              </li>
              <li>
                Contactez l'administrateur système si le problème persiste
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Fonction pour exporter les données du dashboard en format Excel/CSV
  const exportDashboardData = () => {
    try {
      // Créer les données pour l'export
      const now = new Date();
      const currentDate = now.toLocaleDateString("fr-FR");
      const currentTime = now.toLocaleTimeString("fr-FR");

      // Créer un tableau vide pour simuler une cellule vide
      const empty = "";

      // En-tête du fichier avec informations détaillées
      let csvContent = createCSVRow(
        "PHARMALEARN - RAPPORT DU TABLEAU DE BORD FORMATEUR"
      );
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("Date d'exportation:", currentDate);
      csvContent += createCSVRow("Heure d'exportation:", currentTime);
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("=".repeat(50)); // Ligne de séparation
      csvContent += createCSVRow(empty);

      // 1. STATISTIQUES GÉNÉRALES
      csvContent += createCSVRow("1. STATISTIQUES GÉNÉRALES");
      csvContent += createCSVRow(empty);

      // Tableau des statistiques avec en-têtes
      csvContent += createCSVRow(
        "Métrique",
        "Valeur",
        "Croissance (%)",
        "Commentaire"
      );

      // Fonction pour ajouter un commentaire basé sur la croissance
      const getGrowthComment = (growth) => {
        if (growth > 20) return "Croissance excellente";
        if (growth > 10) return "Bonne croissance";
        if (growth > 0) return "Croissance positive";
        if (growth === 0) return "Stable";
        if (growth > -10) return "Légère baisse";
        return "Baisse significative";
      };

      // Ajouter les lignes avec commentaires
      csvContent += createCSVRow(
        "Apprenants",
        dashboardData.stats.totalApprenants
          ? dashboardData.stats.totalApprenants.value
          : dashboardData.stats.totalUsers.value,
        dashboardData.stats.totalApprenants
          ? dashboardData.stats.totalApprenants.growth
          : dashboardData.stats.totalUsers.growth,
        getGrowthComment(
          dashboardData.stats.totalApprenants
            ? dashboardData.stats.totalApprenants.growth
            : dashboardData.stats.totalUsers.growth
        )
      );
      csvContent += createCSVRow(
        "Cours",
        dashboardData.stats.totalCourses.value,
        dashboardData.stats.totalCourses.growth,
        getGrowthComment(dashboardData.stats.totalCourses.growth)
      );
      csvContent += createCSVRow(
        "Quiz",
        dashboardData.stats.totalQuizzes.value,
        dashboardData.stats.totalQuizzes.growth,
        getGrowthComment(dashboardData.stats.totalQuizzes.growth)
      );
      csvContent += createCSVRow(
        "Évaluations",
        dashboardData.stats.evaluationsDone.value,
        dashboardData.stats.evaluationsDone.growth,
        getGrowthComment(dashboardData.stats.evaluationsDone.growth)
      );
      csvContent += createCSVRow(
        "Certificats",
        dashboardData.stats.totalCertificats?.value || 0,
        dashboardData.stats.totalCertificats?.growth || 0,
        getGrowthComment(dashboardData.stats.totalCertificats?.growth || 0)
      );

      // Séparateur de section
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("=".repeat(50));
      csvContent += createCSVRow(empty);

      // 2. RÉPARTITION DES UTILISATEURS
      csvContent += createCSVRow("2. RÉPARTITION DES UTILISATEURS");
      csvContent += createCSVRow(empty);

      // Tableau de répartition avec en-têtes
      csvContent += createCSVRow("Rôle", "Nombre", "Pourcentage (%)");

      // Calculer le total des utilisateurs pour les pourcentages
      const totalUsers = dashboardData.userDistribution.reduce(
        (sum, item) => sum + item.count,
        0
      );

      // Ajouter les lignes avec pourcentages
      dashboardData.userDistribution.forEach((item) => {
        const percentage =
          totalUsers > 0
            ? ((item.count / totalUsers) * 100).toFixed(2)
            : "0.00";
        csvContent += createCSVRow(item.role, item.count, percentage);
      });

      // Ajouter une ligne de total
      csvContent += createCSVRow("Total", totalUsers, "100.00");

      // Séparateur de section
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("=".repeat(50));
      csvContent += createCSVRow(empty);

      // 3. PERFORMANCE DES COURS
      csvContent += createCSVRow("3. PERFORMANCE DES COURS");
      csvContent += createCSVRow(empty);

      // Tableau de performance avec en-têtes
      csvContent += createCSVRow(
        "Cours",
        "Progression Moyenne (%)",
        "Nombre d'évaluations",
        "Statut"
      );

      // Fonction pour déterminer le statut du cours
      const getCourseStatus = (progress) => {
        if (progress >= 90) return "Excellent";
        if (progress >= 75) return "Bon";
        if (progress >= 50) return "Moyen";
        return "Besoin d'attention";
      };

      // Ajouter les lignes avec statut
      dashboardData.courseStats.forEach((item) => {
        const progress = item.avgProgress || 0;
        csvContent += createCSVRow(
          item.course,
          progress,
          item.evaluationCount || 0,
          getCourseStatus(progress)
        );
      });

      // Séparateur de section
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("=".repeat(50));
      csvContent += createCSVRow(empty);

      // 4. TENDANCE DES ÉVALUATIONS
      csvContent += createCSVRow("4. TENDANCE DES ÉVALUATIONS");
      csvContent += createCSVRow(empty);

      // Tableau de tendance avec en-têtes
      csvContent += createCSVRow("Mois", "Nombre d'évaluations", "Tendance");

      // Ajouter les lignes avec tendance
      let prevEvaluations = null;
      dashboardData.evaluationTrend.forEach((item, index) => {
        let trend = "Stable";
        if (index > 0 && prevEvaluations !== null) {
          const diff = item.evaluations - prevEvaluations;
          const percentChange =
            prevEvaluations > 0 ? (diff / prevEvaluations) * 100 : 0;

          if (percentChange > 10) trend = "Forte hausse";
          else if (percentChange > 0) trend = "Hausse";
          else if (percentChange < -10) trend = "Forte baisse";
          else if (percentChange < 0) trend = "Baisse";
        }

        csvContent += createCSVRow(item.month, item.evaluations, trend);
        prevEvaluations = item.evaluations;
      });

      // Séparateur de section
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("=".repeat(50));
      csvContent += createCSVRow(empty);

      // 5. ÉVALUATIONS RÉCENTES
      csvContent += createCSVRow("5. ÉVALUATIONS RÉCENTES");
      csvContent += createCSVRow(empty);

      // Tableau des évaluations avec en-têtes
      csvContent += createCSVRow(
        "ID",
        "Apprenant",
        "Cours",
        "Statut",
        "Date",
        "Jours écoulés"
      );

      // Ajouter les lignes avec jours écoulés
      dashboardData.recentEvaluations.forEach((item) => {
        // Calculer le nombre de jours écoulés depuis l'évaluation
        const evalDate = new Date(item.date);
        const daysDiff = Math.floor((now - evalDate) / (1000 * 60 * 60 * 24));

        csvContent += createCSVRow(
          item.id,
          item.apprenant,
          item.cours,
          item.status,
          item.date,
          daysDiff
        );
      });

      // Pied de page
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow("=".repeat(50));
      csvContent += createCSVRow(empty);
      csvContent += createCSVRow(
        "Rapport généré automatiquement par PharmaLearn"
      );
      csvContent += createCSVRow(
        "© " + new Date().getFullYear() + " PharmaLearn - Tous droits réservés"
      );

      // Créer un objet Blob avec le contenu CSV
      // Ajouter BOM (Byte Order Mark) pour que Excel reconnaisse correctement les caractères UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Créer un lien pour télécharger le fichier
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Configurer le lien
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `rapport_dashboard_formateur_${currentDate.replace(/\//g, "-")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur lors de l'exportation des données:", error);
      alert("Une erreur est survenue lors de l'exportation des données.");
    }
  };

  // Fonction pour rendre le contenu du dashboard
  const renderDashboard = () => {
    return (
      <div className="flex flex-col gap-y-5 dark:bg-gray-900 dark:text-white">
        {/* En-tête du tableau de bord */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:text-white">
            Tableau de Bord Formateur
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={exportDashboardData}
              className="flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
            >
              <Download size={18} />
              <span>Exporter les données</span>
            </button>
          </div>
        </div>

        {/* Section des cartes de statistiques */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Carte Apprenants */}
          <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 transition-all duration-300 group-hover:from-blue-500/30 group-hover:to-blue-600/30">
                <Users size={24} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Apprenants
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalApprenants
                    ? dashboardData.stats.totalApprenants.value
                    : dashboardData.stats.totalUsers.value}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <TrendBadge
                value={
                  dashboardData.stats.totalApprenants
                    ? dashboardData.stats.totalApprenants.growth
                    : dashboardData.stats.totalUsers.growth
                }
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total
              </span>
            </div>
          </div>

          {/* Carte Cours */}
          <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 transition-all duration-300 group-hover:from-green-500/30 group-hover:to-green-600/30">
                <BookOpen
                  size={24}
                  className="text-green-500 dark:text-green-400"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cours
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalCourses.value}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <TrendBadge value={dashboardData.stats.totalCourses.growth} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total
              </span>
            </div>
          </div>

          {/* Carte Quiz */}
          <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 transition-all duration-300 group-hover:from-purple-500/30 group-hover:to-purple-600/30">
                <FileText
                  size={24}
                  className="text-purple-500 dark:text-purple-400"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Quiz
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalQuizzes.value}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <TrendBadge value={dashboardData.stats.totalQuizzes.growth} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total
              </span>
            </div>
          </div>

          {/* Carte Évaluations */}
          <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 transition-all duration-300 group-hover:from-orange-500/30 group-hover:to-orange-600/30">
                <ClipboardCheck
                  size={24}
                  className="text-orange-500 dark:text-orange-400"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Évaluations
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.evaluationsDone.value}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <TrendBadge value={dashboardData.stats.evaluationsDone.growth} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total
              </span>
            </div>
          </div>

          {/* Carte Certificats */}
          <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 transition-all duration-300 group-hover:from-pink-500/30 group-hover:to-pink-600/30">
                <Award size={24} className="text-pink-500 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Certificats
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.stats.totalCertificats.value}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <TrendBadge value={dashboardData.stats.totalCertificats.growth} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total
              </span>
            </div>
          </div>
        </div>

        {/* Première ligne de graphiques */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-1 lg:grid-cols-7">
          {/* Graphique de tendance des évaluations */}
          <div className="col-span-1 rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 md:col-span-2 lg:col-span-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                  <TrendingUp
                    size={20}
                    className="text-blue-500 dark:text-blue-400"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tendance des Évaluations
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Exporter uniquement les données de tendance des évaluations
                    try {
                      const now = new Date();
                      const currentDate = now.toLocaleDateString("fr-FR");
                      const currentTime = now.toLocaleTimeString("fr-FR");

                      // Créer un tableau vide pour simuler une cellule vide
                      const empty = "";

                      // En-tête du fichier avec informations détaillées
                      let csvContent = createCSVRow(
                        "PHARMALEARN - RAPPORT DE TENDANCE DES ÉVALUATIONS"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Date d'exportation:",
                        currentDate
                      );
                      csvContent += createCSVRow(
                        "Heure d'exportation:",
                        currentTime
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50)); // Ligne de séparation
                      csvContent += createCSVRow(empty);

                      // Tableau de tendance avec en-têtes
                      csvContent += createCSVRow("TENDANCE DES ÉVALUATIONS");
                      csvContent += createCSVRow(empty);

                      // Vérifier si nous avons des données détaillées
                      const hasSatisfaisant =
                        dashboardData.evaluationTrend.some(
                          (item) => "satisfaisant" in item
                        );
                      const hasNonSatisfaisant =
                        dashboardData.evaluationTrend.some(
                          (item) => "nonSatisfaisant" in item
                        );

                      // Créer les en-têtes en fonction des données disponibles
                      if (hasSatisfaisant && hasNonSatisfaisant) {
                        csvContent += createCSVRow(
                          "Mois",
                          "Total des évaluations",
                          "Évaluations satisfaisantes",
                          "Évaluations non satisfaisantes",
                          "Tendance"
                        );
                      } else {
                        csvContent += createCSVRow(
                          "Mois",
                          "Nombre d'évaluations",
                          "Tendance"
                        );
                      }

                      // Ajouter les lignes avec tendance
                      let prevEvaluations = null;
                      dashboardData.evaluationTrend.forEach((item, index) => {
                        let trend = "Stable";
                        if (index > 0 && prevEvaluations !== null) {
                          const diff = item.evaluations - prevEvaluations;
                          const percentChange =
                            prevEvaluations > 0
                              ? (diff / prevEvaluations) * 100
                              : 0;

                          if (percentChange > 10) trend = "Forte hausse";
                          else if (percentChange > 0) trend = "Hausse";
                          else if (percentChange < -10) trend = "Forte baisse";
                          else if (percentChange < 0) trend = "Baisse";
                        }

                        // Ajouter la ligne avec les données disponibles
                        if (hasSatisfaisant && hasNonSatisfaisant) {
                          csvContent += createCSVRow(
                            item.month,
                            item.evaluations,
                            item.satisfaisant || 0,
                            item.nonSatisfaisant || 0,
                            trend
                          );
                        } else {
                          csvContent += createCSVRow(
                            item.month,
                            item.evaluations,
                            trend
                          );
                        }

                        prevEvaluations = item.evaluations;
                      });

                      // Calculer des statistiques supplémentaires
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "STATISTIQUES SUPPLÉMENTAIRES"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("Métrique", "Valeur");

                      // Calculer la moyenne des évaluations par mois
                      const avgEvaluations = (
                        dashboardData.evaluationTrend.reduce(
                          (sum, item) => sum + item.evaluations,
                          0
                        ) / dashboardData.evaluationTrend.length
                      ).toFixed(2);
                      csvContent += createCSVRow(
                        "Moyenne des évaluations par mois",
                        avgEvaluations
                      );

                      // Trouver le mois avec le plus d'évaluations
                      const maxEvalMonth = dashboardData.evaluationTrend.reduce(
                        (max, item) =>
                          item.evaluations > max.evaluations ? item : max,
                        { month: "", evaluations: 0 }
                      );
                      csvContent += createCSVRow(
                        "Mois avec le plus d'évaluations",
                        `${maxEvalMonth.month} (${maxEvalMonth.evaluations})`
                      );

                      // Trouver le mois avec le moins d'évaluations
                      const minEvalMonth = dashboardData.evaluationTrend.reduce(
                        (min, item) =>
                          item.evaluations < min.evaluations ? item : min,
                        {
                          month: "",
                          evaluations:
                            dashboardData.evaluationTrend.length > 0
                              ? dashboardData.evaluationTrend[0].evaluations
                              : 0,
                        }
                      );
                      csvContent += createCSVRow(
                        "Mois avec le moins d'évaluations",
                        `${minEvalMonth.month} (${minEvalMonth.evaluations})`
                      );

                      // Pied de page
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50));
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Rapport généré automatiquement par PharmaLearn"
                      );
                      csvContent += createCSVRow(
                        "© " +
                          new Date().getFullYear() +
                          " PharmaLearn - Tous droits réservés"
                      );

                      // Créer un objet Blob avec le contenu CSV
                      // Ajouter BOM (Byte Order Mark) pour que Excel reconnaisse correctement les caractères UTF-8
                      const BOM = "\uFEFF";
                      const blob = new Blob([BOM + csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);

                      link.setAttribute("href", url);
                      link.setAttribute(
                        "download",
                        `rapport_tendance_evaluations_${currentDate.replace(/\//g, "-")}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error(
                        "Erreur lors de l'exportation des données:",
                        error
                      );
                      alert(
                        "Une erreur est survenue lors de l'exportation des données."
                      );
                    }
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Exporter les données de tendance des évaluations"
                >
                  <Download
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardData.evaluationTrend}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorEvaluations"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke={theme === "light" ? "#475569" : "#ffffff"}
                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                    axisLine={{
                      stroke: theme === "light" ? "#e2e8f0" : "#334155",
                    }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={theme === "light" ? "#475569" : "#ffffff"}
                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                    axisLine={{
                      stroke: theme === "light" ? "#e2e8f0" : "#334155",
                    }}
                    tickLine={false}
                    domain={[0, "dataMax + 50"]}
                    label={{
                      value: "Nombre d'évaluations",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fill: theme === "light" ? "#475569" : "#ffffff",
                      },
                    }}
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme === "light" ? "#e2e8f0" : "#334155"}
                    opacity={0.5}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} évaluations`, "Total"]}
                    labelFormatter={(label) => `Mois: ${label}`}
                    contentStyle={{
                      backgroundColor:
                        theme === "light" ? "#ffffff" : "#1f2937",
                      border: "none",
                      borderRadius: "0.5rem",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="evaluations"
                    name="Nombre d'évaluations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEvaluations)"
                    activeDot={{
                      r: 6,
                      fill: "#3b82f6",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                    animationBegin={200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique de répartition des utilisateurs */}
          <div className="col-span-1 rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 md:col-span-2 lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                  <PieChartIcon
                    size={20}
                    className="text-purple-500 dark:text-purple-400"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Répartition des Utilisateurs
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Exporter uniquement les données de répartition des utilisateurs
                    try {
                      const now = new Date();
                      const currentDate = now.toLocaleDateString("fr-FR");
                      const currentTime = now.toLocaleTimeString("fr-FR");

                      // Créer un tableau vide pour simuler une cellule vide
                      const empty = "";

                      // En-tête du fichier avec informations détaillées
                      let csvContent = createCSVRow(
                        "PHARMALEARN - RAPPORT DE RÉPARTITION DES UTILISATEURS"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Date d'exportation:",
                        currentDate
                      );
                      csvContent += createCSVRow(
                        "Heure d'exportation:",
                        currentTime
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50)); // Ligne de séparation
                      csvContent += createCSVRow(empty);

                      // Tableau de répartition avec en-têtes
                      csvContent += createCSVRow(
                        "RÉPARTITION DES UTILISATEURS"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Rôle",
                        "Nombre",
                        "Pourcentage (%)"
                      );

                      // Calculer le total des utilisateurs pour les pourcentages
                      const totalUsers = dashboardData.userDistribution.reduce(
                        (sum, item) => sum + item.count,
                        0
                      );

                      // Ajouter les lignes avec pourcentages
                      dashboardData.userDistribution.forEach((item) => {
                        const percentage =
                          totalUsers > 0
                            ? ((item.count / totalUsers) * 100).toFixed(2)
                            : "0.00";
                        csvContent += createCSVRow(
                          item.role,
                          item.count,
                          percentage
                        );
                      });

                      // Ajouter une ligne de total
                      csvContent += createCSVRow("Total", totalUsers, "100.00");

                      // Pied de page
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50));
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Rapport généré automatiquement par PharmaLearn"
                      );
                      csvContent += createCSVRow(
                        "© " +
                          new Date().getFullYear() +
                          " PharmaLearn - Tous droits réservés"
                      );

                      // Créer un objet Blob avec le contenu CSV
                      // Ajouter BOM (Byte Order Mark) pour que Excel reconnaisse correctement les caractères UTF-8
                      const BOM = "\uFEFF";
                      const blob = new Blob([BOM + csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);

                      link.setAttribute("href", url);
                      link.setAttribute(
                        "download",
                        `rapport_repartition_utilisateurs_${currentDate.replace(/\//g, "-")}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error(
                        "Erreur lors de l'exportation des données:",
                        error
                      );
                      alert(
                        "Une erreur est survenue lors de l'exportation des données."
                      );
                    }
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Exporter les données de répartition des utilisateurs"
                >
                  <Download
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="role"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {dashboardData.userDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} utilisateurs`, "Nombre"]}
                    contentStyle={{
                      backgroundColor:
                        theme === "light" ? "#ffffff" : "#1f2937",
                      border: "none",
                      borderRadius: "0.5rem",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Deuxième ligne de graphiques */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
          {/* Graphique de performance des cours */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                  <BarChart2
                    size={20}
                    className="text-blue-500 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Performance des Cours
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Progression moyenne (%) et nombre d'évaluations par cours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Exporter uniquement les données de performance des cours
                    try {
                      const now = new Date();
                      const currentDate = now.toLocaleDateString("fr-FR");
                      const currentTime = now.toLocaleTimeString("fr-FR");

                      // Créer un tableau vide pour simuler une cellule vide
                      const empty = "";

                      // En-tête du fichier avec informations détaillées
                      let csvContent = createCSVRow(
                        "PHARMALEARN - RAPPORT DE PERFORMANCE DES COURS"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Date d'exportation:",
                        currentDate
                      );
                      csvContent += createCSVRow(
                        "Heure d'exportation:",
                        currentTime
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50)); // Ligne de séparation
                      csvContent += createCSVRow(empty);

                      // Tableau de performance avec en-têtes
                      csvContent += createCSVRow("PERFORMANCE DES COURS");
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Cours",
                        "Progression Moyenne (%)",
                        "Nombre d'évaluations",
                        "Statut"
                      );

                      // Fonction pour déterminer le statut du cours
                      const getCourseStatus = (progress) => {
                        if (progress >= 90) return "Excellent";
                        if (progress >= 75) return "Bon";
                        if (progress >= 50) return "Moyen";
                        return "Besoin d'attention";
                      };

                      // Variables pour calculer les moyennes
                      let totalProgress = 0;
                      let totalEvaluations = 0;

                      // Ajouter les lignes avec statut
                      dashboardData.courseStats.forEach((item) => {
                        const progress = item.avgProgress || 0;
                        const evaluations = item.evaluationCount || 0;

                        totalProgress += progress;
                        totalEvaluations += evaluations;

                        csvContent += createCSVRow(
                          item.course,
                          progress,
                          evaluations,
                          getCourseStatus(progress)
                        );
                      });

                      // Calculer et ajouter les moyennes
                      const courseCount = dashboardData.courseStats.length || 1; // Éviter la division par zéro
                      const avgProgress = (totalProgress / courseCount).toFixed(
                        2
                      );
                      const avgEvaluations = (
                        totalEvaluations / courseCount
                      ).toFixed(2);

                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Moyenne",
                        avgProgress,
                        avgEvaluations,
                        getCourseStatus(avgProgress)
                      );

                      // Ajouter des statistiques supplémentaires
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "STATISTIQUES SUPPLÉMENTAIRES"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("Métrique", "Valeur");
                      csvContent += createCSVRow(
                        "Nombre total de cours",
                        courseCount
                      );
                      csvContent += createCSVRow(
                        "Progression moyenne globale",
                        avgProgress + "%"
                      );
                      csvContent += createCSVRow(
                        "Nombre total d'évaluations",
                        totalEvaluations
                      );

                      // Pied de page
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50));
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Rapport généré automatiquement par PharmaLearn"
                      );
                      csvContent += createCSVRow(
                        "© " +
                          new Date().getFullYear() +
                          " PharmaLearn - Tous droits réservés"
                      );

                      // Créer un objet Blob avec le contenu CSV
                      // Ajouter BOM (Byte Order Mark) pour que Excel reconnaisse correctement les caractères UTF-8
                      const BOM = "\uFEFF";
                      const blob = new Blob([BOM + csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);

                      link.setAttribute("href", url);
                      link.setAttribute(
                        "download",
                        `rapport_performance_cours_${currentDate.replace(/\//g, "-")}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error(
                        "Erreur lors de l'exportation des données:",
                        error
                      );
                      alert(
                        "Une erreur est survenue lors de l'exportation des données."
                      );
                    }
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Exporter les données de performance des cours"
                >
                  <Download
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              {dashboardData.courseStats &&
              dashboardData.courseStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.courseStats}>
                    <XAxis
                      dataKey="course"
                      stroke={theme === "light" ? "#475569" : "#ffffff"}
                      tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                      tickFormatter={(value) => {
                        // Limiter la longueur du texte pour éviter les chevauchements
                        return value.length > 15
                          ? value.substring(0, 15) + "..."
                          : value;
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke={theme === "light" ? "#475569" : "#ffffff"}
                      tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                      label={{
                        value: "Progression (%)",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fill: theme === "light" ? "#475569" : "#ffffff",
                        },
                      }}
                      domain={[0, 100]} // Fixer l'échelle de 0 à 100%
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={theme === "light" ? "#475569" : "#ffffff"}
                      tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                      label={{
                        value: "Évaluations",
                        angle: 90,
                        position: "insideRight",
                        style: {
                          fill: theme === "light" ? "#475569" : "#ffffff",
                        },
                      }}
                      allowDecimals={false} // Pas de décimales pour les complétions
                      // Calculer dynamiquement le domaine pour les complétions
                      domain={[0, "dataMax + 5"]} // Ajouter une marge de 5 au-dessus de la valeur maximale
                    />
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === "Progression Moyenne (%)") {
                          return [`${value}%`, "Progression Moyenne (%)"];
                        } else if (name === "Nombre d'évaluations") {
                          return [
                            `${value} évaluations`,
                            "Nombre d'évaluations",
                          ];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Cours: ${label}`}
                      contentStyle={{
                        backgroundColor:
                          theme === "light" ? "#ffffff" : "#1f2937",
                        border: "none",
                        borderRadius: "0.5rem",
                        boxShadow:
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "10px",
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="avgProgress"
                      name="Progression Moyenne (%)"
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                      animationBegin={200}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="evaluationCount"
                      name="Nombre d'évaluations"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                      animationBegin={400}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center flex-col">
                  <div className="animate-pulse flex flex-col items-center justify-center">
                    <div className="h-16 w-16 mb-4 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center">
                      <BarChart2
                        size={32}
                        className="text-blue-500 dark:text-blue-300"
                      />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Chargement des données de performance...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center">
                      Aucune donnée n'est disponible pour le moment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tableau des évaluations récentes */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                  <ClipboardCheck
                    size={20}
                    className="text-orange-500 dark:text-orange-400"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Évaluations Récentes
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Exporter uniquement les données des évaluations récentes
                    try {
                      const now = new Date();
                      const currentDate = now.toLocaleDateString("fr-FR");
                      const currentTime = now.toLocaleTimeString("fr-FR");

                      // Créer un tableau vide pour simuler une cellule vide
                      const empty = "";

                      // En-tête du fichier avec informations détaillées
                      let csvContent = createCSVRow(
                        "PHARMALEARN - RAPPORT DES ÉVALUATIONS RÉCENTES"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Date d'exportation:",
                        currentDate
                      );
                      csvContent += createCSVRow(
                        "Heure d'exportation:",
                        currentTime
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50)); // Ligne de séparation
                      csvContent += createCSVRow(empty);

                      // Tableau des évaluations avec en-têtes
                      csvContent += createCSVRow("ÉVALUATIONS RÉCENTES");
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "ID",
                        "Apprenant",
                        "Cours",
                        "Statut",
                        "Date",
                        "Jours écoulés"
                      );

                      // Compteurs pour les statistiques
                      let satisfaisantCount = 0;
                      let nonSatisfaisantCount = 0;

                      // Ajouter les lignes avec jours écoulés
                      dashboardData.recentEvaluations.forEach((item) => {
                        // Calculer le nombre de jours écoulés depuis l'évaluation
                        const evalDate = new Date(item.date);
                        const daysDiff = Math.floor(
                          (now - evalDate) / (1000 * 60 * 60 * 24)
                        );

                        // Compter les statuts
                        if (item.status === "Satisfaisant") {
                          satisfaisantCount++;
                        } else {
                          nonSatisfaisantCount++;
                        }

                        csvContent += createCSVRow(
                          item.id,
                          item.apprenant,
                          item.cours,
                          item.status,
                          item.date,
                          daysDiff
                        );
                      });

                      // Ajouter des statistiques supplémentaires
                      const totalEvaluations =
                        dashboardData.recentEvaluations.length;

                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "STATISTIQUES DES ÉVALUATIONS"
                      );
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Métrique",
                        "Valeur",
                        "Pourcentage (%)"
                      );

                      const satisfaisantPercentage =
                        totalEvaluations > 0
                          ? (
                              (satisfaisantCount / totalEvaluations) *
                              100
                            ).toFixed(2)
                          : "0.00";
                      const nonSatisfaisantPercentage =
                        totalEvaluations > 0
                          ? (
                              (nonSatisfaisantCount / totalEvaluations) *
                              100
                            ).toFixed(2)
                          : "0.00";

                      csvContent += createCSVRow(
                        "Évaluations Satisfaisantes",
                        satisfaisantCount,
                        satisfaisantPercentage
                      );
                      csvContent += createCSVRow(
                        "Évaluations Non Satisfaisantes",
                        nonSatisfaisantCount,
                        nonSatisfaisantPercentage
                      );
                      csvContent += createCSVRow(
                        "Total des Évaluations",
                        totalEvaluations,
                        "100.00"
                      );

                      // Pied de page
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow("=".repeat(50));
                      csvContent += createCSVRow(empty);
                      csvContent += createCSVRow(
                        "Rapport généré automatiquement par PharmaLearn"
                      );
                      csvContent += createCSVRow(
                        "© " +
                          new Date().getFullYear() +
                          " PharmaLearn - Tous droits réservés"
                      );

                      // Créer un objet Blob avec le contenu CSV
                      // Ajouter BOM (Byte Order Mark) pour que Excel reconnaisse correctement les caractères UTF-8
                      const BOM = "\uFEFF";
                      const blob = new Blob([BOM + csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);

                      link.setAttribute("href", url);
                      link.setAttribute(
                        "download",
                        `rapport_evaluations_recentes_${currentDate.replace(/\//g, "-")}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error(
                        "Erreur lors de l'exportation des données:",
                        error
                      );
                      alert(
                        "Une erreur est survenue lors de l'exportation des données."
                      );
                    }
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Exporter les données des évaluations récentes"
                >
                  <Download
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full table-auto dark:text-white">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 dark:text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Apprenant
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Cours
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dashboardData.recentEvaluations &&
                    dashboardData.recentEvaluations.length > 0 ? (
                      dashboardData.recentEvaluations.map((evaluation) => (
                        <tr
                          key={evaluation.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 text-sm">
                            {evaluation.apprenant}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {evaluation.cours}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                evaluation.status === "Satisfaisant"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100"
                              }`}
                            >
                              {evaluation.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {evaluation.date}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <ClipboardCheck
                              size={32}
                              className="mb-2 text-gray-400 dark:text-gray-600"
                            />
                            <p className="mb-1 font-medium">
                              Aucune évaluation récente
                            </p>
                            <p className="text-sm">
                              Les évaluations que vous effectuerez apparaîtront
                              ici
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Si pas d'erreur, afficher directement le dashboard
  return renderDashboard();
};

export default FormateurDashboardPage;
