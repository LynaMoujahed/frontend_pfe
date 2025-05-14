import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { useTheme } from "../../contexts/theme-context";
import axios from "axios";
import { API_URL } from "../../config";
import {
  ArrowLeft,
  LogOut,
  Sun,
  Moon,
  User,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Calendar,
  GraduationCap,
  MessageSquare,
  FileText,
  ChevronDown,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import pharmaLearnLogo from "../../assets/PharmaLearn.png";
import ApprenantsList from "./ApprenantsList";
import ApprenantCours from "./ApprenantCours";
import CourseQuizzes from "./CourseQuizzes";
import QuizDetails from "./QuizDetails";
import FormateurDashboard from "./FormateurDashboardPage";
import Messagerie from "./Messagerie";
import NotificationCenter from "../Common/NotificationCenter";
import ProfilePage from "../Administrateur/settings/profile";
import { toast } from "react-toastify";
import "./formateur-styles.css";

const FormateurPage = () => {
  const { user, logout, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalApprenants: 0,
    coursActifs: 0,
    evaluationsEnCours: 0,
    tauxReussite: 0,
  });

  useEffect(() => {
    // Charger les statistiques du tableau de bord depuis l'API
    const fetchDashboardStats = async () => {
      try {
        if (!token) return;

        console.log("Récupération des données du dashboard formateur...");

        // Ajouter un timeout pour éviter les attentes infinies
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout

        const response = await axios.get(
          `${API_URL}/dashboard/formateur/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        // Annuler le timeout si la requête a réussi
        clearTimeout(timeoutId);

        console.log("Données du dashboard reçues:", response.data);

        // Extraire les données pertinentes pour ce dashboard
        const stats = response.data.stats || {};
        const evaluationTrend = response.data.evaluationTrend || [];

        // Calculer le taux de réussite à partir des données d'évaluation
        let satisfaisantCount = 0;
        let totalEvaluations = 0;

        evaluationTrend.forEach((month) => {
          if (month.satisfaisant) satisfaisantCount += month.satisfaisant;
          if (month.evaluations) totalEvaluations += month.evaluations;
        });

        const tauxReussite =
          totalEvaluations > 0
            ? Math.round((satisfaisantCount / totalEvaluations) * 100)
            : 0;

        setDashboardStats({
          totalApprenants: stats.totalApprenants?.value || 0,
          coursActifs: stats.totalCourses?.value || 0,
          evaluationsEnCours: stats.pendingEvaluations?.value || 0,
          tauxReussite: tauxReussite,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        // En cas d'erreur, initialiser avec des valeurs par défaut
        setDashboardStats({
          totalApprenants: 0,
          coursActifs: 0,
          evaluationsEnCours: 0,
          tauxReussite: 0,
        });
      }
    };

    fetchDashboardStats();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Gérer les actions du menu profil
  const handleProfileAction = (action) => {
    setShowProfileMenu(false);
    if (action === "profile") {
      navigate("/formateur/profile");
    } else if (action === "logout") {
      handleLogout();
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    // Rediriger vers la page appropriée en fonction du type de notification
    if (notification.messagerie) {
      navigate("/formateur/messagerie");
    } else if (notification.reclamation) {
      navigate("/formateur/reclamations");
    } else if (notification.certificat) {
      navigate("/formateur/certificats");
    } else if (notification.evaluation) {
      navigate("/formateur/evaluations");
    } else if (notification.evenement) {
      navigate("/formateur/evenements");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950 formateur-container">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-10 formateur-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex items-center mr-auto">
                <img
                  src={pharmaLearnLogo}
                  alt="PharmaLearn"
                  className="h-8 w-auto mr-2"
                />
                <span className="text-lg font-medium text-slate-900 transition-colors dark:text-slate-50">
                  PharmaLearn
                </span>
              </div>
            </div>

            <div className="flex items-center">
              {/* Menu pour mobile */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Menu de navigation desktop */}
              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => navigate("/formateur/dashboard")}
                  className={`flex h-[40px] items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                    location.pathname === "/formateur/dashboard"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
                  }`}
                >
                  <BarChart3 size={22} className="flex-shrink-0" />
                  <p className="whitespace-nowrap">Dashboard</p>
                  {location.pathname === "/formateur/dashboard" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
                  )}
                </button>
                <button
                  onClick={() => navigate("/formateur")}
                  className={`flex h-[40px] items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                    location.pathname === "/formateur" &&
                    location.pathname !== "/formateur/dashboard"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
                  }`}
                >
                  <Users size={22} className="flex-shrink-0" />
                  <p className="whitespace-nowrap">Apprenants</p>
                  {location.pathname === "/formateur" &&
                    location.pathname !== "/formateur/dashboard" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
                    )}
                </button>

                <button
                  onClick={() => navigate("/formateur/messagerie")}
                  className={`flex h-[40px] items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                    location.pathname === "/formateur/messagerie"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
                  }`}
                >
                  <MessageSquare size={22} className="flex-shrink-0" />
                  <p className="whitespace-nowrap">Messagerie</p>
                  {location.pathname === "/formateur/messagerie" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 ml-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Changer de thème"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              {/* Notifications Center */}
              <NotificationCenter
                onNotificationClick={handleNotificationClick}
                buttonClassName="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                iconClassName="h-5 w-5 text-gray-600 dark:text-gray-300"
              />

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="relative">
                    {user?.profileImage ? (
                      <img
                        src={`https://127.0.0.1:8000${user.profileImage}`}
                        alt="Profile"
                        className="h-9 w-9 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-700 shadow-sm">
                        <UserCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-card py-1 z-10 border border-gray-200 dark:border-gray-700 overflow-hidden profile-menu">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name || "Formateur"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || "formateur@example.com"}
                      </p>
                      <div className="mt-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 py-1 px-2 rounded-full inline-block">
                        Formateur
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => handleProfileAction("profile")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        Paramètres du profil
                      </button>

                      <button
                        onClick={() => handleProfileAction("logout")}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {showMobileMenu && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-md border-t border-slate-300 dark:border-slate-700 animate-slideInUp">
          <div className="px-4 py-3 space-y-3">
            <button
              onClick={() => {
                navigate("/formateur/dashboard");
                setShowMobileMenu(false);
              }}
              className={`flex w-full items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                location.pathname === "/formateur/dashboard"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
              }`}
            >
              <BarChart3 size={22} className="flex-shrink-0" />
              <p className="whitespace-nowrap">Dashboard</p>
              {location.pathname === "/formateur/dashboard" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
              )}
            </button>
            <button
              onClick={() => {
                navigate("/formateur");
                setShowMobileMenu(false);
              }}
              className={`flex w-full items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                location.pathname === "/formateur" &&
                location.pathname !== "/formateur/dashboard"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
              }`}
            >
              <Users size={22} className="flex-shrink-0" />
              <p className="whitespace-nowrap">Apprenants</p>
              {location.pathname === "/formateur" &&
                location.pathname !== "/formateur/dashboard" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
                )}
            </button>

            <button
              onClick={() => {
                navigate("/formateur/messagerie");
                setShowMobileMenu(false);
              }}
              className={`flex w-full items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                location.pathname === "/formateur/messagerie"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
              }`}
            >
              <MessageSquare size={22} className="flex-shrink-0" />
              <p className="whitespace-nowrap">Messagerie</p>
              {location.pathname === "/formateur/messagerie" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
              )}
            </button>
            <button
              onClick={() => {
                navigate("/formateur/profile");
                setShowMobileMenu(false);
              }}
              className={`flex w-full items-center gap-x-3 p-3 text-base font-medium transition-colors relative ${
                location.pathname === "/formateur/profile"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
              }`}
            >
              <Settings size={22} className="flex-shrink-0" />
              <p className="whitespace-nowrap">Paramètres du profil</p>
              {location.pathname === "/formateur/profile" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full py-4 sm:py-5 md:py-6">
        <Routes>
          <Route index element={<ApprenantsList />} />
          <Route
            path="dashboard"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <FormateurDashboard />
              </div>
            }
          />
          <Route
            path="apprenants/:id/cours"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ApprenantCours />
              </div>
            }
          />
          <Route
            path="apprenants/:id/cours/:courseId/quizzes"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <CourseQuizzes />
              </div>
            }
          />
          <Route
            path="apprenants/:id/cours/:courseId/quizzes/:quizId"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <QuizDetails />
              </div>
            }
          />
          <Route path="messagerie" element={<Messagerie />} />
          <Route
            path="profile"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ProfilePage />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default FormateurPage;
