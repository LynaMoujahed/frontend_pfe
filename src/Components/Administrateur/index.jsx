import {
  ChartColumn,
  Home,
  NotepadText,
  Book,
  BookOpen,
  Settings,
  ClipboardCheck,
  UserCheck,
  UserPlus,
  Users,
  FileText,
  Award,
  MessageSquare,
  Clock,
  Calendar,
  Calendar1,
  CalendarX2Icon,
  FileQuestion,
  CalendarCheck,
} from "lucide-react";

export const navbarLinks = [
  {
    title: "Tableau de bord",
    links: [
      {
        label: "Dashboard",
        icon: ChartColumn,
        path: "dashboard",
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
        path: "requests",
      },
    ],
  },
  {
    title: "Formations Médicales",
    links: [
      {
        label: "Quiz",
        icon: FileText,
        path: "quiz",
      },
      {
        label: "Cours",
        icon: Book,
        path: "cours",
      },
      {
        label: "Calendrier",
        icon: CalendarCheck,
        path: "calendrier",
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
