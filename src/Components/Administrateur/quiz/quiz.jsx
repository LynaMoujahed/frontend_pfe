import { useState, useEffect } from "react";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiEdit,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { useAuth } from "../../../contexts/auth-context";
import DialogModal from "../../Common/DialogModal";

function QuizCreationPage() {
  // Récupérer le token d'authentification
  const { token } = useAuth();

  // Fonction pour générer des IDs uniques
  const generateUniqueId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const [quiz, setQuiz] = useState({
    course: null,
    id: "",
    type: "Evaluation",
    category: "Sterile",
    mainSurface: false,
    main: 0,
    surface: 0,
    quizNameFr: "",
    quizNameEn: "",
    sriId: "",
    categoryFr: "",
    categoryEn: "",
    sriNameFr: "",
    sriNameEn: "",
  });

  const [skills, setSkills] = useState([
    {
      id: generateUniqueId(),
      title: "Compétence 1",
      skillId: "0",
      skillCategoryFr: "",
      skillCategoryEn: "",
      skillNameFr: "",
      skillNameEn: "",
      subSkills: [{ id: generateUniqueId(), nameFr: "", nameEn: "" }],
    },
  ]);

  const [actions, setActions] = useState([
    { id: generateUniqueId(), nameFr: "", nameEn: "" },
  ]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    quizInfo: true,
    skills: true,
    actions: true,
  });

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("https://127.0.0.1:8000/api/cours", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Erreur serveur: ${errorData?.message || "Erreur inconnue"}`
          );
        }

        const data = await response.json();
        const coursesArray = Array.isArray(data)
          ? data
          : data["hydra:member"] || [];
        setCourses(
          coursesArray.map((course) => ({
            id: course.id,
            titre: course.titre || "Untitled Course",
          }))
        );
      } catch (error) {
        console.error("Erreur de récupération des cours:", {
          message: error.message,
          timestamp: new Date().toISOString(),
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
              }
            : null,
        });
        setDialog({
          show: true,
          title: "Erreur",
          message:
            "Erreur lors de la récupération des cours. Veuillez réessayer plus tard.",
          type: "error",
          onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
          confirmText: "OK",
        });
      }
    };

    fetchCourses();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuiz((prev) => ({
      ...prev,
      [name]:
        name === "course"
          ? parseInt(value) || null
          : name === "main" || name === "surface"
            ? parseInt(value) || 0
            : value,
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const prepareQuizRecords = () => {
    if (!quiz.id) {
      throw new Error("IDModule is required");
    }

    // Ensure quiz.id is a string
    const idModule = String(quiz.id);
    console.log("Using IDModule:", idModule);

    return skills
      .flatMap((skill) => {
        const baseRecord = {
          cours: quiz.course,
          IDModule: idModule,
          idmodule: idModule, // Add both versions to ensure compatibility
          Type: quiz.type || "Evaluation",
          Category: quiz.category || "Sterile",
          MainSurface: quiz.mainSurface || false,
          Surface: quiz.mainSurface ? quiz.surface : 0,
          Main: quiz.mainSurface ? quiz.main : 0,
          Nom_FR: quiz.quizNameFr,
          Nom_EN: quiz.quizNameEn,
          Competence_ID: parseInt(skill.skillId) || 0,
          Comp_Categorie_FR: skill.skillCategoryFr || "",
          Comp_Categorie_EN: skill.skillCategoryEn || "",
          Competence_Nom_FR: skill.skillNameFr || "",
          Competence_Nom_EN: skill.skillNameEn || "",
          SousCompetence_Nom_FR: "",
          SousCompetence_Nom_EN: "",
          PointFort_FR: "",
          PointFort_EN: "",
          Action_Nom_FR: "",
          Action_Nom_EN: "",
          Action_Categorie_FR: "",
          Action_Categorie_EN: "",
        };

        if (skill.subSkills.length > 0) {
          return skill.subSkills.map((subSkill) => ({
            ...baseRecord,
            SousCompetence_Nom_FR: subSkill.nameFr || "",
            SousCompetence_Nom_EN: subSkill.nameEn || "",
          }));
        }
        return [baseRecord];
      })
      .concat(
        actions.map((action) => ({
          cours: quiz.course,
          IDModule: idModule, // Use the same idModule variable
          idmodule: idModule, // Add both versions to ensure compatibility
          Action_Nom_FR: action.nameFr || "",
          Action_Nom_EN: action.nameEn || "",
          // Ajoutez les autres champs requis avec des valeurs par défaut
          Type: quiz.type || "Evaluation",
          Category: quiz.category || "Sterile",
          MainSurface: quiz.mainSurface || false,
          Surface: quiz.mainSurface ? quiz.surface : 0,
          Main: quiz.mainSurface ? quiz.main : 0,
          Nom_FR: quiz.quizNameFr,
          Nom_EN: quiz.quizNameEn,
          Competence_ID: 0,
          Comp_Categorie_FR: "",
          Comp_Categorie_EN: "",
          Competence_Nom_FR: "",
          Competence_Nom_EN: "",
          SousCompetence_Nom_FR: "",
          SousCompetence_Nom_EN: "",
          PointFort_FR: "",
          PointFort_EN: "",
          Action_Categorie_FR: "",
          Action_Categorie_EN: "",
        }))
      );
  };

  const validateQuizData = () => {
    // Validation des champs de base
    if (!quiz.course) return "Le cours est requis";
    if (!quiz.id) return "L'identifiant du quiz est requis";
    if (!quiz.type) return "Le type est requis";
    if (!quiz.category) return "La catégorie est requise";
    if (!quiz.quizNameFr) return "Le nom du quiz (FR) est requis";
    if (!quiz.quizNameEn) return "Le nom du quiz (EN) est requis";

    // Validation des compétences
    for (const skill of skills) {
      if (!skill.skillId)
        return `L'identifiant de compétence est requis pour ${skill.title}`;
      if (!skill.skillNameFr)
        return `Le nom FR de la compétence est requis pour ${skill.title}`;
      if (!skill.skillNameEn)
        return `Le nom EN de la compétence est requis pour ${skill.title}`;

      for (const subSkill of skill.subSkills) {
        if (!subSkill.nameFr && !subSkill.nameEn) {
          return `Au moins un nom (FR ou EN) est requis pour chaque sous-compétence`;
        }
      }
    }

    // Validation des actions
    for (const action of actions) {
      if (!action.nameFr && !action.nameEn) {
        return `Au moins un nom (FR ou EN) est requis pour chaque action`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateQuizData();
    if (validationError) {
      setDialog({
        show: true,
        title: "Validation",
        message: validationError,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
      return;
    }

    // Ensure quiz.id is a string
    if (quiz.id && typeof quiz.id !== "string") {
      setQuiz((prev) => ({
        ...prev,
        id: String(prev.id),
      }));
    }

    const quizRecords = prepareQuizRecords();
    console.log("Données à envoyer:", quizRecords);

    // Check if IDModule is present in all records
    const missingIDModule = quizRecords.some(
      (record) => !record.IDModule && !record.idmodule
    );
    if (missingIDModule) {
      console.error("Erreur: Certains enregistrements n'ont pas d'IDModule");

      // Try to fix the records by adding IDModule where missing
      let fixedRecords = quizRecords.map((record) => {
        if (!record.IDModule && !record.idmodule) {
          console.log("Fixing record without IDModule:", record);
          return {
            ...record,
            IDModule: idModule,
            idmodule: idModule,
          };
        }
        return record;
      });

      // Update quizRecords with the fixed records
      quizRecords = fixedRecords;
      console.log("Records fixed. Continuing with submission.");
    }

    try {
      setIsLoading(true);

      const response = await fetch("https://127.0.0.1:8000/api/quiz/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizRecords),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Détails de l'erreur:", errorData);
        throw new Error(errorData.message || "Erreur serveur");
      }

      const data = await response.json();

      if (data.status === "complete" || data.status === "partial") {
        // Réinitialiser le formulaire immédiatement après l'enregistrement réussi
        resetForm();

        // Afficher la boîte de dialogue de confirmation
        setDialog({
          show: true,
          title: "Succès",
          message: "Quiz enregistré",
          type: "success",
          onConfirm: () => {
            setDialog((prev) => ({ ...prev, show: false }));
          },
          confirmText: "OK",
        });

        if (data.error_count > 0) {
          console.error(
            "Erreurs partielles:",
            data.results.filter((r) => !r.success)
          );
        }
      } else {
        throw new Error(data.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur complète:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      setDialog({
        show: true,
        title: "Erreur",
        message: `Erreur: ${error.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    console.log("Réinitialisation du formulaire...");

    // Réinitialiser l'état du quiz
    setQuiz({
      course: null,
      id: "",
      type: "Evaluation",
      category: "Sterile",
      mainSurface: false,
      main: 0,
      surface: 0,
      quizNameFr: "",
      quizNameEn: "",
      sriId: "",
      categoryFr: "",
      categoryEn: "",
      sriNameFr: "",
      sriNameEn: "",
    });

    // Réinitialiser les compétences
    setSkills([
      {
        id: generateUniqueId(),
        title: "Compétence 1",
        skillId: "0",
        skillCategoryFr: "",
        skillCategoryEn: "",
        skillNameFr: "",
        skillNameEn: "",
        subSkills: [{ id: generateUniqueId(), nameFr: "", nameEn: "" }],
      },
    ]);

    // Réinitialiser les actions
    setActions([{ id: generateUniqueId(), nameFr: "", nameEn: "" }]);

    console.log("Formulaire réinitialisé avec succès");
  };

  const addSkill = () => {
    const newSkillNumber = skills.length + 1;
    const newSkill = {
      id: generateUniqueId(),
      title: `Compétence ${newSkillNumber}`,
      skillId: "0",
      skillCategoryFr: "",
      skillCategoryEn: "",
      skillNameFr: "",
      skillNameEn: "",
      subSkills: [{ id: generateUniqueId(), nameFr: "", nameEn: "" }],
    };
    setSkills([...skills, newSkill]);
  };

  const removeSkill = (id) => {
    if (skills.length > 1) {
      const updatedSkills = skills
        .filter((skill) => skill.id !== id)
        .map((skill, index) => ({
          ...skill,
          title: `Compétence ${index + 1}`,
        }));
      setSkills(updatedSkills);
    }
  };

  const handleSkillChange = (id, field, value) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === id ? { ...skill, [field]: value } : skill
    );
    setSkills(updatedSkills);
  };

  const addSubSkill = (skillId) => {
    const newSubSkill = { id: generateUniqueId(), nameFr: "", nameEn: "" };
    setSkills(
      skills.map((skill) =>
        skill.id === skillId
          ? { ...skill, subSkills: [...skill.subSkills, newSubSkill] }
          : skill
      )
    );
  };

  const removeSubSkill = (skillId, subSkillId) => {
    setSkills(
      skills.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              subSkills: skill.subSkills.filter((sub) => sub.id !== subSkillId),
            }
          : skill
      )
    );
  };

  const addAction = () => {
    const newAction = { id: generateUniqueId(), nameFr: "", nameEn: "" };
    setActions([...actions, newAction]);
  };

  const removeAction = (actionId) => {
    if (actions.length > 1) {
      setActions(actions.filter((action) => action.id !== actionId));
    }
  };

  const handleActionChange = (id, field, value) => {
    const updatedActions = actions.map((action) =>
      action.id === id ? { ...action, [field]: value } : action
    );
    setActions(updatedActions);
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) return;

      const firstRow = jsonData[0];

      // Check if IDModule exists in the first row (check both cases)
      let idModuleValue = null;
      if (firstRow.IDModule) {
        idModuleValue = firstRow.IDModule;
        console.log("Excel import - Found IDModule:", idModuleValue);
      } else if (firstRow.idmodule) {
        idModuleValue = firstRow.idmodule;
        console.log(
          "Excel import - Found idmodule (lowercase):",
          idModuleValue
        );
      } else if (firstRow.Idmodule) {
        idModuleValue = firstRow.Idmodule;
        console.log(
          "Excel import - Found Idmodule (mixed case):",
          idModuleValue
        );
      } else {
        // Try to find any key that might be IDModule (case-insensitive)
        for (const key in firstRow) {
          if (key.toLowerCase() === "idmodule") {
            idModuleValue = firstRow[key];
            console.log(
              `Excel import - Found IDModule with key ${key}:`,
              idModuleValue
            );
            break;
          }
        }

        // If still not found, generate a default value
        if (!idModuleValue) {
          idModuleValue = "excel_import_" + Date.now();
          console.log(
            "Excel import - Generated default IDModule:",
            idModuleValue
          );

          setDialog({
            show: true,
            title: "Avertissement d'importation",
            message:
              "Le fichier Excel ne contient pas de colonne IDModule. Un identifiant par défaut a été généré.",
            type: "warning",
            onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
            confirmText: "OK",
          });
        }
      }

      // Ensure IDModule is a string
      const idModule = String(idModuleValue);
      console.log("Excel import - Using IDModule:", idModule);

      setQuiz({
        ...quiz,
        id: idModule,
        type: firstRow.Type || quiz.type,
        category: firstRow.Category || quiz.category,
        mainSurface: firstRow.Main === 1,
        quizNameFr: firstRow.Nom_FR || quiz.quizNameFr,
        quizNameEn: firstRow.Nom_EN || quiz.quizNameEn,
      });

      const skillsMap = new Map();
      const actionsMap = new Map();

      jsonData.forEach((row) => {
        const skillId = row.Competence_ID;
        if (!skillId) return;

        if (!skillsMap.has(skillId)) {
          skillsMap.set(skillId, {
            id: generateUniqueId(),
            title: `Compétence ${skillsMap.size + 1}`,
            skillId: skillId.toString(),
            skillCategoryFr: row.Comp_Categorie_FR || "",
            skillCategoryEn: row.Comp_Categorie_EN || "",
            skillNameFr: row.Competence_Nom_FR || "",
            skillNameEn: row.Competence_Nom_EN || "",
            subSkills: [],
          });
        }

        const skill = skillsMap.get(skillId);

        const subSkillFr = row.SousCompetence_Nom_FR || "";
        const subSkillEn = row.SousCompetence_Nom_EN || "";
        if (subSkillFr || subSkillEn) {
          const subSkillKey = `${subSkillFr}-${subSkillEn}`;
          const subSkillExists = skill.subSkills.some(
            (sub) => `${sub.nameFr}-${sub.nameEn}` === subSkillKey
          );

          if (!subSkillExists) {
            skill.subSkills.push({
              id: generateUniqueId(),
              nameFr: subSkillFr,
              nameEn: subSkillEn,
            });
          }
        }

        const actionFr = row.Action_Nom_FR || "";
        const actionEn = row.Action_Nom_EN || "";
        if (actionFr || actionEn) {
          const actionKey = `${actionFr}-${actionEn}`;
          if (!actionsMap.has(actionKey)) {
            actionsMap.set(actionKey, {
              id: generateUniqueId(),
              nameFr: actionFr,
              nameEn: actionEn,
            });
          }
        }
      });

      setSkills(Array.from(skillsMap.values()));
      setActions(Array.from(actionsMap.values()));
    } catch (error) {
      console.error("Error importing Excel file:", error);
      setDialog({
        show: true,
        title: "Erreur d'importation",
        message: `Une erreur est survenue lors de l'importation: ${error.message}`,
        type: "error",
        onConfirm: () => setDialog((prev) => ({ ...prev, show: false })),
        confirmText: "OK",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Ajouter un nouveau module de quiz
            </h1>
          </div>
          <div className="flex space-x-3">
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 dark:from-blue-700 dark:to-blue-600 dark:hover:from-blue-800 dark:hover:to-blue-700">
              <FiSave className="mr-2" />
              Importer depuis Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 dark:from-green-700 dark:to-green-600 dark:hover:from-green-800 dark:hover:to-green-700 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quiz Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div
              className="flex justify-between items-center p-5 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
              onClick={() => toggleSection("quizInfo")}
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                Informations sur le quiz
              </h2>
              {expandedSections.quizInfo ? (
                <FiChevronUp className="text-gray-500 dark:text-gray-300" />
              ) : (
                <FiChevronDown className="text-gray-500 dark:text-gray-300" />
              )}
            </div>
            {expandedSections.quizInfo && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cours *
                    </label>
                    <select
                      name="course"
                      value={quiz.course || ""}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Sélectionnez un cours</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.titre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Identifiant du quiz *
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={quiz.id}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      placeholder="Entrez l'identifiant du quiz"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={quiz.type}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Evaluation">Evaluation</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Catégorie *
                    </label>
                    <select
                      name="category"
                      value={quiz.category}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Sterile">Stérile</option>
                      <option value="Non-Sterile">Non stérile</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
                        MainSurface
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="mainSurface"
                          checked={quiz.mainSurface}
                          onChange={(e) =>
                            setQuiz({ ...quiz, mainSurface: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-focus:ring-blue-800 dark:bg-gray-700 dark:border-gray-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {quiz.mainSurface && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Main
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          name="main"
                          value={quiz.main}
                          onChange={handleInputChange}
                          min="0"
                          className="block w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="flex flex-col border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setQuiz((prev) => ({
                                ...prev,
                                main: prev.main + 1,
                              }))
                            }
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setQuiz((prev) => ({
                                ...prev,
                                main: Math.max(0, prev.main - 1),
                              }))
                            }
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
                          name="surface"
                          value={quiz.surface}
                          onChange={handleInputChange}
                          min="0"
                          className="block w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="flex flex-col border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setQuiz((prev) => ({
                                ...prev,
                                surface: prev.surface + 1,
                              }))
                            }
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setQuiz((prev) => ({
                                ...prev,
                                surface: Math.max(0, prev.surface - 1),
                              }))
                            }
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom du quiz (FR) *
                    </label>
                    <input
                      type="text"
                      name="quizNameFr"
                      value={quiz.quizNameFr}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      placeholder="Entrez le nom du quiz (FR)"
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom du quiz (EN) *
                    </label>
                    <input
                      type="text"
                      name="quizNameEn"
                      value={quiz.quizNameEn}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      placeholder="Entrez le nom du quiz (EN)"
                      required
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div
              className="flex justify-between items-center p-5 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
              onClick={() => toggleSection("skills")}
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                Compétences
              </h2>
              {expandedSections.skills ? (
                <FiChevronUp className="text-gray-500 dark:text-gray-300" />
              ) : (
                <FiChevronDown className="text-gray-500 dark:text-gray-300" />
              )}
            </div>

            {expandedSections.skills && (
              <div className="p-6">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={addSkill}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 dark:bg-green-700 dark:hover:bg-green-800"
                  >
                    <FiPlus className="text-lg" />
                  </button>
                </div>

                {skills.map((skill, skillIndex) => (
                  <div
                    key={`skill-${skill.id}`}
                    className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {skill.title}
                      </h4>
                      {skillIndex > 0 && (
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    <div className="p-4 dark:bg-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Identifiant de la compétence *
                          </label>
                          <input
                            type="text"
                            value={skill.skillId}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "skillId",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Entrez l'identifiant de la compétence"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Catégorie (FR)
                          </label>
                          <input
                            type="text"
                            value={skill.skillCategoryFr}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "skillCategoryFr",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Entrez la catégorie (FR)"
                            maxLength={50}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Catégorie (EN)
                          </label>
                          <input
                            type="text"
                            value={skill.skillCategoryEn}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "skillCategoryEn",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Entrez la catégorie (EN)"
                            maxLength={50}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nom de la compétence (FR) *
                          </label>
                          <input
                            type="text"
                            value={skill.skillNameFr}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "skillNameFr",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Entrez le nom de la compétence (FR)"
                            required
                            maxLength={50}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nom de la compétence (EN) *
                          </label>
                          <input
                            type="text"
                            value={skill.skillNameEn}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "skillNameEn",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Entrez le nom de la compétence (EN)"
                            required
                            maxLength={50}
                          />
                        </div>
                      </div>

                      {/* Sous-compétences Section */}
                      <div className="mt-8 border-t pt-6 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                            Sous-compétences
                          </h3>
                          <button
                            onClick={() => addSubSkill(skill.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
                          >
                            <FiPlus className="text-lg" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {skill.subSkills.map((subSkill, subSkillIndex) => (
                            <div
                              key={`subskill-${subSkill.id}`}
                              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nom de la sous-compétence (FR)
                                  </label>
                                  <input
                                    type="text"
                                    value={subSkill.nameFr}
                                    onChange={(e) => {
                                      const updatedSkills = skills.map((s) =>
                                        s.id === skill.id
                                          ? {
                                              ...s,
                                              subSkills: s.subSkills.map(
                                                (sub) =>
                                                  sub.id === subSkill.id
                                                    ? {
                                                        ...sub,
                                                        nameFr: e.target.value,
                                                      }
                                                    : sub
                                              ),
                                            }
                                          : s
                                      );
                                      setSkills(updatedSkills);
                                    }}
                                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                                    placeholder="Entrez le nom de la sous-compétence (FR)"
                                    maxLength={50}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nom de la sous-compétence (EN)
                                  </label>
                                  <input
                                    type="text"
                                    value={subSkill.nameEn}
                                    onChange={(e) => {
                                      const updatedSkills = skills.map((s) =>
                                        s.id === skill.id
                                          ? {
                                              ...s,
                                              subSkills: s.subSkills.map(
                                                (sub) =>
                                                  sub.id === subSkill.id
                                                    ? {
                                                        ...sub,
                                                        nameEn: e.target.value,
                                                      }
                                                    : sub
                                              ),
                                            }
                                          : s
                                      );
                                      setSkills(updatedSkills);
                                    }}
                                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                                    placeholder="Entrez le nom de la sous-compétence (EN)"
                                    maxLength={255}
                                  />
                                </div>
                              </div>
                              {subSkillIndex > 0 && (
                                <div className="flex justify-end mt-3">
                                  <button
                                    onClick={() =>
                                      removeSubSkill(skill.id, subSkill.id)
                                    }
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 dark:bg-red-600 dark:hover:bg-red-700"
                                  >
                                    <FiTrash2 className="mr-0" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div
              className="flex justify-between items-center p-5 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
              onClick={() => toggleSection("actions")}
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
                Actions
              </h2>
              {expandedSections.actions ? (
                <FiChevronUp className="text-gray-500 dark:text-gray-300" />
              ) : (
                <FiChevronDown className="text-gray-500 dark:text-gray-300" />
              )}
            </div>

            {expandedSections.actions && (
              <div className="p-6">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={addAction}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 dark:bg-purple-700 dark:hover:bg-purple-800"
                  >
                    <FiPlus className="text-lg" />
                  </button>
                </div>

                <div className="space-y-4">
                  {actions.map((action, actionIndex) => (
                    <div
                      key={`action-${action.id}`}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Action (FR)
                          </label>
                          <input
                            type="text"
                            value={action.nameFr}
                            onChange={(e) =>
                              handleActionChange(
                                action.id,
                                "nameFr",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Action (FR)"
                            maxLength={50}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Action (EN)
                          </label>
                          <input
                            type="text"
                            value={action.nameEn}
                            onChange={(e) =>
                              handleActionChange(
                                action.id,
                                "nameEn",
                                e.target.value
                              )
                            }
                            className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="Action (EN)"
                            maxLength={50}
                          />
                        </div>
                      </div>
                      {actionIndex > 0 && (
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={() => removeAction(action.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 dark:bg-red-600 dark:hover:bg-red-700"
                          >
                            <FiTrash2 className="mr-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-xl text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <FiX className="mr-2" />
            Annuler les modifications
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 dark:from-blue-700 dark:to-blue-600 dark:hover:from-blue-800 dark:hover:to-blue-700 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enregistrement...
              </span>
            ) : (
              <>
                <FiSave className="mr-2" />
                Enregistrer le module de quiz
              </>
            )}
          </button>
        </div>

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

export default QuizCreationPage;
