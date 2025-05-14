import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import {
  Book,
  ArrowLeft,
  Loader,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  BookOpen,
  BarChart3,
  Award,
  GraduationCap,
  Star,
  Sparkles,
  ArrowUpRight,
  Download,
  Share2,
  MessageSquare,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import "./formateur-styles.css";
import { QuizService } from "../../services/QuizService";
import CertificateDisplay from "../Common/CertificateDisplay";
import { API_URL } from "../../config";

const ApprenantCours = () => {
  const [apprenant, setApprenant] = useState(null);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApprenant, setLoadingApprenant] = useState(true);
  const [loadingCours, setLoadingCours] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [currentCertificateData, setCurrentCertificateData] = useState(null);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [progressStats, setProgressStats] = useState({
    coursCompletes: 0,
    tauxReussite: 0,
    competencesAcquises: 0,
  });
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer la catégorie depuis les paramètres d'URL
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    } else {
      // Si aucune catégorie n'est spécifiée dans l'URL, utiliser "all" par défaut
      setSelectedCategory("all");
      // Mettre à jour l'URL avec le paramètre de catégorie par défaut
      setSearchParams({ category: "all" });
    }

    // Charger les données de l'apprenant immédiatement
    fetchApprenantInfo();

    // Puis charger les cours avec la catégorie appropriée
    fetchCoursWithCategory(category || "all");
  }, [id, searchParams]);

  // Effet pour rafraîchir les données du cours périodiquement
  useEffect(() => {
    // Si un cours est complété mais n'a pas de certificat, rafraîchir les données toutes les 5 secondes
    const coursCompletedWithoutCertificate = cours.filter(
      (course) => course.is_completed && !course.certificat
    );

    const hasCompletedCourseWithoutCertificate =
      coursCompletedWithoutCertificate.length > 0;

    let refreshInterval;

    if (hasCompletedCourseWithoutCertificate) {
      console.log(
        "DEBUG: Cours complétés sans certificat détectés:",
        coursCompletedWithoutCertificate.map((c) => ({
          id: c.id,
          titre: c.titre,
          completed: c.is_completed,
        }))
      );
      console.log(
        "DEBUG: Activation du rafraîchissement automatique des données"
      );

      // Rafraîchir les données périodiquement pour mettre à jour l'interface
      refreshInterval = setInterval(() => {
        console.log(
          "DEBUG: Exécution du rafraîchissement automatique des données du cours..."
        );
        fetchCoursWithCategory(selectedCategory, true); // true pour forceRefresh
      }, 5000); // Rafraîchir toutes les 5 secondes
    } else {
      console.log(
        "DEBUG: Aucun cours complété sans certificat, pas de rafraîchissement automatique nécessaire"
      );
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [cours, selectedCategory, id, token]);

  // Fonction séparée pour récupérer les informations de l'apprenant
  const fetchApprenantInfo = async () => {
    try {
      setLoadingApprenant(true);
      setLoading(true);

      // Récupérer les informations de l'apprenant
      const apprenantResponse = await fetch(
        `${API_URL}/formateur/apprenants/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!apprenantResponse.ok) {
        const errorText = await apprenantResponse.text();
        console.error("Erreur de réponse pour l'apprenant:", errorText);
        throw new Error(
          "Erreur lors de la récupération des informations de l'apprenant"
        );
      }

      const apprenantData = await apprenantResponse.json();
      console.log("Données de l'apprenant:", apprenantData);
      setApprenant(apprenantData || null);

      // Mettre à jour l'état de chargement de l'apprenant
      setLoadingApprenant(false);

      // Nous gardons l'état de chargement global à true car nous attendons toujours les cours
    } catch (error) {
      console.error("Erreur lors de la récupération de l'apprenant:", error);
      toast.error(
        `Impossible de charger les informations de l'apprenant: ${error.message}`
      );
      setLoadingApprenant(false);
      setLoading(false);
    }
  };

  // Fonction pour récupérer les cours avec une catégorie spécifique
  const fetchCoursWithCategory = async (
    category = null,
    forceRefresh = false
  ) => {
    try {
      // Si forceRefresh est true, ne pas afficher l'indicateur de chargement pour éviter un clignotement
      if (!forceRefresh) {
        setLoadingCours(true);
        // Garder l'état de chargement global à true si l'apprenant est encore en chargement
        if (!loadingApprenant) {
          setLoading(true);
        }
      }

      console.log(
        `Récupération des cours${category ? ` avec catégorie: ${category}` : ""}`
      );

      // URL pour récupérer les cours, avec ou sans filtre de catégorie
      let coursUrl = `${API_URL}/cours`;

      // Si une catégorie est spécifiée, utiliser l'endpoint spécifique
      if (category) {
        if (category === "all") {
          // Utiliser l'endpoint pour toutes les catégories
          coursUrl = `${API_URL}/formateur/apprenants/${id}/cours/all-categories`;
          console.log(
            `Utilisation de l'URL pour toutes les catégories: ${coursUrl}`
          );
        } else {
          // Utiliser l'endpoint pour une catégorie spécifique
          coursUrl = `${API_URL}/formateur/apprenants/${id}/cours/category/${category}`;
          console.log(`Utilisation de l'URL avec catégorie: ${coursUrl}`);
        }
      }

      console.log(`Envoi de la requête à: ${coursUrl}`);
      const coursResponse = await fetch(coursUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!coursResponse.ok) {
        const errorText = await coursResponse.text();
        console.error("Erreur de réponse pour les cours:", errorText);
        throw new Error(
          `Erreur lors de la récupération des cours: ${errorText}`
        );
      }

      const coursData = await coursResponse.json();
      console.log("Données brutes des cours:", coursData);

      // Si nous avons utilisé l'endpoint avec catégorie, les cours sont dans la propriété 'cours'
      const coursArray = category ? coursData.cours : coursData;
      console.log(
        `Cours disponibles (${coursArray ? coursArray.length : 0}):`,
        coursArray
      );

      // Récupérer la progression pour chaque cours en parallèle
      console.log(
        `DEBUG: Récupération des progressions pour ${coursArray ? coursArray.length : 0} cours`
      );
      const coursWithProgressions = await Promise.all(
        (coursArray || []).map(async (course) => {
          try {
            console.log(
              `DEBUG: Récupération de la progression pour le cours ${course.id} (${course.titre})`
            );
            const progressionData =
              await QuizService.getProgressionByApprenantAndCours(
                token,
                id,
                course.id
              );

            console.log(
              `DEBUG: Progression reçue pour le cours ${course.id}:`,
              {
                pourcentage: progressionData.progress_percentage,
                total_quiz: progressionData.quizzes_total,
                quiz_reussis: progressionData.quizzes_passed,
                complete: progressionData.is_completed,
                certificat: progressionData.certificat
                  ? `ID: ${progressionData.certificat.id}`
                  : "Aucun",
              }
            );

            return {
              ...course,
              progress_percentage: progressionData.progress_percentage || 0,
              quizzes_total: progressionData.quizzes_total || 0,
              quizzes_passed: progressionData.quizzes_passed || 0,
              is_completed: progressionData.is_completed || false,
              certificat: progressionData.certificat || null,
            };
          } catch (error) {
            console.error(
              `Erreur lors de la récupération de la progression pour le cours ${course.id}:`,
              error
            );

            // Si l'erreur est 403 Forbidden, afficher un message plus convivial
            if (error.message && error.message.includes("403")) {
              toast.info(
                `Vous n'avez pas accès aux données de progression pour le cours "${course.titre}"`
              );
            }

            return {
              ...course,
              progress_percentage: 0,
              quizzes_total: 0,
              quizzes_passed: 0,
              is_completed: false,
              certificat: null,
            };
          }
        })
      );

      // Utiliser les cours avec leurs données de progression
      setCours(coursWithProgressions || []);

      if (category && (!coursArray || coursArray.length === 0)) {
        toast.info(
          `Aucun cours associé trouvé pour la catégorie "${category}"`
        );
      }

      // Récupérer les données de progression globales en parallèle
      fetchProgressionStats();
    } catch (error) {
      console.error("Erreur complète:", error);
      toast.error(`Impossible de charger les cours: ${error.message}`);
    } finally {
      // Mettre à jour l'état de chargement seulement si ce n'est pas un rafraîchissement forcé
      if (!forceRefresh) {
        setLoadingCours(false);
        setLoading(false);
      }
    }
  };

  // Fonction séparée pour récupérer les statistiques de progression
  const fetchProgressionStats = async () => {
    try {
      const progressionData = await QuizService.getProgressionByApprenant(
        token,
        id
      );
      console.log("Données de progression:", progressionData);

      if (progressionData) {
        // Mettre à jour les statistiques de progression avec les données réelles
        setProgressStats({
          coursCompletes: progressionData.completed_courses || 0,
          tauxReussite: progressionData.overall_progress
            ? Math.round(progressionData.overall_progress)
            : 0,
          competencesAcquises: progressionData.passed_quizzes || 0,
        });
      }
    } catch (progressionError) {
      console.error(
        "Erreur lors de la récupération des données de progression:",
        progressionError
      );

      // Si l'erreur est 403 Forbidden, afficher un message plus convivial
      if (
        progressionError.message &&
        progressionError.message.includes("403")
      ) {
        toast.info(
          `Vous n'avez pas accès aux données de progression globales pour cet apprenant`
        );
      }

      // En cas d'erreur, utiliser des valeurs par défaut
      setProgressStats({
        coursCompletes: 0,
        tauxReussite: 0,
        competencesAcquises: 0,
      });
    }
  };

  // Fonction pour afficher le certificat
  const handleShowCertificate = async (courseId, certificatId = null) => {
    try {
      setCurrentCourseId(courseId);

      // Si nous avons déjà un certificat, récupérer ses données
      if (certificatId) {
        const response = await fetch(
          `${API_URL}/certificat/${certificatId}/download`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du certificat");
        }

        const data = await response.json();
        setCurrentCertificateData(data.certificat);
      } else {
        // Sinon, préparer les données pour un nouveau certificat
        const course = cours.find((c) => c.id === courseId);
        if (!course) {
          throw new Error("Cours non trouvé");
        }

        setCurrentCertificateData({
          apprenant: {
            id: apprenant.id,
            name: apprenant.name,
          },
          cours: {
            id: course.id,
            titre: course.titre,
          },
          date_obtention: new Date().toISOString().split("T")[0],
        });
      }

      // Afficher le certificat
      setShowCertificate(true);
    } catch (error) {
      console.error("Erreur lors de l'affichage du certificat:", error);
      toast.error(`Erreur: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Fonction pour fermer le certificat
  const handleCloseCertificate = () => {
    setShowCertificate(false);
    setCurrentCertificateData(null);
    setCurrentCourseId(null);
  };

  // Fonction pour enregistrer le certificat
  const handleSaveCertificate = async () => {
    if (!currentCourseId) return;

    try {
      // Appeler l'API pour générer le certificat
      const result = await QuizService.generateCertificat(
        token,
        id,
        currentCourseId
      );

      console.log("Résultat de la génération du certificat:", result);

      // Mettre à jour les données du certificat avec l'ID généré
      if (result && result.certificat) {
        setCurrentCertificateData(result.certificat);

        // Afficher un message de succès dans la console
        console.log(
          "Certificat enregistré avec succès, ID:",
          result.certificat.id
        );

        // Vérifier si le contenu est présent
        if (result.certificat.contenu) {
          console.log("Contenu du certificat présent dans la réponse");
        } else {
          console.log("Contenu du certificat non présent dans la réponse");
        }
      }

      // Mettre à jour la liste des cours pour afficher le certificat
      await fetchCoursWithCategory(selectedCategory);

      return result;
    } catch (error) {
      console.error("Erreur lors de la génération du certificat:", error);

      // Propager l'erreur pour que le composant CertificateDisplay puisse l'afficher
      throw error;
    }
  };

  // Fonction pour générer un certificat
  const handleGenerateCertificate = async (courseId) => {
    try {
      setGeneratingCertificate(true);

      console.log(
        `Génération du certificat pour l'apprenant ${id} et le cours ${courseId}`
      );

      // Générer directement le certificat sans afficher la fenêtre modale
      const result = await QuizService.generateCertificat(token, id, courseId);

      console.log("Résultat de la génération du certificat:", result);

      if (result && result.certificat) {
        // Afficher un message de succès
        toast.success("Certificat généré avec succès !", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Mettre à jour la liste des cours pour afficher le certificat
        await fetchCoursWithCategory(selectedCategory);
      }
    } catch (error) {
      console.error("Erreur lors de la génération du certificat:", error);

      // Afficher un message d'erreur approprié
      if (error.message && error.message.includes("certificat existe déjà")) {
        toast.info("Un certificat existe déjà pour ce cours.", {
          position: "top-right",
          autoClose: 3000,
          icon: "ℹ️",
        });
      } else if (
        error.message &&
        (error.message.includes("quiz du cours doivent être complétés") ||
          error.message.includes("not completed"))
      ) {
        toast.warning(
          "Tous les quiz du cours doivent être complétés avec succès pour générer un certificat.",
          {
            position: "top-right",
            autoClose: 5000,
            icon: "⚠️",
          }
        );
      } else if (
        error.message &&
        error.message.includes("permissions nécessaires")
      ) {
        toast.error(
          "Vous n'avez pas les permissions nécessaires pour générer ce certificat.",
          {
            position: "top-right",
            autoClose: 5000,
            icon: "🔒",
          }
        );
      } else if (error.message && error.message.includes("Server error")) {
        toast.error(
          "Une erreur serveur est survenue. Veuillez réessayer plus tard.",
          {
            position: "top-right",
            autoClose: 5000,
            icon: "❌",
          }
        );
      } else if (error.message && error.message.includes("Database error")) {
        toast.error(
          "Une erreur de base de données est survenue. Veuillez réessayer.",
          {
            position: "top-right",
            autoClose: 5000,
            icon: "❌",
          }
        );
      } else {
        toast.error(
          `Erreur lors de la génération du certificat: ${error.message}`,
          {
            position: "top-right",
            autoClose: 5000,
            icon: "❌",
          }
        );
      }
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Fonction pour changer la catégorie sélectionnée
  const handleCategoryChange = (category) => {
    console.log(`Changement de catégorie: ${category}`);

    // Mettre à jour l'état local
    setSelectedCategory(category);

    // Mettre à jour l'URL avec le paramètre de catégorie
    setSearchParams({ category });

    // Réinitialiser les cours pendant le chargement
    setCours([]);

    // Récupérer les cours avec la nouvelle catégorie
    try {
      fetchCoursWithCategory(category);
    } catch (error) {
      console.error("Erreur lors du changement de catégorie:", error);
      toast.error(`Erreur lors du changement de catégorie: ${error.message}`);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8">
      {/* Affichage du certificat */}
      <CertificateDisplay
        isOpen={showCertificate}
        onClose={handleCloseCertificate}
        certificateData={currentCertificateData}
        onSave={handleSaveCertificate}
      />

      <div className="flex items-center mb-8 animate-slideInLeft">
        <button
          onClick={() => navigate("/formateur")}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-3 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:text-white formateur-title flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-blue-500" />
            Profil de l'apprenant et cours associés
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consultez le profil de l'apprenant et les cours qui lui sont
            associés par l'administrateur
          </p>
        </div>
      </div>

      {loadingApprenant ? (
        <div className="flex flex-col justify-center items-center h-64 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            Chargement des informations de l'apprenant...
          </span>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 max-w-md text-center">
            Nous récupérons les données de base sur cet apprenant
          </p>
        </div>
      ) : (
        <>
          {apprenant && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-soft hover-lift animate-fadeIn">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-700">
                    <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white formateur-title">
                    {apprenant.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                      {apprenant.email}
                    </div>
                    {apprenant.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                        {apprenant.phone}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate("/formateur/messagerie")}
                      className="btn-formateur-primary flex items-center text-sm py-1.5"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contacter
                    </button>
                  </div>
                </div>
                <div className="lg:border-l lg:border-blue-200 lg:dark:border-blue-900/30 lg:pl-6 mt-4 lg:mt-0">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                    Statistiques de progression
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cours complétés
                          </p>
                          {loadingCours ? (
                            <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              {progressStats.coursCompletes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
                          <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Taux de réussite
                          </p>
                          {loadingCours ? (
                            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              {progressStats.tauxReussite}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mr-3">
                          <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Compétences
                          </p>
                          {loadingCours ? (
                            <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              {progressStats.competencesAcquises}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 animate-slideInUp">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h3 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-semibold text-transparent dark:text-white flex items-center formateur-title">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                {selectedCategory
                  ? selectedCategory === "all"
                    ? "Cours associés de toutes les catégories (stérile et non stérile)"
                    : `Cours associés de catégorie "${selectedCategory}"`
                  : "Tous les cours associés à cet apprenant"}
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  {loadingCours ? (
                    <span className="inline-flex items-center">
                      <Loader className="w-3 h-3 mr-1 text-blue-500 animate-spin" />
                      Chargement...
                    </span>
                  ) : (
                    `(${cours.length} cours)`
                  )}
                </span>
              </h3>

              <div className="mt-4 md:mt-0 flex flex-col">
                <div className="relative inline-block">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <label
                      htmlFor="category-select"
                      className="text-sm font-medium text-gray-600 dark:text-gray-300"
                    >
                      Catégorie:
                    </label>
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                      disabled={loadingCours}
                    >
                      <option value="all">Toutes les catégories</option>
                      <option value="Sterile">Stérile</option>
                      <option value="Non-Sterile">Non stérile</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                    Filtrer les cours par catégorie de quiz associés
                  </p>
                </div>
              </div>
            </div>

            {loadingCours ? (
              <div className="flex flex-col justify-center items-center h-48 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                  <Loader className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                  Chargement des cours...
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md text-center">
                  Nous récupérons les cours et les données de progression
                </p>
              </div>
            ) : cours.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-48 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                  <Book className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                  Aucun cours associé
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md text-center">
                  Aucun cours n'est associé à cet apprenant pour le moment.
                  L'administrateur doit associer des cours à cet apprenant.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cours.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <Book className="text-xl" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h2
                                onClick={() =>
                                  navigate(
                                    `/formateur/apprenants/${id}/cours/${course.id}/quizzes`
                                  )
                                }
                                className="text-xl font-semibold text-gray-800 dark:text-white truncate pr-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {course.titre}
                              </h2>
                              <div className="flex space-x-2 flex-shrink-0 ml-2">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/formateur/apprenants/${id}/cours/${course.id}/quizzes`
                                    )
                                  }
                                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                                  title="Voir les quiz du cours"
                                >
                                  <FileText size={18} />
                                </button>
                                <button
                                  className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                                  title="Voir la progression"
                                >
                                  <BarChart3 size={18} />
                                </button>
                              </div>
                            </div>

                            {course.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                                {course.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {course.dateCreation || "Non définie"}
                              </span>
                              {course.status && (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    course.status === "active"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                  }`}
                                >
                                  {course.status === "active" ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Clock className="w-3 h-3 mr-1" />
                                  )}
                                  {course.status === "active"
                                    ? "Actif"
                                    : "En attente"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progression
                        </span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {course.progress_percentage !== undefined
                            ? `${Math.round(course.progress_percentage)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${
                              course.progress_percentage !== undefined
                                ? Math.round(course.progress_percentage)
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <div className="mt-3 flex flex-col space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                          <span>Quiz complétés:</span>
                          <span>
                            {course.quizzes_passed || 0}/
                            {course.quizzes_total || 0}
                          </span>
                        </div>

                        {course.is_completed && (
                          <div className="flex flex-col space-y-2">
                            {!course.certificat ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateCertificate(course.id);
                                }}
                                className="w-full flex items-center justify-center bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 p-2 rounded-lg transition-colors cursor-pointer"
                              >
                                <Award className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  Cours complété - Générer certificat
                                </span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                <Award className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  Cours complété - Certificat généré
                                  {course.certificat &&
                                  course.certificat.isAutoGenerated
                                    ? " automatiquement"
                                    : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-center mt-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/formateur/apprenants/${id}/cours/${course.id}/quizzes`
                              )
                            }
                            className="w-full md:w-auto px-6 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Voir les quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ApprenantCours;
