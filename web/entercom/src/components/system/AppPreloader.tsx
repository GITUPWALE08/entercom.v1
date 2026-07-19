import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import logo from '../../assets/logo.png';
import '../../styles/preloader.css';

export function AppPreloader() {
  const { isInitialized } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      // Start fade out
      setIsVisible(false);
      // Remove from DOM after transition completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // matches CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  if (!shouldRender) return null;

  return (
    <div className={`app-preloader ${!isVisible ? 'fade-out' : ''}`}>
      <div className="preloader-content">
        <img src={logo} alt="Entercom Logo" className="preloader-logo" />
        <div className="preloader-spinner"></div>
      </div>
    </div>
  );
}
