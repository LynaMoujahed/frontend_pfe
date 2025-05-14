import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { User, Loader, Mail, Phone, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import "./formateur-styles.css";
import { API_URL } from "../../config";

const ApprenantsList = () => {
  const [apprenants, setApprenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApprenants();
  }, []);

  const fetchApprenants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/formateur/apprenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des apprenants");
      }

      const data = await response.json();
      const apprenantsData = data.apprenants || [];

      // Récupérer le nombre de cours pour chaque apprenant
      const apprenantsWithCourses = await Promise.all(
        apprenantsData.map(async (apprenant) => {
          try {
            const coursResponse = await fetch(
              `${API_URL}/formateur/apprenants/${apprenant.id}/cours`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!coursResponse.ok) {
              console.error(
                `Erreur lors de la récupération des cours pour l'apprenant ${apprenant.id}`
              );
              return { ...apprenant, coursCount: 0 };
            }

            const coursData = await coursResponse.json();
            return {
              ...apprenant,
              coursCount: coursData.cours ? coursData.cours.length : 0,
            };
          } catch (error) {
            console.error(`Erreur pour l'apprenant ${apprenant.id}:`, error);
            return { ...apprenant, coursCount: 0 };
          }
        })
      );

      setApprenants(apprenantsWithCourses);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger la liste des apprenants");
    } finally {
      setLoading(false);
    }
  };

  const handleApprenantClick = (apprenantId) => {
    navigate(`/formateur/apprenants/${apprenantId}/cours`);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <Loader className="mx-auto text-5xl text-gray-400 dark:text-gray-500 mb-4 animate-spin" />
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
              Chargement des apprenants...
            </h3>
          </div>
        ) : apprenants.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <User className="mx-auto text-5xl text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
              Aucun apprenant disponible
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Vous n'avez pas encore d'apprenants assignés à vos cours.
            </p>
          </div>
        ) : (
          apprenants.map((apprenant) => (
            <div
              key={apprenant.id}
              onClick={() => handleApprenantClick(apprenant.id)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                      <User className="text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate pr-4">
                          {apprenant.name}
                        </h2>
                        <div className="flex space-x-2 flex-shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprenantClick(apprenant.id);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                            title="Voir les cours de l'apprenant"
                          >
                            <BookOpen size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <Mail className="w-4 h-4 mr-1.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                        <span className="truncate">{apprenant.email}</span>
                      </div>
                      {apprenant.phone && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <Phone className="w-4 h-4 mr-1.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                          <span>{apprenant.phone}</span>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actif
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {apprenant.coursCount || 0} cours
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprenantsList;
