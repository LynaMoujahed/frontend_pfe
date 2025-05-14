import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { ArrowLeft, BookOpen, Loader, FileText, Sparkles } from "lucide-react";
import { QuizService } from "../../services/QuizService";
import "./formateur-styles.css";
import { API_URL } from "../../config";

const CourseQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id, courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseAndQuizzes = async () => {
      try {
        setLoading(true);

        // Vérifier que le token est disponible
        if (!token) {
          console.error("No authentication token available");
          setError("Authentification requise. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }

        console.log(
          "Starting to fetch course and quizzes with token:",
          token ? "Token exists" : "No token"
        );

        // Récupérer les informations du cours
        const courseResponse = await fetch(`${API_URL}/cours/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!courseResponse.ok) {
          throw new Error(
            "Erreur lors de la récupération des informations du cours"
          );
        }

        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Récupérer les quiz associés au cours
        console.log("Fetching quizzes for course ID:", courseId);
        try {
          const quizzesData = await QuizService.getQuizzesByCourse(
            token,
            courseId
          );

          console.log("Quizzes data received:", quizzesData);

          // Vérifier si les données sont un tableau ou un objet avec une propriété hydra:member
          if (Array.isArray(quizzesData)) {
            console.log(
              "Quizzes data is an array with",
              quizzesData.length,
              "items"
            );
            setQuizzes(quizzesData);
          } else if (quizzesData && quizzesData["hydra:member"]) {
            console.log(
              "Quizzes data has hydra:member with",
              quizzesData["hydra:member"].length,
              "items"
            );
            setQuizzes(quizzesData["hydra:member"]);
          } else if (quizzesData && typeof quizzesData === "object") {
            // Si c'est un objet mais pas au format attendu, essayer d'extraire les données
            console.log(
              "Quizzes data is an object, trying to extract quiz data"
            );
            const extractedQuizzes = Object.values(quizzesData).filter(
              (item) => item && typeof item === "object" && item.IDModule
            );

            if (extractedQuizzes.length > 0) {
              console.log(
                "Extracted",
                extractedQuizzes.length,
                "quizzes from object"
              );
              setQuizzes(extractedQuizzes);
            } else {
              console.warn(
                "Could not extract quizzes from object:",
                quizzesData
              );
              setQuizzes([]);
            }
          } else {
            console.warn("Unexpected quizzes data format:", quizzesData);
            setQuizzes([]);
          }
        } catch (quizError) {
          console.error("Error fetching quizzes:", quizError);
          setError(
            "Impossible de charger les quiz pour ce cours: " + quizError.message
          );
        }

        setError(null);
      } catch (error) {
        console.error("Erreur:", error);
        setError("Impossible de charger les quiz pour ce cours");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndQuizzes();
  }, [courseId, token]);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8 animate-slideInLeft">
        <button
          onClick={() => navigate(`/formateur/apprenants/${id}/cours`)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-3 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white formateur-title flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-blue-500" />
            {course ? `Quiz du cours: ${course.titre}` : "Liste des quiz"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consultez tous les quiz disponibles pour ce cours
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">
            Chargement des quiz...
          </span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
          <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
            Aucun quiz disponible
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Ce cours ne contient pas encore de quiz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-slideInUp">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6 transition-all duration-300 formateur-card">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white formateur-title">
                Liste des quiz
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({quizzes.length} quiz)
                </span>
              </h3>
            </div>

            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() =>
                    navigate(
                      `/formateur/apprenants/${id}/cours/${courseId}/quizzes/${quiz.IDModule}`
                    )
                  }
                  className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-300 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {quiz.Nom_FR}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {quiz.IDModule}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Catégorie: {quiz.Category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Type: {quiz.Type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseQuizzes;
