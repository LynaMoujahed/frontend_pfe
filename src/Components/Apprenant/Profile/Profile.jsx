// src/Components/Apprenant/Profile/Profile.jsx
import { useState } from 'react';
import { User, Mail, Phone, Calendar, Lock } from 'lucide-react';

const Profile = () => {
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    phone: "+33 6 12 34 56 78",
    birthDate: "1990-05-15",
    password: "********"
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically call an API to update the user data
    console.log("Updated data:", userData);
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mon Profil</h2>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Modifier mes informations
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-slate-800 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                <User className="w-10 h-10 text-gray-500 dark:text-gray-400" />
              </div>
              {editMode && (
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Changer la photo
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  Nom complet
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{userData.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{userData.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4" />
                  Téléphone
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{userData.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  Date de naissance
                </label>
                {editMode ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={userData.birthDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">
                    {new Date(userData.birthDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Lock className="w-4 h-4" />
                  Mot de passe
                </label>
                {editMode ? (
                  <input
                    type="password"
                    name="password"
                    value={userData.password}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{userData.password}</p>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;