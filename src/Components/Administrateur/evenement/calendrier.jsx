import React, { useState } from 'react';

const CalendarPage = () => {
  // État principal
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // État des événements
  const [events, setEvents] = useState([
    { 
      id: 1, 
      title: "Évaluation de cardiologie", 
      date: new Date(2025, 3, 10), 
      category: "evaluation",
      color: "#EA4335",
      description: ""
    },
    { 
      id: 2, 
      title: "Évaluation de pharmacologie", 
      date: new Date(2025, 3, 15), 
      category: "evaluation",
      color: "#EA4335",
      description: ""
    },
    { 
      id: 3, 
      title: "Évaluation pratique", 
      date: new Date(2025, 3, 18), 
      category: "evaluation",
      color: "#EA4335",
      description: ""
    },
  ]);

  // État du formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isAllDay: true,
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    category: 'evaluation',
    color: '#EA4335'
  });

  // Catégories disponibles
  const categories = [
    { id: "evaluation", name: "Évaluation", color: "bg-purple-500", hex: "#EA4335" },
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    
    const eventDate = new Date(formData.date);
    if (!formData.isAllDay) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      eventDate.setHours(startHours, startMinutes);
    }

    const newEvent = {
      id: selectedEvent?.id || Math.max(0, ...events.map(e => e.id)) + 1,
      title: formData.title,
      description: formData.description,
      date: eventDate,
      category: 'evaluation',
      color: '#EA4335'
    };

    if (selectedEvent) {
      // Mise à jour d'un événement existant
      setEvents(events.map(e => e.id === selectedEvent.id ? newEvent : e));
    } else {
      // Ajout d'un nouvel événement
      setEvents([...events, newEvent]);
    }

    // Réinitialiser le formulaire
    setFormData({
      title: '',
      description: '',
      isAllDay: true,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      category: 'evaluation',
      color: '#EA4335'
    });
    
    setSelectedEvent(null);
    setShowEventForm(false);
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      // Demander confirmation avant de supprimer
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?")) {
        setEvents(events.filter(e => e.id !== selectedEvent.id));
        setShowEventForm(false);
        setSelectedEvent(null);
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
        <div key={`prev-${i}`} className="p-2 text-center text-gray-300 dark:text-gray-600 min-h-24 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          {prevMonthDays - i}
        </div>
      );
    }

    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEvents = events.filter(
        event =>
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
              date: new Date(year, month, i).toISOString().split('T')[0]
            });
            setShowEventForm(true);
          }}
        >
          <div className={`text-right font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>{i}</div>
          <div className="mt-1 space-y-1">
            {dayEvents.map(event => (
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
                    date: event.date.toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '17:00',
                    category: event.category,
                    color: event.color
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
        <div key={`next-${i}`} className="p-2 text-center text-gray-300 dark:text-gray-600 min-h-24 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
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
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="container mx-auto p-4 relative">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Calendrier des Évaluations
        </h1>
        <button 
          onClick={() => setShowEventForm(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          + Créer une évaluation
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - Catégories et Événements à venir */}
        <div className="w-full md:w-72">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Événements à venir
            </h2>
            {events.filter(e => e.date > new Date()).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">Aucun événement à venir</p>
            ) : (
              <div className="space-y-3">
                {events
                  .filter(event => event.date > new Date())
                  .sort((a, b) => a.date - b.date)
                  .slice(0, 3)
                  .map(event => (
                    <div 
                      key={event.id} 
                      className="border-l-4 pl-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-r-md transition-colors duration-200"
                      style={{ borderLeftColor: event.color }}
                    >
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{event.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.date.toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short'
                        })}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Catégories
            </h2>
            <div className="space-y-2">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`flex items-center cursor-pointer p-2.5 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id 
                      ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-3 shadow-sm" 
                    style={{ backgroundColor: category.hex }}
                  ></div>
                  <span className={`font-medium ${selectedCategory === category.id ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(day => (
              <div key={day} className="text-center font-medium py-2 text-gray-600 dark:text-gray-400 text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Formulaire de création/modification d'événement */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                {selectedEvent ? "Modifier l'évaluation" : "Créer une évaluation"}
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
                    <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
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
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Heure de début</label>
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
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Heure de fin</label>
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
                      style={{ backgroundColor: '#EA4335' }}
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