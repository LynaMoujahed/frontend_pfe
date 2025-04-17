import './App.css';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/theme-context";
import Home from './Components/HomePage/Home.jsx';
import Layout from "./components/Administrateur/layout";
import DashboardPage from "./components/Administrateur/dashboard/page";
import UsersManagementPage from "./components/Administrateur/gestion/users";
import RegistrationRequestsPage from "./components/Administrateur/gestion/requests";
import ProfilePage from "./components/Administrateur/settings/profile";
import CalendarPage from "./components/Administrateur/evenement/calendrier";
import ReclamationSystem from "./components/Administrateur/settings/reclamation";
import ApprenantPage from "./Components/Apprenant/ApprenantPage.jsx";
// Import des nouveaux composants Apprenant
import Dashboard from "./Components/Apprenant/Dashboard/Dashboard";
import Cours from "./Components/Apprenant/Cours/Cours";
import Progression from "./Components/Apprenant/Progression/Progression";
import Messagerie from "./Components/Apprenant/Messagerie/Messagerie";
import Reclamation from "./Components/Apprenant/Reclamation/Reclamation";
import Profile from "./Components/Apprenant/Profile/Profile.jsx";

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Home />,
        },
        {
            path: "/admin",
            element: <Layout />,
            children: [
                {
                    index: true,
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
                    ],
                },
                {
                    path: "Calendrier",
                    element: <CalendarPage />,
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
        {
            path: "/apprenant",
            element: <ApprenantPage />,
            children: [
                {
                    index: true,
                    element: <Dashboard />,
                },
                {
                    path: "cours",
                    element: <Cours />,
                },
                {
                    path: "progression",
                    element: <Progression />,
                },
                {
                    path: "messagerie",
                    element: <Messagerie />,
                },
                {
                    path: "reclamation",
                    element: <Reclamation />,
                },
                {
                    path: "Profile",
                    element: <Profile />,
                },
            ],
        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;