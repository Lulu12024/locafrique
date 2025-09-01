
import { useState, useEffect } from 'react';

export const useScrollBehavior = () => {
  const [scrollY, setScrollY] = useState(0);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Afficher la barre de recherche scrollable après 150px de scroll
      setShowScrollSearch(currentScrollY > 150);
      
      // Cacher la navbar après 100px de scroll
      setHideNavbar(currentScrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { scrollY, showScrollSearch, hideNavbar };
};
