import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth-context";
import { QuizService } from "../../../services/QuizService";
import {
  Loader,
  AlertCircle,
  Award,
  CheckCircle,
  BookOpen,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Progression = () => {
  const { user, token } = useAuth();
  const [progressionData, setProgressionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProgressionData = async () => {
      if (!user || !token) {
        setLoading(false);
        setError("Vous devez être connecté pour accéder à votre progression");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Récupérer les données de progression globale
        const data = await QuizService.getProgressionByApprenant(
          token,
          user.id
        );
        setProgressionData(data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de la progression:",
          error
        );
        setError(
          "Impossible de récupérer les données de progression. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgressionData();
  }, [user, token]);

  const handleCourseClick = (courseId) => {
    navigate(`/apprenant/cours/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-300">
          Chargement de votre progression...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Erreur
        </h3>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Ma Progression
      </h1>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-4">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            Cours suivis
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {progressionData?.total_courses || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            Cours complétés
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {progressionData?.completed_courses || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-4">
            <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            Quiz réussis
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {progressionData?.passed_quizzes || 0}/
            {progressionData?.total_quizzes || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full mb-4">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            Progression globale
          </h3>
          <div className="w-full mt-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>Taux de réussite</span>
              <span>{Math.round(progressionData?.overall_progress || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressionData?.overall_progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Détail des cours */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Détail par cours
        </h2>

        {progressionData?.course_progressions?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Aucun cours suivi pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progressionData?.course_progressions?.map((course) => (
              <div
                key={course.course_id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => handleCourseClick(course.course_id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {course.course_title}
                  </h3>
                  {course.is_completed && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complété
                    </span>
                  )}
                  {course.certificat && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      <Award className="h-3 w-3 mr-1" />
                      Certifié
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Progression</span>
                  <span>{course.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${course.progress_percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    Quiz réussis: {course.quizzes_passed}/{course.quizzes_total}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 hover:underline">
                    Voir les détails
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progression;
