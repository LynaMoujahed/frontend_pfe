import {
  Home,
  BookOpen,
  BarChart2,
  MessageSquare,
  AlertCircle,
  User,
} from "lucide-react";

export const navbarLinks = [
  {
    title: "Tableau de bord",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "",
      },
    ],
  },
  {
    title: "Formation",
    links: [
      {
        label: "Mes Cours",
        icon: BookOpen,
        path: "cours",
      },
    ],
  },
  {
    title: "Communication",
    links: [
      {
        label: "Messagerie",
        icon: MessageSquare,
        path: "messagerie",
      },
      {
        label: "Réclamation",
        icon: AlertCircle,
        path: "reclamation",
      },
    ],
  },
  {
    title: "Paramètres",
    links: [
      {
        label: "Profil",
        icon: User,
        path: "profile",
      },
    ],
  },
];
