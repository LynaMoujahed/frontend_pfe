import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../../contexts/auth-context";
import coursService from "../../../services/coursService";
import { QuizService } from "../../../services/QuizService";
import {
  Loader,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Award,
  Sparkles,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  Filter,
  Search,
  Clock,
  ArrowUpRight,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CertificateDisplay from "../../common/CertificateDisplay";
import { API_URL } from "../../../config";
import { cn } from "../../../utils/cn";

const CourseCard = ({ course, onClick, onCertificateClick }) => {
  // Utiliser la couleur bleue pour toutes les barres de progression
  const getProgressColor = () => {
    return "from-blue-400 to-blue-600";
  };

  const getProgressBg = () => {
    return "bg-blue-500";
  };

  const progress = course.progress_percentage || course.progress || 0;
  const progressColor = getProgressColor(progress);
  const progressBg = getProgressBg(progress);

  // Vérifier si le cours a une erreur de progression
  const hasError = course.error === true;
  const isCompleted =
    progress >= 100 || course.is_completed || course.validated;
  const hasCertificate = !!course.certificat;

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-card hover:shadow-card-hover",
        "bg-white dark:bg-slate-800/90 backdrop-blur-sm border",
        hasError
          ? "border-orange-200 dark:border-orange-800"
          : isCompleted
            ? "border-green-200 dark:border-green-800"
            : "border-gray-200 dark:border-gray-700"
      )}
      onClick={onClick}
    >
      {/* Ribbon for completed courses */}
      {isCompleted && !hasError && (
        <div className="absolute top-0 right-0">
          <div className="w-20 h-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 transform rotate-45 translate-y-4 translate-x-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs font-bold py-1 text-center">
              {hasCertificate ? "Certifié" : "Complété"}
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {hasError && (
        <div className="bg-orange-100 dark:bg-orange-900/30 px-4 py-2 text-sm text-orange-800 dark:text-orange-200 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Données de progression indisponibles
        </div>
      )}

      <div className="p-6">
        {/* Header with title and category */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.titre || course.title}
          </h3>
          <div className="flex space-x-1">
            {course.category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200 shadow-sm">
                {course.category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 h-10 mb-4">
          {course.description ||
            course.shortDescription ||
            "Aucune description disponible"}
        </p>

        {/* Certificate badge */}
        {hasCertificate && (
          <div className="mb-4 flex justify-end">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onCertificateClick(course.id, course.certificat.id);
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-200 shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <Award className="h-4 w-4 mr-2" />
              Certificat disponible
            </span>
          </div>
        )}

        {/* Stats cards */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div
            className={cn(
              "p-4 rounded-xl transition-transform hover:scale-[1.02]",
              hasError
                ? "bg-orange-50/80 dark:bg-orange-900/20"
                : "bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10"
            )}
          >
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-1">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg mr-2",
                  hasError
                    ? "bg-orange-100 dark:bg-orange-800/30 text-orange-500"
                    : "bg-blue-100 dark:bg-blue-800/30 text-blue-500"
                )}
              >
                <BookOpenCheck className="h-4 w-4" />
              </div>
              <span>Quiz complétés</span>
            </div>
            <div
              className={cn(
                "text-xl font-bold mt-1",
                hasError
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
              )}
            >
              {course.quizzes_passed || course.completedQuizzes || 0}/
              {course.quizzes_total || course.totalQuizzes || 0}
            </div>
          </div>

          <div
            className={cn(
              "p-4 rounded-xl transition-transform hover:scale-[1.02]",
              hasError
                ? "bg-orange-50/80 dark:bg-orange-900/20"
                : "bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10"
            )}
          >
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-1">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg mr-2",
                  hasError
                    ? "bg-orange-100 dark:bg-orange-800/30 text-orange-500"
                    : "bg-blue-100 dark:bg-blue-800/30 text-blue-500"
                )}
              >
                <BarChart3 className="h-4 w-4" />
              </div>
              <span>Progression</span>
            </div>
            <div
              className={cn(
                "text-xl font-bold mt-1",
                hasError
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
              )}
            >
              {progress}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Progression</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700/50">
          {!hasError && (
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500 relative`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 overflow-hidden rounded-full"></div>
            </div>
          )}
          {hasError && (
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 relative"
              style={{ width: "100%" }}
            >
              <div className="absolute inset-0 bg-white/20 overflow-hidden rounded-full"></div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span>{isCompleted ? "Terminé" : "En cours"}</span>
          </div>

          <button
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Voir détails
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* Certificate actions */}
        {!hasError && isCompleted && !hasCertificate && (
          <div
            className="mt-4 flex items-center justify-center p-3 rounded-xl cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 hover:shadow-md transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onCertificateClick(course.id);
            }}
          >
            <Award className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            <span className="font-medium">Obtenir votre certificat</span>
          </div>
        )}
      </div>
    </div>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titre: PropTypes.string,
    title: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    shortDescription: PropTypes.string,
    progress_percentage: PropTypes.number,
    progress: PropTypes.number,
    quizzes_passed: PropTypes.number,
    completedQuizzes: PropTypes.number,
    quizzes_total: PropTypes.number,
    totalQuizzes: PropTypes.number,
    is_completed: PropTypes.bool,
    validated: PropTypes.bool,
    certificat: PropTypes.object,
    error: PropTypes.bool,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onCertificateClick: PropTypes.func.isRequired,
};

const Cours = () => {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);
  const navigate = useNavigate();

  // Effet pour filtrer les cours en fonction du terme de recherche
  useEffect(() => {
    if (courses.length > 0) {
      if (searchTerm.trim() === "") {
        setFilteredCourses(courses);
      } else {
        const filtered = courses.filter(
          (course) =>
            (course.titre || course.title || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (course.description || course.shortDescription || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (course.category || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
        setFilteredCourses(filtered);
      }
    }
  }, [courses, searchTerm]);

  // Effet pour charger les cours
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || !token) {
        setLoading(false);
        setError("Vous devez être connecté pour accéder à vos cours");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Récupérer les cours de l'apprenant
        const coursData = await coursService.getApprenantCours(token, user.id);

        // Afficher un message si aucun cours n'est trouvé
        if (!coursData || coursData.length === 0) {
          console.log("Aucun cours trouvé pour cet apprenant");
          setCourses([]);
          setError(
            "Aucun cours n'est actuellement assigné à votre compte. Veuillez contacter votre administrateur."
          );
        } else {
          // Pour chaque cours, récupérer la progression
          const coursesWithProgress = [];

          for (const course of coursData) {
            try {
              console.log(
                `Récupération de la progression pour le cours ${course.id} (${course.titre})`
              );

              const progressionData =
                await QuizService.getProgressionByApprenantAndCours(
                  token,
                  user.id,
                  course.id
                );

              coursesWithProgress.push({
                ...course,
                progress_percentage: progressionData.progress_percentage || 0,
                quizzes_total: progressionData.quizzes_total || 0,
                quizzes_passed: progressionData.quizzes_passed || 0,
                is_completed: progressionData.is_completed || false,
                certificat: progressionData.certificat || null,
              });
            } catch (error) {
              console.error(
                `Erreur lors de la récupération de la progression pour le cours ${course.id} (${course.titre}):`,
                error
              );

              // Ajouter quand même le cours avec une progression à 0
              coursesWithProgress.push({
                ...course,
                progress_percentage: 0,
                quizzes_total: 0,
                quizzes_passed: 0,
                is_completed: false,
                certificat: null,
                error: true,
              });
            }
          }

          if (coursesWithProgress.length > 0) {
            setCourses(coursesWithProgress);
            setFilteredCourses(coursesWithProgress);
          } else {
            setError(
              "Impossible de récupérer les données de progression pour vos cours. Veuillez réessayer plus tard."
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des cours:", error);
        setError(
          "Impossible de récupérer vos cours. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, token]);

  const handleCourseClick = (courseId) => {
    // Naviguer vers la page de détails du cours
    navigate(`/apprenant/cours/${courseId}`);
  };

  // Fonction pour afficher le certificat
  const handleShowCertificate = async (courseId, certificatId = null) => {
    try {
      setCurrentCourseId(courseId);
      console.log(
        `Affichage du certificat pour le cours ${courseId}, certificat ID: ${certificatId}`
      );

      // Si nous avons déjà un certificat, récupérer ses données
      if (certificatId) {
        try {
          // Utiliser l'endpoint data au lieu de download pour récupérer les données JSON
          const response = await fetch(
            `${API_URL}/certificat/${certificatId}/data`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error(`Erreur HTTP: ${response.status}`);
            throw new Error("Erreur lors de la récupération du certificat");
          }

          const data = await response.json();
          console.log("Données du certificat reçues:", data);

          if (data.certificat) {
            setCertificateData(data.certificat);
            setShowCertificate(true);
          } else {
            throw new Error("Format de données invalide");
          }
        } catch (fetchError) {
          console.error(
            "Erreur lors de la récupération du certificat:",
            fetchError
          );
          // En cas d'erreur, essayer de générer un nouveau certificat
          await handleGenerateCertificate(courseId);
        }
      } else {
        // Si le certificat n'existe pas encore, générer un nouveau certificat
        await handleGenerateCertificate(courseId);
      }
    } catch (error) {
      console.error("Erreur lors de l'affichage du certificat:", error);
      toast.error(
        "Erreur lors de l'affichage du certificat. Veuillez réessayer.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    }
  };

  // Fonction pour générer un certificat
  const handleGenerateCertificate = async (courseId) => {
    try {
      console.log(
        `Génération du certificat pour l'apprenant ${user.id} et le cours ${courseId}`
      );

      // Appeler l'API pour générer le certificat
      const result = await QuizService.generateCertificat(
        token,
        user.id,
        courseId
      );

      if (result && result.certificat) {
        setCertificateData(result.certificat);
        setShowCertificate(true);

        // Mettre à jour la liste des cours pour afficher le certificat
        const updatedCourses = courses.map((course) =>
          course.id === courseId
            ? { ...course, certificat: result.certificat }
            : course
        );
        setCourses(updatedCourses);
      }
    } catch (error) {
      console.error("Erreur lors de la génération du certificat:", error);
    }
  };

  // Fonction pour enregistrer le certificat
  const handleCertificateSaved = async () => {
    try {
      if (!currentCourseId) {
        throw new Error("ID du cours non disponible");
      }

      // Générer le certificat
      const result = await QuizService.generateCertificat(
        token,
        user.id,
        currentCourseId
      );

      // Rafraîchir les données des cours
      const coursData = await coursService.getApprenantCours(token, user.id);
      if (coursData && coursData.length > 0) {
        const coursesWithProgress = [];

        for (const course of coursData) {
          try {
            const progressionData =
              await QuizService.getProgressionByApprenantAndCours(
                token,
                user.id,
                course.id
              );

            coursesWithProgress.push({
              ...course,
              progress_percentage: progressionData.progress_percentage || 0,
              quizzes_total: progressionData.quizzes_total || 0,
              quizzes_passed: progressionData.quizzes_passed || 0,
              is_completed: progressionData.is_completed || false,
              certificat: progressionData.certificat || null,
            });
          } catch (error) {
            console.error(
              `Erreur lors de la récupération de la progression:`,
              error
            );
            coursesWithProgress.push({
              ...course,
              progress_percentage: 0,
              quizzes_total: 0,
              quizzes_passed: 0,
              is_completed: false,
              certificat: null,
              error: true,
            });
          }
        }

        if (coursesWithProgress.length > 0) {
          setCourses(coursesWithProgress);
          setFilteredCourses(coursesWithProgress);
        }
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du certificat:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          <Loader className="absolute inset-0 w-8 h-8 m-auto text-blue-500 animate-pulse" />
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">
          Chargement de vos cours...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
        <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <p className="mt-6 text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Rafraîchir la page
        </button>
      </div>
    );
  }

  // Calculer les statistiques globales
  const totalCourses = courses.length;
  const certifiedCourses = courses.filter((c) => c.certificat).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Affichage du certificat */}
      <CertificateDisplay
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        certificateData={certificateData}
        onSave={handleCertificateSaved}
        forceDownloadButton={true}
      />

      {/* Header section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] opacity-20"></div>

        <div className="relative p-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md mr-4 flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/30">
                <GraduationCap className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  Mes Cours Pharmaceutiques
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Explorez vos cours et suivez votre progression
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mb-4">
                Suivez votre progression, accédez à vos certificats et continuez
                votre apprentissage professionnel dans le domaine
                pharmaceutique.
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <span
                      key={course.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      {course.titre || course.title}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    Aucun cours disponible pour le moment
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md mr-4 flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/30">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Mes cours ({totalCourses})
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Tous vos cours disponibles
              </p>
            </div>
          </div>

          {courses.length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-blue-400" />
                </div>
                <input
                  type="text"
                  className="py-2.5 pl-10 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-700 shadow-sm"
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setSearchTerm("")}
                    aria-label="Effacer la recherche"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="relative">
                <button className="flex items-center py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm hover:border-blue-200 dark:hover:border-blue-800">
                  <Filter className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Filtrer
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-full mb-6 shadow-md border-2 border-blue-100 dark:border-blue-900/30">
              <BookOpen className="w-16 h-16 text-blue-300 dark:text-blue-800" />
            </div>
            <h4 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3">
              Aucun cours disponible
            </h4>
            <p className="text-center max-w-md">
              Vous n'avez pas encore de cours assignés. Veuillez contacter votre
              administrateur pour plus d'informations.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => handleCourseClick(course.id)}
                  onCertificateClick={handleShowCertificate}
                />
              ))
            ) : (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
                  <Search className="w-8 h-8 text-blue-300 dark:text-blue-700" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aucun cours trouvé
                </h4>
                <p className="text-center max-w-md">
                  Aucun cours ne correspond à votre recherche "{searchTerm}".
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cours;
