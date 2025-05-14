import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Loader,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  CheckSquare,
  Award,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { QuizService } from "../../services/QuizService";
import "./formateur-styles.css";
import { API_URL } from "../../config";

// Style pour l'animation de pulsation
const pulseAnimationStyle = `
@keyframes pulse-animation {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.02);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.pulse-animation {
  animation: pulse-animation 0.5s ease-in-out;
}
`;

const QuizDetails = () => {
  const [quiz, setQuiz] = useState(null);
  const [competences, setCompetences] = useState([]);
  const [actions, setActions] = useState([]);
  const [checkedActions, setCheckedActions] = useState({});
  const [checkedSousCompetences, setCheckedSousCompetences] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainValue, setMainValue] = useState(0);
  const [surfaceValue, setSurfaceValue] = useState(0);
  const [originalMainValue, setOriginalMainValue] = useState(0);
  const [originalSurfaceValue, setOriginalSurfaceValue] = useState(0);
  const [evaluation, setEvaluation] = useState(null); // null, "satisfaisant", "non_satisfaisant"
  // Initialiser les deux boutons comme désactivés par défaut
  // Ils seront activés en fonction des conditions vérifiées
  const [satisfactoryButtonDisabled, setSatisfactoryButtonDisabled] =
    useState(true);
  const [nonSatisfactoryButtonDisabled, setNonSatisfactoryButtonDisabled] =
    useState(true);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [previousEvaluation, setPreviousEvaluation] = useState(null); // Pour stocker le statut de l'évaluation précédente
  const [reevaluationAllowed, setReevaluationAllowed] = useState(true); // Pour indiquer si la réévaluation est autorisée

  const { id, courseId, quizId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  // Effet pour s'assurer que les boutons sont dans un état cohérent après chaque changement pertinent
  useEffect(() => {
    // Utiliser la fonction centralisée pour mettre à jour l'état des boutons
    console.log(
      "useEffect: Mise à jour de l'état des boutons suite à un changement d'état"
    );

    // Appeler directement updateButtonsState sans setTimeout pour éviter les conditions de course
    updateButtonsState();
  }, [
    // Dépendances liées aux compétences
    competences,
    // Dépendances liées aux actions
    actions,
    checkedActions,
    // Dépendances liées aux sous-compétences
    checkedSousCompetences,
    // Dépendances liées à Main/Surface
    mainValue,
    surfaceValue,
    originalMainValue,
    originalSurfaceValue,
    // Dépendances liées à l'évaluation
    evaluation,
    alreadyEvaluated,
    reevaluationAllowed,
    // Dépendances liées au quiz
    quiz,
  ]);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        // Réinitialiser les états des boutons au début du chargement
        setSatisfactoryButtonDisabled(true);
        setNonSatisfactoryButtonDisabled(true);

        setLoading(true);

        // Récupérer les informations du quiz
        const quizData = await QuizService.getQuizByIdModule(token, quizId);
        setQuiz(quizData);

        // Initialiser les valeurs de Main et Surface
        if (quizData.MainSurface) {
          // Initialiser les valeurs Main et Surface aux valeurs d'origine
          const originalMain = quizData.Main || 0;
          const originalSurface = quizData.Surface || 0;

          setMainValue(originalMain);
          setSurfaceValue(originalSurface);
          setOriginalMainValue(originalMain);
          setOriginalSurfaceValue(originalSurface);

          // Les valeurs sont identiques aux valeurs d'origine au chargement
          // Les boutons seront désactivés initialement et seront activés uniquement
          // lorsque les conditions seront vérifiées
        }

        // Vérifier si une évaluation existe déjà pour ce quiz
        if (id && quizData.id) {
          try {
            const evaluationData =
              await QuizService.getEvaluationByQuizAndApprenant(
                token,
                quizData.id,
                id
              );
            if (evaluationData) {
              // Mettre à jour l'état avec le statut de l'évaluation existante
              const evaluationStatus = evaluationData.statut.toLowerCase();
              setEvaluation(evaluationStatus);
              setAlreadyEvaluated(true);
              setPreviousEvaluation(evaluationStatus);

              // Déterminer si la réévaluation est autorisée (uniquement si l'évaluation précédente était "non satisfaisant")
              const isAllowed = evaluationStatus === "non satisfaisant";
              setReevaluationAllowed(isAllowed);

              console.log("Évaluation existante chargée:", evaluationData);
              console.log("Réévaluation autorisée:", isAllowed);

              // S'assurer que les deux boutons sont désactivés initialement, même si une évaluation existe déjà
              // Ils seront activés uniquement lorsque les conditions seront vérifiées et si la réévaluation est autorisée
              setSatisfactoryButtonDisabled(true);
              setNonSatisfactoryButtonDisabled(true);

              // Afficher une notification toast pour informer que le quiz a déjà été évalué
              toast.info(
                `Ce quiz a déjà été évalué pour cet apprenant (${evaluationData.statut})${!isAllowed ? " et ne peut pas être réévalué" : ""}`,
                {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  icon: "ℹ️",
                }
              );

              // Stocker le statut précédent pour référence lors de la réévaluation
              console.log(
                "Statut précédent de l'évaluation:",
                evaluationStatus
              );
            }
          } catch (evalError) {
            console.warn("Aucune évaluation existante trouvée:", evalError);
          }
        }

        try {
          // Récupérer les compétences associées au quiz
          const competencesData = await QuizService.getCompetencesByQuiz(
            token,
            quizId,
            true
          );

          // Pour chaque compétence, récupérer ses sous-compétences
          const competencesWithSubs = await Promise.all(
            competencesData.map(async (competence) => {
              try {
                const sousCompetences =
                  await QuizService.getSousCompetencesByCompetence(
                    token,
                    competence.id
                  );
                return {
                  ...competence,
                  sousCompetences: sousCompetences || [],
                };
              } catch (subError) {
                console.warn(
                  "Erreur lors de la récupération des sous-compétences:",
                  subError
                );
                return {
                  ...competence,
                  sousCompetences: [],
                };
              }
            })
          );

          // Initialiser les compétences avec un état par défaut
          // Pour une réévaluation, nous initialisons les compétences avec un état null
          // pour que le formateur doive explicitement les évaluer à nouveau
          const initializedCompetences = competencesWithSubs.map((comp) => ({
            ...comp,
            evaluation: null, // Forcer une réévaluation explicite
          }));

          setCompetences(initializedCompetences);

          console.log(
            "Compétences initialisées avec état null pour réévaluation"
          );

          // Désactiver les deux boutons initialement jusqu'à ce que toutes les compétences soient évaluées
          // Ils seront activés uniquement lorsque les conditions seront vérifiées
          setSatisfactoryButtonDisabled(true);
          setNonSatisfactoryButtonDisabled(true);

          // Après l'initialisation des compétences, l'effet de dépendance se déclenchera automatiquement
          console.log(
            "Compétences initialisées, l'effet de dépendance mettra à jour l'état des boutons"
          );
        } catch (compError) {
          console.error(
            "Erreur lors de la récupération des compétences:",
            compError
          );

          // Au lieu de créer des données fictives, afficher un message d'erreur clair
          setError(
            `Impossible de récupérer les compétences: ${compError.message || "Erreur inconnue"}`
          );

          // Initialiser avec un tableau vide au lieu de données fictives
          setCompetences([]);

          // Désactiver les deux boutons
          setSatisfactoryButtonDisabled(true);
          setNonSatisfactoryButtonDisabled(true);

          // Afficher une notification d'erreur
          toast.error(
            "Erreur lors du chargement des compétences. Veuillez réessayer ou contacter l'administrateur.",
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        }

        // Récupérer les actions associées au quiz
        try {
          const actionsData = await QuizService.getActions(token, {
            idmodule: quizId,
          });

          // Vérifier si les actions retournées sont valides (ont un id et un nom_fr)
          const validActions = actionsData.filter(
            (action) =>
              action &&
              action.id &&
              action.nom_fr &&
              action.nom_fr.trim() !== ""
          );

          console.log("Actions récupérées (brutes):", actionsData);
          console.log("Actions valides:", validActions);

          setActions(validActions);

          // Initialiser l'état des checkboxes pour les actions valides
          const initialCheckedState = {};
          validActions.forEach((action) => {
            // Lors d'une réévaluation, toutes les actions doivent être décochées initialement
            // pour forcer le formateur à vérifier activement chaque action
            initialCheckedState[action.id] = false;
          });
          setCheckedActions(initialCheckedState);

          console.log("Actions initialisées comme décochées pour réévaluation");

          // Après avoir initialisé les actions, utiliser la fonction centralisée pour mettre à jour l'état des boutons
          if (validActions.length > 0) {
            console.log(
              "Des actions existent et sont initialement décochées, mise à jour de l'état des boutons"
            );

            // Vérifier si toutes les actions sont décochées
            const allActionsUnchecked = validActions.every(
              (action) => initialCheckedState[action.id] === false
            );

            console.log(
              "Toutes les actions sont décochées:",
              allActionsUnchecked
            );

            // Appeler directement updateButtonsState sans setTimeout et sans application directe
            // pour éviter les conditions de course et les incohérences
            console.log(
              "Appel de updateButtonsState après initialisation des actions"
            );
            updateButtonsState();
          }
        } catch (actionsError) {
          console.error(
            "Erreur lors de la récupération des actions:",
            actionsError
          );

          // Initialiser avec un tableau vide
          setActions([]);

          // Afficher une notification d'erreur
          toast.error(
            "Erreur lors du chargement des actions. Les actions ne seront pas disponibles pour l'évaluation.",
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        }

        setError(null);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des détails du quiz:",
          error
        );
        setError("Impossible de charger les détails du quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId, token]);

  // Fonction centralisée pour vérifier toutes les conditions d'évaluation
  const checkEvaluationConditions = (
    comps = competences,
    actionsState = checkedActions,
    sousCompsState = checkedSousCompetences
  ) => {
    // Résultat par défaut: les deux boutons sont désactivés
    const result = {
      canMarkAsSatisfactory: false,
      canMarkAsNonSatisfactory: false,
      allCompetencesHaveEvaluation: false,
      allCompetencesAcquired: false,
      allActionsChecked: true,
      mainSurfaceCorrect: true,
      competencesWithoutEvaluation: [],
      hasNotAcquiredOrNotEvaluated: false,
      hasToImproveWithCheckedSousCompetence: false,
    };

    // Si aucune compétence n'est définie, retourner le résultat par défaut
    if (!comps || comps.length === 0) {
      console.log("checkEvaluationConditions: Aucune compétence définie");
      return result;
    }

    // Vérifier si toutes les compétences ont un état d'évaluation (pas null)
    result.allCompetencesHaveEvaluation = comps.every(
      (comp) => comp.evaluation !== null
    );

    // Identifier les compétences sans état d'évaluation pour le débogage
    if (!result.allCompetencesHaveEvaluation) {
      result.competencesWithoutEvaluation = comps
        .filter((comp) => comp.evaluation === null)
        .map((comp) => ({ id: comp.id, nom_fr: comp.nom_fr }));

      console.log(
        "Compétences sans état d'évaluation:",
        result.competencesWithoutEvaluation
      );
    }

    // Vérifier si toutes les compétences sont marquées comme "acquired"
    result.allCompetencesAcquired = comps.every(
      (comp) => comp.evaluation === "acquired"
    );

    // Vérifier si au moins une compétence est marquée comme "not_acquired" ou "not_evaluated"
    result.hasNotAcquiredOrNotEvaluated = comps.some(
      (comp) =>
        comp.evaluation === "not_acquired" ||
        comp.evaluation === "not_evaluated"
    );

    // Vérifier les actions UNIQUEMENT si des actions existent
    if (actions && actions.length > 0) {
      // Utiliser une approche robuste pour vérifier l'état des actions
      result.allActionsChecked = actions.every((action) => {
        // Vérifier si l'action est cochée dans l'état actuel
        return actionsState[action.id] === true;
      });
    }

    // Vérifier si au moins une compétence est marquée comme "to_improve" avec des sous-compétences cochées
    const toImproveCompetences = comps.filter(
      (comp) => comp.evaluation === "to_improve"
    );

    if (toImproveCompetences.length > 0) {
      // Pour chaque compétence "to_improve", vérifier si au moins une sous-compétence est cochée
      for (const comp of toImproveCompetences) {
        if (!comp.sousCompetences || comp.sousCompetences.length === 0) {
          continue;
        }

        const hasCheckedSousCompetence = comp.sousCompetences.some(
          (sousComp) => sousCompsState[sousComp.id]
        );

        if (hasCheckedSousCompetence) {
          result.hasToImproveWithCheckedSousCompetence = true;
          break;
        }
      }
    }

    // Vérifier Main/Surface UNIQUEMENT si MainSurface est activé (1, true, "1", etc.)
    // Normaliser la valeur de MainSurface pour gérer différents types (booléen, nombre, chaîne)
    const isMainSurfaceEnabled =
      quiz &&
      (quiz.MainSurface === 1 ||
        quiz.MainSurface === true ||
        quiz.MainSurface === "1" ||
        quiz.MainSurface === "true");

    if (isMainSurfaceEnabled) {
      console.log(
        "MainSurface est activé, vérification des valeurs Main/Surface"
      );

      // Vérifier que les valeurs Main et Surface sont définies
      if (
        mainValue !== undefined &&
        originalMainValue !== undefined &&
        surfaceValue !== undefined &&
        originalSurfaceValue !== undefined
      ) {
        // Convertir en nombres pour comparer correctement
        const currentMain = Number(mainValue);
        const originalMain = Number(originalMainValue);
        const currentSurface = Number(surfaceValue);
        const originalSurface = Number(originalSurfaceValue);

        result.mainSurfaceCorrect =
          currentMain === originalMain && currentSurface === originalSurface;

        console.log("Vérification Main/Surface:", {
          currentMain,
          originalMain,
          currentSurface,
          originalSurface,
          mainSurfaceCorrect: result.mainSurfaceCorrect,
        });
      }
    } else {
      console.log(
        "MainSurface n'est pas activé, pas de vérification nécessaire"
      );
    }

    // Déterminer si le quiz peut être marqué comme satisfaisant
    result.canMarkAsSatisfactory =
      result.allCompetencesHaveEvaluation &&
      result.allCompetencesAcquired &&
      result.allActionsChecked &&
      result.mainSurfaceCorrect;

    // Déterminer si le quiz peut être marqué comme non satisfaisant
    result.canMarkAsNonSatisfactory =
      result.allCompetencesHaveEvaluation &&
      (!result.allCompetencesAcquired ||
        !result.allActionsChecked ||
        !result.mainSurfaceCorrect ||
        result.hasNotAcquiredOrNotEvaluated ||
        result.hasToImproveWithCheckedSousCompetence);

    // Journaliser les résultats pour le débogage
    console.log("Résultats de la vérification des conditions:", result);

    return result;
  };

  // Fonction pour vérifier si toutes les compétences sont marquées comme "acquired"
  // et si les valeurs de Main et Surface sont correctes (vertes) uniquement si MainSurface=1
  // et si toutes les actions sont cochées uniquement si des actions existent
  const canMarkAsSatisfactory = (updatedCompetences) => {
    const conditions = checkEvaluationConditions(
      updatedCompetences,
      checkedActions,
      checkedSousCompetences
    );
    return conditions.canMarkAsSatisfactory;
  };

  // Fonction pour vérifier si le bouton "Non Satisfaisant" doit être activé
  const canMarkAsNonSatisfactory = (
    updatedCompetences,
    checkedSousCompetencesState
  ) => {
    const conditions = checkEvaluationConditions(
      updatedCompetences,
      checkedActions,
      checkedSousCompetencesState
    );
    return conditions.canMarkAsNonSatisfactory;
  };

  // Fonction pour gérer l'évaluation (dans une version réelle, cela enverrait les données au serveur)
  const handleEvaluation = (competenceId, evaluation) => {
    console.log(
      `Évaluation de la compétence ${competenceId} comme "${evaluation}"`
    );

    // Créer une copie des compétences actuelles
    const updatedCompetences = competences.map((comp) =>
      comp.id === competenceId ? { ...comp, evaluation } : comp
    );

    // Afficher l'état mis à jour pour le débogage
    console.log(
      `Compétence ${competenceId} mise à jour avec l'état "${evaluation}"`
    );

    // Mettre à jour l'état des compétences
    setCompetences(updatedCompetences);

    // Gérer les sous-compétences en fonction de l'évaluation de la compétence
    // Trouver la compétence concernée
    const competence = competences.find((comp) => comp.id === competenceId);

    if (
      competence &&
      competence.sousCompetences &&
      competence.sousCompetences.length > 0
    ) {
      // Créer un nouvel état pour les sous-compétences
      const newCheckedState = { ...checkedSousCompetences };

      if (evaluation === "to_improve") {
        // Si l'évaluation est "to_improve", laisser les sous-compétences actives
        // mais réinitialiser leur état (toutes décochées)
        competence.sousCompetences.forEach((sousComp) => {
          newCheckedState[sousComp.id] = false;
        });

        console.log(
          "Sous-compétences réinitialisées (décochées) car l'évaluation est 'to_improve'"
        );
      } else {
        // Si l'évaluation n'est pas "to_improve", désactiver toutes les sous-compétences
        competence.sousCompetences.forEach((sousComp) => {
          newCheckedState[sousComp.id] = false;
        });

        console.log(
          "Sous-compétences désactivées car l'évaluation n'est pas 'to_improve'"
        );
      }

      // Mettre à jour l'état
      setCheckedSousCompetences(newCheckedState);
    }

    // Mettre à jour l'état des boutons immédiatement
    // Note: React batche les mises à jour d'état, donc updateButtonsState
    // sera appelé après que les états aient été mis à jour
    console.log(
      "Mise à jour de l'état des boutons après évaluation de la compétence"
    );

    // Utiliser la fonction centralisée pour mettre à jour l'état des boutons
    // sans délai pour éviter les conditions de course
    updateButtonsState();
  };

  // Fonction pour gérer le changement d'état des sous-compétences
  const handleSousCompetenceCheckboxChange = (sousCompetenceId) => {
    console.log(`Changement d'état de la sous-compétence ${sousCompetenceId}`);

    // Récupérer la valeur actuelle
    const currentValue = checkedSousCompetences[sousCompetenceId] || false;
    const newValue = !currentValue;

    console.log(
      `Sous-compétence ${sousCompetenceId} passant de ${currentValue} à ${newValue}`
    );

    // Créer un nouvel état avec la valeur mise à jour
    const newCheckedSousCompetences = {
      ...checkedSousCompetences,
      [sousCompetenceId]: newValue,
    };

    // Mettre à jour l'état
    setCheckedSousCompetences(newCheckedSousCompetences);

    // Mettre à jour l'état des boutons immédiatement
    // Note: React batche les mises à jour d'état, donc updateButtonsState
    // sera appelé après que setCheckedSousCompetences ait été appliqué
    console.log(
      `État des sous-compétences après mise à jour:`,
      newCheckedSousCompetences
    );

    // Utiliser la fonction centralisée pour mettre à jour l'état des boutons
    // sans délai pour éviter les conditions de course
    updateButtonsState();
  };

  // Fonction pour mettre à jour l'état des boutons en fonction des conditions actuelles
  const updateButtonsState = () => {
    console.log("Mise à jour de l'état des boutons...");

    // Désactiver d'abord les deux boutons pour éviter tout état incohérent
    setSatisfactoryButtonDisabled(true);
    setNonSatisfactoryButtonDisabled(true);

    // Si la réévaluation n'est pas autorisée, sortir immédiatement
    if (alreadyEvaluated && !reevaluationAllowed) {
      console.log(
        "Réévaluation non autorisée car l'évaluation précédente était 'Satisfaisant'"
      );
      return;
    }

    // Vérification supplémentaire: si l'évaluation actuelle est "satisfaisant",
    // s'assurer que la réévaluation n'est pas autorisée
    if (evaluation === "satisfaisant" && reevaluationAllowed) {
      console.log(
        "ATTENTION: Incohérence détectée - L'évaluation est 'Satisfaisant' mais reevaluationAllowed=true"
      );
      console.log("Correction automatique: désactivation de la réévaluation");
      setReevaluationAllowed(false);
      return;
    }

    // Vérifier si le tableau des compétences est vide
    if (!competences || competences.length === 0) {
      console.log(
        "Le tableau des compétences est vide, attente du chargement..."
      );
      return;
    }

    // Utiliser la fonction centralisée pour vérifier toutes les conditions
    const conditions = checkEvaluationConditions();

    // Si au moins une compétence n'a pas d'état d'évaluation, les deux boutons restent désactivés
    if (!conditions.allCompetencesHaveEvaluation) {
      console.log(
        "Au moins une compétence n'a pas d'état d'évaluation, les deux boutons restent désactivés"
      );
      return;
    }

    // Activer le bouton approprié en fonction des conditions
    if (conditions.canMarkAsSatisfactory) {
      console.log("Activation du bouton 'Satisfaisant' uniquement");
      setSatisfactoryButtonDisabled(false);
      setNonSatisfactoryButtonDisabled(true);
    } else if (conditions.canMarkAsNonSatisfactory) {
      console.log("Activation du bouton 'Non Satisfaisant' uniquement");
      setSatisfactoryButtonDisabled(true);
      setNonSatisfactoryButtonDisabled(false);
    } else {
      console.log(
        "Aucune condition n'est remplie, les deux boutons restent désactivés"
      );
    }
  };

  // Fonction pour gérer les changements de valeur Main
  const handleMainChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setMainValue(value);

    // Utiliser la fonction handleMainSurfaceChange pour mettre à jour l'état des boutons
    handleMainSurfaceChange("main", value);
  };

  // Fonction pour gérer les changements de valeur Surface
  const handleSurfaceChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setSurfaceValue(value);

    // Utiliser la fonction handleMainSurfaceChange pour mettre à jour l'état des boutons
    handleMainSurfaceChange("surface", value);
  };

  // Fonction pour gérer le changement des valeurs Main et Surface
  const handleMainSurfaceChange = (field, value) => {
    console.log(`Changement de la valeur ${field} à ${value}`);

    console.log(`Valeurs Main/Surface après mise à jour:`, {
      main: field === "main" ? value : mainValue,
      surface: field === "surface" ? value : surfaceValue,
      originalMain: originalMainValue,
      originalSurface: originalSurfaceValue,
    });

    // Utiliser la fonction centralisée pour mettre à jour l'état des boutons
    // sans délai pour éviter les conditions de course
    console.log("Appel de updateButtonsState après changement de Main/Surface");
    updateButtonsState();
  };

  // Fonction pour incrémenter la valeur Main sans sauvegarder
  const incrementMain = () => {
    const newValue = mainValue + 1;
    setMainValue(newValue);

    // Utiliser la fonction handleMainSurfaceChange pour mettre à jour l'état des boutons
    handleMainSurfaceChange("main", newValue);
  };

  // Fonction pour décrémenter la valeur Main sans sauvegarder
  const decrementMain = () => {
    if (mainValue <= 0) return;
    const newValue = mainValue - 1;
    setMainValue(newValue);

    // Utiliser la fonction handleMainSurfaceChange pour mettre à jour l'état des boutons
    handleMainSurfaceChange("main", newValue);
  };

  // Fonction pour incrémenter la valeur Surface sans sauvegarder
  const incrementSurface = () => {
    const newValue = surfaceValue + 1;
    setSurfaceValue(newValue);

    // Utiliser la fonction handleMainSurfaceChange pour mettre à jour l'état des boutons
    handleMainSurfaceChange("surface", newValue);
  };

  // Fonction pour décrémenter la valeur Surface sans sauvegarder
  const decrementSurface = () => {
    if (surfaceValue <= 0) return;
    const newValue = surfaceValue - 1;
    setSurfaceValue(newValue);

    // Utiliser la fonction handleMainSurfaceChange pour mettre à jour l'état des boutons
    handleMainSurfaceChange("surface", newValue);
  };

  // Fonction pour gérer le changement d'état des checkboxes des actions
  const handleActionCheckboxChange = (actionId) => {
    console.log(`Changement d'état de l'action ${actionId}`);

    // Récupérer la valeur actuelle
    const currentValue = checkedActions[actionId] || false;
    const newValue = !currentValue;

    console.log(`Action ${actionId} passant de ${currentValue} à ${newValue}`);

    // Créer un nouvel état avec la valeur mise à jour
    const newCheckedActions = {
      ...checkedActions,
      [actionId]: newValue,
    };

    // Mettre à jour l'état
    setCheckedActions(newCheckedActions);

    // Effet visuel de confirmation
    const actionElement = document.getElementById(`action-item-${actionId}`);
    if (actionElement) {
      // Ajouter la classe pour l'animation
      actionElement.classList.add("pulse-animation");

      // Créer un timer pour supprimer la classe après l'animation
      const animationTimer = setTimeout(() => {
        // Vérifier si l'élément existe toujours avant de modifier ses classes
        if (document.getElementById(`action-item-${actionId}`)) {
          actionElement.classList.remove("pulse-animation");
        }
      }, 500);

      // Nettoyer le timer si le composant est démonté
      return () => clearTimeout(animationTimer);
    }

    // Mettre à jour l'état des boutons immédiatement
    // Note: React batche les mises à jour d'état, donc updateButtonsState
    // sera appelé après que setCheckedActions ait été appliqué
    console.log("État des actions après mise à jour:", newCheckedActions);
    console.log("Appel de updateButtonsState après changement d'action");

    // Utiliser la fonction centralisée pour mettre à jour l'état des boutons
    // sans délai pour éviter les conditions de course
    updateButtonsState();
  };

  // Fonction pour gérer l'évaluation globale du quiz
  // Lors d'une réévaluation, le comportement attendu est le suivant:
  // 1. Si toutes les compétences sont marquées comme "Acquired", toutes les actions sont cochées,
  //    et les valeurs Main/Surface sont correctes, alors le bouton "Satisfaisant" sera activé.
  // 2. Si au moins une compétence n'est pas marquée comme "Acquired", ou au moins une action n'est pas cochée,
  //    ou les valeurs Main/Surface sont incorrectes, alors le bouton "Non Satisfaisant" sera activé.
  // 3. Les deux boutons ne peuvent pas être activés en même temps.
  // 4. Si aucune compétence n'a d'état d'évaluation, les deux boutons seront désactivés.
  const handleQuizEvaluation = async (result) => {
    try {
      console.log(`DEBUG: Début de l'évaluation du quiz - Résultat: ${result}`);

      // Vérifier si la réévaluation est autorisée
      if (alreadyEvaluated && !reevaluationAllowed) {
        console.error(
          "ERREUR: Tentative de réévaluation non autorisée - L'évaluation précédente était 'Satisfaisant'"
        );

        // Afficher une notification d'erreur pour l'utilisateur
        toast.error(
          "La réévaluation n'est pas autorisée car ce quiz a déjà été évalué comme 'Satisfaisant'.",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        return;
      }

      // Vérifier toutes les conditions avant de procéder à l'évaluation
      const allCompetencesAcquired = competences.every(
        (comp) => comp.evaluation === "acquired"
      );

      // Vérifier si toutes les actions sont cochées
      const allActionsChecked =
        actions.length === 0 ||
        actions.every((action) => {
          const isChecked = checkedActions[action.id] === true;
          return isChecked === true;
        });

      // Vérifier si les valeurs Main/Surface sont correctes
      let mainSurfaceCorrect = true;

      // Normaliser la valeur de MainSurface pour gérer différents types (booléen, nombre, chaîne)
      const isMainSurfaceEnabled =
        quiz &&
        (quiz.MainSurface === 1 ||
          quiz.MainSurface === true ||
          quiz.MainSurface === "1" ||
          quiz.MainSurface === "true");

      if (isMainSurfaceEnabled) {
        // Convertir en nombres pour comparer correctement
        const currentMain = Number(mainValue);
        const originalMain = Number(originalMainValue);
        const currentSurface = Number(surfaceValue);
        const originalSurface = Number(originalSurfaceValue);

        mainSurfaceCorrect =
          currentMain === originalMain && currentSurface === originalSurface;
      }

      // Vérifier si on essaie d'utiliser un bouton désactivé
      if (
        (result === "satisfaisant" && satisfactoryButtonDisabled) ||
        (result === "non_satisfaisant" && nonSatisfactoryButtonDisabled)
      ) {
        console.log(
          `DEBUG: Évaluation annulée - Bouton '${result === "satisfaisant" ? "Satisfaisant" : "Non Satisfaisant"}' désactivé`
        );

        // Afficher un message d'erreur pour aider au débogage
        console.error(
          `ERREUR: Tentative d'évaluation avec le bouton '${result === "satisfaisant" ? "Satisfaisant" : "Non Satisfaisant"}' désactivé`
        );

        console.log("État actuel des conditions:");
        console.log(
          "- Toutes les compétences sont 'acquired':",
          allCompetencesAcquired
        );
        console.log("- Toutes les actions sont cochées:", allActionsChecked);

        if (quiz && quiz.MainSurface === 1) {
          console.log("- Main/Surface corrects:", mainSurfaceCorrect);
          console.log("  - Main:", mainValue, "Original:", originalMainValue);
          console.log(
            "  - Surface:",
            surfaceValue,
            "Original:",
            originalSurfaceValue
          );
        }

        // Afficher une notification d'erreur pour l'utilisateur
        toast.error(
          `Impossible d'évaluer le quiz comme ${result === "satisfaisant" ? "Satisfaisant" : "Non Satisfaisant"} car les conditions ne sont pas remplies.`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // Mettre à jour l'état des boutons immédiatement
        // sans délai pour éviter les conditions de course
        updateButtonsState();
        return;
      }

      // Vérification supplémentaire pour s'assurer que les boutons sont correctement activés/désactivés
      if (result === "satisfaisant" && !satisfactoryButtonDisabled) {
        console.log(
          "DEBUG: Évaluation 'Satisfaisant' autorisée - Le bouton est activé"
        );

        // Vérification supplémentaire pour s'assurer que toutes les conditions sont remplies
        if (
          !allCompetencesAcquired ||
          !allActionsChecked ||
          !mainSurfaceCorrect
        ) {
          console.error(
            "ERREUR: Conditions non remplies pour évaluation 'Satisfaisant' mais le bouton est activé"
          );
          // Mettre à jour l'état des boutons immédiatement
          // sans délai pour éviter les conditions de course
          updateButtonsState();
          return;
        }
      }

      if (result === "non_satisfaisant" && !nonSatisfactoryButtonDisabled) {
        console.log(
          "DEBUG: Évaluation 'Non Satisfaisant' autorisée - Le bouton est activé"
        );

        // Pour Non Satisfaisant, au moins une des conditions doit ne pas être remplie
        if (allCompetencesAcquired && allActionsChecked && mainSurfaceCorrect) {
          console.error(
            "ERREUR: Toutes les conditions sont remplies mais le bouton 'Non Satisfaisant' est activé"
          );
          // Mettre à jour l'état des boutons immédiatement
          // sans délai pour éviter les conditions de course
          updateButtonsState();
          return;
        }
      }

      console.log(`DEBUG: Mise à jour de l'état d'évaluation: ${result}`);
      setEvaluation(result);

      // Mettre à jour l'état de réévaluation en fonction du nouveau statut
      // Si le résultat est "satisfaisant", la réévaluation ne sera plus autorisée
      if (result === "satisfaisant") {
        console.log(
          "DEBUG: Nouvelle évaluation 'Satisfaisant', désactivation des futures réévaluations"
        );
        setReevaluationAllowed(false);
      }

      // Envoyer l'évaluation au serveur
      if (quiz && quiz.id && id) {
        const evaluationData = {
          quizId: quiz.id,
          apprenantId: parseInt(id),
          statut:
            result === "satisfaisant" ? "Satisfaisant" : "Non Satisfaisant",
          idmodule: quiz.IDModule, // Ajouter l'IDModule du quiz
        };

        console.log(
          "DEBUG: Préparation des données d'évaluation:",
          evaluationData
        );

        // Appel à l'API pour créer/mettre à jour l'évaluation
        console.log("DEBUG: Envoi de la requête d'évaluation au serveur...");
        const response = await QuizService.createEvaluation(
          token,
          evaluationData
        );

        console.log("DEBUG: Réponse du serveur reçue:", response);

        // Si l'évaluation est "Non Satisfaisant", sauvegarder les détails d'évaluation
        if (
          result === "non_satisfaisant" &&
          response.evaluation &&
          response.evaluation.id
        ) {
          console.log(
            "DEBUG: Sauvegarde des détails d'évaluation pour Non Satisfaisant"
          );

          // Préparer les données des compétences
          const competenceStatuses = {};

          // Créer une structure améliorée pour checkedSousCompetences
          // qui associe chaque sous-compétence à sa compétence parente
          const enhancedCheckedSousCompetences = {};

          competences.forEach((comp) => {
            if (comp.evaluation) {
              competenceStatuses[comp.id] = comp.evaluation;

              // Si la compétence est "to_improve", collecter les sous-compétences cochées
              if (
                comp.evaluation === "to_improve" &&
                comp.sousCompetences &&
                comp.sousCompetences.length > 0
              ) {
                comp.sousCompetences.forEach((sousComp) => {
                  // Vérifier si cette sous-compétence est cochée
                  if (checkedSousCompetences[sousComp.id]) {
                    // Stocker la sous-compétence cochée avec une référence à sa compétence parente
                    enhancedCheckedSousCompetences[sousComp.id] = {
                      checked: true,
                      competenceId: comp.id,
                      competenceStatus: comp.evaluation,
                    };
                  }
                });
              }
            }
          });

          // Préparer les données des détails d'évaluation
          const evaluationDetailsData = {
            competenceStatuses,
            checkedSousCompetences: enhancedCheckedSousCompetences,
            checkedActions,
            mainValue,
            surfaceValue,
            originalMainValue,
            originalSurfaceValue,
          };

          console.log(
            "DEBUG: Données des détails d'évaluation:",
            evaluationDetailsData
          );

          try {
            // Sauvegarder les détails d'évaluation
            const detailsResponse = await QuizService.saveEvaluationDetails(
              token,
              response.evaluation.id,
              evaluationDetailsData
            );

            console.log(
              "DEBUG: Détails d'évaluation sauvegardés avec succès:",
              detailsResponse
            );
          } catch (detailsError) {
            console.error(
              "ERREUR: Échec de la sauvegarde des détails d'évaluation:",
              detailsError
            );

            // Afficher une notification d'erreur pour les détails d'évaluation
            toast.error(
              "Les détails de l'évaluation n'ont pas pu être sauvegardés. L'évaluation globale a été enregistrée.",
              {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
          }
        }

        // Afficher une notification de confirmation
        toast.success(
          alreadyEvaluated
            ? `Évaluation mise à jour : ${result === "satisfaisant" ? "Satisfaisant" : "Non Satisfaisant"}`
            : `Évaluation enregistrée : ${result === "satisfaisant" ? "Satisfaisant" : "Non Satisfaisant"}`,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // Mettre à jour l'état pour indiquer que le quiz a été évalué
        setAlreadyEvaluated(true);

        // Mettre à jour l'état de réévaluation en fonction du résultat final
        // Cette mise à jour est redondante avec celle faite plus haut, mais assure la cohérence
        const newReevaluationAllowed = result !== "satisfaisant";
        setReevaluationAllowed(newReevaluationAllowed);
        console.log(
          `DEBUG: État de réévaluation mis à jour: ${newReevaluationAllowed ? "autorisée" : "non autorisée"}`
        );

        // Après l'évaluation, désactiver les deux boutons immédiatement
        setSatisfactoryButtonDisabled(true);
        setNonSatisfactoryButtonDisabled(true);

        // Mettre à jour l'état des boutons immédiatement
        // Note: React batche les mises à jour d'état, donc updateButtonsState
        // sera appelé après que les états aient été mis à jour
        console.log("Mise à jour de l'état des boutons après évaluation");
        updateButtonsState();

        // Afficher un message supplémentaire si la réévaluation n'est plus autorisée
        if (!newReevaluationAllowed) {
          // Afficher la notification immédiatement sans setTimeout
          toast.info(
            "Ce quiz ne pourra plus être réévalué car il a été marqué comme 'Satisfaisant'.",
            {
              position: "top-right",
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              icon: "ℹ️",
              delay: 500, // Utiliser l'option delay de react-toastify au lieu de setTimeout
            }
          );
        }

        console.log("Réponse du serveur:", response);

        // Vérifier si un certificat a été généré
        if (response.certificate && response.certificate.certificat_generated) {
          console.log(
            "DEBUG: Un certificat a été généré automatiquement:",
            response.certificate
          );
          // Afficher une notification pour le certificat généré automatiquement
          toast.success(
            `Félicitations ! Un certificat a été généré automatiquement pour ce cours. Tous les quiz ont été complétés avec succès !`,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              icon: "🏆",
            }
          );
        } else if (
          response.certificate &&
          response.certificate.certificat_exists
        ) {
          console.log(
            "DEBUG: Un certificat existe déjà pour ce cours:",
            response.certificate
          );
          // Afficher une notification pour le certificat existant
          toast.info(`Un certificat existe déjà pour ce cours.`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            icon: "🎓",
          });
        } else {
          console.log(
            "DEBUG: Aucun certificat généré ou existant dans la réponse"
          );
        }

        // Redirection après un délai plus long pour permettre à l'utilisateur de voir les notifications
        // Si un certificat a été généré, attendre encore plus longtemps
        const redirectDelay =
          response.certificate && response.certificate.certificat_generated
            ? 5000 // 5 secondes si un certificat a été généré
            : 4000; // 4 secondes sinon

        console.log(
          `DEBUG: Redirection prévue dans ${redirectDelay}ms vers la liste des quiz`
        );

        // Afficher une notification pour informer l'utilisateur de la redirection imminente
        toast.info(
          "Redirection vers la liste des quiz dans quelques secondes...",
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            delay: 1000, // Utiliser l'option delay de react-toastify au lieu de setTimeout
          }
        );

        // Utiliser un seul setTimeout pour la redirection et le stocker dans une variable
        // pour pouvoir le nettoyer si nécessaire
        const redirectTimer = setTimeout(() => {
          console.log("DEBUG: Redirection vers la liste des quiz...");
          navigate(`/formateur/apprenants/${id}/cours/${courseId}/quizzes`);
        }, redirectDelay);

        // Retourner une fonction de nettoyage pour annuler le timer si le composant est démonté
        return () => {
          clearTimeout(redirectTimer);
        };
      } else {
        throw new Error("Données manquantes pour l'évaluation");
      }
    } catch (error) {
      console.error("Erreur lors de l'évaluation du quiz:", error);

      // Afficher une notification d'erreur
      toast.error(
        `Erreur lors de l'enregistrement de l'évaluation: ${error.message}`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8">
      <style>{pulseAnimationStyle}</style>
      <div className="flex items-center mb-10 animate-slideInLeft">
        <button
          onClick={() =>
            navigate(`/formateur/apprenants/${id}/cours/${courseId}/quizzes`)
          }
          className="p-3 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-4 transition-all duration-300 transform hover:scale-105 shadow-sm"
          aria-label="Retour"
        >
          <ArrowLeft className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </button>
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-xl mr-4 shadow-md">
            <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white formateur-title flex items-center">
              {loading
                ? "Chargement du quiz..."
                : quiz
                  ? quiz.Nom_FR
                  : "Détails du quiz"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Évaluez les compétences et actions associées à ce quiz
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping opacity-50"></div>
            <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Chargement des détails du quiz...
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Veuillez patienter pendant le chargement des données
          </p>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-600 dark:text-red-400 shadow-md flex items-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
            <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Erreur de chargement</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* En-tête du quiz */}
          {quiz.MainSurface && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-2 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Paramètres de désinfection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main (Disinfection of hands) */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        M
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Désinfection des mains
                    </h4>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-lg shadow-md font-bold text-2xl transition-all duration-300 ${
                        mainValue !== originalMainValue
                          ? "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400"
                          : "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400"
                      }`}
                    >
                      {mainValue}
                    </div>
                    <div className="flex">
                      <button
                        onClick={decrementMain}
                        disabled={
                          mainValue <= 0 ||
                          (alreadyEvaluated && !reevaluationAllowed)
                        }
                        className={`w-12 h-12 flex items-center justify-center rounded-l-lg shadow-md transition-all duration-200 ${
                          mainValue <= 0 ||
                          (alreadyEvaluated && !reevaluationAllowed)
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 hover:shadow-lg"
                        }`}
                      >
                        <span className="text-xl font-bold">-</span>
                      </button>
                      <button
                        onClick={incrementMain}
                        disabled={alreadyEvaluated && !reevaluationAllowed}
                        className={`w-12 h-12 flex items-center justify-center rounded-r-lg ${
                          alreadyEvaluated && !reevaluationAllowed
                            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-600"
                        }`}
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Surface (Disinfection of surfaces) */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        S
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Désinfection des surfaces
                    </h4>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-lg shadow-md font-bold text-2xl transition-all duration-300 ${
                        surfaceValue !== originalSurfaceValue
                          ? "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400"
                          : "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400"
                      }`}
                    >
                      {surfaceValue}
                    </div>
                    <div className="flex">
                      <button
                        onClick={decrementSurface}
                        disabled={
                          surfaceValue <= 0 ||
                          (alreadyEvaluated && !reevaluationAllowed)
                        }
                        className={`w-12 h-12 flex items-center justify-center rounded-l-lg shadow-md transition-all duration-200 ${
                          surfaceValue <= 0 ||
                          (alreadyEvaluated && !reevaluationAllowed)
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 hover:shadow-lg"
                        }`}
                      >
                        <span className="text-xl font-bold">-</span>
                      </button>
                      <button
                        onClick={incrementSurface}
                        disabled={alreadyEvaluated && !reevaluationAllowed}
                        className={`w-12 h-12 flex items-center justify-center rounded-r-lg ${
                          alreadyEvaluated && !reevaluationAllowed
                            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:from-indigo-600 hover:to-purple-600"
                        }`}
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des compétences et sous-compétences */}
          {competences.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
              <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700 p-5 text-white">
                <div className="flex items-center">
                  <div className="bg-white/20 p-2 rounded-lg mr-3">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Compétences à évaluer</h3>
                </div>
              </div>
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <AlertCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  Aucune compétence disponible
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Ce quiz ne contient pas encore de compétences à évaluer. Les
                  compétences permettent d'évaluer les connaissances et
                  aptitudes liées à ce module.
                </p>
              </div>
            </div>
          ) : (
            competences.map((competence) => (
              <div
                key={competence.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl"
              >
                {/* En-tête de la compétence */}
                <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700 p-5 text-white">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-2 rounded-lg mr-3">
                      <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {competence.nom_fr}
                    </h3>
                  </div>
                </div>

                {/* Options d'évaluation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
                  <button
                    onClick={() => handleEvaluation(competence.id, "acquired")}
                    disabled={alreadyEvaluated && !reevaluationAllowed}
                    className={`py-3 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                      competence.evaluation === "acquired"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white transform hover:scale-105"
                        : alreadyEvaluated && !reevaluationAllowed
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 opacity-70"
                          : "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-300 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transform hover:scale-105"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">ACQUIRED</span>
                  </button>
                  <button
                    onClick={() =>
                      handleEvaluation(competence.id, "to_improve")
                    }
                    disabled={alreadyEvaluated && !reevaluationAllowed}
                    className={`py-3 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                      competence.evaluation === "to_improve"
                        ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white transform hover:scale-105"
                        : alreadyEvaluated && !reevaluationAllowed
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 opacity-70"
                          : "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 dark:from-yellow-900/20 dark:to-amber-900/20 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 transform hover:scale-105"
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">TO IMPROVE</span>
                  </button>
                  <button
                    onClick={() =>
                      handleEvaluation(competence.id, "not_acquired")
                    }
                    disabled={alreadyEvaluated && !reevaluationAllowed}
                    className={`py-3 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                      competence.evaluation === "not_acquired"
                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white transform hover:scale-105"
                        : alreadyEvaluated && !reevaluationAllowed
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 opacity-70"
                          : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-300 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/30 dark:hover:to-rose-900/30 transform hover:scale-105"
                    }`}
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">NOT ACQUIRED</span>
                  </button>
                  <button
                    onClick={() =>
                      handleEvaluation(competence.id, "not_evaluated")
                    }
                    disabled={alreadyEvaluated && !reevaluationAllowed}
                    className={`py-3 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                      competence.evaluation === "not_evaluated"
                        ? "bg-gradient-to-r from-gray-500 to-slate-500 text-white transform hover:scale-105"
                        : alreadyEvaluated && !reevaluationAllowed
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 opacity-70"
                          : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 dark:from-gray-800 dark:to-slate-800 dark:text-gray-300 hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-700 dark:hover:to-slate-700 transform hover:scale-105"
                    }`}
                  >
                    <span className="font-semibold">NOT EVALUATED</span>
                  </button>
                </div>

                {/* Sous-compétences - Afficher uniquement s'il y a des sous-compétences valides */}
                {competence.sousCompetences &&
                  competence.sousCompetences.filter(
                    (sc) => sc && sc.id && sc.nom_fr && sc.nom_fr.trim() !== ""
                  ).length > 0 && (
                    <div className="px-5 pb-5">
                      <div
                        className={`mt-4 space-y-3 rounded-xl p-4 transition-all duration-300 ${
                          competence.evaluation === "to_improve"
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800 shadow-md"
                            : "bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700 opacity-70"
                        }`}
                      >
                        <h4
                          className={`font-semibold mb-3 flex items-center ${
                            competence.evaluation === "to_improve"
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-500"
                          }`}
                        >
                          <div
                            className={`p-1 rounded-md mr-2 ${
                              competence.evaluation === "to_improve"
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <AlertCircle
                              className={`w-4 h-4 ${
                                competence.evaluation === "to_improve"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-500 dark:text-gray-500"
                              }`}
                            />
                          </div>
                          Sous-compétences à améliorer
                        </h4>
                        {competence.sousCompetences
                          .filter(
                            (sc) =>
                              sc &&
                              sc.id &&
                              sc.nom_fr &&
                              sc.nom_fr.trim() !== ""
                          )
                          .map((sousCompetence) => (
                            <div
                              key={sousCompetence.id}
                              className={`p-3 rounded-lg transition-all duration-300 ${
                                competence.evaluation === "to_improve"
                                  ? "bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-blue-100 dark:border-blue-800/50 transform hover:translate-y-[-2px]"
                                  : "bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    id={`sous-comp-${sousCompetence.id}`}
                                    checked={
                                      checkedSousCompetences[
                                        sousCompetence.id
                                      ] || false
                                    }
                                    onChange={() =>
                                      handleSousCompetenceCheckboxChange(
                                        sousCompetence.id
                                      )
                                    }
                                    disabled={
                                      competence.evaluation !== "to_improve" ||
                                      (alreadyEvaluated && !reevaluationAllowed)
                                    }
                                    className={`w-5 h-5 rounded border-2 ${
                                      competence.evaluation === "to_improve" &&
                                      !(
                                        alreadyEvaluated && !reevaluationAllowed
                                      )
                                        ? "border-blue-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        : "border-gray-300 text-gray-400 focus:ring-gray-400 cursor-not-allowed"
                                    }`}
                                  />
                                  {competence.evaluation === "to_improve" &&
                                    checkedSousCompetences[
                                      sousCompetence.id
                                    ] && (
                                      <div className="absolute -inset-1 bg-blue-100 dark:bg-blue-900/20 rounded-full -z-10 animate-pulse"></div>
                                    )}
                                </div>
                                <label
                                  htmlFor={`sous-comp-${sousCompetence.id}`}
                                  className={`ml-3 text-sm ${
                                    competence.evaluation === "to_improve"
                                      ? "text-gray-700 dark:text-gray-300 cursor-pointer"
                                      : "text-gray-500 dark:text-gray-500 cursor-not-allowed"
                                  }`}
                                >
                                  {sousCompetence.nom_fr}
                                </label>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}

          {/* Liste des actions - Afficher uniquement s'il y a des actions */}
          {actions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 mt-8 animate-fadeIn transition-all duration-300 hover:shadow-2xl">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 dark:from-indigo-600 dark:via-purple-600 dark:to-purple-700 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-2 rounded-lg mr-3">
                      <CheckSquare className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">Actions à évaluer</h3>
                  </div>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">
                    {actions.length}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      id={`action-item-${action.id}`}
                      className={`bg-gradient-to-r ${
                        checkedActions[action.id]
                          ? "from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-700"
                          : "from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border-gray-200 dark:border-gray-700"
                      } p-5 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-3px]`}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id={`action-${action.id}`}
                            checked={checkedActions[action.id] || false}
                            onChange={() =>
                              handleActionCheckboxChange(action.id)
                            }
                            disabled={alreadyEvaluated && !reevaluationAllowed}
                            className={`w-5 h-5 rounded-md border-2 ${
                              checkedActions[action.id]
                                ? "border-blue-400 text-blue-600 focus:ring-blue-500"
                                : "border-gray-300 text-gray-500 focus:ring-gray-400"
                            } ${
                              alreadyEvaluated && !reevaluationAllowed
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            } transition-colors duration-200`}
                          />
                          {checkedActions[action.id] && (
                            <div className="absolute -inset-2 bg-blue-100 dark:bg-blue-900/20 rounded-full -z-10 animate-pulse"></div>
                          )}
                        </div>
                        <label
                          htmlFor={`action-${action.id}`}
                          className={`ml-3 font-medium ${
                            checkedActions[action.id]
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300"
                          } cursor-pointer transition-colors duration-200`}
                        >
                          {action.nom_fr}
                        </label>
                      </div>
                      {action.categorie_fr && (
                        <div className="mt-3 ml-8">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
                            {action.categorie_fr}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'évaluation globale */}
          <div className="mt-12 mb-16 flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-8 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800/30 w-full max-w-3xl">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-md mr-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Évaluation globale du quiz
                </h3>
              </div>

              {alreadyEvaluated && (
                <div
                  className={`mb-6 p-3 ${!reevaluationAllowed ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50" : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50"} rounded-lg text-center`}
                >
                  <div className="flex items-center justify-center">
                    <div
                      className={`${!reevaluationAllowed ? "bg-red-100 dark:bg-red-800/50" : "bg-blue-100 dark:bg-blue-800/50"} p-2 rounded-full mr-2`}
                    >
                      {!reevaluationAllowed ? (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p
                      className={`${!reevaluationAllowed ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"} font-medium`}
                    >
                      Ce quiz a déjà été évalué comme{" "}
                      <span
                        className={`font-bold ${evaluation === "satisfaisant" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {evaluation === "satisfaisant"
                          ? "Satisfaisant"
                          : "Non Satisfaisant"}
                      </span>
                      .
                      {!reevaluationAllowed
                        ? " La réévaluation n'est pas autorisée pour les quiz évalués comme 'Satisfaisant'."
                        : " Vous pouvez modifier cette évaluation."}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                <button
                  onClick={() => handleQuizEvaluation("satisfaisant")}
                  disabled={satisfactoryButtonDisabled}
                  className={`px-8 py-4 rounded-xl flex items-center justify-center text-lg font-semibold transition-all duration-300 shadow-lg ${
                    evaluation === "satisfaisant"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white transform hover:scale-105 hover:shadow-xl"
                      : satisfactoryButtonDisabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 opacity-70"
                        : "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-400 hover:from-green-100 hover:to-emerald-100 dark:bg-gray-800 dark:text-green-400 dark:border-green-500 dark:hover:bg-gray-700 transform hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Satisfaisant
                </button>
                <button
                  onClick={() => handleQuizEvaluation("non_satisfaisant")}
                  disabled={nonSatisfactoryButtonDisabled}
                  className={`px-8 py-4 rounded-xl flex items-center justify-center text-lg font-semibold transition-all duration-300 shadow-lg ${
                    evaluation === "non_satisfaisant"
                      ? "bg-gradient-to-r from-red-500 to-rose-500 text-white transform hover:scale-105 hover:shadow-xl"
                      : nonSatisfactoryButtonDisabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 opacity-70"
                        : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-400 hover:from-red-100 hover:to-rose-100 dark:bg-gray-800 dark:text-red-400 dark:border-red-500 dark:hover:bg-gray-700 transform hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  <XCircle className="w-6 h-6 mr-3" />
                  Non Satisfaisant
                </button>
              </div>

              {evaluation && (
                <div className="mt-6 text-center">
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      evaluation === "satisfaisant"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {evaluation === "satisfaisant" ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Statut actuel:{" "}
                    {evaluation === "satisfaisant"
                      ? "Satisfaisant"
                      : "Non Satisfaisant"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizDetails;
