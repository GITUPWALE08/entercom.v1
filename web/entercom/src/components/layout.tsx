import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Mail, ArrowRight, FacebookIcon, InstagramIcon} from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useLogout';
import HeroSection from './hero';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useLogout();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Products', path: '/products' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-row min-h-screen font-sans w-full">
      <div className="flex-1 flex flex-col min-h-screen font-sans relative">
        {/* Top Bar - Hidden on Mobile to save space */}
        <div className="bg-ess-navy text-white text-xs py-2 px-4 hidden md:flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 opacity-80 hover:opacity-100 transition"><Phone size={13} /> Call for Free Site Check</span>
            <span className="flex items-center gap-1 opacity-80 hover:opacity-100 transition"><Mail size={13} /> sales@entercomsecurity.com</span>
          </div>
          <div className="flex gap-4 opacity-80">
            <Link to="/contact" className="hover:text-white transition">Support</Link>
          </div>
        </div>

        {/* Main Navbar */}
        <header className={`sticky top-0 z-50 transition-all duration-100 ${isMenuOpen ? 'bg-white' : 'bg-white/95 backdrop-blur-md shadow-sm'}`}>
          <div className="container mx-auto px-4 h-16 md:h-20 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
                {/* Image Logo */}
                <div className="group-hover:scale-105 transition-transform duration-100">
                  <img 
                    src={logo} 
                    alt="ESS Logo" 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-ess-navy tracking-tight leading-none">ESS</h1>
                  <p className="text-[0.65rem] font-bold tracking-[0.2em] text-gray-500 uppercase">Entercom</p>
                </div>
              </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-ess-purple ${
                    isActive(link.path) ? 'text-ess-purple font-bold' : 'text-gray-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to={`/portal/${user?.role?.toLowerCase() || 'customer'}`} 
                    className="text-sm font-bold text-ess-navy hover:text-ess-purple transition-colors"
                  >
                    Go to Portal
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/login"
                    className="text-sm font-bold text-ess-navy hover:text-ess-purple transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    className="text-sm font-bold text-ess-navy hover:text-ess-purple transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link 
                    to="/contact" 
                    className="bg-ess-purple hover:bg-ess-darkPurple text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-purple-200 text-sm hover:scale-105 active:scale-95"
                  >
                    Get a Quote
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 text-ess-navy relative z-50 focus:outline-none bg-white"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Full Screen Menu Overlay */}
          <div className={`fixed inset-0 bg-white z-40 flex flex-col pt-28 px-6 transition-transform duration-100 ease-in-out md:hidden ${isMenuOpen ? 'flex translate-x-0' : 'hidden translate-x-full'}`}>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  className={`text-xl font-bold py-4 border-b border-gray-100 flex justify-between items-center ${
                    isActive(link.path) ? 'text-ess-purple' : 'text-ess-navy'
                  }`}
                >
                  {link.name}
                  <ArrowRight size={20} className="opacity-20" />
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto mb-8 space-y-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={`/portal/${user?.role?.toLowerCase() || 'customer'}`}
                    className="block w-full bg-ess-navy text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg"
                  >
                    Go to Portal
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      navigate('/');
                    }}
                    className="block w-full bg-red-50 text-red-600 text-center py-4 rounded-xl font-bold text-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="block w-full bg-gray-100 text-ess-navy text-center py-4 rounded-xl font-bold text-lg"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    className="text-sm font-bold text-ess-navy hover:text-ess-purple transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link 
                    to="/contact" 
                    className="block w-full bg-ess-purple text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200"
                  >
                    Get a Free Quote
                  </Link>
                </>
              )}
              <div className="flex flex-col gap-3 text-sm text-gray-500 text-center mt-6">
                <a href="tel:+2348001234567" className="flex items-center justify-center gap-2 py-2">
                  <Phone size={16} /> +234 800 123 4567
                </a>
                <a href="mailto:sales@entercomsecsys.com" className="flex items-center justify-center gap-2 py-2">
                  <Mail size={16} /> sales@entercomsecsys.com
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Hero */}
        <div className="block lg:hidden">
           <HeroSection />
        </div>

        {/* Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Simplified Footer for Mobile */}
        <footer className="bg-slate-900 text-gray-400 py-12 border-t border-slate-800">
            <div className="container mx-auto px-6 max-w-7xl text-center md:text-left">
              <div className="grid md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4 text-white">
                      <div className="group-hover:scale-105 transition-transform duration-100">
                        <img 
                          src={logo} 
                          alt="ESS Logo" 
                          className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                        />
                      </div>
                      <span className="text-xl font-bold">ENTERCOM SECURITY</span>
                    </div>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Providing practical security solutions for homes and small businesses
                    </p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/services" className="hover:text-ess-purple">Services</Link></li>
                    <li><Link to="/products" className="hover:text-ess-purple">Products</Link></li>
                    <li><Link to="/contact" className="hover:text-ess-purple">Contact Support</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Office</h4>
                  <p className="text-sm">Ogun, Oyo & Lagos, Nigeria</p>
                  <p className="text-sm p-0 mt-2">+234 816 739 2243</p>
                  <p className="text-sm p-0 mt-2">+234 813 031 8817</p>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-4">Socials</h4>
                  <p className="text-gray-500 text-sm mb-2">Reach out to us on our social media pages:</p>
                  <a href="https://www.instagram.com/p/DUWwu5xiA70/?igsh=anI1aTVoaGQ5MzJq" className="text-ess-purple font-semibold flex mt-4"><InstagramIcon size={24}/>  Instagram</a>


                  <a href="https://www.facebook.com/share/p/1GynGrWXhM/" className="text-ess-purple font-semibold flex mt-4"><FacebookIcon size={24} /> Facebook</a>
                </div>
              </div>


              <div className="border-t border-slate-800 mt-12 pt-8 text-xs text-slate-600 flex justify-between items-center">
                <span>© {new Date().getFullYear()} Entercom Security Systems.</span>
                <span>Privacy Policy</span>
              </div>
            </div>
        </footer>
      </div>
      
      {/* Desktop Hero */}
      <div className="hidden lg:flex lg:flex-1 lg:min-w-[35vw] lg:max-w-[55vw]">
        <HeroSection />
      </div>
    </div>
  );
};

export default Layout;