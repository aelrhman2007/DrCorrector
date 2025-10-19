
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Header: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { theme, toggleTheme } = context;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg transition-colors text-sm md:text-base ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
              DrC
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">DrCorrector</h1>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              رفع
            </NavLink>
            <NavLink to="/review" className={navLinkClass}>
              عرض النتائج
            </NavLink>
            <NavLink to="/preferences" className={navLinkClass}>
              الإعدادات
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <i className="fas fa-sun text-yellow-400 text-lg"></i>
            ) : (
              <i className="fas fa-moon text-gray-700 text-lg"></i>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Navigation */}
      <nav className="md:hidden flex justify-around items-center p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <NavLink to="/" className={navLinkClass}>
          <i className="fas fa-upload mr-1"></i> رفع
        </NavLink>
        <NavLink to="/review" className={navLinkClass}>
          <i className="fas fa-tasks mr-1"></i> النتائج
        </NavLink>
        <NavLink to="/preferences" className={navLinkClass}>
          <i className="fas fa-cog mr-1"></i> الإعدادات
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;
