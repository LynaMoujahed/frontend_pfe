import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900">
      <main className="flex-1 p-4 sm:p-6 text-gray-900 dark:text-gray-100">
        <div className="mx-auto max-w-7xl">
          {children || <Outlet />}
        </div>
      </main>

      <footer className="bg-inherit shadow">
  <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
      © {new Date().getFullYear()} PharmaLearn. Tous droits réservés.
    </p>
  </div>
</footer>

    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node
};

export default Layout;