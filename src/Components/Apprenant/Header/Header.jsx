import { useState, useRef, useEffect } from 'react';
import { useTheme } from "../../../hooks/use-theme";
import { Bell, ChevronsLeft, Moon, Sun, User, LogOut, X } from "lucide-react";
import profileImg from "../../../assets/profile-image.jpg";
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onClick }) => (
  <div 
    className={`p-3 border-b border-gray-100 dark:border-slate-700 cursor-pointer transition-colors ${
      !notification.read 
        ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" 
        : "hover:bg-gray-50 dark:hover:bg-slate-700"
    }`}
    onClick={() => onClick(notification.id)}
  >
    <div className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Il y a 2 heures
    </div>
  </div>
);

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

export const Header = ({ collapsed, setCollapsed, notifications, onNotificationRead }) => {
  const { theme, setTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (showProfileMenu && profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileMenu]);

  const handleProfileAction = (action) => {
    setShowProfileMenu(false);
    if (action === "profile") {
      navigate("/apprenant/profile"); // Updated to navigate to profile page
    } else if (action === "logout") {
      console.log("Déconnexion...");
      // Add your logout logic here
    }
  };

  const handleNotificationClick = (id) => {
    onNotificationRead(id);
    setShowNotifications(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => !prev);
    setShowNotifications(false);
  };

  return (
    <header className="relative z-50 flex h-[60px] items-center justify-between bg-white px-4 shadow-md dark:bg-slate-900">
      <div className="flex items-center gap-x-3">
        <button
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
      
      <div className="flex items-center gap-x-3">
        <button
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <Sun className="w-5 h-5 text-gray-700 dark:hidden" />
          <Moon className="w-5 h-5 text-gray-300 hidden dark:block" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 z-50">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700">
                <h3 className="font-medium text-gray-800 dark:text-white">Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <NotificationItem 
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    Aucune notification
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            className="w-10 h-10 overflow-hidden rounded-full hover:ring-2 hover:ring-gray-300 dark:hover:ring-slate-600"
            onClick={toggleProfileMenu}
            aria-label="User profile"
          >
            <img
              src={profileImg}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 z-50">
              <button
                onClick={() => handleProfileAction("profile")}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <User className="w-4 h-4 mr-2" />
                Mon Profil
              </button>
              <button
                onClick={() => handleProfileAction("logout")}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  setCollapsed: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired,
  onNotificationRead: PropTypes.func.isRequired
};

export default Header;