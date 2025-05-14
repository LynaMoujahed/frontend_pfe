import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";

const Layout = ({ children }) => {
  return (
    <main className="custom-scrollbar h-[calc(100vh-60px)] overflow-y-auto p-6">
      <div className="transition-all duration-300">
        {children || <Outlet />}
      </div>
    </main>
  );
};

Layout.propTypes = {
  children: PropTypes.node,
};

export default Layout;
