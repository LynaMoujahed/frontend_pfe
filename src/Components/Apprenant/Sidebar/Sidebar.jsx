import { forwardRef } from "react";
import { NavLink } from "react-router-dom";

import { navbarLinks } from "..";
import pharmaLearnLogo from "../../../assets/PharmaLearn.png";
import { cn } from "../../../utils/cn";

import PropTypes from "prop-types";

const Sidebar = forwardRef(({ collapsed }, ref) => {
  return (
    <aside
      ref={ref}
      className={cn(
        "fixed z-[100] flex h-screen w-[240px] flex-col border-r border-slate-300 bg-white [transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1),_background-color_150ms_cubic-bezier(0.4,_0,_0.2,_1),_border_150ms_cubic-bezier(0.4,_0,_0.2,_1)] dark:border-slate-700 dark:bg-slate-900",
        collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
        collapsed ? "max-md:-left-full" : "max-md:left-0"
      )}
    >
      <div className="flex-shrink-0 p-3">
        <div className="flex items-center gap-x-3">
          <img src={pharmaLearnLogo} alt="PharmaLearn" className="h-8 w-auto" />
          {!collapsed && (
            <p className="text-lg font-medium text-slate-900 transition-colors dark:text-slate-50">
              PharmaLearn
            </p>
          )}
        </div>
      </div>
      <nav className="custom-scrollbar flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-y-6">
          {navbarLinks.map((navbarLink) => (
            <nav
              key={navbarLink.title}
              className={cn("sidebar-group", collapsed && "md:items-center")}
            >
              <p
                className={cn(
                  "sidebar-group-title",
                  collapsed && "md:w-[45px]"
                )}
              >
                {navbarLink.title}
              </p>
              {navbarLink.links.map((link) => (
                <NavLink
                  key={link.label}
                  to={`/apprenant/${link.path}`}
                  className={cn("sidebar-item", collapsed && "md:w-[45px]")}
                  end={link.path === ""}
                >
                  <link.icon size={22} className="flex-shrink-0" />
                  {!collapsed && (
                    <p className="whitespace-nowrap">{link.label}</p>
                  )}
                </NavLink>
              ))}
            </nav>
          ))}
        </div>
      </nav>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
};

export default Sidebar;
