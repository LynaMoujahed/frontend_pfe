import { useState, useEffect } from "react";
import {
  FiSave,
  FiX,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiBook,
  FiFileText,
  FiHelpCircle,
} from "react-icons/fi";
import { useAuth } from "../../../contexts/auth-context";
import DialogModal from "../../Common/DialogModal";

function CourseManagementPage() {
  const API_BASE_URL = "https://127.0.0.1:8000/api";
  const { token } = useAuth();
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState([]);
  const [expandedQuizzes, setExpandedQuizzes] = useState([]);
  const [expandedCompetences, setExpandedCompetences] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState({});
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingCompetence, setEditingCompetence] = useState(null);
  const [editingSousCompetence, setEditingSousCompetence] = useState(null);
  const [editingAction, setEditingAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // État pour les boîtes de dialogue
  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "info", // 'info', 'success', 'error', 'confirm'
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Annuler",
  });

  // Fonction pour récupérer tous les cours
  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const coursesData = data["hydra:member"] || data;

      const coursesWithQuizzes = await Promise.all(
        coursesData.map(async (course) => {
          try {
            const quizzes = await fetchQuizzesForCourse(course.id);
            return { ...course, quizzes };
          } catch (error) {
            return { ...course, quizzes: [] };
          }
        })
      );

      return coursesWithQuizzes;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  useEffect(() => {
    // Charger les cours au chargement du composant
    const loadCourses = async () => {
      setIsLoading(true);
      try {
        const coursesData = await fetchCourses();
        setCourses(coursesData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [token]);

  const fetchQuizzesForCourse = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz?cours=${courseId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const quizzesData = data["hydra:member"] || data;

      // Traiter les quiz avec leurs compétences et sous-compétences
      const processedQuizzes = quizzesData.map((quiz) => {
        // S'assurer que les noms sont des chaînes complètes
        const processedQuiz = {
          ...quiz,
          id: quiz.id || `quiz-${Math.random().toString(36).substr(2, 9)}`,
          Nom_FR: quiz.Nom_FR || "",
          Nom_EN: quiz.Nom_EN || "",
        };

        // Traiter les compétences si elles existent
        if (quiz.competences && Array.isArray(quiz.competences)) {
          processedQuiz.competences = quiz.competences.map((competence) => {
            // Traiter chaque compétence
            const processedCompetence = {
              ...competence,
              id: competence.id,
              Competence_ID: competence.id,
              Competence_Nom_FR: competence.nom_fr || "",
              Competence_Nom_EN: competence.nom_en || "",
              Comp_Categorie_FR: competence.categorie_fr || "",
              Comp_Categorie_EN: competence.categorie_en || "",
            };

            // Traiter les sous-compétences si elles existent
            if (
              competence.sousCompetences &&
              Array.isArray(competence.sousCompetences)
            ) {
              processedCompetence.sousCompetences =
                competence.sousCompetences.map((sousComp) => ({
                  id:
                    sousComp.id ||
                    `sub-${Math.random().toString(36).substr(2, 9)}`,
                  SousCompetence_Nom_FR: sousComp.nom_fr || "",
                  SousCompetence_Nom_EN: sousComp.nom_en || "",
                }));
            } else {
              processedCompetence.sousCompetences = [];
            }

            return processedCompetence;
          });
        } else {
          processedQuiz.competences = [];
        }

        // Traiter les actions si elles existent
        if (quiz.actions && Array.isArray(quiz.actions)) {
          processedQuiz.actions = quiz.actions.map((action) => ({
            id: action.id || `act-${Math.random().toString(36).substr(2, 9)}`,
            Action_Nom_FR: action.nom_fr || "",
            Action_Nom_EN: action.nom_en || "",
            Action_Categorie_FR: action.categorie_fr || "",
            Action_Categorie_EN: action.categorie_en || "",
          }));
        } else {
          processedQuiz.actions = [];
        }

        return processedQuiz;
      });

      // Regrouper les quiz par IDModule pour éviter les doublons
      const quizzesByIDModule = {};
      processedQuizzes.forEach((quiz) => {
        if (!quizzesByIDModule[quiz.IDModule]) {
          quizzesByIDModule[quiz.IDModule] = quiz;
        }
      });

      return Object.values(quizzesByIDModule);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return [];
    }
  };

  const createCourse = async (courseData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.title || "Failed to create course"
        );
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const updateCourse = async (id, courseData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update course");
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const deleteCourse = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete course");
      }

      return true;
    } catch (err) {
      throw err;
    }
  };

  const updateQuiz = async (id, quizData) => {
    try {
      // Trouver le quiz dans les cours pour obtenir son IDModule
      let quizIDModule = null;
      let quizToUpdate = null;

      for (const course of courses) {
        for (const quiz of course.quizzes || []) {
          if (quiz.id === id) {
            quizIDModule = quiz.IDModule;
            quizToUpdate = quiz;
            break;
          }
        }
        if (quizIDModule) break;
      }

      if (!quizIDModule) {
        throw new Error(`Quiz avec ID ${id} non trouvé`);
      }

      // Utiliser l'IDModule pour la mise à jour
      // Note: Le backend ne met à jour que MainSurface, pas Main et Surface
      const response = await fetch(`${API_BASE_URL}/quiz/${quizIDModule}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...quizData,
          // Inclure Main et Surface au cas où le backend serait mis à jour à l'avenir
          Main: quizData.Main,
          Surface: quizData.Surface,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update quiz");
      }

      const result = await response.json();

      return result;
    } catch (err) {
      throw err;
    }
  };

  // Fonction pour mettre à jour un quiz par son IDModule
  const updateQuizByIDModule = async (idModule, quizData) => {
    try {
      // Vérifier si l'IDModule est valide
      if (!idModule) {
        throw new Error("IDModule est requis pour mettre à jour un quiz");
      }

      // Construire l'URL avec l'IDModule
      const url = `${API_BASE_URL}/quiz/${idModule}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        throw new Error(
          errorData.message ||
            `Échec de la mise à jour du quiz: ${response.status}`
        );
      }

      const result = await response.json();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteQuiz = async (quizIDModule) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/quiz/by-idmodule/${quizIDModule}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {}
        if (response.status === 404) {
          return {
            success: false,
            message: "Quiz not found or already deleted",
          };
        }
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const handleAddCourse = async (newCourse) => {
    try {
      const createdCourse = await createCourse({
        titre: newCourse.title,
        description: newCourse.description,
      });
      setCourses([...courses, createdCourse]);
      setShowAddCourseForm(false);

      // Afficher une boîte de dialogue de succès
      setDialog({
        show: true,
        title: "Succès",
        message: "Cours ajouté avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      setError(err.message);

      // Afficher une boîte de dialogue d'erreur
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de l'ajout du cours: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleUpdateCourse = async (updatedCourse) => {
    try {
      const updated = await updateCourse(updatedCourse.id, {
        titre: updatedCourse.title,
        description: updatedCourse.description,
      });
      setCourses(
        courses.map((course) => (course.id === updated.id ? updated : course))
      );
      setEditingCourse(null);

      // Afficher une boîte de dialogue de succès
      setDialog({
        show: true,
        title: "Succès",
        message: "Cours mis à jour avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      setError(err.message);

      // Afficher une boîte de dialogue d'erreur
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la mise à jour du cours: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleDeleteCourse = async (courseId) => {
    // Afficher une boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer ce cours ?",
      type: "confirm",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, show: false }));

        try {
          await deleteCourse(courseId);
          setCourses(courses.filter((course) => course.id !== courseId));

          // Afficher une boîte de dialogue de succès
          setDialog({
            show: true,
            title: "Succès",
            message: "Cours supprimé avec succès",
            type: "success",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        } catch (err) {
          setError(err.message);

          // Afficher une boîte de dialogue d'erreur
          setDialog({
            show: true,
            title: "Erreur",
            message: `Échec de la suppression du cours: ${err.message}`,
            type: "error",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
      cancelText: "Annuler",
      confirmText: "Supprimer",
    });
  };

  const handleUpdateQuiz = async (updatedQuiz) => {
    try {
      // Utiliser updateQuizByIDModule au lieu de updateQuiz pour mettre à jour toutes les lignes avec le même IDModule
      const updated = await updateQuizByIDModule(updatedQuiz.IDModule, {
        Nom_FR: updatedQuiz.Nom_FR,
        Nom_EN: updatedQuiz.Nom_EN,
      });

      setCourses(
        courses.map((course) => ({
          ...course,
          quizzes:
            course.quizzes?.map((quiz) =>
              quiz.IDModule === updatedQuiz.IDModule
                ? {
                    ...quiz,
                    Nom_FR: updatedQuiz.Nom_FR,
                    Nom_EN: updatedQuiz.Nom_EN,
                  }
                : quiz
            ) || [],
        }))
      );
      setEditingQuiz(null);

      // Afficher une boîte de dialogue pour informer l'utilisateur que le quiz a été enregistré
      setDialog({
        show: true,
        title: "Succès",
        message: "Quiz enregistré",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      setError(err.message);
      setDialog({
        show: true,
        title: "Erreur",
        message:
          "Erreur lors de l'enregistrement des modifications : " + err.message,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleUpdateQuizMainSurface = async (quiz) => {
    try {
      // Mettre à jour l'état local immédiatement pour une meilleure expérience utilisateur
      setCourses(
        courses.map((c) => ({
          ...c,
          quizzes:
            c.quizzes?.map((q) =>
              q.IDModule === quiz.IDModule
                ? {
                    ...q,
                    MainSurface: quiz.MainSurface || false,
                    Main: quiz.Main || 0,
                    Surface: quiz.Surface || 0,
                  }
                : q
            ) || [],
        }))
      );

      // Essayer de mettre à jour le backend
      try {
        if (!quiz.IDModule) {
          setDialog({
            show: true,
            title: "Information",
            message: "Paramètres MainSurface mis à jour localement",
            type: "info",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
          return;
        }

        // Envoyer les valeurs MainSurface, Main et Surface au backend
        const updated = await updateQuizByIDModule(quiz.IDModule, {
          MainSurface: quiz.MainSurface || false,
          Main: quiz.Main || 0,
          Surface: quiz.Surface || 0,
        });

        // Vérifier si Main et Surface ont été mis à jour correctement
        const mainUpdated = updated.quiz && updated.quiz.Main === quiz.Main;
        const surfaceUpdated =
          updated.quiz && updated.quiz.Surface === quiz.Surface;

        if (mainUpdated && surfaceUpdated) {
          setDialog({
            show: true,
            title: "Succès",
            message:
              "Tous les paramètres (MainSurface, Main et Surface) ont été mis à jour avec succès",
            type: "success",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        } else {
          setDialog({
            show: true,
            title: "Information",
            message:
              "Le paramètre MainSurface a été mis à jour avec succès, mais les valeurs Main et Surface ne sont pas synchronisées avec le serveur (limitation du backend actuel).",
            type: "info",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      } catch (backendErr) {
        setDialog({
          show: true,
          title: "Avertissement",
          message:
            "Les paramètres ont été mis à jour localement, mais n'ont pas pu être synchronisés avec le serveur.",
          type: "error",
          onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
          confirmText: "OK",
        });
      }
    } catch (err) {
      setDialog({
        show: true,
        title: "Erreur",
        message:
          "Erreur lors de la mise à jour des paramètres MainSurface: " +
          err.message,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
      setError(err.message);
    }
  };

  const handleDeleteQuiz = async (courseId, quizIDModule) => {
    // Afficher une boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer ce quiz ?",
      type: "confirm",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, show: false }));

        try {
          const { success, message } = await deleteQuiz(quizIDModule);

          if (success) {
            setCourses((prevCourses) =>
              prevCourses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      quizzes:
                        course.quizzes?.filter(
                          (q) => q.IDModule !== quizIDModule
                        ) || [],
                    }
                  : course
              )
            );

            // Afficher une boîte de dialogue de succès
            setDialog({
              show: true,
              title: "Succès",
              message: "Quiz supprimé avec succès",
              type: "success",
              onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
              confirmText: "OK",
            });
          } else {
            // Afficher une boîte de dialogue d'erreur
            setDialog({
              show: true,
              title: "Erreur",
              message: message || "Le quiz n'a pas pu être supprimé",
              type: "error",
              onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
              confirmText: "OK",
            });
          }
        } catch (err) {
          console.error("Delete operation failed:", err);
          // Afficher une boîte de dialogue d'erreur
          setDialog({
            show: true,
            title: "Erreur",
            message: `Échec de la suppression: ${err.message}`,
            type: "error",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
    });
  };

  const handleUpdateCompetence = async (quiz) => {
    try {
      const updates = [];

      updates.push({
        id: quiz.id,
        IDModule: quiz.IDModule,
        Type: quiz.Type,
        Category: quiz.Category,
        Main: quiz.Main,
        Nom_FR: quiz.Nom_FR,
        Nom_EN: quiz.Nom_EN,
        Surface: quiz.Surface,
      });

      quiz.competences.forEach((competence) => {
        competence.sousCompetences.forEach((sousComp) => {
          updates.push({
            id: quiz.id,
            IDModule: quiz.IDModule,
            Competence_ID: competence.Competence_ID,
            Comp_Categorie_FR: competence.Comp_Categorie_FR,
            Comp_Categorie_EN: competence.Comp_Categorie_EN,
            Competence_Nom_FR: competence.Competence_Nom_FR,
            Competence_Nom_EN: competence.Competence_Nom_EN,
            SousCompetence_Nom_FR: sousComp.SousCompetence_Nom_FR,
            SousCompetence_Nom_EN: sousComp.SousCompetence_Nom_EN,
            Action_Nom_FR: "",
            Action_Nom_EN: "",
            Action_Categorie_FR: "",
            Action_Categorie_EN: "",
          });
        });

        competence.actions.forEach((action) => {
          updates.push({
            id: quiz.id,
            IDModule: quiz.IDModule,
            Competence_ID: competence.Competence_ID,
            Comp_Categorie_FR: competence.Comp_Categorie_FR,
            Comp_Categorie_EN: competence.Comp_Categorie_EN,
            Competence_Nom_FR: competence.Competence_Nom_FR,
            Competence_Nom_EN: competence.Competence_Nom_EN,
            SousCompetence_Nom_FR: "",
            SousCompetence_Nom_EN: "",
            Action_Nom_FR: action.Action_Nom_FR,
            Action_Nom_EN: action.Action_Nom_EN,
            Action_Categorie_FR: action.Action_Categorie_FR,
            Action_Categorie_EN: action.Action_Categorie_EN,
          });
        });
      });

      const results = await Promise.all(
        updates.map((update) => updateQuizByIDModule(update.IDModule, update))
      );

      setCourses(
        courses.map((c) => ({
          ...c,
          quizzes: c.quizzes?.map((q) => (q.id === quiz.id ? quiz : q)) || [],
        }))
      );

      setEditingCompetence(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // État pour stocker la nouvelle compétence en cours de création
  const [newCompetence, setNewCompetence] = useState(null);

  const handleAddCompetence = (courseId, quizId) => {
    // Trouver le quiz pour obtenir ses informations
    let quiz = null;
    for (const course of courses) {
      for (const q of course.quizzes || []) {
        if (q.IDModule === quizId) {
          quiz = q;
          break;
        }
      }
      if (quiz) break;
    }

    if (!quiz) {
      setDialog({
        show: true,
        title: "Erreur",
        message: `Quiz avec ID ${quizId} non trouvé`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
      return;
    }

    // Initialiser la nouvelle compétence avec les propriétés nécessaires pour l'API
    // Laisser les champs vides pour que l'utilisateur les remplisse
    const newCompetenceData = {
      courseId, // ID du cours parent (important pour le rechargement après création)
      quizId, // IDModule du quiz parent
      quiz_id: quiz.id, // ID réel du quiz pour l'API
      Competence_Nom_FR: "", // Nom en français (requis) - champ vide
      Competence_Nom_EN: "", // Nom en anglais (requis) - champ vide
      Comp_Categorie_FR: "", // Catégorie en français (optionnel)
      Comp_Categorie_EN: "", // Catégorie en anglais (optionnel)
      quiz: quiz, // Référence à l'objet quiz parent
    };

    console.log("Initialisation de newCompetence:", newCompetenceData);
    setNewCompetence(newCompetenceData);
  };

  const handleSaveNewCompetence = async () => {
    if (!newCompetence) {
      console.error("newCompetence est null ou undefined");
      return;
    }

    try {
      console.log("newCompetence:", newCompetence);
      const { quizId, quiz_id, quiz } = newCompetence;

      // La validation des champs obligatoires a été supprimée

      // Créer la nouvelle compétence à ajouter à l'interface
      const newCompetenceObj = {
        id: Date.now(), // ID temporaire pour l'interface
        Competence_ID: Date.now(), // ID temporaire pour l'interface
        Comp_Categorie_FR: newCompetence.Comp_Categorie_FR || "",
        Comp_Categorie_EN: newCompetence.Comp_Categorie_EN || "",
        Competence_Nom_FR: newCompetence.Competence_Nom_FR,
        Competence_Nom_EN: newCompetence.Competence_Nom_EN,
        sousCompetences: [],
        actions: [],
      };

      // Mettre à jour l'état local immédiatement pour une meilleure expérience utilisateur
      setCourses(
        courses.map((course) => {
          if (course.id === newCompetence.courseId) {
            return {
              ...course,
              quizzes:
                course.quizzes?.map((q) => {
                  if (q.IDModule === quizId) {
                    return {
                      ...q,
                      competences: [...(q.competences || []), newCompetenceObj],
                    };
                  }
                  return q;
                }) || [],
            };
          }
          return course;
        })
      );

      // Créer la compétence dans la base de données en utilisant les champs du formulaire
      const requestData = {
        quiz_id: quiz_id, // ID du quiz pour l'API
        nom_fr: newCompetence.Competence_Nom_FR,
        nom_en: newCompetence.Competence_Nom_EN,
        categorie_fr: newCompetence.Comp_Categorie_FR || "",
        categorie_en: newCompetence.Comp_Categorie_EN || "",
      };

      console.log("Données envoyées pour createCompetence:", requestData);

      // Utiliser le bon endpoint pour créer une compétence
      const response = await fetch(`${API_BASE_URL}/quiz/competence/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          IDModule: newCompetence.quizId, // Utiliser IDModule au lieu de quiz_id
          nom_fr: newCompetence.Competence_Nom_FR,
          nom_en: newCompetence.Competence_Nom_EN,
          categorie_fr: newCompetence.Comp_Categorie_FR || "",
          categorie_en: newCompetence.Comp_Categorie_EN || "",
        }),
      });

      console.log("Statut de la réponse:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log("Données d'erreur:", errorData);
        } catch (jsonError) {
          console.error(
            "Erreur lors de la lecture de la réponse JSON:",
            jsonError
          );
          const text = await response.text();
          console.log("Réponse texte brute:", text);
          throw new Error(
            `Échec de la création de la compétence: ${response.status} - ${text}`
          );
        }
        throw new Error(
          errorData.message || "Échec de la création de la compétence"
        );
      }

      const responseData = await response.json();
      console.log("Compétence créée avec succès:", responseData);

      // Fermer le formulaire
      setNewCompetence(null);

      // Planifier un rechargement complet des données après un court délai
      // pour s'assurer que la base de données a eu le temps de traiter la nouvelle compétence
      setTimeout(async () => {
        try {
          const courseId = newCompetence.courseId;
          console.log(
            "Rechargement différé des données pour le cours:",
            courseId
          );

          // Recharger les quizzes pour ce cours
          const updatedQuizzes = await fetchQuizzesForCourse(courseId);

          // Mettre à jour l'état des cours avec les nouveaux quizzes
          setCourses(
            courses.map((c) =>
              c.id === courseId ? { ...c, quizzes: updatedQuizzes } : c
            )
          );

          console.log("Rechargement différé terminé avec succès");
        } catch (reloadError) {
          console.error("Erreur lors du rechargement différé:", reloadError);
        }
      }, 1000); // Attendre 1 seconde avant de recharger

      setDialog({
        show: true,
        title: "Succès",
        message: "Compétence ajoutée avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout de la compétence:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de l'ajout: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleDeleteCompetence = async (courseId, quizId, competenceId) => {
    // Afficher une boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer cette compétence ?",
      type: "confirm",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, show: false }));

        try {
          // Trouver le quiz pour obtenir son IDModule
          let quizIDModule = null;
          for (const course of courses) {
            for (const quiz of course.quizzes || []) {
              if (quiz.IDModule === quizId) {
                quizIDModule = quiz.IDModule;
                break;
              }
            }
            if (quizIDModule) break;
          }

          if (!quizIDModule) {
            throw new Error(`Quiz avec ID ${quizId} non trouvé`);
          }

          // Appeler l'API pour supprimer la compétence
          const response = await fetch(
            `${API_BASE_URL}/quiz/competence/${quizIDModule}/${competenceId}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete competence");
          }

          // Mettre à jour l'état local
          setCourses(
            courses.map((course) => ({
              ...course,
              quizzes:
                course.quizzes?.map((quiz) =>
                  quiz.IDModule === quizId
                    ? {
                        ...quiz,
                        competences: quiz.competences.filter(
                          (c) => c.Competence_ID !== competenceId
                        ),
                      }
                    : quiz
                ) || [],
            }))
          );

          // Afficher une boîte de dialogue de succès
          setDialog({
            show: true,
            title: "Succès",
            message: "Compétence supprimée avec succès",
            type: "success",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        } catch (err) {
          console.error("Error deleting competence:", err);
          setDialog({
            show: true,
            title: "Erreur",
            message: `Échec de la suppression: ${err.message}`,
            type: "error",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
      cancelText: "Annuler",
      confirmText: "Supprimer",
    });
  };

  const handleAddSousCompetence = async (courseId, quizId, competenceId) => {
    try {
      // Trouver le quiz et la compétence pour obtenir leurs informations
      let quiz = null;
      let competence = null;

      for (const course of courses) {
        for (const q of course.quizzes || []) {
          if (q.IDModule === quizId) {
            quiz = q;
            competence = q.competences.find(
              (c) => c.Competence_ID === competenceId
            );
            break;
          }
        }
        if (quiz && competence) break;
      }

      if (!quiz) {
        throw new Error(`Quiz avec ID ${quizId} non trouvé`);
      }

      if (!competence) {
        throw new Error(`Compétence avec ID ${competenceId} non trouvée`);
      }

      // Générer un ID unique pour la nouvelle sous-compétence
      const sousCompId = Date.now();

      // Ouvrir le formulaire pour créer une nouvelle sous-compétence
      setEditingSousCompetence({
        id: sousCompId,
        SousCompetence_Nom_FR: "",
        SousCompetence_Nom_EN: "",
        competenceId,
        quizId,
        courseId,
        isNew: true, // Marquer comme nouvelle sous-compétence
      });
    } catch (err) {
      console.error(
        "Erreur lors de la préparation de l'ajout de la sous-compétence:",
        err
      );
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la préparation: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleDeleteSousCompetence = async (
    courseId,
    quizId,
    competenceId,
    sousCompIndex
  ) => {
    // Afficher une boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer cette sous-compétence ?",
      type: "confirm",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, show: false }));

        try {
          // Trouver la sous-compétence
          let sousCompetence = null;

          for (const course of courses) {
            for (const quiz of course.quizzes || []) {
              if (quiz.IDModule === quizId) {
                const competence = quiz.competences.find(
                  (c) => c.Competence_ID === competenceId
                );
                if (
                  competence &&
                  competence.sousCompetences &&
                  competence.sousCompetences[sousCompIndex]
                ) {
                  sousCompetence = competence.sousCompetences[sousCompIndex];
                }
                break;
              }
            }
            if (sousCompetence) break;
          }

          if (!sousCompetence) {
            throw new Error(
              `Sous-compétence à l'index ${sousCompIndex} non trouvée`
            );
          }

          // Vérifier que l'ID de la sous-compétence est présent
          if (!sousCompetence.id) {
            throw new Error("ID de la sous-compétence manquant");
          }

          // Appeler l'API pour supprimer la sous-compétence avec le bon endpoint
          const response = await fetch(
            `${API_BASE_URL}/sous-competence/${sousCompetence.id}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (jsonError) {
              throw new Error(`Échec de la suppression: ${response.status}`);
            }
            throw new Error(
              errorData.message ||
                "Échec de la suppression de la sous-compétence"
            );
          }

          // Mettre à jour l'état local immédiatement pour une meilleure expérience utilisateur
          setCourses(
            courses.map((course) => ({
              ...course,
              quizzes:
                course.quizzes?.map((q) =>
                  q.IDModule === quizId
                    ? {
                        ...q,
                        competences: q.competences.map((c) =>
                          c.Competence_ID === competenceId
                            ? {
                                ...c,
                                sousCompetences: c.sousCompetences.filter(
                                  (_, index) => index !== sousCompIndex
                                ),
                              }
                            : c
                        ),
                      }
                    : q
                ) || [],
            }))
          );

          // Afficher un message de succès
          setDialog({
            show: true,
            title: "Succès",
            message: "Sous-compétence supprimée avec succès",
            type: "success",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        } catch (err) {
          console.error("Error deleting sous-competence:", err);
          setDialog({
            show: true,
            title: "Erreur",
            message: `Échec de la suppression: ${err.message}`,
            type: "error",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
      cancelText: "Annuler",
      confirmText: "Supprimer",
    });
  };

  const handleAddQuizAction = async (courseId, quizId) => {
    try {
      // Trouver le quiz pour obtenir son ID réel
      let quiz = null;

      for (const course of courses) {
        for (const q of course.quizzes || []) {
          if (q.IDModule === quizId) {
            quiz = q;
            break;
          }
        }
        if (quiz) break;
      }

      if (!quiz) {
        throw new Error(`Quiz avec ID ${quizId} non trouvé`);
      }

      // Créer une nouvelle action avec des valeurs par défaut
      const newAction = {
        id: Date.now(), // ID temporaire pour l'interface
        Action_Nom_FR: "Nouvelle Action",
        Action_Nom_EN: "New Action",
        Action_Categorie_FR: "",
        Action_Categorie_EN: "",
      };

      // Mettre à jour l'état local d'abord pour une meilleure expérience utilisateur
      setCourses(
        courses.map((course) => ({
          ...course,
          quizzes:
            course.quizzes?.map((q) =>
              q.IDModule === quizId
                ? {
                    ...q,
                    actions: [...(q.actions || []), newAction],
                  }
                : q
            ) || [],
        }))
      );

      // Appeler l'API pour créer l'action en utilisant le bon endpoint
      const response = await fetch(`${API_BASE_URL}/quiz/action/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          IDModule: quizId, // Utiliser IDModule au lieu de quiz_id
          Action_Nom_FR: newAction.Action_Nom_FR,
          Action_Nom_EN: newAction.Action_Nom_EN,
          Action_Categorie_FR: newAction.Action_Categorie_FR || "",
          Action_Categorie_EN: newAction.Action_Categorie_EN || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur de réponse du serveur:", errorData);
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Échec de la création de l'action"
        );
      }

      const responseData = await response.json();
      console.log("Action créée avec succès:", responseData);

      // Recharger les données complètes pour s'assurer que nous avons les dernières informations
      const refreshedCourses = await fetchCourses();
      setCourses(refreshedCourses);

      setDialog({
        show: true,
        title: "Succès",
        message: "Action ajoutée avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'action:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de l'ajout: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleDeleteQuizAction = async (courseId, quizId, actionIndex) => {
    // Afficher une boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer cette action ?",
      type: "confirm",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, show: false }));

        try {
          // Trouver le quiz et l'action
          let quiz = null;
          let action = null;

          for (const course of courses) {
            for (const q of course.quizzes || []) {
              if (
                q.IDModule === quizId &&
                q.actions &&
                q.actions[actionIndex]
              ) {
                quiz = q;
                action = q.actions[actionIndex];
                break;
              }
            }
            if (quiz) break;
          }

          if (!quiz) {
            throw new Error(`Quiz avec ID ${quizId} non trouvé`);
          }

          if (!action) {
            throw new Error(`Action à l'index ${actionIndex} non trouvée`);
          }

          // Utiliser l'ID de l'action pour la suppression
          const actionId = action.id;

          console.log("Suppression de l'action avec ID:", actionId);

          // Appeler l'API pour supprimer l'action en utilisant le bon endpoint
          const response = await fetch(
            `${API_BASE_URL}/quiz/quiz-action-by-id/${actionId}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete action");
          }

          // Mettre à jour l'état local immédiatement pour une meilleure expérience utilisateur
          setCourses(
            courses.map((course) => ({
              ...course,
              quizzes:
                course.quizzes?.map((q) =>
                  q.IDModule === quizId
                    ? {
                        ...q,
                        actions: q.actions.filter((_, i) => i !== actionIndex),
                      }
                    : q
                ) || [],
            }))
          );

          // Recharger les données complètes pour s'assurer que nous avons les dernières informations
          console.log("Action supprimée avec succès, recharger les données");
          const refreshedCourses = await fetchCourses();
          setCourses(refreshedCourses);

          setDialog({
            show: true,
            title: "Succès",
            message: "Action supprimée avec succès",
            type: "success",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        } catch (err) {
          console.error("Error deleting action:", err);
          setDialog({
            show: true,
            title: "Erreur",
            message: `Échec de la suppression: ${err.message}`,
            type: "error",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
      cancelText: "Annuler",
      confirmText: "Supprimer",
    });
  };

  const handleQuizActionChange = (quiz, actionIndex, field, value) => {
    setCourses(
      courses.map((course) => ({
        ...course,
        quizzes:
          course.quizzes?.map((q) =>
            q.IDModule === quiz.IDModule
              ? {
                  ...q,
                  actions: q.actions.map((action, i) =>
                    i === actionIndex ? { ...action, [field]: value } : action
                  ),
                }
              : q
          ) || [],
      }))
    );
  };

  const handleUpdateQuizAction = async (quiz, actionIndex, actionData) => {
    try {
      // Trouver l'action par son ID
      let originalAction = quiz.actions[actionIndex];

      if (!originalAction) {
        throw new Error(`Action à l'index ${actionIndex} non trouvée`);
      }

      // Utiliser l'ID de l'action pour la mise à jour
      const actionId = originalAction.id;

      console.log("Mise à jour de l'action avec ID:", actionId);

      // Appeler l'API pour mettre à jour l'action en utilisant le bon endpoint
      const response = await fetch(
        `${API_BASE_URL}/quiz/quiz-action-by-id/${actionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom_fr: actionData.Action_Nom_FR,
            nom_en: actionData.Action_Nom_EN,
            categorie_fr: actionData.Action_Categorie_FR,
            categorie_en: actionData.Action_Categorie_EN,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update action");
      }

      // Mettre à jour l'état local immédiatement pour une meilleure expérience utilisateur
      setCourses(
        courses.map((course) => ({
          ...course,
          quizzes:
            course.quizzes?.map((q) =>
              q.IDModule === quiz.IDModule
                ? {
                    ...q,
                    actions: q.actions.map((action, i) =>
                      i === actionIndex
                        ? {
                            ...action,
                            Action_Nom_FR: actionData.Action_Nom_FR,
                            Action_Nom_EN: actionData.Action_Nom_EN,
                            Action_Categorie_FR: actionData.Action_Categorie_FR,
                            Action_Categorie_EN: actionData.Action_Categorie_EN,
                          }
                        : action
                    ),
                  }
                : q
            ) || [],
        }))
      );

      // Recharger les données complètes pour s'assurer que nous avons les dernières informations
      console.log("Action mise à jour avec succès, recharger les données");
      const refreshedCourses = await fetchCourses();
      setCourses(refreshedCourses);

      setEditingAction(null);
      setDialog({
        show: true,
        title: "Succès",
        message: "Action mise à jour avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Error updating action:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la mise à jour: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleAddAction = async (courseId, quizId, competenceId) => {
    try {
      // Trouver le quiz et la compétence
      let quiz = null;
      let competence = null;

      for (const course of courses) {
        for (const q of course.quizzes || []) {
          if (q.IDModule === quizId) {
            quiz = q;
            competence = q.competences.find(
              (c) => c.Competence_ID === competenceId
            );
            break;
          }
        }
        if (quiz) break;
      }

      if (!quiz) {
        throw new Error(`Quiz avec ID ${quizId} non trouvé`);
      }

      if (!competence) {
        throw new Error(`Compétence avec ID ${competenceId} non trouvée`);
      }

      // Créer une nouvelle action avec des valeurs par défaut
      const newAction = {
        id: Date.now(), // ID temporaire pour l'interface
        Action_Nom_FR: "Nouvelle Action",
        Action_Nom_EN: "New Action",
        Action_Categorie_FR: "",
        Action_Categorie_EN: "",
      };

      // Mettre à jour l'état local d'abord pour une meilleure expérience utilisateur
      setCourses(
        courses.map((course) => ({
          ...course,
          quizzes:
            course.quizzes?.map((q) =>
              q.IDModule === quizId
                ? {
                    ...q,
                    competences: q.competences.map((c) =>
                      c.Competence_ID === competenceId
                        ? {
                            ...c,
                            actions: [...(c.actions || []), newAction],
                          }
                        : c
                    ),
                  }
                : q
            ) || [],
        }))
      );

      // Créer l'action dans la base de données en utilisant le bon endpoint
      const response = await fetch(`${API_BASE_URL}/quiz/action/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          IDModule: quizId, // Utiliser IDModule au lieu de quiz_id
          Action_Nom_FR: newAction.Action_Nom_FR,
          Action_Nom_EN: newAction.Action_Nom_EN,
          Action_Categorie_FR: newAction.Action_Categorie_FR || "",
          Action_Categorie_EN: newAction.Action_Categorie_EN || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Échec de la création de l'action"
        );
      }

      const responseData = await response.json();
      console.log("Action créée avec succès:", responseData);

      // Recharger les données complètes pour s'assurer que nous avons les dernières informations
      const refreshedCourses = await fetchCourses();
      setCourses(refreshedCourses);

      setDialog({
        show: true,
        title: "Succès",
        message: "Action ajoutée avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'action:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de l'ajout: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleDeleteAction = async (
    courseId,
    quizId,
    competenceId,
    actionIndex
  ) => {
    // Afficher une boîte de dialogue de confirmation
    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer cette action ?",
      type: "confirm",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, show: false }));

        try {
          // Trouver le quiz et l'action
          let quiz = null;
          let action = null;
          let competence = null;

          for (const course of courses) {
            for (const q of course.quizzes || []) {
              if (q.IDModule === quizId) {
                quiz = q;
                competence = q.competences.find(
                  (c) => c.Competence_ID === competenceId
                );
                if (
                  competence &&
                  competence.actions &&
                  competence.actions[actionIndex]
                ) {
                  action = competence.actions[actionIndex];
                }
                break;
              }
            }
            if (quiz && action) break;
          }

          if (!quiz) {
            throw new Error(`Quiz avec ID ${quizId} non trouvé`);
          }

          if (!action) {
            throw new Error(`Action à l'index ${actionIndex} non trouvée`);
          }

          // Utiliser l'ID de l'action pour la suppression
          const actionId = action.id;

          console.log("Suppression de l'action avec ID:", actionId);

          // Appeler l'API pour supprimer l'action en utilisant le bon endpoint
          const response = await fetch(
            `${API_BASE_URL}/quiz/quiz-action-by-id/${actionId}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete action");
          }

          // Mettre à jour l'état local
          setCourses(
            courses.map((course) => ({
              ...course,
              quizzes:
                course.quizzes?.map((q) =>
                  q.IDModule === quizId
                    ? {
                        ...q,
                        competences: q.competences.map((c) =>
                          c.Competence_ID === competenceId
                            ? {
                                ...c,
                                actions: c.actions.filter(
                                  (_, i) => i !== actionIndex
                                ),
                              }
                            : c
                        ),
                      }
                    : q
                ) || [],
            }))
          );

          // Recharger les données complètes pour s'assurer que nous avons les dernières informations
          const refreshedCourses = await fetchCourses();
          setCourses(refreshedCourses);

          setDialog({
            show: true,
            title: "Succès",
            message: "Action supprimée avec succès",
            type: "success",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        } catch (err) {
          console.error("Error deleting action:", err);
          setDialog({
            show: true,
            title: "Erreur",
            message: `Échec de la suppression: ${err.message}`,
            type: "error",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, show: false })),
      cancelText: "Annuler",
      confirmText: "Supprimer",
    });
  };

  const handleCompetenceChange = (quiz, compIndex, field, value) => {
    const updatedCompetences = [...quiz.competences];
    updatedCompetences[compIndex] = {
      ...updatedCompetences[compIndex],
      [field]: value,
    };

    const updatedQuiz = {
      ...quiz,
      competences: updatedCompetences,
    };

    setCourses(
      courses.map((c) => ({
        ...c,
        quizzes:
          c.quizzes?.map((q) =>
            q.IDModule === quiz.IDModule ? updatedQuiz : q
          ) || [],
      }))
    );
  };

  const handleUpdateCompetenceSubmit = async (competenceData) => {
    try {
      // Trouver le quiz pour obtenir son IDModule
      let quizIDModule = null;
      let competence = null;

      for (const course of courses) {
        for (const quiz of course.quizzes || []) {
          const foundCompetence = quiz.competences.find(
            (c) => c.Competence_ID === competenceData.Competence_ID
          );
          if (foundCompetence) {
            quizIDModule = quiz.IDModule;
            competence = foundCompetence;
            break;
          }
        }
        if (quizIDModule) break;
      }

      if (!quizIDModule || !competence) {
        throw new Error(
          `Compétence avec ID ${competenceData.Competence_ID} non trouvée`
        );
      }

      // Appeler l'API pour mettre à jour la compétence
      const response = await fetch(
        `${API_BASE_URL}/quiz/competence/${quizIDModule}/${competenceData.Competence_ID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Competence_Nom_FR: competenceData.Competence_Nom_FR,
            Competence_Nom_EN: competenceData.Competence_Nom_EN,
            Comp_Categorie_FR: competenceData.Comp_Categorie_FR,
            Comp_Categorie_EN: competenceData.Comp_Categorie_EN,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update competence");
      }

      // Mettre à jour manuellement la compétence dans l'état local
      const newCourses = [...courses];

      // Parcourir les cours pour trouver et mettre à jour la compétence
      for (let i = 0; i < newCourses.length; i++) {
        const course = newCourses[i];
        if (!course.quizzes) continue;

        for (let j = 0; j < course.quizzes.length; j++) {
          const quiz = course.quizzes[j];
          if (quiz.IDModule !== quizIDModule) continue;

          for (let k = 0; k < quiz.competences.length; k++) {
            const comp = quiz.competences[k];
            if (comp.Competence_ID !== competenceData.Competence_ID) continue;

            // Mettre à jour la compétence trouvée
            quiz.competences[k] = {
              ...comp,
              Competence_Nom_FR: competenceData.Competence_Nom_FR,
              Competence_Nom_EN: competenceData.Competence_Nom_EN,
              Comp_Categorie_FR: competenceData.Comp_Categorie_FR,
              Comp_Categorie_EN: competenceData.Comp_Categorie_EN,
            };

            // Sortir des boucles une fois la mise à jour effectuée
            break;
          }
        }
      }

      // Mettre à jour l'état avec les nouvelles données
      setCourses(newCourses);

      setEditingCompetence(null);
      setDialog({
        show: true,
        title: "Succès",
        message: "Compétence mise à jour avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Error updating competence:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la mise à jour: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleUpdateSousCompetenceSubmit = async (sousCompetenceData) => {
    try {
      // Vérifier que l'ID de la sous-compétence est présent
      if (!sousCompetenceData.id) {
        throw new Error("ID de la sous-compétence manquant");
      }

      // Préparer les données pour l'API - adapter au format attendu par l'API
      const requestData = {
        nom_fr: sousCompetenceData.SousCompetence_Nom_FR,
        nom_en: sousCompetenceData.SousCompetence_Nom_EN,
      };

      // Appel API avec le bon endpoint
      const response = await fetch(
        `${API_BASE_URL}/sous-competence/${sousCompetenceData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          throw new Error(`Échec de la mise à jour: ${response.status}`);
        }
        throw new Error(errorData.message || "Échec de la mise à jour");
      }

      // Récupérer les données de la réponse
      const responseData = await response.json();

      // Mettre à jour manuellement la sous-compétence dans l'état local
      const newCourses = [...courses];

      // Parcourir les cours pour trouver et mettre à jour la sous-compétence
      let updated = false;
      for (const course of newCourses) {
        if (!course.quizzes) continue;

        for (const quiz of course.quizzes) {
          for (const competence of quiz.competences) {
            for (let i = 0; i < competence.sousCompetences.length; i++) {
              const sc = competence.sousCompetences[i];
              if (sc.id === sousCompetenceData.id) {
                // Mettre à jour la sous-compétence trouvée
                competence.sousCompetences[i] = {
                  ...sc,
                  SousCompetence_Nom_FR:
                    sousCompetenceData.SousCompetence_Nom_FR,
                  SousCompetence_Nom_EN:
                    sousCompetenceData.SousCompetence_Nom_EN,
                };
                updated = true;
                break;
              }
            }
            if (updated) break;
          }
          if (updated) break;
        }
        if (updated) break;
      }

      // Mettre à jour l'état avec les nouvelles données
      setCourses(newCourses);

      // Fermer le formulaire
      setEditingSousCompetence(null);

      // Afficher un message de succès
      setDialog({
        show: true,
        title: "Succès",
        message: "Sous-compétence mise à jour avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la mise à jour: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleCreateSousCompetenceSubmit = async (sousCompetenceData) => {
    try {
      // Vérifier que les données nécessaires sont présentes
      if (!sousCompetenceData.quizId || !sousCompetenceData.competenceId) {
        throw new Error("Données manquantes pour créer la sous-compétence");
      }

      // Préparer les données pour l'API - adapter au format attendu par l'API
      const requestData = {
        competence_id: sousCompetenceData.competenceId,
        nom_fr: sousCompetenceData.SousCompetence_Nom_FR,
        nom_en: sousCompetenceData.SousCompetence_Nom_EN,
      };

      // Appel API pour créer la sous-compétence avec le bon endpoint
      const response = await fetch(`${API_BASE_URL}/sous-competence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error(
            `Échec de la création de la sous-compétence: ${response.status} - ${text}`
          );
        }
        throw new Error(
          errorData.message || "Échec de la création de la sous-compétence"
        );
      }

      const responseData = await response.json();
      console.log("Sous-compétence créée avec succès:", responseData);

      // Recharger les données complètes pour s'assurer que nous avons les dernières informations
      const refreshedCourses = await fetchCourses();
      setCourses(refreshedCourses);

      // Fermer le formulaire
      setEditingSousCompetence(null);

      // Afficher un message de succès
      setDialog({
        show: true,
        title: "Succès",
        message: "Sous-compétence ajoutée avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Erreur lors de la création de la sous-compétence:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la création: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const handleUpdateActionSubmit = async (actionData) => {
    try {
      // Trouver le quiz, la compétence et l'action
      let quizIDModule = null;
      let competenceId = null;
      let quizId = null;
      let compIndex = null;
      let actionIndex = null;
      let originalAction = null;

      for (const course of courses) {
        for (const quiz of course.quizzes || []) {
          for (let i = 0; i < quiz.competences.length; i++) {
            const competence = quiz.competences[i];
            for (let j = 0; j < competence.actions.length; j++) {
              const action = competence.actions[j];
              if (action.id === actionData.id) {
                quizIDModule = quiz.IDModule;
                competenceId = competence.Competence_ID;
                quizId = quiz.id;
                compIndex = i;
                actionIndex = j;
                originalAction = action;
                break;
              }
            }
            if (originalAction) break;
          }
          if (originalAction) break;
        }
        if (originalAction) break;
      }

      if (!originalAction) {
        throw new Error(`Action avec ID ${actionData.id} non trouvée`);
      }

      // Encoder les noms originaux pour l'URL
      const originalNomFR = encodeURIComponent(originalAction.Action_Nom_FR);
      const originalNomEN = encodeURIComponent(originalAction.Action_Nom_EN);

      // Appeler l'API pour mettre à jour l'action
      const response = await fetch(
        `${API_BASE_URL}/quiz/action/${quizIDModule}/${competenceId}/${originalNomFR}/${originalNomEN}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Action_Nom_FR: actionData.Action_Nom_FR,
            Action_Nom_EN: actionData.Action_Nom_EN,
            Action_Categorie_FR: actionData.Action_Categorie_FR,
            Action_Categorie_EN: actionData.Action_Categorie_EN,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update action");
      }

      // Mettre à jour l'état local
      setCourses(
        courses.map((course) => ({
          ...course,
          quizzes:
            course.quizzes?.map((quiz) =>
              quiz.IDModule === quizId
                ? {
                    ...quiz,
                    competences: quiz.competences.map((c, i) =>
                      i === compIndex
                        ? {
                            ...c,
                            actions: c.actions.map((act, j) =>
                              j === actionIndex
                                ? {
                                    ...act,
                                    Action_Nom_FR: actionData.Action_Nom_FR,
                                    Action_Nom_EN: actionData.Action_Nom_EN,
                                    Action_Categorie_FR:
                                      actionData.Action_Categorie_FR,
                                    Action_Categorie_EN:
                                      actionData.Action_Categorie_EN,
                                  }
                                : act
                            ),
                          }
                        : c
                    ),
                  }
                : quiz
            ) || [],
        }))
      );

      setEditingAction(null);
      setDialog({
        show: true,
        title: "Succès",
        message: "Action mise à jour avec succès",
        type: "success",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Error updating action:", err);
      setDialog({
        show: true,
        title: "Erreur",
        message: `Échec de la mise à jour: ${err.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  const toggleCourse = async (courseId) => {
    setExpandedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );

    if (!expandedCourses.includes(courseId)) {
      const course = courses.find((c) => c.id === courseId);
      if (!course.quizzes || course.quizzes.length === 0) {
        try {
          // Définir l'état de chargement pour ce cours spécifique
          setLoadingCourses((prev) => ({ ...prev, [courseId]: true }));

          const quizzes = await fetchQuizzesForCourse(courseId);
          setCourses(
            courses.map((c) => (c.id === courseId ? { ...c, quizzes } : c))
          );

          // Réinitialiser l'état de chargement une fois terminé
          setLoadingCourses((prev) => ({ ...prev, [courseId]: false }));
        } catch (err) {
          setError("Impossible de charger les quiz pour ce cours");
          // Réinitialiser l'état de chargement en cas d'erreur
          setLoadingCourses((prev) => ({ ...prev, [courseId]: false }));
        }
      }
    }
  };

  const toggleQuiz = (quizId) => {
    setExpandedQuizzes((prev) =>
      prev.includes(quizId)
        ? prev.filter((id) => id !== quizId)
        : [...prev, quizId]
    );
  };

  const toggleCompetence = (competenceId) => {
    setExpandedCompetences((prev) =>
      prev.includes(competenceId)
        ? prev.filter((id) => id !== competenceId)
        : [...prev, competenceId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-700 dark:text-gray-300">
          Chargement en cours...
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Erreur: {error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Formulaire pour ajouter une nouvelle compétence */}
      {newCompetence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Ajouter une nouvelle compétence
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Nom en français *
                </label>
                <input
                  type="text"
                  value={newCompetence.Competence_Nom_FR}
                  onChange={(e) =>
                    setNewCompetence({
                      ...newCompetence,
                      Competence_Nom_FR: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de la compétence en français"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Nom en anglais *
                </label>
                <input
                  type="text"
                  value={newCompetence.Competence_Nom_EN}
                  onChange={(e) =>
                    setNewCompetence({
                      ...newCompetence,
                      Competence_Nom_EN: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de la compétence en anglais"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Catégorie en français
                </label>
                <input
                  type="text"
                  value={newCompetence.Comp_Categorie_FR}
                  onChange={(e) =>
                    setNewCompetence({
                      ...newCompetence,
                      Comp_Categorie_FR: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Catégorie en français (optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Catégorie en anglais
                </label>
                <input
                  type="text"
                  value={newCompetence.Comp_Categorie_EN}
                  onChange={(e) =>
                    setNewCompetence({
                      ...newCompetence,
                      Comp_Categorie_EN: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Catégorie en anglais (optionnel)"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setNewCompetence(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNewCompetence}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {showAddCourseForm ? (
          <AddCourseForm
            onSave={handleAddCourse}
            onCancel={() => setShowAddCourseForm(false)}
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Gestion des Cours
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Gérez vos cours, quiz et compétences en un seul endroit
                </p>
              </div>
              <button
                onClick={() => setShowAddCourseForm(true)}
                className="flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <FiPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Nouveau Cours
              </button>
            </div>

            <div className="space-y-6">
              {courses.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <FiBook className="mx-auto text-5xl text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
                    Aucun cours disponible
                  </h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Commencez par créer votre premier cours pour organiser vos
                    quiz et compétences.
                  </p>
                </div>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <FiBook className="text-xl" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                              {course.titre}
                            </h2>
                            <p className="mt-1 text-gray-600 dark:text-gray-300">
                              {course.description ||
                                "Aucune description fournie"}
                            </p>
                            <div className="mt-3 flex space-x-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {course.quizzes?.length || 0} quiz
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                            title="Modifier le cours"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                            title="Supprimer le cours"
                          >
                            <FiTrash2 />
                          </button>
                          <button
                            onClick={() => toggleCourse(course.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title={
                              expandedCourses.includes(course.id)
                                ? "Réduire"
                                : "Développer"
                            }
                          >
                            {expandedCourses.includes(course.id) ? (
                              <FiChevronDown />
                            ) : (
                              <FiChevronRight />
                            )}
                          </button>
                        </div>
                      </div>

                      {expandedCourses.includes(course.id) && (
                        <div className="mt-8 space-y-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center">
                              <FiFileText className="mr-2 text-blue-500 dark:text-blue-400" />
                              Quiz associés
                            </h3>
                          </div>

                          {loadingCourses[course.id] ? (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                              <p className="text-gray-700 dark:text-gray-300 text-lg">
                                Chargement en cours...
                              </p>
                            </div>
                          ) : !course.quizzes || course.quizzes.length === 0 ? (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                              <FiHelpCircle className="mx-auto text-3xl text-gray-400 dark:text-gray-500 mb-3" />
                              <p className="text-gray-500 dark:text-gray-400">
                                Ce cours ne contient aucun quiz pour le moment.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {course.quizzes.map((quiz) => (
                                <div
                                  key={quiz.id}
                                  className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-300"
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <FiFileText />
                                      </div>
                                      <div className="flex flex-col max-w-md">
                                        <h4 className="font-medium text-gray-800 dark:text-gray-200 break-words">
                                          {quiz.Nom_FR}
                                        </h4>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {quiz.IDModule}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => setEditingQuiz(quiz)}
                                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                                        title="Modifier le quiz"
                                      >
                                        <FiEdit2 size={16} />
                                      </button>
                                      {typeof quiz.IDModule === "string" && (
                                        <button
                                          onClick={() => {
                                            console.log(
                                              "Deleting quiz with IDModule:",
                                              quiz.IDModule,
                                              typeof quiz.IDModule
                                            );
                                            handleDeleteQuiz(
                                              course.id,
                                              quiz.IDModule
                                            );
                                          }}
                                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                                          title="Supprimer le quiz"
                                        >
                                          <FiTrash2 size={16} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          toggleQuiz(quiz.IDModule)
                                        }
                                        className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                        title={
                                          expandedQuizzes.includes(
                                            quiz.IDModule
                                          )
                                            ? "Réduire"
                                            : "Développer"
                                        }
                                      >
                                        {expandedQuizzes.includes(
                                          quiz.IDModule
                                        ) ? (
                                          <FiChevronDown size={16} />
                                        ) : (
                                          <FiChevronRight size={16} />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {expandedQuizzes.includes(quiz.IDModule) && (
                                    <div className="mt-5 space-y-4">
                                      {/* MainSurface, Main et Surface */}
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                        {!quiz.MainSurface ? (
                                          // Si MainSurface est false, afficher uniquement la case à cocher
                                          <div className="flex items-center mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
                                              MainSurface
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={false}
                                                onChange={(e) => {
                                                  const updatedQuiz = {
                                                    ...quiz,
                                                    MainSurface:
                                                      e.target.checked,
                                                  };
                                                  setCourses(
                                                    courses.map((c) => ({
                                                      ...c,
                                                      quizzes:
                                                        c.quizzes?.map((q) =>
                                                          q.IDModule ===
                                                          quiz.IDModule
                                                            ? updatedQuiz
                                                            : q
                                                        ) || [],
                                                    }))
                                                  );
                                                }}
                                                className="sr-only peer"
                                              />
                                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-focus:ring-blue-800 dark:bg-gray-700 dark:border-gray-600"></div>
                                            </label>
                                          </div>
                                        ) : (
                                          // Si MainSurface est true, afficher les champs Main et Surface
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="space-y-1">
                                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Main
                                              </label>
                                              <div className="flex">
                                                <input
                                                  type="number"
                                                  value={quiz.Main || 0}
                                                  onChange={(e) => {
                                                    const value =
                                                      parseInt(
                                                        e.target.value
                                                      ) || 0;
                                                    const updatedQuiz = {
                                                      ...quiz,
                                                      Main: value,
                                                    };
                                                    setCourses(
                                                      courses.map((c) => ({
                                                        ...c,
                                                        quizzes:
                                                          c.quizzes?.map((q) =>
                                                            q.IDModule ===
                                                            quiz.IDModule
                                                              ? updatedQuiz
                                                              : q
                                                          ) || [],
                                                      }))
                                                    );
                                                  }}
                                                  min="0"
                                                  className="block w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                                                />
                                                <div className="flex flex-col border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg overflow-hidden">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const updatedQuiz = {
                                                        ...quiz,
                                                        Main:
                                                          (quiz.Main || 0) + 1,
                                                      };
                                                      setCourses(
                                                        courses.map((c) => ({
                                                          ...c,
                                                          quizzes:
                                                            c.quizzes?.map(
                                                              (q) =>
                                                                q.IDModule ===
                                                                quiz.IDModule
                                                                  ? updatedQuiz
                                                                  : q
                                                            ) || [],
                                                        }))
                                                      );
                                                    }}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600"
                                                  >
                                                    ▲
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const updatedQuiz = {
                                                        ...quiz,
                                                        Main: Math.max(
                                                          0,
                                                          (quiz.Main || 0) - 1
                                                        ),
                                                      };
                                                      setCourses(
                                                        courses.map((c) => ({
                                                          ...c,
                                                          quizzes:
                                                            c.quizzes?.map(
                                                              (q) =>
                                                                q.IDModule ===
                                                                quiz.IDModule
                                                                  ? updatedQuiz
                                                                  : q
                                                            ) || [],
                                                        }))
                                                      );
                                                    }}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                                  >
                                                    ▼
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Surface
                                              </label>
                                              <div className="flex">
                                                <input
                                                  type="number"
                                                  value={quiz.Surface || 0}
                                                  onChange={(e) => {
                                                    const value =
                                                      parseInt(
                                                        e.target.value
                                                      ) || 0;
                                                    const updatedQuiz = {
                                                      ...quiz,
                                                      Surface: value,
                                                    };
                                                    setCourses(
                                                      courses.map((c) => ({
                                                        ...c,
                                                        quizzes:
                                                          c.quizzes?.map((q) =>
                                                            q.IDModule ===
                                                            quiz.IDModule
                                                              ? updatedQuiz
                                                              : q
                                                          ) || [],
                                                      }))
                                                    );
                                                  }}
                                                  min="0"
                                                  className="block w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                                                />
                                                <div className="flex flex-col border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg overflow-hidden">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const updatedQuiz = {
                                                        ...quiz,
                                                        Surface:
                                                          (quiz.Surface || 0) +
                                                          1,
                                                      };
                                                      setCourses(
                                                        courses.map((c) => ({
                                                          ...c,
                                                          quizzes:
                                                            c.quizzes?.map(
                                                              (q) =>
                                                                q.IDModule ===
                                                                quiz.IDModule
                                                                  ? updatedQuiz
                                                                  : q
                                                            ) || [],
                                                        }))
                                                      );
                                                    }}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600"
                                                  >
                                                    ▲
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const updatedQuiz = {
                                                        ...quiz,
                                                        Surface: Math.max(
                                                          0,
                                                          (quiz.Surface || 0) -
                                                            1
                                                        ),
                                                      };
                                                      setCourses(
                                                        courses.map((c) => ({
                                                          ...c,
                                                          quizzes:
                                                            c.quizzes?.map(
                                                              (q) =>
                                                                q.IDModule ===
                                                                quiz.IDModule
                                                                  ? updatedQuiz
                                                                  : q
                                                            ) || [],
                                                        }))
                                                      );
                                                    }}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                                  >
                                                    ▼
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex justify-end mt-4">
                                          <button
                                            onClick={() =>
                                              handleUpdateQuizMainSurface(quiz)
                                            }
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg shadow transition-colors duration-300"
                                          >
                                            Enregistrer les modifications
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-center">
                                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                          <FiHelpCircle className="mr-2 text-blue-500 dark:text-blue-400" />
                                          Compétences (
                                          {quiz.competences?.length || 0})
                                        </h5>
                                        <button
                                          onClick={() =>
                                            handleAddCompetence(
                                              course.id,
                                              quiz.IDModule
                                            )
                                          }
                                          className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg shadow transition-colors duration-300"
                                        >
                                          <FiPlus className="mr-1" /> Ajouter
                                          Compétence
                                        </button>
                                      </div>

                                      {quiz.competences?.length > 0 ? (
                                        <div className="space-y-3">
                                          {quiz.competences.map(
                                            (competence, compIndex) => (
                                              <div
                                                key={`comp-${compIndex}`}
                                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                              >
                                                <div
                                                  className="flex justify-between items-center cursor-pointer"
                                                  onClick={() =>
                                                    toggleCompetence(
                                                      `${quiz.IDModule}-${compIndex}`
                                                    )
                                                  }
                                                >
                                                  <div>
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-2">
                                                      <div>
                                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                          Nom FR
                                                        </label>
                                                        <input
                                                          type="text"
                                                          value={
                                                            competence.Competence_Nom_FR
                                                          }
                                                          onChange={(e) =>
                                                            handleCompetenceChange(
                                                              quiz,
                                                              compIndex,
                                                              "Competence_Nom_FR",
                                                              e.target.value
                                                            )
                                                          }
                                                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white min-w-[450px]"
                                                          style={{
                                                            width: "100%",
                                                            minWidth: "450px",
                                                          }}
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                          Nom EN
                                                        </label>
                                                        <input
                                                          type="text"
                                                          value={
                                                            competence.Competence_Nom_EN
                                                          }
                                                          onChange={(e) =>
                                                            handleCompetenceChange(
                                                              quiz,
                                                              compIndex,
                                                              "Competence_Nom_EN",
                                                              e.target.value
                                                            )
                                                          }
                                                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white min-w-[450px]"
                                                          style={{
                                                            width: "100%",
                                                            minWidth: "450px",
                                                          }}
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex space-x-2">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Conserver les valeurs des catégories FR et EN même si elles ne sont pas affichées
                                                        setEditingCompetence({
                                                          ...competence,
                                                          quizId: quiz.IDModule,
                                                          courseId: course.id,
                                                          // S'assurer que ces valeurs sont conservées
                                                          Comp_Categorie_FR:
                                                            competence.Comp_Categorie_FR ||
                                                            "",
                                                          Comp_Categorie_EN:
                                                            competence.Comp_Categorie_EN ||
                                                            "",
                                                        });
                                                      }}
                                                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 mr-2"
                                                      title="Modifier la compétence"
                                                    >
                                                      <FiEdit2 />
                                                    </button>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCompetence(
                                                          course.id,
                                                          quiz.IDModule,
                                                          competence.Competence_ID
                                                        );
                                                      }}
                                                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                      title="Supprimer la compétence"
                                                    >
                                                      <FiTrash2 />
                                                    </button>
                                                    <div>
                                                      {expandedCompetences.includes(
                                                        `${quiz.IDModule}-${compIndex}`
                                                      ) ? (
                                                        <FiChevronUp className="text-gray-500 dark:text-gray-300" />
                                                      ) : (
                                                        <FiChevronDown className="text-gray-500 dark:text-gray-300" />
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                {expandedCompetences.includes(
                                                  `${quiz.IDModule}-${compIndex}`
                                                ) && (
                                                  <div className="mt-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                                                    {/* Sous-compétences */}
                                                    <div className="mb-3">
                                                      <div className="flex justify-between items-center mb-2">
                                                        <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                          Sous-compétences (
                                                          {competence
                                                            .sousCompetences
                                                            ?.length || 0}
                                                          )
                                                        </h6>
                                                        <button
                                                          onClick={() =>
                                                            handleAddSousCompetence(
                                                              course.id,
                                                              quiz.IDModule,
                                                              competence.Competence_ID
                                                            )
                                                          }
                                                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                        >
                                                          <FiPlus className="inline mr-1" />{" "}
                                                          Ajouter
                                                        </button>
                                                      </div>
                                                      {competence
                                                        .sousCompetences
                                                        ?.length > 0 ? (
                                                        <div className="space-y-2">
                                                          {competence.sousCompetences.map(
                                                            (
                                                              sousComp,
                                                              scIndex
                                                            ) => (
                                                              <div
                                                                key={`sc-${scIndex}`}
                                                                className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded relative"
                                                              >
                                                                <div className="absolute top-2 right-2 flex space-x-2">
                                                                  <button
                                                                    onClick={() =>
                                                                      setEditingSousCompetence(
                                                                        {
                                                                          ...sousComp,
                                                                          quizId:
                                                                            quiz.IDModule,
                                                                          courseId:
                                                                            course.id,
                                                                          competenceId:
                                                                            competence.Competence_ID,
                                                                          compIndex:
                                                                            compIndex,
                                                                          scIndex:
                                                                            scIndex,
                                                                        }
                                                                      )
                                                                    }
                                                                    className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-xs"
                                                                    title="Modifier la sous-compétence"
                                                                  >
                                                                    <FiEdit2 />
                                                                  </button>
                                                                  <button
                                                                    onClick={() =>
                                                                      handleDeleteSousCompetence(
                                                                        course.id,
                                                                        quiz.IDModule,
                                                                        competence.Competence_ID,
                                                                        scIndex
                                                                      )
                                                                    }
                                                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs"
                                                                    title="Supprimer la sous-compétence"
                                                                  >
                                                                    <FiTrash2 />
                                                                  </button>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                  <div>
                                                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                      FR
                                                                    </label>
                                                                    <input
                                                                      type="text"
                                                                      value={
                                                                        sousComp.SousCompetence_Nom_FR
                                                                      }
                                                                      onChange={(
                                                                        e
                                                                      ) => {
                                                                        const updated =
                                                                          [
                                                                            ...competence.sousCompetences,
                                                                          ];
                                                                        updated[
                                                                          scIndex
                                                                        ].SousCompetence_Nom_FR =
                                                                          e.target.value;
                                                                        handleCompetenceChange(
                                                                          quiz,
                                                                          compIndex,
                                                                          "sousCompetences",
                                                                          updated
                                                                        );
                                                                      }}
                                                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                                    />
                                                                  </div>
                                                                  <div>
                                                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                      EN
                                                                    </label>
                                                                    <input
                                                                      type="text"
                                                                      value={
                                                                        sousComp.SousCompetence_Nom_EN
                                                                      }
                                                                      onChange={(
                                                                        e
                                                                      ) => {
                                                                        const updated =
                                                                          [
                                                                            ...competence.sousCompetences,
                                                                          ];
                                                                        updated[
                                                                          scIndex
                                                                        ].SousCompetence_Nom_EN =
                                                                          e.target.value;
                                                                        handleCompetenceChange(
                                                                          quiz,
                                                                          compIndex,
                                                                          "sousCompetences",
                                                                          updated
                                                                        );
                                                                      }}
                                                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                                    />
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            )
                                                          )}
                                                        </div>
                                                      ) : (
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                          Aucune sous-compétence
                                                          définie
                                                        </p>
                                                      )}
                                                    </div>

                                                    {/* Pas d'actions ici, elles sont maintenant au niveau du quiz */}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
                                          Aucune compétence définie pour ce quiz
                                        </div>
                                      )}

                                      {/* Bloc Actions au niveau du quiz */}
                                      <div className="mt-6">
                                        <div className="flex justify-between items-center mb-3">
                                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                            Actions ({quiz.actions?.length || 0}
                                            )
                                          </h5>
                                          <button
                                            onClick={() =>
                                              handleAddQuizAction(
                                                course.id,
                                                quiz.IDModule
                                              )
                                            }
                                            className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs rounded-lg shadow transition-colors duration-300"
                                          >
                                            <FiPlus className="mr-1" /> Ajouter
                                            Action
                                          </button>
                                        </div>

                                        {quiz.actions?.length > 0 ? (
                                          <div className="space-y-3">
                                            {quiz.actions.map(
                                              (action, actionIndex) => (
                                                <div
                                                  key={`quiz-action-${actionIndex}`}
                                                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-900"
                                                >
                                                  <div className="flex justify-between items-center mb-2">
                                                    <div className="flex-grow">
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            Nom FR
                                                          </label>
                                                          <input
                                                            type="text"
                                                            value={
                                                              action.Action_Nom_FR
                                                            }
                                                            onChange={(e) => {
                                                              handleQuizActionChange(
                                                                quiz,
                                                                actionIndex,
                                                                "Action_Nom_FR",
                                                                e.target.value
                                                              );
                                                            }}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                          />
                                                        </div>
                                                        <div>
                                                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            Nom EN
                                                          </label>
                                                          <input
                                                            type="text"
                                                            value={
                                                              action.Action_Nom_EN
                                                            }
                                                            onChange={(e) => {
                                                              handleQuizActionChange(
                                                                quiz,
                                                                actionIndex,
                                                                "Action_Nom_EN",
                                                                e.target.value
                                                              );
                                                            }}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                          />
                                                        </div>
                                                      </div>
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3"></div>
                                                    </div>
                                                    <div className="flex flex-col space-y-2 ml-4">
                                                      <button
                                                        onClick={() => {
                                                          // Préparer les données pour la mise à jour
                                                          const actionData = {
                                                            Action_Nom_FR:
                                                              action.Action_Nom_FR,
                                                            Action_Nom_EN:
                                                              action.Action_Nom_EN,
                                                            Action_Categorie_FR:
                                                              action.Action_Categorie_FR,
                                                            Action_Categorie_EN:
                                                              action.Action_Categorie_EN,
                                                          };
                                                          // Appeler la fonction de mise à jour
                                                          handleUpdateQuizAction(
                                                            quiz,
                                                            actionIndex,
                                                            actionData
                                                          );
                                                        }}
                                                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                                                        title="Enregistrer les modifications"
                                                      >
                                                        <FiSave />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDeleteQuizAction(
                                                            course.id,
                                                            quiz.IDModule,
                                                            actionIndex
                                                          )
                                                        }
                                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                        title="Supprimer l'action"
                                                      >
                                                        <FiTrash2 />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        ) : (
                                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
                                            Aucune action définie pour ce quiz
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Modals */}
        {editingCourse && (
          <EditModal
            title="Modifier le Cours"
            initialData={{
              id: editingCourse.id,
              title: editingCourse.titre,
              description: editingCourse.description,
            }}
            onSave={handleUpdateCourse}
            onCancel={() => setEditingCourse(null)}
            fields={[
              { name: "title", label: "Titre", type: "text" },
              { name: "description", label: "Description", type: "textarea" },
            ]}
          />
        )}

        {editingQuiz && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                Modifier le Quiz
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID du Quiz (non modifiable)
                  </label>
                  <input
                    type="text"
                    value={editingQuiz.IDModule}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom (FR)
                  </label>
                  <input
                    type="text"
                    value={editingQuiz.Nom_FR}
                    onChange={(e) =>
                      setEditingQuiz({
                        ...editingQuiz,
                        Nom_FR: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom (EN)
                  </label>
                  <input
                    type="text"
                    value={editingQuiz.Nom_EN}
                    onChange={(e) =>
                      setEditingQuiz({
                        ...editingQuiz,
                        Nom_EN: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setEditingQuiz(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateQuiz(editingQuiz)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition de compétence */}
        {editingCompetence && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                Modifier la compétence
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Nom en français *
                  </label>
                  <input
                    type="text"
                    value={editingCompetence.Competence_Nom_FR}
                    onChange={(e) =>
                      setEditingCompetence({
                        ...editingCompetence,
                        Competence_Nom_FR: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nom de la compétence en français"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Nom en anglais *
                  </label>
                  <input
                    type="text"
                    value={editingCompetence.Competence_Nom_EN}
                    onChange={(e) =>
                      setEditingCompetence({
                        ...editingCompetence,
                        Competence_Nom_EN: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nom de la compétence en anglais"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Catégorie en français
                  </label>
                  <input
                    type="text"
                    value={editingCompetence.Comp_Categorie_FR}
                    onChange={(e) =>
                      setEditingCompetence({
                        ...editingCompetence,
                        Comp_Categorie_FR: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Catégorie en français (optionnel)"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Catégorie en anglais
                  </label>
                  <input
                    type="text"
                    value={editingCompetence.Comp_Categorie_EN}
                    onChange={(e) =>
                      setEditingCompetence({
                        ...editingCompetence,
                        Comp_Categorie_EN: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Catégorie en anglais (optionnel)"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setEditingCompetence(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    handleUpdateCompetenceSubmit(editingCompetence)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition ou création de sous-compétence */}
        {editingSousCompetence && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                {editingSousCompetence.isNew
                  ? "Ajouter une sous-compétence"
                  : "Modifier la sous-compétence"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom (FR)
                  </label>
                  <input
                    type="text"
                    value={editingSousCompetence.SousCompetence_Nom_FR}
                    onChange={(e) =>
                      setEditingSousCompetence({
                        ...editingSousCompetence,
                        SousCompetence_Nom_FR: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Entrez le nom en français"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom (EN)
                  </label>
                  <input
                    type="text"
                    value={editingSousCompetence.SousCompetence_Nom_EN}
                    onChange={(e) =>
                      setEditingSousCompetence({
                        ...editingSousCompetence,
                        SousCompetence_Nom_EN: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Entrez le nom en anglais"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setEditingSousCompetence(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    // Vérifier si les champs obligatoires sont remplis
                    if (
                      !editingSousCompetence.SousCompetence_Nom_FR &&
                      !editingSousCompetence.SousCompetence_Nom_EN
                    ) {
                      setDialog({
                        show: true,
                        title: "Attention",
                        message:
                          "Veuillez remplir au moins un des champs (FR ou EN)",
                        type: "error",
                        onConfirm: () =>
                          setDialog((prev) => ({ ...prev, show: false })),
                        confirmText: "OK",
                      });
                      return;
                    }

                    // Utiliser le flag isNew pour déterminer l'action
                    if (editingSousCompetence.isNew) {
                      handleCreateSousCompetenceSubmit(editingSousCompetence);
                    } else {
                      handleUpdateSousCompetenceSubmit(editingSousCompetence);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition d'action */}
        {editingAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                Modifier l'action
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom (FR)
                  </label>
                  <input
                    type="text"
                    value={editingAction.Action_Nom_FR}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        Action_Nom_FR: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom (EN)
                  </label>
                  <input
                    type="text"
                    value={editingAction.Action_Nom_EN}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        Action_Nom_EN: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie (FR)
                  </label>
                  <input
                    type="text"
                    value={editingAction.Action_Categorie_FR}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        Action_Categorie_FR: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie (EN)
                  </label>
                  <input
                    type="text"
                    value={editingAction.Action_Categorie_EN}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        Action_Categorie_EN: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setEditingAction(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateActionSubmit(editingAction)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Boîte de dialogue pour les notifications et confirmations */}
        {dialog.show && (
          <DialogModal
            title={dialog.title}
            message={dialog.message}
            type={dialog.type}
            onClose={() => setDialog((prev) => ({ ...prev, show: false }))}
            onConfirm={dialog.onConfirm}
            confirmText={dialog.confirmText}
            cancelText={dialog.cancelText}
          />
        )}
      </div>
    </div>
  );
}

// AddCourseForm component
function AddCourseForm({ onSave, onCancel }) {
  const [course, setCourse] = useState({
    title: "",
    description: "",
  });

  const [isFocused, setIsFocused] = useState({
    title: false,
    description: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
  };

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(course);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
      <div className="p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Créer un Nouveau Cours
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div
              className={`relative p-5 rounded-xl transition-all duration-300 ${isFocused.title ? "bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600" : "bg-gray-50 dark:bg-gray-700/50 border border-transparent"}`}
            >
              <div className="flex items-center mb-3">
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  Titre du Cours *
                </label>
              </div>
              <input
                type="text"
                id="title"
                name="title"
                value={course.title}
                onChange={handleInputChange}
                onFocus={() => handleFocus("title")}
                onBlur={() => handleBlur("title")}
                className="w-full px-4 py-3 bg-transparent border-none text-lg font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0"
                placeholder="Entrez le titre du cours..."
                required
              />
            </div>

            <div
              className={`relative p-5 rounded-xl transition-all duration-300 ${isFocused.description ? "bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600" : "bg-gray-50 dark:bg-gray-700/50 border border-transparent"}`}
            >
              <div className="flex items-center mb-3">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  Description du Cours
                </label>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={course.description}
                onChange={handleInputChange}
                onFocus={() => handleFocus("description")}
                onBlur={() => handleBlur("description")}
                className="w-full px-4 py-3 bg-transparent border-none text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-0 resize-none"
                placeholder="Décrivez..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <FiX className="mr-2" /> Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <FiSave className="mr-2" /> Créer le Cours
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// EditModal component
function EditModal({ title, initialData, fields, onSave, onCancel }) {
  const [data, setData] = useState(initialData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            {title}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      value={data[field.name] || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={data[field.name] || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CourseManagementPage;
