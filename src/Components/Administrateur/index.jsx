import { 
    ChartColumn, Home, NotepadText, Book, BookOpen,
    Settings, ClipboardCheck, UserCheck, UserPlus, 
    Users, FileText, Award, MessageSquare, Clock,
    Calendar,
    Calendar1,
    CalendarX2Icon,
    CalendarCheck
} from "lucide-react";

export const navbarLinks = [
    {
        title: "Tableau de bord",
        links: [
            {
                label: "Dashboard",
                icon: ChartColumn,
                path: "Dashboard",
            },
        ],
    },
    {
        title: "Gestion des Utilisateurs",
        links: [
            {
                label: "Liste des utilisateurs",
                icon: Users,
                path: "users", // Page indépendante
            },
            {
                label: "Les demandes",
                icon: Clock,
                path: "requests", // Chemin indépendant
            },
        ],
    },
    {
        title: "Formations Médicales",
        links: [
            {
                label: "Cours",
                icon: Book,
                path: "courses",
            },
            {
                label: "Calendrier",
                icon: CalendarCheck,
                path: "Calendrier",
            },
           
        ],
    },
    {
        title: "Paramètres",
        links: [
            {
                label: "Profil",
                icon: Settings,
                path: "settings",
            },
            {
                label: "Réclamation",
                icon: MessageSquare,
                path: "reclamation",
            },
        ],
    },
];