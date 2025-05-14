import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth-context";
import axios from "axios";
import { API_URL } from "../../../config";
import coursService from "../../../services/coursService";
import { QuizService } from "../../../services/QuizService";
import {
  BookOpen,
  CheckCircle,
  Clock,
  BarChart2,
  Award,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "react-feather";

const StatCard = ({
  title,
  value,
  description,
  progress,
  icon: Icon,
  iconBgColor,
  iconColor,
}) => (
  <div className="rounded-2xl bg-white/90 dark:bg-slate-800/80 p-6 shadow-lg transition-all duration-300 hover:shadow-xl border border-white/50 dark:border-gray-700/30 backdrop-blur-md group relative overflow-hidden transform hover:-translate-y-1">
    {/* Élément décoratif en arrière-plan */}
    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/30 dark:to-gray-600/20 group-hover:scale-150 transition-transform duration-500"></div>

    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {title}
            </h3>
            <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
          </div>
          <p className="mt-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 group-hover:from-blue-600 group-hover:to-indigo-600 dark:group-hover:from-blue-400 dark:group-hover:to-indigo-400 transition-all duration-300">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-[200px]">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-3.5 rounded-xl ${iconBgColor} transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md group-hover:shadow-lg`}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
          </div>
        )}
      </div>
      {progress && (
        <div className="mt-5 relative z-10">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span className="font-medium">Progression</span>
            <span className="font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700/70 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 h-2.5 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
  progress: PropTypes.number,
  icon: PropTypes.elementType,
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string,
};

const RecentActivityItem = ({ title, time, icon: Icon, status }) => (
  <div className="relative flex items-start py-4 px-3 mb-2 last:mb-0 hover:bg-white/80 dark:hover:bg-gray-700/40 rounded-xl transition-all duration-300 group backdrop-blur-sm border border-transparent hover:border-gray-100/50 dark:hover:border-gray-700/30 hover:shadow-md transform hover:-translate-x-1">
    {/* Ligne de connexion entre les activités */}
    <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700/50 z-0"></div>

    <div
      className={`p-3.5 rounded-xl mr-4 shadow-md transition-all duration-300 group-hover:shadow-lg z-10 ${
        status === "completed"
          ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 group-hover:from-green-100 group-hover:to-green-200 dark:group-hover:from-green-900/40 dark:group-hover:to-green-800/40 border border-green-200/50 dark:border-green-700/30"
          : "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/40 dark:group-hover:to-blue-800/40 border border-blue-200/50 dark:border-blue-700/30"
      }`}
    >
      <Icon
        className={`w-5 h-5 transform transition-all duration-300 group-hover:scale-125 ${
          status === "completed"
            ? "text-green-600 dark:text-green-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
        strokeWidth={2}
      />
    </div>

    <div className="flex-1">
      <h4 className="text-sm font-medium text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h4>

      <div className="flex items-center mt-2">
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-medium mr-2 ${
            status === "completed"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {status === "completed" ? "Terminé" : "En cours"}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3 mr-1 inline-block" strokeWidth={2.5} />
          {time}
        </p>
      </div>
    </div>
  </div>
);

RecentActivityItem.propTypes = {
  title: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  status: PropTypes.oneOf(["completed", "in-progress"]),
};

const ProgressItem = ({ title, progress, color }) => {
  // Déterminer la couleur de base à partir de la classe color (bg-blue-600, bg-green-600, etc.)
  const baseColor = color.split("-")[1]; // Extrait "blue", "green", etc.

  return (
    <div className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all duration-300 group backdrop-blur-sm border border-transparent hover:border-gray-100/50 dark:hover:border-gray-700/30 hover:shadow-md">
      <div className="flex items-center">
        <div
          className={`w-1.5 h-12 rounded-full bg-gradient-to-b from-${baseColor}-400 to-${baseColor}-600 dark:from-${baseColor}-500 dark:to-${baseColor}-700 mr-3 group-hover:h-14 transition-all duration-300 shadow-sm`}
        ></div>
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[180px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block">
            {title}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 hidden group-hover:block transition-all">
            {progress === 100 ? "Terminé" : "En cours"}
          </span>
        </div>
      </div>
      <div className="flex-1 mx-4">
        <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-700/70 overflow-hidden shadow-inner">
          <div
            className={`h-3 rounded-full bg-gradient-to-r from-${baseColor}-400 to-${baseColor}-600 dark:from-${baseColor}-500 dark:to-${baseColor}-700 transition-all duration-500 ease-out relative`}
            style={{ width: `${progress}%` }}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>

            {/* Points de progression */}
            {[25, 50, 75].map(
              (milestone) =>
                progress >= milestone && (
                  <div
                    key={milestone}
                    className="absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-sm"
                    style={{ left: `${milestone}%` }}
                  ></div>
                )
            )}
          </div>
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[48px] text-center bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-indigo-500 group-hover:text-white transition-all duration-300">
        {progress}%
      </span>
    </div>
  );
};

ProgressItem.propTypes = {
  title: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const Dashboard = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    coursesInProgress: 0,
    completedQuizzes: "0/0",
    certifications: 0,
    overallProgress: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Récupérer les cours de l'apprenant en utilisant le service coursService
        // comme dans le composant Cours.jsx
        const coursData = await coursService.getApprenantCours(token, user.id);

        if (!coursData || coursData.length === 0) {
          console.log("Aucun cours trouvé pour cet apprenant");
          setStats({
            coursesInProgress: 0,
            completedQuizzes: "0/0",
            certifications: 0,
            overallProgress: 0,
          });
          setCourseProgress([]);
          setRecentActivities([
            {
              title: "Aucun cours disponible",
              time: "Maintenant",
              icon: AlertCircle,
              status: "in-progress",
            },
          ]);
          setLoading(false);
          return;
        }

        console.log("Cours récupérés:", coursData);

        // Récupérer les certificats de l'apprenant en utilisant le service QuizService
        console.log("Récupération des certificats pour l'apprenant:", user.id);
        const certificatsData = await QuizService.getCertificatsByApprenant(
          token,
          user.id
        );
        console.log("Certificats récupérés:", certificatsData);

        // Pour chaque cours, récupérer la progression comme dans Cours.jsx
        const coursesWithProgress = [];
        let totalQuizzes = 0;
        let completedQuizzes = 0;
        let totalProgressPercentage = 0;

        for (const course of coursData) {
          try {
            console.log(
              `Récupération de la progression pour le cours ${course.id} (${course.titre || course.title})`
            );

            const progressionData =
              await QuizService.getProgressionByApprenantAndCours(
                token,
                user.id,
                course.id
              );

            // Vérifier si un certificat existe pour ce cours dans certificatsData
            const certificatForCourse = certificatsData.find(
              (cert) => cert.cours && cert.cours.id === course.id
            );

            // Ajouter les données de progression au cours
            coursesWithProgress.push({
              ...course,
              progress_percentage: progressionData.progress_percentage || 0,
              quizzes_total: progressionData.quizzes_total || 0,
              quizzes_passed: progressionData.quizzes_passed || 0,
              is_completed: progressionData.is_completed || false,
              certificat:
                certificatForCourse || progressionData.certificat || null,
            });

            // Accumuler les statistiques globales
            totalQuizzes += progressionData.quizzes_total || 0;
            completedQuizzes += progressionData.quizzes_passed || 0;
            totalProgressPercentage += progressionData.progress_percentage || 0;
          } catch (error) {
            console.error(
              `Erreur lors de la récupération de la progression pour le cours ${course.id}:`,
              error
            );

            // Vérifier si un certificat existe pour ce cours dans certificatsData
            const certificatForCourse = certificatsData.find(
              (cert) => cert.cours && cert.cours.id === course.id
            );

            // Ajouter quand même le cours avec une progression à 0
            coursesWithProgress.push({
              ...course,
              progress_percentage: 0,
              quizzes_total: 0,
              quizzes_passed: 0,
              is_completed: false,
              certificat: certificatForCourse || null,
              error: true,
            });
          }
        }

        // Calculer la progression globale basée sur la moyenne des progressions des cours
        const coursesInProgress = coursesWithProgress.length;
        const overallProgress =
          coursesInProgress > 0
            ? Math.round(totalProgressPercentage / coursesInProgress)
            : 0;

        // Calculer le nombre de certificats de la même manière que dans Cours.jsx
        // en comptant les cours qui ont un certificat associé
        const certifiedCourses = coursesWithProgress.filter(
          (course) => course.certificat
        ).length;

        // Vérifier la cohérence avec les certificats récupérés directement
        console.log(`Nombre de cours avec certificat: ${certifiedCourses}`);
        console.log(
          `Nombre de certificats récupérés via API: ${certificatsData.length}`
        );

        // Mettre à jour les statistiques
        setStats({
          coursesInProgress,
          completedQuizzes: `${completedQuizzes}/${totalQuizzes}`,
          certifications: certifiedCourses, // Utiliser le nombre de cours certifiés
          overallProgress,
        });

        // Préparer les données de progression des cours pour l'affichage
        const coursProgressData = coursesWithProgress.map((course) => ({
          title: course.titre || course.title || "Cours inconnu",
          progress: course.progress_percentage || 0,
          color: course.is_completed ? "bg-green-600" : "bg-blue-600",
        }));

        setCourseProgress(
          coursProgressData.length > 0
            ? coursProgressData
            : [
                {
                  title: "Aucun cours en progression",
                  progress: 0,
                  color: "bg-gray-400",
                },
              ]
        );

        // Générer les activités récentes basées sur les données des cours avec progression
        const activities = [];

        // Trier les cours par progression pour trouver les plus récemment actifs
        const sortedCourses = [...coursesWithProgress].sort((a, b) => {
          // Priorité aux cours avec des certificats récents
          if (a.certificat && b.certificat) {
            return (
              new Date(
                b.certificat.date_obtention || b.certificat.createdAt || 0
              ) -
              new Date(
                a.certificat.date_obtention || a.certificat.createdAt || 0
              )
            );
          }
          if (a.certificat) return -1;
          if (b.certificat) return 1;

          // Ensuite, trier par progression
          return b.progress_percentage - a.progress_percentage;
        });

        // Ajouter les cours avec progression récente
        sortedCourses.slice(0, 2).forEach((course) => {
          if (course.progress_percentage > 0) {
            activities.push({
              title: `Progression dans ${course.titre || course.title}`,
              time: course.progress_percentage === 100 ? "Terminé" : "En cours",
              icon: BookOpen,
              status:
                course.progress_percentage === 100
                  ? "completed"
                  : "in-progress",
            });
          }
        });

        // Ajouter les certificats récents depuis certificatsData
        if (certificatsData && certificatsData.length > 0) {
          // Trier les certificats par date d'obtention (du plus récent au plus ancien)
          const sortedCertificats = [...certificatsData].sort((a, b) => {
            const dateA = new Date(a.date_obtention || 0);
            const dateB = new Date(b.date_obtention || 0);
            return dateB - dateA;
          });

          // Ajouter le certificat le plus récent
          const recentCertificat = sortedCertificats[0];
          if (recentCertificat && recentCertificat.cours) {
            activities.push({
              title: `Certificat obtenu: ${recentCertificat.cours.titre || "Cours"}`,
              time: formatTimeAgo(
                recentCertificat.date_obtention || new Date()
              ),
              icon: Award,
              status: "completed",
            });
          }
        }

        // Si pas assez d'activités, ajouter un message générique
        if (activities.length === 0) {
          activities.push({
            title: "Bienvenue sur votre tableau de bord",
            time: "Aujourd'hui",
            icon: AlertCircle,
            status: "in-progress",
          });
        }

        setRecentActivities(activities);
      } catch (err) {
        console.error(
          "Erreur lors du chargement des données du dashboard:",
          err
        );
        setError("Impossible de charger les données du tableau de bord");

        // Utiliser des données par défaut en cas d'erreur
        setStats({
          coursesInProgress: 0,
          completedQuizzes: "0/0",
          certifications: 0,
          overallProgress: 0,
        });

        setCourseProgress([
          {
            title: "Erreur de chargement",
            progress: 0,
            color: "bg-red-500",
          },
        ]);

        setRecentActivities([
          {
            title: "Erreur de chargement des données",
            time: "Maintenant",
            icon: AlertCircle,
            status: "in-progress",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, user]);

  // Fonction pour formater les dates en format relatif (il y a X temps)
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Date inconnue";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return "À l'instant";
    if (diffMin < 60)
      return `Il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
    if (diffHour < 24)
      return `Il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
    if (diffDay < 30) return `Il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;

    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="relative space-y-8 p-8 min-h-screen animate-fadeIn overflow-hidden">
      {/* Arrière-plan avec effet de glassmorphism avancé */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/20 -z-10 animate-gradient"></div>

      {/* Motif subtil en arrière-plan */}
      <div className="absolute inset-0 bg-pattern opacity-[0.015] dark:opacity-[0.03] -z-10"></div>

      {/* Formes décoratives en arrière-plan */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-200/10 dark:bg-blue-500/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-[30rem] h-[30rem] bg-purple-200/5 dark:bg-purple-500/3 rounded-full filter blur-3xl -z-10 animate-pulse-slow animation-delay-3000"></div>

      {/* Particules flottantes */}
      <div className="absolute top-20 left-[20%] w-6 h-6 rounded-full bg-blue-400/10 dark:bg-blue-400/5 -z-10 animate-float"></div>
      <div className="absolute top-[40%] right-[15%] w-8 h-8 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 -z-10 animate-float animation-delay-1000"></div>
      <div className="absolute bottom-[30%] left-[10%] w-4 h-4 rounded-full bg-purple-400/10 dark:bg-purple-400/5 -z-10 animate-float animation-delay-2000"></div>

      {/* En-tête du dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative z-10 group">
          <div className="flex items-center">
            <div className="p-3.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl mr-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 animate-glow">
              <BarChart2 className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 animate-gradient">
                Tableau de Bord
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                Bienvenue dans votre espace personnel de formation
                pharmaceutique
              </p>
            </div>
          </div>
          <div className="absolute -bottom-3 left-0 w-32 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm group-hover:w-40 transition-all duration-500"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center glass-card-3d px-5 py-2.5 rounded-xl">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" strokeWidth={2} />
            <span className="relative overflow-hidden">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer"></span>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card-3d flex flex-col justify-center items-center h-80 py-10 animate-breathe">
          <div className="relative">
            {/* Cercles concentriques animés */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 opacity-20 animate-ping"></div>

            {/* Cercle extérieur */}
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-200 dark:border-gray-700"></div>

            {/* Cercle intermédiaire */}
            <div className="absolute top-2 left-2 animate-spin rounded-full h-20 w-20 border-4 border-gray-100 dark:border-gray-800 animate-rotate-slow"></div>

            {/* Cercle coloré */}
            <div
              className="absolute top-0 left-0 animate-spin rounded-full h-24 w-24 border-t-4 border-l-4 border-r-4 border-blue-500 dark:border-blue-400 border-opacity-75"
              style={{ animationDirection: "reverse", animationDuration: "3s" }}
            ></div>

            {/* Cercle central avec pulsation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-inner flex items-center justify-center backdrop-blur-sm border border-white/50 dark:border-gray-700/50">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse-slow shadow-glow"></div>
              </div>
            </div>

            {/* Particules orbitales */}
            <div
              className="absolute h-full w-full animate-spin"
              style={{ animationDuration: "10s" }}
            >
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-blue-400 shadow-glow"></div>
            </div>
            <div
              className="absolute h-full w-full animate-spin"
              style={{
                animationDuration: "15s",
                animationDirection: "reverse",
              }}
            >
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 h-2 w-2 rounded-full bg-indigo-400 shadow-glow"></div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 font-bold text-xl animate-gradient">
              Chargement de vos données...
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 max-w-xs text-center">
              Nous préparons votre tableau de bord personnalisé avec vos
              dernières activités
            </p>

            {/* Indicateur de progression */}
            <div className="mt-6 w-48 mx-auto">
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 animate-gradient"
                  style={{ width: "70%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          className="glass-card-3d p-8 overflow-hidden relative animate-slide-up"
          role="alert"
        >
          {/* Éléments décoratifs */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-400 to-red-600"></div>
          <div className="absolute -left-20 -top-20 w-60 h-60 bg-red-500/10 rounded-full filter blur-xl animate-pulse-slow"></div>
          <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-red-500/5 rounded-full filter blur-xl animate-pulse-slow animation-delay-2000"></div>

          <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-5 rounded-xl shadow-lg flex items-center justify-center border border-red-100/50 dark:border-red-800/30 animate-bounce-subtle">
              <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 dark:from-red-400 dark:to-red-300 animate-gradient">
                Une erreur est survenue
              </h3>
              <p className="mt-3 text-gray-700 dark:text-gray-300 text-lg">
                {error}
              </p>

              <div className="mt-6 flex items-center text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 p-4 rounded-xl backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/30 shadow-inner-light">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    Que faire ?
                  </p>
                  <p className="mt-1">
                    Veuillez rafraîchir la page ou contacter l'administrateur si
                    le problème persiste.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="neuomorphic-button px-5 py-2.5 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Rafraîchir la page
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Cartes de statistiques */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
            <div className="transform hover:scale-105 transition-all duration-300">
              <StatCard
                title="Cours en cours"
                value={stats.coursesInProgress}
                icon={BookOpen}
                iconBgColor="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30"
                iconColor="text-purple-600 dark:text-purple-400"
              />
              <div className="mt-2 mx-auto w-1/3 h-1 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 opacity-70"></div>
            </div>

            <div className="transform hover:scale-105 transition-all duration-300 animation-delay-1000">
              <StatCard
                title="Quiz complétés"
                value={stats.completedQuizzes}
                progress={stats.completedQuizzes
                  .split("/")
                  .map(Number)
                  .reduce((a, b) => (b === 0 ? 0 : (a / b) * 100), 0)}
                icon={CheckCircle}
                iconBgColor="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30"
                iconColor="text-green-600 dark:text-green-400"
              />
              <div className="mt-2 mx-auto w-1/3 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 opacity-70"></div>
            </div>

            <div className="transform hover:scale-105 transition-all duration-300 animation-delay-2000">
              <StatCard
                title="Certifications"
                value={stats.certifications}
                description={
                  stats.certifications === 0
                    ? "Aucune certification"
                    : stats.certifications === 1
                      ? "1 certification obtenue"
                      : `${stats.certifications} certifications obtenues`
                }
                icon={Award}
                iconBgColor="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30"
                iconColor="text-yellow-600 dark:text-yellow-400"
              />
              <div className="mt-2 mx-auto w-1/3 h-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-70"></div>
            </div>

            <div className="transform hover:scale-105 transition-all duration-300 animation-delay-3000">
              <StatCard
                title="Progression globale"
                value={`${stats.overallProgress}%`}
                progress={stats.overallProgress}
                icon={BarChart2}
                iconBgColor="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <div className="mt-2 mx-auto w-1/3 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-70"></div>
            </div>
          </div>

          {/* Sections principales */}
          <div
            className="grid gap-8 md:grid-cols-3 mt-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Section Progression des Cours */}
            <div className="md:col-span-2 glass-card-3d p-6 relative overflow-hidden group">
              {/* Éléments décoratifs */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-glow"></div>
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-blue-100/20 dark:bg-blue-900/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
              <div className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-blue-400/10 dark:bg-blue-400/5 animate-float"></div>
              <div className="absolute bottom-1/4 right-1/3 w-6 h-6 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 animate-float animation-delay-2000"></div>

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center">
                  <div className="p-3.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl mr-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 animate-glow">
                    <BarChart2 className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 animate-gradient" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 animate-gradient">
                      Progression des Cours
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">
                      Suivez votre avancement dans chaque cours pharmaceutique
                    </p>
                  </div>
                </div>
                <div className="neuomorphic-button text-xs font-medium text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>{courseProgress.length} cours</span>
                </div>
              </div>

              {courseProgress.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl shadow-inner backdrop-blur-sm border border-white/10 dark:border-gray-700/10">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-full inline-block shadow-lg mb-6 border border-gray-100 dark:border-gray-700 animate-float">
                    <BookOpen className="w-14 h-14 text-blue-400 dark:text-blue-300" />
                  </div>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 font-bold text-xl animate-gradient">
                    Aucun cours en progression
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 max-w-xs mx-auto">
                    Vos cours apparaîtront ici dès que vous commencerez à les
                    suivre dans votre parcours de formation
                  </p>

                  {/* Bouton d'action */}
                  <button className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto">
                    <BookOpen className="w-4 h-4" />
                    <span>Explorer les cours</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl p-5 shadow-inner backdrop-blur-sm border border-white/10 dark:border-gray-700/10">
                  {courseProgress.map((course, index) => (
                    <ProgressItem
                      key={index}
                      title={course.title}
                      progress={course.progress}
                      color={course.color}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section Activité Récente */}
            <div className="glass-card-3d p-6 relative overflow-hidden group">
              {/* Éléments décoratifs */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 to-purple-500 shadow-glow"></div>
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-indigo-100/20 dark:bg-indigo-900/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>
              <div className="absolute top-1/3 right-1/4 w-5 h-5 rounded-full bg-purple-400/10 dark:bg-purple-400/5 animate-float animation-delay-1000"></div>

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center">
                  <div className="p-3.5 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl mr-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 animate-glow">
                    <Clock className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-gradient" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-gradient">
                      Activité Récente
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Vos dernières actions et réalisations
                    </p>
                  </div>
                </div>
                <div className="neuomorphic-button text-xs font-medium text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span>{recentActivities.length} activités</span>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl shadow-inner backdrop-blur-sm border border-white/10 dark:border-gray-700/10">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-full inline-block shadow-lg mb-6 border border-gray-100 dark:border-gray-700 animate-float animation-delay-1000">
                    <Clock className="w-14 h-14 text-indigo-400 dark:text-indigo-300" />
                  </div>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 font-bold text-xl animate-gradient">
                    Aucune activité récente
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 max-w-xs mx-auto">
                    Vos activités apparaîtront ici au fur et à mesure de votre
                    progression dans les cours
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl p-4 shadow-inner backdrop-blur-sm border border-white/10 dark:border-gray-700/10">
                  {recentActivities.map((activity, index) => (
                    <RecentActivityItem
                      key={index}
                      title={activity.title}
                      time={activity.time}
                      icon={activity.icon}
                      status={activity.status}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
