import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// This component runs every time the URL path changes
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scrolls the window to the very top (X: 0, Y: 0)
    window.scrollTo(0, 0);
  }, [pathname]); // Triggered whenever the path (URL) changes

  return null; // This component renders nothing to the screen
};

export default ScrollToTop;