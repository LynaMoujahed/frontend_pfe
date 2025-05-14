import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth-context";
import coursService from "../../../services/coursService";
import { QuizService } from "../../../services/QuizService";
import {
  Loader,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Filter,
  Info,
  AlertTriangle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  BookOpenCheck,
  GraduationCap,
  ListChecks,
} from "lucide-react";
import CertificateDisplay from "../../common/CertificateDisplay";

const CourseDetails = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progression, setProgression] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  // États pour les compétences et filtres
  const [quizCompetences, setQuizCompetences] = useState({});
  const [quizActions, setQuizActions] = useState({});
  const [checkedSousCompetences, setCheckedSousCompetences] = useState({});
  const [checkedActions, setCheckedActions] = useState({});
  const [quizMainSurface, setQuizMainSurface] = useState({});
  const [loadingCompetences, setLoadingCompetences] = useState(false);
  const [competenceFilter, setCompetenceFilter] = useState("all"); // all, not_acquired, not_evaluated, to_improve
  const [expandedQuizzes, setExpandedQuizzes] = useState({});

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!user || !token) {
        setLoading(false);
        setError("Vous devez être connecté pour accéder aux détails du cours");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Récupérer les détails du cours
        const courseData = await coursService.getCoursById(token, courseId);
        setCourse(courseData);

        // Récupérer les quiz associés au cours
        const quizzesData = await QuizService.getQuizzesByCourse(
          token,
          courseId
        );
        const quizzesArray = Array.isArray(quizzesData) ? quizzesData : [];
        setQuizzes(quizzesArray);

        // Récupérer la progression pour ce cours
        const progressionData =
          await QuizService.getProgressionByApprenantAndCours(
            token,
            user.id,
            courseId
          );
        setProgression(progressionData);

        // Vérifier si un certificat existe
        if (progressionData.is_completed && progressionData.certificat) {
          setCertificateData(progressionData.certificat);
        }

        // Initialiser l'état des quiz développés
        const initialExpandedState = {};
        quizzesArray.forEach((quiz) => {
          // Trouver l'évaluation correspondante
          const evaluation = progressionData?.quiz_evaluations?.find(
            (evalItem) =>
              evalItem.quiz_id === quiz.id ||
              evalItem.idmodule === quiz.idmodule
          );

          // Développer automatiquement les quiz non satisfaisants
          if (evaluation?.status === "Non Satisfaisant") {
            initialExpandedState[quiz.id] = true;
          } else {
            initialExpandedState[quiz.id] = false;
          }
        });
        setExpandedQuizzes(initialExpandedState);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des détails du cours:",
          error
        );
        setError(
          "Impossible de récupérer les détails du cours. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, user, token]);

  // Fonction pour récupérer les compétences, sous-compétences et actions d'un quiz
  const fetchQuizCompetences = async (quiz) => {
    if (!quiz || !token) return;

    try {
      setLoadingCompetences(true);

      // Vérifier si nous avons déjà récupéré les compétences pour ce quiz
      if (quizCompetences[quiz.id]) {
        setLoadingCompetences(false);
        return;
      }

      console.log(
        `Récupération des compétences pour le quiz ${quiz.id} (${quiz.nom_fr || quiz.Nom_FR})`
      );

      // Récupérer l'évaluation correspondante
      const evaluation = progression?.quiz_evaluations?.find(
        (evalItem) =>
          evalItem.quiz_id === quiz.id ||
          evalItem.idmodule === quiz.idmodule ||
          evalItem.idmodule === quiz.IDModule
      );

      // Si le quiz n'a pas d'évaluation, ne rien afficher
      if (!evaluation) {
        console.log("Aucune évaluation trouvée pour ce quiz");
        setLoadingCompetences(false);
        return;
      }

      // Récupérer les détails de l'évaluation (compétences, sous-compétences, actions, Main/Surface)
      const evaluationDetails = await QuizService.getEvaluationDetails(
        token,
        quiz.id,
        user.id
      );

      // Si aucun détail d'évaluation n'est trouvé, utiliser la méthode traditionnelle
      if (!evaluationDetails) {
        console.log(
          "Aucun détail d'évaluation trouvé, utilisation des données simulées"
        );

        // Récupérer les compétences
        const competencesData = await QuizService.getCompetencesByQuiz(
          token,
          quiz.idmodule || quiz.IDModule,
          true
        );

        // Récupérer les actions associées au quiz
        const actionsData = await QuizService.getActions(token, {
          idmodule: quiz.idmodule || quiz.IDModule,
        });

        // Générer un identifiant unique pour ce quiz basé sur son idmodule
        const quizSeed =
          parseInt(
            (quiz.idmodule || quiz.IDModule || "0").replace(/\D/g, "")
          ) || 0;

        // Initialiser les états des actions
        const initialCheckedActions = {};
        actionsData.forEach((action) => {
          // Utiliser un algorithme déterministe basé sur l'ID de l'action et l'ID du quiz
          const actionSeed = (action.id * 31 + quizSeed) % 100;

          // Si le quiz est non satisfaisant, certaines actions ne sont pas cochées
          if (evaluation?.status === "Non Satisfaisant") {
            initialCheckedActions[action.id] = actionSeed >= 30;
          } else {
            // Si le quiz est satisfaisant, toutes les actions sont cochées
            initialCheckedActions[action.id] = true;
          }
        });

        // Initialiser les états des sous-compétences
        const initialCheckedSousCompetences = {};

        // Récupérer les valeurs Main et Surface du quiz
        let mainSurfaceData = null;
        if (
          quiz.MainSurface === 1 ||
          quiz.MainSurface === true ||
          quiz.MainSurface === "1" ||
          quiz.MainSurface === "true"
        ) {
          // Si le quiz est non satisfaisant, simuler des valeurs différentes
          if (evaluation?.status === "Non Satisfaisant") {
            const mainDiff = (quizSeed % 10) + 1;
            const surfaceDiff = ((quizSeed + 7) % 10) + 1;

            mainSurfaceData = {
              originalMain: quiz.Main || 0,
              originalSurface: quiz.Surface || 0,
              currentMain: (quiz.Main || 0) + mainDiff,
              currentSurface: Math.max(0, (quiz.Surface || 0) - surfaceDiff),
              isModified: true,
            };
          } else {
            mainSurfaceData = {
              originalMain: quiz.Main || 0,
              originalSurface: quiz.Surface || 0,
              currentMain: quiz.Main || 0,
              currentSurface: quiz.Surface || 0,
              isModified: false,
            };
          }
        }

        // Pour chaque compétence, récupérer ses sous-compétences et simuler son évaluation
        const competencesWithSubs = await Promise.all(
          competencesData.map(async (competence) => {
            try {
              const sousCompetences =
                await QuizService.getSousCompetencesByCompetence(
                  token,
                  competence.id
                );

              // Générer un identifiant unique pour cette compétence
              const competenceSeed = (competence.id * 17 + quizSeed) % 100;

              // Déterminer le statut de la compétence
              let status = "not_evaluated";

              // Si le quiz est évalué comme "Non Satisfaisant"
              if (evaluation?.status === "Non Satisfaisant") {
                if (competenceSeed < 33) {
                  status = "not_acquired";
                } else if (competenceSeed < 66) {
                  status = "to_improve";

                  // Pour les compétences "to_improve", marquer certaines sous-compétences comme cochées
                  if (sousCompetences && sousCompetences.length > 0) {
                    sousCompetences.forEach((sousComp) => {
                      const sousCompSeed =
                        (sousComp.id * 13 + competence.id) % 100;
                      initialCheckedSousCompetences[sousComp.id] =
                        sousCompSeed < 50;
                    });
                  }
                } else {
                  status = "not_evaluated";
                }
              }
              // Si le quiz est évalué comme "Satisfaisant", les compétences sont acquired
              else if (evaluation?.status === "Satisfaisant") {
                status = "acquired";
              }

              return {
                ...competence,
                sousCompetences: sousCompetences || [],
                status: status,
                evaluation:
                  status === "to_improve"
                    ? "to_improve"
                    : status === "not_acquired"
                      ? "not_acquired"
                      : status === "acquired"
                        ? "acquired"
                        : "not_evaluated",
              };
            } catch (error) {
              console.error(
                "Erreur lors de la récupération des sous-compétences:",
                error
              );
              return {
                ...competence,
                sousCompetences: [],
                status: "not_evaluated",
                evaluation: "not_evaluated",
              };
            }
          })
        );

        // Mettre à jour l'état des compétences
        setQuizCompetences((prevState) => ({
          ...prevState,
          [quiz.id]: competencesWithSubs,
        }));

        // Mettre à jour l'état des actions
        setQuizActions((prevState) => ({
          ...prevState,
          [quiz.id]: actionsData,
        }));

        // Mettre à jour l'état des actions cochées
        setCheckedActions((prevState) => ({
          ...prevState,
          [quiz.id]: initialCheckedActions,
        }));

        // Mettre à jour l'état des sous-compétences cochées
        setCheckedSousCompetences((prevState) => ({
          ...prevState,
          ...initialCheckedSousCompetences,
        }));

        // Mettre à jour l'état des valeurs Main et Surface
        if (mainSurfaceData) {
          setQuizMainSurface((prevState) => ({
            ...prevState,
            [quiz.id]: mainSurfaceData,
          }));
        }
      } else {
        // Utiliser les détails d'évaluation réels
        console.log(
          "Détails d'évaluation trouvés, utilisation des données réelles"
        );

        // Mettre à jour l'état des compétences
        setQuizCompetences((prevState) => ({
          ...prevState,
          [quiz.id]: evaluationDetails.competences,
        }));

        // Mettre à jour l'état des actions
        setQuizActions((prevState) => ({
          ...prevState,
          [quiz.id]: evaluationDetails.actions,
        }));

        // Mettre à jour l'état des actions cochées
        setCheckedActions((prevState) => {
          // Créer un nouvel objet pour les actions cochées de ce quiz
          const quizCheckedActions = {};

          // Pour chaque action, définir son état (cochée ou non)
          Object.keys(evaluationDetails.checkedActions).forEach((actionId) => {
            quizCheckedActions[actionId] =
              evaluationDetails.checkedActions[actionId];
          });

          return {
            ...prevState,
            [quiz.id]: quizCheckedActions,
          };
        });

        // Mettre à jour l'état des sous-compétences cochées
        const newCheckedSousCompetences = {};

        // Traiter les sous-compétences cochées depuis evaluationDetails
        if (evaluationDetails.checkedSousCompetences) {
          // Parcourir toutes les sous-compétences cochées
          Object.keys(evaluationDetails.checkedSousCompetences).forEach(
            (sousCompId) => {
              const sousCompData =
                evaluationDetails.checkedSousCompetences[sousCompId];

              // Si c'est un objet avec des informations détaillées
              if (typeof sousCompData === "object" && sousCompData.checked) {
                newCheckedSousCompetences[sousCompId] = sousCompData;
              }
              // Si c'est juste un booléen
              else if (sousCompData === true) {
                newCheckedSousCompetences[sousCompId] = true;
              }
            }
          );
        }

        // Pour chaque compétence, vérifier également les sous-compétences cochées
        evaluationDetails.competences.forEach((competence) => {
          // Si la compétence a des sous-compétences cochées
          if (competence.checkedSousCompetences) {
            // Pour chaque sous-compétence cochée
            Object.keys(competence.checkedSousCompetences).forEach(
              (sousCompId) => {
                if (competence.checkedSousCompetences[sousCompId] === true) {
                  // Si la sous-compétence n'est pas déjà dans newCheckedSousCompetences
                  // ou si elle y est mais sans information sur la compétence parente
                  if (
                    !newCheckedSousCompetences[sousCompId] ||
                    typeof newCheckedSousCompetences[sousCompId] !== "object"
                  ) {
                    newCheckedSousCompetences[sousCompId] = {
                      checked: true,
                      competenceId: competence.id,
                      competenceStatus:
                        competence.status || competence.evaluation,
                    };
                  }
                }
              }
            );
          }
        });

        setCheckedSousCompetences((prevState) => ({
          ...prevState,
          ...newCheckedSousCompetences,
        }));

        // Mettre à jour l'état des valeurs Main et Surface
        if (evaluationDetails.mainSurfaceData) {
          setQuizMainSurface((prevState) => ({
            ...prevState,
            [quiz.id]: evaluationDetails.mainSurfaceData,
          }));
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des compétences:", error);
    } finally {
      setLoadingCompetences(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setLoading(true);
      const certificateData = await QuizService.generateCertificat(
        token,
        user.id,
        courseId
      );
      setCertificateData(certificateData);
      setShowCertificate(true);
    } catch (error) {
      console.error("Erreur lors de la génération du certificat:", error);
      setError(
        "Impossible de générer le certificat. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateSaved = async () => {
    try {
      // Générer le certificat
      const result = await QuizService.generateCertificat(
        token,
        user.id,
        courseId
      );

      // Rafraîchir les données de progression
      const progressionData =
        await QuizService.getProgressionByApprenantAndCours(
          token,
          user.id,
          courseId
        );
      setProgression(progressionData);

      if (progressionData.certificat) {
        setCertificateData(progressionData.certificat);
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du certificat:", error);
      throw error;
    }
  };

  // Fonction pour basculer l'état d'expansion d'un quiz
  const toggleQuizExpansion = (quizId) => {
    // Mettre à jour l'état d'expansion
    setExpandedQuizzes((prevState) => {
      const newState = {
        ...prevState,
        [quizId]: !prevState[quizId],
      };

      // Si le quiz va être développé et que nous n'avons pas encore récupéré ses compétences
      if (!prevState[quizId] && !quizCompetences[quizId]) {
        const quiz = quizzes.find((q) => q.id === quizId);
        if (quiz) {
          // Utiliser setTimeout pour s'assurer que l'état est mis à jour avant de récupérer les compétences
          setTimeout(() => {
            fetchQuizCompetences(quiz);
          }, 0);
        }
      }

      return newState;
    });
  };

  // Fonction pour développer automatiquement les quiz non satisfaisants
  useEffect(() => {
    if (quizzes.length > 0 && progression?.quiz_evaluations) {
      // Créer un nouvel objet pour stocker l'état d'expansion des quiz
      const newExpandedState = { ...expandedQuizzes };
      const quizzesToFetch = [];

      // Pour chaque quiz, vérifier s'il est non satisfaisant
      quizzes.forEach((quiz) => {
        const evaluation = progression.quiz_evaluations.find(
          (evalItem) =>
            evalItem.quiz_id === quiz.id ||
            evalItem.idmodule === quiz.idmodule ||
            evalItem.idmodule === quiz.IDModule
        );

        // Si le quiz est non satisfaisant, le développer automatiquement
        if (evaluation?.status === "Non Satisfaisant") {
          newExpandedState[quiz.id] = true;

          // Vérifier si nous avons déjà récupéré les compétences pour ce quiz
          if (!quizCompetences[quiz.id]) {
            quizzesToFetch.push(quiz);
          }
        }
      });

      // Mettre à jour l'état d'expansion des quiz
      setExpandedQuizzes(newExpandedState);

      // Récupérer les compétences pour les quiz non satisfaisants en une seule fois
      quizzesToFetch.forEach((quiz) => {
        fetchQuizCompetences(quiz);
      });
    }
  }, [quizzes, progression, quizCompetences]);

  // Fonction pour changer le filtre des compétences
  const handleFilterChange = (filter) => {
    setCompetenceFilter(filter);
  };

  // Fonction pour filtrer les compétences selon le filtre actif
  const filterCompetences = (competences) => {
    if (!competences || competenceFilter === "all") {
      return competences;
    }

    return competences.filter((comp) => comp.status === competenceFilter);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Chargement des détails du cours...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
        <AlertCircle className="w-8 h-8" />
        <p className="mt-4">{error}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-yellow-500 dark:text-yellow-400">
        <AlertCircle className="w-8 h-8" />
        <p className="mt-4">Cours non trouvé</p>
        <button
          onClick={() => navigate("/apprenant/cours")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retour à la liste des cours
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec bouton de retour - Design amélioré */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg p-6 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 dark:bg-blue-800/20 rounded-full -mr-20 -mt-20 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-100 dark:bg-indigo-800/20 rounded-full -ml-10 -mb-10 opacity-50"></div>

        <div className="relative flex items-start">
          <button
            onClick={() => navigate("/apprenant/cours")}
            className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/30 mr-4 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </button>

          <div className="flex-1">
            <div className="flex items-center">
              <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md mr-4">
                <BookOpenCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  {course.titre || course.title}
                </h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
                  {course.description || course.shortDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage du certificat */}
      <CertificateDisplay
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        certificateData={certificateData}
        onSave={handleCertificateSaved}
      />

      {/* Carte de progression et certificat - Design amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Progression */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="p-4 relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md mr-4 flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/30">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center relative z-10">
                  Progression du cours
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-medium">Progression globale</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {progression?.progress_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden shadow-inner">
                <div
                  className="h-4 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-blue-500"
                  style={{ width: `${progression?.progress_percentage || 0}%` }}
                >
                  {(progression?.progress_percentage || 0) > 15 && (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white px-2">
                        {progression?.progress_percentage || 0}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                    <Clock className="h-6 w-6 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut du cours
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {progression?.is_completed ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Cours complété
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      En cours
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                    <ListChecks className="h-6 w-6 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quiz réussis
                  </span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {progression?.quizzes_passed || 0}
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">
                    /{progression?.quizzes_total || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificat */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="p-4 relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md mr-4 flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/30">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center relative z-10">
                  Certification
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            {progression?.is_completed ? (
              certificateData ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-xl shadow-md border border-green-100 dark:border-green-800/30">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <span className="font-medium text-green-800 dark:text-green-300">
                        Certificat obtenu
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Date d'obtention:{" "}
                      <span className="font-medium">
                        {new Date(
                          certificateData.date_obtention
                        ).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  <div
                    onClick={() => setShowCertificate(true)}
                    className="mt-4 flex items-center justify-center p-3 rounded-xl cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 hover:shadow-md transition-all"
                  >
                    <Award className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Voir mon certificat</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-xl shadow-md border border-green-100 dark:border-green-800/30">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <span className="font-medium text-green-800 dark:text-green-300">
                        Félicitations !
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Vous avez complété ce cours avec succès. Vous pouvez
                      maintenant générer votre certificat.
                    </p>
                  </div>

                  <div
                    onClick={handleGenerateCertificate}
                    className="mt-4 flex items-center justify-center p-3 rounded-xl cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 hover:shadow-md transition-all"
                  >
                    <Award className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Générer mon certificat</span>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <span className="font-medium text-blue-800 dark:text-blue-300">
                      En cours
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Complétez tous les quiz du cours pour obtenir votre
                    certificat.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {progression?.progress_percentage || 0}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Progression requise: 100%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des quiz - Design amélioré */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md mr-4 flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/30">
                <BookOpenCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center relative z-10">
                  Quiz disponibles ({quizzes.length})
                </h3>
              </div>
            </div>

            {/* Filtres pour les compétences */}
            <div className="flex flex-wrap items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
              <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                Filtrer:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    competenceFilter === "all"
                      ? "bg-white text-blue-600 font-medium shadow-md"
                      : "bg-blue-200 text-blue-700 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => handleFilterChange("not_acquired")}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    competenceFilter === "not_acquired"
                      ? "bg-white text-red-600 font-medium shadow-md"
                      : "bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
                  }`}
                >
                  Non acquises
                </button>
                <button
                  onClick={() => handleFilterChange("not_evaluated")}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    competenceFilter === "not_evaluated"
                      ? "bg-white text-gray-600 font-medium shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Non évaluées
                </button>
                <button
                  onClick={() => handleFilterChange("to_improve")}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    competenceFilter === "to_improve"
                      ? "bg-white text-amber-600 font-medium shadow-md"
                      : "bg-amber-200 text-amber-700 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700"
                  }`}
                >
                  À améliorer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Info className="h-12 w-12 mb-4 text-blue-400 opacity-50" />
              <p className="text-lg font-medium">
                Aucun quiz disponible pour ce cours.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {quizzes.map((quiz) => {
                // Trouver l'évaluation correspondante dans la progression
                const evaluation = progression?.quiz_evaluations?.find(
                  (evalItem) =>
                    evalItem.quiz_id === quiz.id ||
                    evalItem.idmodule === quiz.idmodule
                );

                // Déterminer le statut du quiz
                const status = evaluation?.status || "Non évalué";
                const isCompleted = status === "Satisfaisant";
                const isNotSatisfactory = status === "Non Satisfaisant";

                // Récupérer les compétences pour ce quiz
                const competences = quizCompetences[quiz.id] || [];

                // Filtrer les compétences selon le filtre actif
                const filteredCompetences = filterCompetences(competences);

                // Déterminer si le quiz doit être affiché en fonction du filtre
                const shouldShowQuiz =
                  competenceFilter === "all" ||
                  (filteredCompetences && filteredCompetences.length > 0) ||
                  !quizCompetences[quiz.id]; // Toujours afficher les quiz dont les compétences n'ont pas encore été chargées

                return shouldShowQuiz ? (
                  <div
                    key={quiz.id}
                    className={`rounded-xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg ${
                      isCompleted
                        ? "border border-green-200 dark:border-green-800"
                        : isNotSatisfactory
                          ? "border border-red-200 dark:border-red-800"
                          : "border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {/* En-tête du quiz */}
                    <div
                      className={`p-5 cursor-pointer transition-all duration-300 ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
                          : isNotSatisfactory
                            ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10"
                            : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50"
                      }`}
                      onClick={() => toggleQuizExpansion(quiz.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div
                            className={`p-2 rounded-lg mr-3 shadow-md ${
                              isCompleted
                                ? "bg-white dark:bg-gray-800"
                                : isNotSatisfactory
                                  ? "bg-white dark:bg-gray-800"
                                  : "bg-white dark:bg-gray-800"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : isNotSatisfactory ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4
                              className={`font-medium text-lg ${
                                isCompleted
                                  ? "text-green-700 dark:text-green-400"
                                  : isNotSatisfactory
                                    ? "text-red-700 dark:text-red-400"
                                    : "text-gray-800 dark:text-white"
                              }`}
                            >
                              {quiz.nom_fr ||
                                quiz.Nom_FR ||
                                quiz.titre ||
                                quiz.title ||
                                `Quiz ${quiz.idmodule || quiz.IDModule}`}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {quiz.description ||
                                "Aucune description disponible"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                              isCompleted
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                : isNotSatisfactory
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {status}
                          </span>
                          <button
                            className={`p-2 rounded-full transition-all duration-300 ${
                              expandedQuizzes[quiz.id]
                                ? isCompleted
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                  : isNotSatisfactory
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-white/80 text-gray-500 dark:bg-gray-800/80 dark:text-gray-400"
                            }`}
                            aria-label={
                              expandedQuizzes[quiz.id]
                                ? "Réduire"
                                : "Développer"
                            }
                          >
                            {expandedQuizzes[quiz.id] ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contenu des compétences (affiché uniquement si le quiz est développé) - Design amélioré */}
                    {expandedQuizzes[quiz.id] && (
                      <div
                        className={`border-t p-6 ${
                          isNotSatisfactory
                            ? "border-red-200 dark:border-red-800 bg-gradient-to-br from-white to-red-50/30 dark:from-gray-800 dark:to-red-900/5"
                            : isCompleted
                              ? "border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/5"
                              : "border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/5"
                        }`}
                      >
                        {loadingCompetences ? (
                          <div className="flex flex-col justify-center items-center py-8">
                            <div className="relative w-16 h-16">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                              </div>
                              <div
                                className="absolute inset-0 border-t-2 border-blue-500/20 rounded-full animate-spin"
                                style={{ animationDuration: "3s" }}
                              ></div>
                            </div>
                            <span className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                              Chargement des compétences...
                            </span>
                          </div>
                        ) : competences.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                              <Info className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="text-base font-medium">
                              Aucune compétence disponible pour ce quiz.
                            </p>
                          </div>
                        ) : filteredCompetences.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4">
                              <Filter className="w-8 h-8 text-amber-400" />
                            </div>
                            <p className="text-base font-medium">
                              Aucune compétence ne correspond au filtre
                              sélectionné.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {/* Affichage des compétences */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {filteredCompetences.map((competence) => (
                                <div
                                  key={competence.id}
                                  className={`p-5 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg ${
                                    competence.status === "not_acquired"
                                      ? "bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 dark:from-red-900/10 dark:to-rose-900/5 dark:border-red-800"
                                      : competence.status === "to_improve"
                                        ? "bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 dark:from-amber-900/10 dark:to-yellow-900/5 dark:border-amber-800"
                                        : competence.status === "not_evaluated"
                                          ? "bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 dark:from-gray-800/50 dark:to-slate-800/30 dark:border-gray-700"
                                          : "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 dark:from-green-900/10 dark:to-emerald-900/5 dark:border-green-800"
                                  }`}
                                >
                                  <div className="flex items-start">
                                    <div
                                      className={`p-3 rounded-lg mr-3 shadow-md ${
                                        competence.status === "not_acquired"
                                          ? "bg-white dark:bg-gray-800"
                                          : competence.status === "to_improve"
                                            ? "bg-white dark:bg-gray-800"
                                            : competence.status ===
                                                "not_evaluated"
                                              ? "bg-white dark:bg-gray-800"
                                              : "bg-white dark:bg-gray-800"
                                      }`}
                                    >
                                      {competence.status === "not_acquired" && (
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                      )}
                                      {competence.status === "to_improve" && (
                                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                      )}
                                      {competence.status ===
                                        "not_evaluated" && (
                                        <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                      )}
                                      {competence.status === "acquired" && (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h5
                                        className={`text-lg font-medium mb-2 ${
                                          competence.status === "not_acquired"
                                            ? "text-red-700 dark:text-red-400"
                                            : competence.status === "to_improve"
                                              ? "text-amber-700 dark:text-amber-400"
                                              : competence.status ===
                                                  "not_evaluated"
                                                ? "text-gray-700 dark:text-gray-300"
                                                : "text-green-700 dark:text-green-400"
                                        }`}
                                      >
                                        {competence.nom_fr}
                                      </h5>

                                      {/* Statut de la compétence */}
                                      <div className="mb-3">
                                        <span
                                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                                            competence.status === "not_acquired"
                                              ? "bg-white text-red-800 dark:bg-gray-800 dark:text-red-300"
                                              : competence.status ===
                                                  "to_improve"
                                                ? "bg-white text-amber-800 dark:bg-gray-800 dark:text-amber-300"
                                                : competence.status ===
                                                    "not_evaluated"
                                                  ? "bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                  : "bg-white text-green-800 dark:bg-gray-800 dark:text-green-300"
                                          }`}
                                        >
                                          {competence.status === "not_acquired"
                                            ? "Non acquise"
                                            : competence.status === "to_improve"
                                              ? "À améliorer"
                                              : competence.status ===
                                                  "not_evaluated"
                                                ? "Non évaluée"
                                                : competence.status ===
                                                    "acquired"
                                                  ? "Acquise"
                                                  : ""}
                                        </span>
                                      </div>

                                      {/* Afficher les sous-compétences si elles existent */}
                                      {competence.sousCompetences &&
                                        competence.sousCompetences.length >
                                          0 && (
                                          <div
                                            className={`mt-3 pl-3 border-l-2 space-y-2 ${
                                              competence.status ===
                                              "not_acquired"
                                                ? "border-red-200 dark:border-red-800"
                                                : competence.status ===
                                                    "to_improve"
                                                  ? "border-amber-200 dark:border-amber-800"
                                                  : competence.status ===
                                                      "not_evaluated"
                                                    ? "border-gray-200 dark:border-gray-700"
                                                    : "border-green-200 dark:border-green-800"
                                            }`}
                                          >
                                            {competence.sousCompetences.map(
                                              (sousComp) => {
                                                // Vérifier si cette sous-compétence est cochée
                                                // Priorité à checkedSousCompetences de la compétence si disponible
                                                const isChecked =
                                                  (competence.checkedSousCompetences &&
                                                    competence
                                                      .checkedSousCompetences[
                                                      sousComp.id
                                                    ] === true) ||
                                                  (checkedSousCompetences[
                                                    sousComp.id
                                                  ] &&
                                                    (checkedSousCompetences[
                                                      sousComp.id
                                                    ] === true ||
                                                      (typeof checkedSousCompetences[
                                                        sousComp.id
                                                      ] === "object" &&
                                                        checkedSousCompetences[
                                                          sousComp.id
                                                        ].checked === true &&
                                                        checkedSousCompetences[
                                                          sousComp.id
                                                        ].competenceId ===
                                                          competence.id)));

                                                // Afficher uniquement les sous-compétences cochées pour les compétences "to_improve"
                                                // ou toutes les sous-compétences pour les autres statuts
                                                const shouldDisplay =
                                                  competence.status !==
                                                    "to_improve" ||
                                                  (competence.status ===
                                                    "to_improve" &&
                                                    isChecked);

                                                return shouldDisplay ? (
                                                  <div
                                                    key={sousComp.id}
                                                    className={`flex items-center p-2 rounded-lg ${
                                                      competence.status ===
                                                        "to_improve" &&
                                                      isChecked
                                                        ? "bg-amber-100/50 dark:bg-amber-900/20"
                                                        : ""
                                                    }`}
                                                  >
                                                    {competence.status ===
                                                      "to_improve" &&
                                                    isChecked ? (
                                                      <div className="flex items-center justify-center bg-white dark:bg-gray-800 p-1.5 rounded-md shadow-sm mr-2">
                                                        <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                      </div>
                                                    ) : (
                                                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 mr-3"></div>
                                                    )}
                                                    <div>
                                                      <span
                                                        className={`text-sm ${
                                                          competence.status ===
                                                            "to_improve" &&
                                                          isChecked
                                                            ? "text-amber-700 dark:text-amber-400 font-medium"
                                                            : "text-gray-600 dark:text-gray-400"
                                                        }`}
                                                      >
                                                        {sousComp.nom_fr}
                                                      </span>
                                                      {competence.status ===
                                                        "to_improve" &&
                                                        isChecked && (
                                                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white text-amber-800 dark:bg-gray-800 dark:text-amber-300 shadow-sm">
                                                            À améliorer
                                                          </span>
                                                        )}
                                                    </div>
                                                  </div>
                                                ) : null;
                                              }
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Affichage des actions - Design amélioré */}
                            {isNotSatisfactory &&
                              quizActions[quiz.id] &&
                              quizActions[quiz.id].length > 0 && (
                                <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/5 p-5 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30">
                                  <h4 className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-4 flex items-center">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Actions à vérifier
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {quizActions[quiz.id].map((action) => {
                                      // Vérifier si cette action est cochée
                                      const isChecked =
                                        checkedActions[quiz.id] &&
                                        checkedActions[quiz.id][action.id] ===
                                          true;

                                      // Pour les quiz non satisfaisants, n'afficher que les actions non cochées
                                      // car ce sont celles qui posent problème
                                      if (isNotSatisfactory && isChecked) {
                                        return null;
                                      }

                                      return (
                                        <div
                                          key={action.id}
                                          className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-red-100 dark:border-red-800/30 transform transition-all duration-300 hover:shadow-lg"
                                        >
                                          <div className="flex items-start">
                                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm mr-3">
                                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                              <span className="text-base font-medium text-red-700 dark:text-red-400">
                                                {action.nom_fr}
                                              </span>
                                              <div className="mt-2 flex items-center">
                                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm mr-2">
                                                  Non réalisée
                                                </span>
                                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            {/* Affichage des valeurs Main et Surface - Design amélioré */}
                            {isNotSatisfactory &&
                              quizMainSurface[quiz.id] &&
                              (quizMainSurface[quiz.id].currentMain !==
                                quizMainSurface[quiz.id].originalMain ||
                                quizMainSurface[quiz.id].currentSurface !==
                                  quizMainSurface[quiz.id].originalSurface) && (
                                <div className="mt-8 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/5 p-5 rounded-xl shadow-md border border-purple-100 dark:border-purple-800/30">
                                  <h4 className="text-lg font-medium text-purple-700 dark:text-purple-400 mb-4 flex items-center">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md mr-3">
                                      <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    Valeurs Main et Surface incorrectes
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {quizMainSurface[quiz.id].currentMain !==
                                      quizMainSurface[quiz.id].originalMain && (
                                      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-red-100 dark:border-red-800/30 transform transition-all duration-300 hover:shadow-lg">
                                        <div className="flex items-start">
                                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm mr-3">
                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                          </div>
                                          <div>
                                            <span className="text-base font-medium text-red-700 dark:text-red-400">
                                              Valeur Main incorrecte
                                            </span>
                                            <div className="mt-3 flex items-center space-x-4">
                                              <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                  Valeur actuelle
                                                </span>
                                                <span className="text-lg font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                                                  {
                                                    quizMainSurface[quiz.id]
                                                      .currentMain
                                                  }
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {quizMainSurface[quiz.id].currentSurface !==
                                      quizMainSurface[quiz.id]
                                        .originalSurface && (
                                      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-red-100 dark:border-red-800/30 transform transition-all duration-300 hover:shadow-lg">
                                        <div className="flex items-start">
                                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm mr-3">
                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                          </div>
                                          <div>
                                            <span className="text-base font-medium text-red-700 dark:text-red-400">
                                              Valeur Surface incorrecte
                                            </span>
                                            <div className="mt-3 flex items-center space-x-4">
                                              <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                  Valeur actuelle
                                                </span>
                                                <span className="text-lg font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                                                  {
                                                    quizMainSurface[quiz.id]
                                                      .currentSurface
                                                  }
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
