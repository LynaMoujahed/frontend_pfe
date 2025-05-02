import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/theme-context";
import { AuthProvider } from "./contexts/auth-context";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./Components/HomePage/Home.jsx";
import Layout from "./components/Administrateur/layout";
import DashboardPage from "./components/Administrateur/dashboard/page";
import UsersManagementPage from "./components/Administrateur/gestion/users";
import RegistrationRequestsPage from "./components/Administrateur/gestion/requests";
import ProfilePage from "./components/Administrateur/settings/profile";
import CalendarPage from "./components/Administrateur/evenement/calendrier";
import ReclamationSystem from "./components/Administrateur/settings/reclamation";
import QuizCreationPage from "./Components/Administrateur/quiz/quiz.jsx";
import CourseManagementPage from "./Components/Administrateur/cours/cours.jsx";
import Login from "./Components/Auth/Login";
import Register from "./Components/Auth/Register";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import Unauthorized from "./Components/Auth/Unauthorized";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/unauthorized",
      element: <Unauthorized />,
    },
    {
      path: "/admin",
      element: (
        <ProtectedRoute requiredRole="ROLE_ADMINISTRATEUR">
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true, // Ceci rendra DashboardPage la vue par défaut pour "/admin"
          element: <DashboardPage />,
        },
        {
          path: "dashboard",
          element: <DashboardPage />,
        },
        {
          children: [
            {
              path: "users",
              element: <UsersManagementPage />,
            },
            {
              path: "requests",
              element: <RegistrationRequestsPage />,
            },
            {
              path: "calendrier",
              element: <CalendarPage />,
            },
          ],
        },

        {
          path: "quiz",
          element: <QuizCreationPage />,
        },
        {
          path: "cours",
          element: <CourseManagementPage />,
        },
        {
          path: "settings",
          element: <ProfilePage />,
        },
        {
          path: "reclamation",
          element: <ReclamationSystem />,
        },
      ],
    },
  ]);

  return (
    <ThemeProvider storageKey="theme">
      <AuthProvider>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
