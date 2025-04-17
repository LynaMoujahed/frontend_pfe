import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  BarChart2,
  Mail,
  AlertCircle
} from 'lucide-react';
import pharmaLearnLogo from "../../../assets/PharmaLearn.png";

const Sidebar = ({ collapsed }) => {
  return (
    <aside className={`fixed top-0 left-0 z-20 h-screen bg-white shadow-md transition-all duration-300 dark:bg-slate-800 ${collapsed ? "w-16" : "w-64"}`}>
      <div className={`flex h-[60px] items-center border-b border-gray-200 dark:border-slate-700 ${collapsed ? "justify-center" : "px-4"}`}>
        <div className="flex items-center gap-2">
          <img 
            src={pharmaLearnLogo} 
            alt="PharmaLearn Logo" 
            className="h-8 w-auto"
          />
          {!collapsed && <h2 className="text-xl font-semibold text-gray-800 dark:text-white">PharmaLearn</h2>}
        </div>
      </div>
      
      <nav className="mt-4 space-y-1 px-2">
        <NavLink
          to="/apprenant"
          className={({ isActive }) => 
            `flex items-center p-3 mx-2 rounded-lg transition-colors ${
              isActive 
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            } ${collapsed ? "justify-center" : "gap-3"}`
          }
        >
          <Home size={20} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink
          to="/apprenant/cours"
          className={({ isActive }) => 
            `flex items-center p-3 mx-2 rounded-lg transition-colors ${
              isActive 
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            } ${collapsed ? "justify-center" : "gap-3"}`
          }
        >
          <BookOpen size={20} />
          {!collapsed && <span>Mes Cours</span>}
        </NavLink>

        <NavLink
          to="/apprenant/progression"
          className={({ isActive }) => 
            `flex items-center p-3 mx-2 rounded-lg transition-colors ${
              isActive 
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            } ${collapsed ? "justify-center" : "gap-3"}`
          }
        >
          <BarChart2 size={20} />
          {!collapsed && <span>Progression</span>}
        </NavLink>

        <NavLink
          to="/apprenant/messagerie"
          className={({ isActive }) => 
            `flex items-center p-3 mx-2 rounded-lg transition-colors ${
              isActive 
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            } ${collapsed ? "justify-center" : "gap-3"}`
          }
        >
          <Mail size={20} />
          {!collapsed && <span>Messagerie</span>}
        </NavLink>

        <NavLink
          to="/apprenant/reclamation"
          className={({ isActive }) => 
            `flex items-center p-3 mx-2 rounded-lg transition-colors ${
              isActive 
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            } ${collapsed ? "justify-center" : "gap-3"}`
          }
        >
          <AlertCircle size={20} />
          {!collapsed && <span>Réclamation</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;