import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Wrench, Home, ChevronRight } from 'lucide-react';
import MainPage from './pages/MainPage';
import DentAnalysisTool from './components/DentAnalysisTool';
import DentDetection from './components/DentDetection';
const NavLink = ({ to, children, icon: Icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out space-x-2
        ${isActive 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-1" />}
    </Link>
  );
};

const MobileNav = ({ isOpen, setIsOpen }) => (
  <div className={`
    fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `}>
    <div className="relative flex flex-col w-72 h-full bg-white shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-lg font-semibold text-gray-900">Menu</span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        <NavLink to="/" icon={Home}>Home</NavLink>
        <NavLink to="/label" icon={Wrench}>Labeling Tool</NavLink>
        <NavLink to="/display" icon={Wrench}>Overlay Display</NavLink>
      </nav>
    </div>
    <div 
      className="absolute inset-0 z-negative bg-gray-600 bg-opacity-50"
      onClick={() => setIsOpen(false)}
    />
  </div>
);

function Navigation() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Dent Detection
              </span>
            </Link>
            <div className="hidden md:flex md:ml-10 md:space-x-4">
              <NavLink to="/" icon={Home}>Home</NavLink>
              <NavLink to="/label" icon={Wrench}>Labeling Tool</NavLink>
              <NavLink to="/display" icon={Wrench}>Overlay Display</NavLink>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} setIsOpen={setIsMobileNavOpen} />
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="relative">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/label" element={<DentAnalysisTool />} />
            <Route path="/display" element={<DentDetection />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;