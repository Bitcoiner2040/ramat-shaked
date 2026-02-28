import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Car, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user, userData, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-cyan-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 font-bold text-xl flex items-center gap-2">
                <Car className="h-6 w-6" />
                <span>שטיפת רכב רמת שקד</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4 space-x-reverse">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-cyan-600 transition-colors">בית</Link>
                {user ? (
                  <>
                    <Link to="/booking" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-cyan-600 transition-colors">הזמנת תור</Link>
                    {userData?.role === 'admin' && (
                      <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-cyan-600 transition-colors">ניהול</Link>
                    )}
                    <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-cyan-600 transition-colors flex items-center gap-1">
                      <LogOut className="h-4 w-4" /> יציאה
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-cyan-600 transition-colors">כניסה / הרשמה</Link>
                )}
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-cyan-600 inline-flex items-center justify-center p-2 rounded-md text-cyan-100 hover:text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyan-700 focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-600 transition-colors">בית</Link>
              {user ? (
                <>
                  <Link to="/booking" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-600 transition-colors">הזמנת תור</Link>
                  {userData?.role === 'admin' && (
                    <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-600 transition-colors">ניהול</Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-right block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-600 transition-colors">
                    יציאה
                  </button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-600 transition-colors">כניסה / הרשמה</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <footer className="bg-slate-800 text-slate-300 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} שטיפת רכב רמת שקד. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
