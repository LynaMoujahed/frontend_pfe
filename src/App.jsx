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
            path: "/Apprenant",
            element: < ApprenantPage />,

        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;