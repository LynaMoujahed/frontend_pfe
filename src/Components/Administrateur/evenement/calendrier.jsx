import React, { useState, useEffect } from "react";
import {
  getEvenements,
  getUpcomingEvenements,
  createEvenement,
  updateEvenement,
  deleteEvenement,
  debugAuthentication,
} from "../../../services/evenementService";
import { useAuth } from "../../../contexts/auth-context";

const CalendarPage = () => {
  // Récupérer le contexte d'authentification
  const { user, isAuthenticated } = useAuth();

  // État principal
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État des événements
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // État du formulaire
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isAllDay: true,
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    category: "evaluation",
    color: "#EA4335",
  });

  // Charger les événements depuis l'API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Vérifier si l'utilisateur est authentifié avant de charger les événements
        if (!isAuthenticated) {
          console.log(
            "Utilisateur non authentifié, impossible de charger les événements"
          );
          setError(
            "Veuillez vous connecter pour accéder au calendrier des évaluations."
          );
          setLoading(false);
          return;
        }

        // Vérifier si le token est présent dans le localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Token manquant dans le localStorage");
          setError("Session expirée. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }

        console.log(
          "Chargement des événements avec token:",
          token ? "Présent" : "Absent"
        );
        const response = await getEvenements();

        // Transformer les données pour correspondre au format attendu par le composant
        const formattedEvents = response.evenements.map((event) => ({
          id: event.id,
          title: event.titre,
          description: event.description,
          date: new Date(event.dateDebut),
          dateFin: event.dateFin ? new Date(event.dateFin) : null,
          category: event.categorie,
          color: event.couleur,
          journeeEntiere: event.journeeEntiere,
        }));

        setEvents(formattedEvents);
        setError(null);

        // Charger les événements à venir
        const upcomingResponse = await getUpcomingEvenements(5);
        const formattedUpcomingEvents = upcomingResponse.evenements.map(
          (event) => ({
            id: event.id,
            title: event.titre,
            description: event.description,
            date: new Date(event.dateDebut),
            dateFin: event.dateFin ? new Date(event.dateFin) : null,
            category: event.categorie,
            color: event.couleur,
            journeeEntiere: event.journeeEntiere,
          })
        );

        setUpcomingEvents(formattedUpcomingEvents);
        console.log(
          "Événements à venir chargés:",
          formattedUpcomingEvents.length
        );
      } catch (err) {
        console.error("Erreur lors du chargement des événements:", err);

        if (err.response) {
          if (err.response.status === 401) {
            setError("Erreur d'authentification. Veuillez vous reconnecter.");
          } else {
            setError(
              `Erreur (${err.response.status}): Impossible de charger les événements.`
            );
          }
        } else {
          setError(
            "Impossible de charger les événements. Veuillez réessayer plus tard."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Recharger les événements lorsque le mois change
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const fetchEventsByMonth = async () => {
      try {
        const response = await getEvenements({
          dateDebut: startDate.toISOString(),
          dateFin: endDate.toISOString(),
        });

        // Transformer les données
        const formattedEvents = response.evenements.map((event) => ({
          id: event.id,
          title: event.titre,
          description: event.description,
          date: new Date(event.dateDebut),
          dateFin: event.dateFin ? new Date(event.dateFin) : null,
          category: event.categorie,
          color: event.couleur,
          journeeEntiere: event.journeeEntiere,
        }));

        setEvents(formattedEvents);
      } catch (err) {
        console.error(
          "Erreur lors du chargement des événements par mois:",
          err
        );
      }
    };

    fetchEventsByMonth();
  }, [currentDate]);

  // Catégories disponibles
  const categories = [
    {
      id: "evaluation",
      name: "Évaluation",
      color: "bg-purple-500",
      hex: "#EA4335",
    },
  ];

  // Fonctions utilitaires
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Gestion du formulaire
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();

    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated) {
      setError("Vous devez être connecté pour créer ou modifier un événement.");
      return;
    }

    // Vérifier si le token est présent
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    // Vérifier si l'utilisateur a le rôle administrateur
    const isAdmin =
      user &&
      (user.role === "administrateur" ||
        (user.roles && user.roles.includes("ROLE_ADMINISTRATEUR")));
    if (!isAdmin) {
      setError(
        "Vous devez avoir le rôle administrateur pour gérer les événements."
      );
      console.error(
        "Rôle utilisateur:",
        user ? user.role : "Utilisateur non défini"
      );
      console.error(
        "Rôles utilisateur:",
        user && user.roles ? user.roles.join(", ") : "Aucun rôle"
      );
      return;
    }

    console.log(
      "Utilisateur authentifié avec le rôle administrateur, création de l'événement..."
    );

    try {
      // Préparer les données pour l'API
      const eventData = {
        titre: formData.title,
        description: formData.description,
        journeeEntiere: formData.isAllDay,
        dateDebut: formData.date,
        categorie: "evaluation",
        couleur: "#EA4335",
      };

      // Ajouter les heures si ce n'est pas toute la journée
      if (!formData.isAllDay) {
        const dateDebut = new Date(formData.date);
        const [startHours, startMinutes] = formData.startTime
          .split(":")
          .map(Number);
        dateDebut.setHours(startHours, startMinutes);
        eventData.dateDebut = dateDebut.toISOString();

        if (formData.endTime) {
          const dateFin = new Date(formData.date);
          const [endHours, endMinutes] = formData.endTime
            .split(":")
            .map(Number);
          dateFin.setHours(endHours, endMinutes);
          eventData.dateFin = dateFin.toISOString();
        }
      }

      let response;

      if (selectedEvent) {
        // Mise à jour d'un événement existant
        response = await updateEvenement(selectedEvent.id, eventData);

        // Mettre à jour l'état local
        const updatedEvent = {
          id: selectedEvent.id,
          title: eventData.titre,
          description: eventData.description,
          date: new Date(eventData.dateDebut),
          dateFin: eventData.dateFin ? new Date(eventData.dateFin) : null,
          category: eventData.categorie,
          color: eventData.couleur,
          journeeEntiere: eventData.journeeEntiere,
        };

        setEvents(
          events.map((e) => (e.id === selectedEvent.id ? updatedEvent : e))
        );
      } else {
        // Ajout d'un nouvel événement
        response = await createEvenement(eventData);

        // Vérifier si la réponse contient les données attendues
        if (!response.evenement) {
          console.error("Réponse invalide de l'API:", response);
          setError("Format de réponse invalide. Veuillez réessayer.");
          return;
        }

        // Ajouter le nouvel événement à l'état local
        const newEvent = {
          id: response.evenement.id,
          title: response.evenement.titre,
          description: response.evenement.description,
          date: new Date(response.evenement.dateDebut),
          dateFin: response.evenement.dateFin
            ? new Date(response.evenement.dateFin)
            : null,
          category: response.evenement.categorie,
          color: response.evenement.couleur,
          journeeEntiere: response.evenement.journeeEntiere,
        };

        console.log("Événement créé avec succès:", newEvent);
        setEvents([...events, newEvent]);
      }

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        description: "",
        isAllDay: true,
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "17:00",
        category: "evaluation",
        color: "#EA4335",
      });

      // Recharger les événements à venir
      try {
        const upcomingResponse = await getUpcomingEvenements(5);
        const formattedUpcomingEvents = upcomingResponse.evenements.map(
          (event) => ({
            id: event.id,
            title: event.titre,
            description: event.description,
            date: new Date(event.dateDebut),
            dateFin: event.dateFin ? new Date(event.dateFin) : null,
            category: event.categorie,
            color: event.couleur,
            journeeEntiere: event.journeeEntiere,
          })
        );

        setUpcomingEvents(formattedUpcomingEvents);
        console.log(
          "Événements à venir rechargés après modification:",
          formattedUpcomingEvents.length
        );
      } catch (err) {
        console.error(
          "Erreur lors du rechargement des événements à venir:",
          err
        );
      }

      setSelectedEvent(null);
      setShowEventForm(false);
      setError(null); // Effacer les erreurs précédentes en cas de succès
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'événement:", err);

      // Afficher un message d'erreur plus spécifique
      if (err.response) {
        if (err.response.status === 401) {
          setError("Erreur d'authentification. Veuillez vous reconnecter.");
        } else if (err.response.status === 403) {
          setError(
            "Vous n'avez pas les droits nécessaires pour effectuer cette action."
          );
        } else if (err.response.data && err.response.data.error) {
          setError(`Erreur: ${err.response.data.error}`);
        } else {
          setError(`Erreur (${err.response.status}): Veuillez réessayer.`);
        }
      } else if (err.request) {
        setError(
          "Impossible de communiquer avec le serveur. Vérifiez votre connexion."
        );
      } else {
        setError(
          "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer."
        );
      }
    }
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async () => {
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated) {
      setError("Vous devez être connecté pour supprimer un événement.");
      return;
    }

    // Vérifier si le token est présent
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    // Vérifier si l'utilisateur a le rôle administrateur
    const isAdmin =
      user &&
      (user.role === "administrateur" ||
        (user.roles && user.roles.includes("ROLE_ADMINISTRATEUR")));
    if (!isAdmin) {
      setError(
        "Vous devez avoir le rôle administrateur pour gérer les événements."
      );
      console.error(
        "Rôle utilisateur:",
        user ? user.role : "Utilisateur non défini"
      );
      console.error(
        "Rôles utilisateur:",
        user && user.roles ? user.roles.join(", ") : "Aucun rôle"
      );
      return;
    }

    console.log(
      "Utilisateur authentifié avec le rôle administrateur, suppression de l'événement..."
    );

    if (selectedEvent) {
      // Demander confirmation avant de supprimer
      if (
        window.confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?")
      ) {
        try {
          // Appeler l'API pour supprimer l'événement
          await deleteEvenement(selectedEvent.id);

          // Mettre à jour l'état local
          setEvents(events.filter((e) => e.id !== selectedEvent.id));

          // Recharger les événements à venir après suppression
          try {
            const upcomingResponse = await getUpcomingEvenements(5);
            const formattedUpcomingEvents = upcomingResponse.evenements.map(
              (event) => ({
                id: event.id,
                title: event.titre,
                description: event.description,
                date: new Date(event.dateDebut),
                dateFin: event.dateFin ? new Date(event.dateFin) : null,
                category: event.categorie,
                color: event.couleur,
                journeeEntiere: event.journeeEntiere,
              })
            );

            setUpcomingEvents(formattedUpcomingEvents);
            console.log(
              "Événements à venir rechargés après suppression:",
              formattedUpcomingEvents.length
            );
          } catch (err) {
            console.error(
              "Erreur lors du rechargement des événements à venir:",
              err
            );
          }

          setShowEventForm(false);
          setSelectedEvent(null);
          setError(null); // Effacer les erreurs précédentes en cas de succès
        } catch (err) {
          console.error("Erreur lors de la suppression de l'événement:", err);

          // Afficher un message d'erreur plus spécifique
          if (err.response) {
            if (err.response.status === 401) {
              setError("Erreur d'authentification. Veuillez vous reconnecter.");
            } else if (err.response.status === 403) {
              setError(
                "Vous n'avez pas les droits nécessaires pour effectuer cette action."
              );
            } else if (err.response.data && err.response.data.error) {
              setError(`Erreur: ${err.response.data.error}`);
            } else {
              setError(`Erreur (${err.response.status}): Veuillez réessayer.`);
            }
          } else if (err.request) {
            setError(
              "Impossible de communiquer avec le serveur. Vérifiez votre connexion."
            );
          } else {
            setError(
              "Une erreur est survenue lors de la suppression. Veuillez réessayer."
            );
          }
        }
      }
    }
  };

  // Rendu du calendrier
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const prevMonthDays = getDaysInMonth(year, month - 1);
    const nextMonthDays = getDaysInMonth(year, month + 1);

    const calendarDays = [];

    // Jours du mois précédent
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      calendarDays.push(
        <div
          key={`prev-${i}`}
          className="p-2 text-center text-gray-300 dark:text-gray-600 min-h-24 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          {prevMonthDays - i}
        </div>
      );
    }

    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEvents = events.filter(
        (event) =>
          event.date.getDate() === i &&
          event.date.getMonth() === month &&
          event.date.getFullYear() === year &&
          (!selectedCategory || event.category === selectedCategory)
      );

      const isToday =
        i === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();

      calendarDays.push(
        <div
          key={`current-${i}`}
          className={`p-2 border border-gray-200 dark:border-gray-700 min-h-24 rounded-lg transition-all duration-200 ${
            isToday
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm"
              : "hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md"
          }`}
          onClick={() => {
            setFormData({
              ...formData,
              date: new Date(year, month, i).toISOString().split("T")[0],
            });
            setShowEventForm(true);
          }}
        >
          <div
            className={`text-right font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
          >
            {i}
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1.5 rounded-md text-white truncate shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105`}
                style={{ backgroundColor: event.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setFormData({
                    title: event.title,
                    description: event.description,
                    isAllDay: true,
                    date: event.date.toISOString().split("T")[0],
                    startTime: "09:00",
                    endTime: "17:00",
                    category: event.category,
                    color: event.color,
                  });
                  setShowEventForm(true);
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Jours du mois suivant
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    const remainingDays = totalCells - (firstDayOfMonth + daysInMonth);
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(
        <div
          key={`next-${i}`}
          className="p-2 text-center text-gray-300 dark:text-gray-600 min-h-24 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          {i}
        </div>
      );
    }

    return calendarDays;
  };

  const changeMonth = (increment) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1)
    );
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Vérifier si l'utilisateur est un administrateur
  const isAdmin =
    user &&
    (user.role === "administrateur" ||
      (user.roles && user.roles.includes("ROLE_ADMINISTRATEUR")));

  // Vérifier le token et les informations d'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token d'authentification:", token ? "Présent" : "Absent");

    if (user) {
      console.log("Utilisateur connecté:", user);
      console.log("Rôle:", user.role);
      console.log("Rôles:", user.roles);
      console.log("Est administrateur:", isAdmin ? "Oui" : "Non");

      // Appeler la fonction de débogage pour vérifier l'authentification côté serveur
      const checkAuthDebug = async () => {
        try {
          const debugData = await debugAuthentication();
          console.log("Résultat du débogage d'authentification:", debugData);
        } catch (err) {
          console.error("Erreur lors du débogage d'authentification:", err);
        }
      };

      checkAuthDebug();
    } else {
      console.log("Aucun utilisateur connecté");
    }
  }, [user, isAdmin]);

  return (
    <div className="container mx-auto p-4 relative">
      {/* Afficher les erreurs */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="text-red-500">×</span>
          </button>
        </div>
      )}

      {/* Afficher un message si l'utilisateur n'est pas administrateur */}
      {isAuthenticated && !isAdmin && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <span className="block sm:inline">
            Vous êtes connecté en tant que {user?.role || "utilisateur"}, mais
            vous devez être administrateur pour créer ou modifier des
            événements.
          </span>
        </div>
      )}

      {/* Afficher un message si l'utilisateur n'est pas connecté */}
      {!isAuthenticated && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <span className="block sm:inline">
            Veuillez vous connecter en tant qu'administrateur pour gérer les
            événements.
          </span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Calendrier des Évaluations
        </h1>
        {isAuthenticated && isAdmin && (
          <button
            onClick={() => setShowEventForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            + Créer une évaluation
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - Catégories et Événements à venir */}
        <div className="w-full md:w-72">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Événements à venir
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Aucun événement à venir
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 pl-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-r-md transition-colors duration-200"
                    style={{ borderLeftColor: event.color }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setFormData({
                        title: event.title,
                        description: event.description,
                        isAllDay: event.journeeEntiere,
                        date: event.date.toISOString().split("T")[0],
                        startTime:
                          event.date.getHours().toString().padStart(2, "0") +
                          ":" +
                          event.date.getMinutes().toString().padStart(2, "0"),
                        endTime: event.dateFin
                          ? event.dateFin
                              .getHours()
                              .toString()
                              .padStart(2, "0") +
                            ":" +
                            event.dateFin
                              .getMinutes()
                              .toString()
                              .padStart(2, "0")
                          : "17:00",
                        category: event.category,
                        color: event.color,
                      });
                      setShowEventForm(true);
                    }}
                  >
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.date.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Catégories
            </h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center cursor-pointer p-2.5 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                >
                  <div
                    className="w-4 h-4 rounded-full mr-3 shadow-sm"
                    style={{ backgroundColor: category.hex }}
                  ></div>
                  <span
                    className={`font-medium ${selectedCategory === category.id ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendrier principal */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div
                key={day}
                className="text-center font-medium py-2 text-gray-600 dark:text-gray-400 text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      </div>

      {/* Formulaire de création/modification d'événement */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                {selectedEvent
                  ? "Modifier l'évaluation"
                  : "Créer une évaluation"}
              </h2>

              <form onSubmit={handleSubmitEvent}>
                {/* Titre */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                {/* Date & Heure */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date & Heure
                  </label>

                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="isAllDay"
                      name="isAllDay"
                      checked={formData.isAllDay}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                    />
                    <label
                      htmlFor="isAllDay"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Toute la journée
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-3">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      />
                    </div>

                    {!formData.isAllDay && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Heure de début
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                          />
                        </div>
                        <div className="text-center pt-7">-</div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Heure de fin
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Catégorie */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Évaluation
                  </div>
                  <input type="hidden" name="category" value="evaluation" />
                </div>

                {/* Couleur */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Couleur
                  </label>
                  <div className="flex space-x-2">
                    <div
                      className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600 shadow-md"
                      style={{ backgroundColor: "#EA4335" }}
                      title="Évaluation"
                    />
                  </div>
                  <input type="hidden" name="color" value="#EA4335" />
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-3">
                  {selectedEvent && (
                    <button
                      type="button"
                      onClick={handleDeleteEvent}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventForm(false);
                      setSelectedEvent(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {selectedEvent ? "Modifier" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
