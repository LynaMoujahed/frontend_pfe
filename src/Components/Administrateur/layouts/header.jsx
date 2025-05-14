import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../../hooks/use-theme";
import {
  ChevronsLeft,
  Moon,
  Sun,
  User,
  LogOut,
  UserCircle,
} from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth-context";
import NotificationCenter from "../../Common/NotificationCenter";

export const Header = ({ collapsed, setCollapsed }) => {
  const { theme, setTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileAction = (action) => {
    setShowProfileMenu(false);
    if (action === "profile") {
      navigate("/admin/settings");
    } else if (action === "logout") {
      logout();
      navigate("/login");
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    // Rediriger vers la page appropriée en fonction du type de notification
    if (notification.messagerie) {
      navigate("/admin/messagerie");
    } else if (notification.reclamation) {
      navigate("/admin/reclamations");
    } else if (notification.certificat) {
      navigate("/admin/certificats");
    } else if (notification.evaluation) {
      navigate("/admin/evaluations");
    } else if (notification.evenement) {
      navigate("/admin/evenements");
    }
  };

  return (
    <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
      <div className="flex items-center gap-x-3">
        <button
          className="btn-ghost size-10"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronsLeft className={collapsed && "rotate-180"} />
        </button>
      </div>
      <div className="flex items-center gap-x-3">
        <button
          className="btn-ghost size-10"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun size={20} className="dark:hidden" />
          <Moon size={20} className="hidden dark:block" />
        </button>

        {/* Notifications Center */}
        <NotificationCenter
          onNotificationClick={handleNotificationClick}
          buttonClassName="relative btn-ghost size-10"
          iconClassName="size-5"
        />

        {/* Menu profil */}
        <div className="relative">
          <button
            className="size-10 overflow-hidden rounded-full"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {user && user.profileImage ? (
              <img
                src={`https://127.0.0.1:8000${user.profileImage}`}
                alt="profile image"
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <UserCircle
                  className="text-gray-400 dark:text-gray-500"
                  size={24}
                />
              </div>
            )}
          </button>

          {/* Menu déroulant */}
          {showProfileMenu && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-slate-800">
              <button
                onClick={() => handleProfileAction("profile")}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <User className="mr-2" size={16} />
                Gestion du profil
              </button>
              <button
                onClick={() => handleProfileAction("logout")}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <LogOut className="mr-2" size={16} />
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
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
};
