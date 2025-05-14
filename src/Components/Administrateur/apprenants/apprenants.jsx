import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/auth-context";
import {
  Users,
  Search,
  Book,
  Plus,
  X,
  Check,
  Loader,
  Info,
  BarChart3,
  PieChart,
  GraduationCap,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Clock,
  Layers,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Sliders,
  FileText,
  Award,
  Bookmark,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import DialogModal from "../../Common/DialogModal";
import { API_URL } from "../../../config";

const ApprenantsCoursesPage = () => {
  const { token } = useAuth();
  const [apprenants, setApprenants] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [apprenantCourses, setApprenantCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [activeTab, setActiveTab] = useState("courses"); // courses, stats, notes, info
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name"); // name, date, progress
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [statsData, setStatsData] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0,
  });
  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Annuler",
  });

  // Récupérer la liste des apprenants
  useEffect(() => {
    const fetchApprenants = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/admin/apprenants`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des apprenants");
        }

        const data = await response.json();

        // Récupérer le nombre de cours pour chaque apprenant
        const apprenantsWithCourseCount = await Promise.all(
          (data.apprenants || []).map(async (apprenant) => {
            try {
              const coursResponse = await fetch(
                `${API_URL}/admin/apprenants/${apprenant.id}/cours`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (coursResponse.ok) {
                const coursData = await coursResponse.json();
                return {
                  ...apprenant,
                  coursCount: (coursData.cours || []).length,
                };
              }
              return { ...apprenant, coursCount: 0 };
            } catch (error) {
              console.error(
                `Erreur lors de la récupération des cours pour l'apprenant ${apprenant.id}:`,
                error
              );
              return { ...apprenant, coursCount: 0 };
            }
          })
        );

        setApprenants(apprenantsWithCourseCount);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger la liste des apprenants");
      } finally {
        setLoading(false);
      }
    };

    // Récupérer la liste des cours
    const fetchCours = async () => {
      try {
        const response = await fetch(`${API_URL}/cours`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des cours");
        }

        const data = await response.json();
        setCours(Array.isArray(data) ? data : data["hydra:member"] || []);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger la liste des cours");
      }
    };

    fetchApprenants();
    fetchCours();
  }, [token]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchApprenants();
      await fetchCours();
      toast.success("Données rafraîchies avec succès");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      toast.error("Erreur lors du rafraîchissement des données");
    } finally {
      setRefreshing(false);
    }
  };

  // Fonction pour calculer les statistiques d'un apprenant
  const calculateStats = (courses) => {
    if (!courses || courses.length === 0) {
      return {
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        averageProgress: 0,
      };
    }

    const total = courses.length;
    const completed = courses.filter(
      (course) => course.progress === 100
    ).length;
    const inProgress = courses.filter(
      (course) => course.progress > 0 && course.progress < 100
    ).length;
    const avgProgress =
      courses.reduce((acc, course) => acc + (course.progress || 0), 0) / total;

    return {
      totalCourses: total,
      completedCourses: completed,
      inProgressCourses: inProgress,
      averageProgress: Math.round(avgProgress),
    };
  };

  // Mettre à jour les statistiques lorsque les cours de l'apprenant changent
  useEffect(() => {
    if (apprenantCourses.length > 0) {
      setStatsData(calculateStats(apprenantCourses));
    }
  }, [apprenantCourses]);

  // Fonction pour trier les apprenants
  const sortApprenants = (apprenants) => {
    return [...apprenants].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "date") {
        // Supposons que nous avons une date d'inscription
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (sortBy === "progress") {
        // Supposons que nous calculons la progression moyenne
        const aProgress = a.progress || 0;
        const bProgress = b.progress || 0;
        comparison = aProgress - bProgress;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  // Filtrer et trier les apprenants
  const filteredAndSortedApprenants = useMemo(() => {
    // Filtrer d'abord
    const filtered = apprenants.filter(
      (apprenant) =>
        apprenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apprenant.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Puis trier
    return sortApprenants(filtered);
  }, [apprenants, searchTerm, sortBy, sortOrder]);

  // Sélectionner un apprenant et récupérer ses cours
  const handleSelectApprenant = async (apprenant) => {
    setSelectedApprenant(apprenant);
    setLoadingCourses(true);

    try {
      // Récupérer les cours de l'apprenant
      const response = await fetch(
        `${API_URL}/admin/apprenants/${apprenant.id}/cours`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des cours de l'apprenant"
        );
      }

      const data = await response.json();
      const coursesData = data.cours || [];
      setApprenantCourses(coursesData);

      // Mettre à jour le compteur de cours de l'apprenant sélectionné
      setSelectedApprenant({
        ...apprenant,
        coursCount: coursesData.length,
      });

      // Mettre à jour la liste des apprenants avec le compteur exact
      setApprenants(
        apprenants.map((a) =>
          a.id === apprenant.id ? { ...a, coursCount: coursesData.length } : a
        )
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les cours de l'apprenant");
      setApprenantCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Associer un cours à un apprenant
  const handleAssignCourse = async (courseId) => {
    if (!selectedApprenant) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/apprenants/${selectedApprenant.id}/cours/${courseId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'association du cours à l'apprenant");
      }

      const data = await response.json();

      // Mettre à jour la liste des cours de l'apprenant
      setApprenantCourses([...apprenantCourses, data.cours]);

      // Mettre à jour le compteur de cours de l'apprenant sélectionné
      setSelectedApprenant({
        ...selectedApprenant,
        coursCount: (selectedApprenant.coursCount || 0) + 1,
      });

      // Mettre à jour la liste des apprenants avec le nouveau compteur
      setApprenants(
        apprenants.map((apprenant) =>
          apprenant.id === selectedApprenant.id
            ? { ...apprenant, coursCount: (apprenant.coursCount || 0) + 1 }
            : apprenant
        )
      );

      toast.success("Cours associé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible d'associer le cours à l'apprenant");
    }
  };

  // Retirer un cours d'un apprenant
  const handleRemoveCourse = async (courseId) => {
    if (!selectedApprenant) return;

    setDialog({
      show: true,
      title: "Confirmation",
      message: "Êtes-vous sûr de vouloir retirer ce cours de l'apprenant ?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `https://127.0.0.1:8000/api/admin/apprenants/${selectedApprenant.id}/cours/${courseId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Erreur lors du retrait du cours");
          }

          // Mettre à jour la liste des cours de l'apprenant
          setApprenantCourses(
            apprenantCourses.filter((course) => course.id !== courseId)
          );

          // Mettre à jour le compteur de cours de l'apprenant sélectionné
          setSelectedApprenant({
            ...selectedApprenant,
            coursCount: Math.max(0, (selectedApprenant.coursCount || 0) - 1),
          });

          // Mettre à jour la liste des apprenants avec le nouveau compteur
          setApprenants(
            apprenants.map((apprenant) =>
              apprenant.id === selectedApprenant.id
                ? {
                    ...apprenant,
                    coursCount: Math.max(0, (apprenant.coursCount || 0) - 1),
                  }
                : apprenant
            )
          );

          toast.success("Cours retiré avec succès");
          setDialog((prev) => ({ ...prev, show: false }));
        } catch (error) {
          console.error("Erreur:", error);
          toast.error("Impossible de retirer le cours");
          setDialog((prev) => ({ ...prev, show: false }));
        }
      },
      cancelText: "Annuler",
      confirmText: "Confirmer",
    });
  };

  // Vérifier si un cours est déjà associé à l'apprenant
  const isCourseAssigned = (courseId) => {
    return apprenantCourses.some((course) => course.id === courseId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {dialog.show && (
        <DialogModal
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          onConfirm={dialog.onConfirm}
          onClose={() => setDialog((prev) => ({ ...prev, show: false }))}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
        />
      )}

      {/* En-tête avec titre et statistiques */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Liste des Apprenants
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Gérez les cours associés à chaque apprenant
            </p>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Rechercher un apprenant..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2 text-blue-500" />
              <span>Trier par</span>
              {filterOpen ? (
                <ChevronUp className="w-4 h-4 ml-2 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
              )}
            </button>

            {filterOpen && (
              <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSortBy("name");
                      setFilterOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-left rounded-lg ${
                      sortBy === "name"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    <span>Nom</span>
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("date");
                      setFilterOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-left rounded-lg ${
                      sortBy === "date"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Date</span>
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("progress");
                      setFilterOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-left rounded-lg ${
                      sortBy === "progress"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <span>Progression</span>
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <button
                    onClick={() => {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      setFilterOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {sortOrder === "asc" ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        <span>Croissant</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        <span>Décroissant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Liste des apprenants avec design amélioré */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Apprenants
            </h2>
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
              {filteredAndSortedApprenants.length}{" "}
              {filteredAndSortedApprenants.length > 1
                ? "apprenants"
                : "apprenant"}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-900/30 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>
          ) : filteredAndSortedApprenants.length === 0 ? (
            <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Users className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                Aucun résultat
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Aucun apprenant ne correspond à votre recherche
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto p-1">
              {filteredAndSortedApprenants.map((apprenant) => (
                <div
                  key={apprenant.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                    selectedApprenant?.id === apprenant.id
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-md transform scale-[1.02]"
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
                  }`}
                  onClick={() => handleSelectApprenant(apprenant)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full ${
                          selectedApprenant?.id === apprenant.id
                            ? "bg-blue-100 dark:bg-blue-900/50"
                            : "bg-gray-100 dark:bg-gray-700"
                        } flex items-center justify-center`}
                      >
                        <Users
                          className={`${
                            selectedApprenant?.id === apprenant.id
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                          size={20}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {apprenant.name}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="w-3 h-3 mr-1" />
                          {apprenant.email}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${selectedApprenant?.id === apprenant.id ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
                    ></div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Book className="w-3 h-3 mr-1" />
                      <span>{apprenant.coursCount || 0} cours</span>
                    </div>
                    <div className="flex items-center">
                      <button
                        className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectApprenant(apprenant);
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAndSortedApprenants.map((apprenant) => (
                <div
                  key={apprenant.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                    selectedApprenant?.id === apprenant.id
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-md"
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-800"
                  }`}
                  onClick={() => handleSelectApprenant(apprenant)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full ${
                          selectedApprenant?.id === apprenant.id
                            ? "bg-blue-100 dark:bg-blue-900/50"
                            : "bg-gray-100 dark:bg-gray-700"
                        } flex items-center justify-center`}
                      >
                        <Users
                          className={`${
                            selectedApprenant?.id === apprenant.id
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                          size={20}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {apprenant.name}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="w-3 h-3 mr-1" />
                          {apprenant.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {apprenant.coursCount || 0} cours
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${selectedApprenant?.id === apprenant.id ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détails de l'apprenant et ses cours */}
        <div className="md:col-span-2">
          {selectedApprenant ? (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* En-tête avec informations de l'apprenant */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-sm">
                    <Users
                      className="text-blue-600 dark:text-blue-400"
                      size={28}
                    />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {selectedApprenant.name}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center mt-1 space-y-1 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                        {selectedApprenant.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Book className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                        {apprenantCourses.length} cours associés
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                    onClick={() => {
                      // Fonction pour contacter l'apprenant
                      toast.info("Fonctionnalité de contact à implémenter");
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    <span>Contacter</span>
                  </button>
                </div>
              </div>

              {/* Onglets pour naviguer entre les sections */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                  className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                    activeTab === "courses"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("courses")}
                >
                  Cours associés
                  {activeTab === "courses" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 dark:bg-blue-400"></span>
                  )}
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                    activeTab === "add"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("add")}
                >
                  Ajouter des cours
                  {activeTab === "add" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 dark:bg-blue-400"></span>
                  )}
                </button>
              </div>

              {/* Contenu des onglets */}
              {activeTab === "courses" && (
                <div className="mb-6">
                  {loadingCourses ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border-3 border-blue-200 dark:border-blue-900/30 border-t-blue-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Book className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  ) : apprenantCourses.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Book className="text-gray-400" size={28} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                        Aucun cours associé
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                        Cet apprenant n'a pas encore de cours associés. Utilisez
                        l'onglet "Ajouter des cours" pour lui en attribuer.
                      </p>
                      <button
                        onClick={() => setActiveTab("add")}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter des cours
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto p-1">
                      {apprenantCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Book
                                  className="text-blue-600 dark:text-blue-400"
                                  size={18}
                                />
                              </div>
                              <div className="ml-3">
                                <h4 className="font-semibold text-gray-800 dark:text-white">
                                  {course.titre}
                                </h4>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCourse(course.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full transition-colors"
                              title="Retirer ce cours"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          {course.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}

                          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                {course.progress || 0}% complété
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                                title="Voir les détails"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "add" && (
                <div>
                  {cours.length === 0 ||
                  cours.every((course) => isCourseAssigned(course.id)) ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Info className="text-gray-400" size={28} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                        Aucun cours à ajouter
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Il n'y a actuellement aucun cours disponible à ajouter.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto p-1">
                        {cours
                          .filter((course) => !isCourseAssigned(course.id))
                          .map((course) => (
                            <div
                              key={course.id}
                              className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <Book
                                      className="text-gray-500 dark:text-gray-400"
                                      size={18}
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="font-semibold text-gray-800 dark:text-white">
                                      {course.titre}
                                    </h4>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssignCourse(course.id)}
                                  className="p-1.5 text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400 rounded-full transition-colors"
                                  title="Ajouter ce cours"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              {course.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                  {course.description}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center h-full min-h-[400px] border border-gray-100 dark:border-gray-700"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
                <Users className="text-gray-400" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Aucun apprenant sélectionné
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                Sélectionnez un apprenant dans la liste pour voir ses détails et
                gérer ses cours associés.
              </p>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <ChevronDown className="animate-bounce w-5 h-5 mr-1" />
                <span>Sélectionnez un apprenant</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprenantsCoursesPage;
