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
import profileImg from "../../../assets/profile-image.jpg";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth-context";
import NotificationCenter from "../../Common/NotificationCenter";

export const Header = ({ collapsed, setCollapsed }) => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showProfileMenu &&
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
  }, [showProfileMenu]);

  const handleProfileAction = (action) => {
    setShowProfileMenu(false);
    if (action === "profile") {
      navigate("/apprenant/profile");
    } else if (action === "logout") {
      console.log("Déconnexion...");
      logout();
      navigate("/login");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    // Rediriger vers la page appropriée en fonction du type de notification
    if (notification.messagerie) {
      navigate("/apprenant/messagerie");
    } else if (notification.reclamation) {
      navigate("/apprenant/reclamations");
    } else if (notification.certificat) {
      navigate("/apprenant/certificats");
    } else if (notification.evaluation) {
      navigate("/apprenant/cours");
    } else if (notification.evenement) {
      navigate("/apprenant/evenements");
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

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={toggleProfileMenu}
            className="btn-ghost size-10 rounded-full"
          >
            <UserCircle size={20} />
          </button>

          {/* Menu déroulant */}
          {showProfileMenu && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-slate-800">
              <button
                onClick={() => handleProfileAction("profile")}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <User className="mr-2" size={16} />
                Mon Profil
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
  collapsed: PropTypes.bool.isRequired,
  setCollapsed: PropTypes.func.isRequired,
};

export default Header;
