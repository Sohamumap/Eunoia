import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeAtmoMap = {
  '/': 'atmo-landing',
  '/circles': 'atmo-circles',
  '/profile': 'atmo-profile',
  '/companion': 'atmo-companion',
  '/assessment': 'atmo-assessment',
  '/hub': 'atmo-companion',
  '/settings/data': 'atmo-companion',
  '/onboarding': 'atmo-companion',
};

export default function AtmosphericBg() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Find matching route (handle /circles/:id)
    let atmoClass = routeAtmoMap[path];
    if (!atmoClass && path.startsWith('/circles/')) atmoClass = 'atmo-circles';
    if (!atmoClass) atmoClass = 'atmo-companion';

    // Remove all atmo classes
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('atmo-') && c !== 'revealing' && c !== 'revealed')
      .join(' ');
    document.body.classList.add(atmoClass);

    return () => {
      document.body.className = document.body.className
        .split(' ')
        .filter(c => !c.startsWith('atmo-') && c !== 'revealing' && c !== 'revealed')
        .join(' ');
    };
  }, [location.pathname]);

  return null;
}
