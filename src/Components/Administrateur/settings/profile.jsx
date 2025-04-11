import { useState, useRef } from 'react';
import {
  User, Mail, Lock, Eye, EyeOff, XCircle, Camera, Shield, Key, Bell, Smartphone
} from 'lucide-react';
import profileImg from "../../../assets/profile-image.jpg";

const ProfilePage = () => {
  // États pour les données du profil
  const [profileData, setProfileData] = useState({
    name: 'Dr. Ahmed Ben Salah',
    email: 'ahmed.bensalah@example.com',
    phone: '+216 12 345 678',
  });

  // États pour la sécurité
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true
  });

  // États pour l'interface
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [profileImage, setProfileImage] = useState(profileImg);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Gestion des changements
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSecurityChange = (e) => {
    setSecurity({
      ...security,
      [e.target.name]: e.target.value
    });
  };

  const toggle2FA = () => {
    setSecurity(prev => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileImage = () => {
    if (imagePreview) {
      setProfileImage(imagePreview);
      setImagePreview(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec photo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <img 
              src={profileImage} 
              alt="Profil" 
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900/50 shadow-lg group-hover:shadow-xl transition-all duration-300"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600  bg-clip-text dark:text-white text-transparent">
            Gestion du Profil
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation latérale */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveSection('personal')}
              className={`w-full p-3 text-left rounded-xl flex items-center gap-2 transition-all duration-300 ${
                activeSection === 'personal' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              <User size={18} className={`flex-shrink-0 ${activeSection === 'personal' ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
              <span>Informations Personnelles</span>
            </button>
            <button
              onClick={() => setActiveSection('security')}
              className={`w-full p-3 text-left rounded-xl flex items-center gap-2 transition-all duration-300 ${
                activeSection === 'security' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              <Lock size={18} className={`flex-shrink-0 ${activeSection === 'security' ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
              <span>Sécurité</span>
            </button>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Section Informations Personnelles */}
            {activeSection === 'personal' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User size={20} className="text-blue-500 dark:text-blue-400" />
                  <span>Profil Public</span>
                </h2>

                <form className="space-y-6">
                  {/* Photo de profil */}
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                    <div className="relative group">
                      <img
                        src={imagePreview || profileImage}
                        alt="Photo de profil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900/50 shadow-lg group-hover:shadow-xl transition-all duration-300"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                      >
                        <Camera size={16} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Photo de profil</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Formats supportés: JPG, PNG (max 2MB)
                      </p>
                      {imagePreview && (
                        <div className="flex gap-2">
                          <button
                            onClick={saveProfileImage}
                            className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => setImagePreview(null)}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations personnelles */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom Complet
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
                        <User size={18} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <input
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
                        <Mail size={18} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <input
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Téléphone
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
                        <Smartphone size={18} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <input
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Enregistrer les modifications
                  </button>
                </form>
              </div>
            )}

            {/* Section Sécurité */}
            {activeSection === 'security' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Lock size={20} className="text-blue-500 dark:text-blue-400" />
                  <span>Sécurité du Compte</span>
                </h2>

                <div className="space-y-6">
                  {/* Changement de mot de passe */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Key size={18} className="text-blue-500 dark:text-blue-400" />
                      <span>Changer le mot de passe</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Mot de passe actuel
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="currentPassword"
                          value={security.currentPassword}
                          onChange={handleSecurityChange}
                          className="w-full bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <div className="relative">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Nouveau mot de passe
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          value={security.newPassword}
                          onChange={handleSecurityChange}
                          className="w-full bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <div className="relative">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Confirmer le nouveau mot de passe
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={security.confirmPassword}
                          onChange={handleSecurityChange}
                          className="w-full bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Shield size={18} className="text-blue-500 dark:text-blue-400" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-200">Authentification à deux facteurs</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {security.twoFactorEnabled ? 'Activée' : 'Désactivée'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggle2FA}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          security.twoFactorEnabled 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                          security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bell size={18} className="text-blue-500 dark:text-blue-400" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-200">Notifications</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Gérer les préférences de notification
                          </p>
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Configurer
                      </button>
                    </div>
                  </div>

                  {/* Suppression de compte */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 flex items-center gap-2 transition-colors">
                      <XCircle size={18} />
                      <span>Supprimer le compte</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;