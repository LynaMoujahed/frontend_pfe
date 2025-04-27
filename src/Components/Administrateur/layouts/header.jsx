import { useState } from "react";
import { useTheme } from "../../../hooks/use-theme";
import { Bell, ChevronsLeft, Moon, Search, Sun, User, LogOut } from "lucide-react";
import profileImg from "../../../assets/profile-image.jpg";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();

    const handleProfileAction = (action) => {
        setShowProfileMenu(false);
        if (action === "profile") {
            navigate("/admin/settings"); // Assurez-vous d'avoir cette route configurée
        } else if (action === "logout") {
            // Ajoutez ici votre logique de déconnexion
            console.log("Déconnexion...");
            // Exemple : localStorage.removeItem('token');
            // navigate('/login');
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
                    <Sun
                        size={20}
                        className="dark:hidden"
                    />
                    <Moon
                        size={20}
                        className="hidden dark:block"
                    />
                </button>
                <button className="btn-ghost size-10">
                    <Bell size={20} />
                </button>

                {/* Menu profil */}
                <div className="relative">
                    <button
                        className="size-10 overflow-hidden rounded-full"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <img
                            src={profileImg}
                            alt="profile image"
                            className="size-full object-cover"
                        />
                    </button>

                    {/* Menu déroulant */}
                    {showProfileMenu && (
                        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-slate-800">
                            <button
                                onClick={() => handleProfileAction("profile")}
                                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                            >
                                <User
                                    className="mr-2"
                                    size={16}
                                />
                                Gestion du profil
                            </button>
                            <button
                                onClick={() => handleProfileAction("logout")}
                                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
                            >
                                <LogOut
                                    className="mr-2"
                                    size={16}
                                />
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
