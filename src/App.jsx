import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, Monitor, ArrowRight, Calculator } from 'lucide-react';
import LogRocket from 'logrocket';
import MainPage from './pages/MainPage';
import DentDetection from './components/DentDetection';
import logo from "/src/assets/OBAI_Branding_FullColorLogo.png"
import Appraiser from './components/Appraiser';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const NavItem = ({ to, children, isExternal = false, href, onClose }) => {
  const location = useLocation();
  const isActive = !isExternal && location.pathname === to;
  
  const baseClasses = "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg group";
  const activeClasses = isActive 
    ? "text-orange-600 bg-orange-50 shadow-sm" 
    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100";

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${activeClasses}`}
        onClick={onClose}
      >
        {children}
      </a>
    );
  }

  return (
    <Link 
      to={to} 
      className={`${baseClasses} ${activeClasses}`}
      onClick={onClose} 
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
      )}
    </Link>
  );
};

const MobileMenu = ({ isOpen, onClose }) => (
  <>
    {/* Backdrop */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
        onClick={onClose}
      />
    )}
    
    {/* Slide-out menu */}
    <div className={`
      fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out
      ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <img src={logo} alt="OBAI Logo" className="h-8 filter drop-shadow-sm" />
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-6 py-8 space-y-3 bg-gradient-to-b from-white to-gray-50">
          <div className="space-y-2">
            <NavItem to="/" onClose={onClose}>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Home className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium">Home</span>
              </div>
            </NavItem>
            
            <NavItem to="/display" onClose={onClose}>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">Dent Detection</span>
              </div>
            </NavItem>

            <NavItem to="/appraiser" onClose={onClose}>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Calculator className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium">Appraisal Tech</span>
              </div>
            </NavItem>
          </div>

          {/* Elegant Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs text-gray-400 bg-white font-medium tracking-wider uppercase">Connect</span>
            </div>
          </div>

          {/* Enhanced CTA Button */}
          <a
            href="https://calendly.com/team-obai/intro-conversation"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 text-white bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={onClose}
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold block">Talk to the Team</span>
                <span className="text-xs text-orange-100 opacity-90">Schedule a conversation</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </a>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            © 2024 OBAI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </>
);

function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Track route changes with LogRocket
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src={logo} 
                alt="OBAI Logo" 
                className="h-8 transition-all duration-200 group-hover:scale-105 filter drop-shadow-sm" 
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <NavItem to="/">Home</NavItem>
              <NavItem to="/display">Dent Detection</NavItem>
              <NavItem to="/appraiser">Appraisal Tech</NavItem>
              
              {/* Desktop CTA Button */}
              <div className="ml-8 pl-8 border-l border-gray-200">
                <a
                  href="https://calendly.com/team-obai/intro-conversation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 space-x-2 group transform hover:scale-105 active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Talk to the Team</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                </a>
              </div>
            </div>

            {/* Mobile Menu Button - NO HOVER EFFECTS */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-3 text-gray-600 rounded-lg transition-colors duration-200 active:bg-gray-100 active:scale-95"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
}

// Component that handles LogRocket initialization and routing
function AppContent() {
  const location = useLocation();

  // Initialize LogRocket
  useEffect(() => {
    LogRocket.init('obai-jpwyy/obai-frontend');

    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    
    const anonymousId = `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
    
    LogRocket.identify(anonymousId, {
      name: `Anonymous User ${anonymousId}`,
      visitTime: now.toISOString()
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <ScrollToTop />
      <Navigation />
      <main className="relative">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/display" element={<DentDetection />} />
          <Route path="/appraiser" element={<Appraiser />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;