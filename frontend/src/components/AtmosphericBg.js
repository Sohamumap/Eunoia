import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeAtmoMap = {
  '/': 'atmo-landing',
  '/home': 'atmo-home',
  '/circles': 'atmo-circles',
  '/profile': 'atmo-profile',
  '/companion': 'atmo-companion',
  '/hub': 'atmo-hub',
  '/assessment': 'atmo-assessment',
  '/settings/data': 'atmo-home',
  '/onboarding': 'atmo-companion',
  '/signup': 'atmo-companion',
};

export default function AtmosphericBg() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let className = routeAtmoMap[path];
    if (!className && path.startsWith('/circles/')) className = routeAtmoMap['/circles'];
    if (!className) className = routeAtmoMap['/home'];

    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('atmo-') && c !== 'revealing' && c !== 'revealed')
      .join(' ');
    document.body.classList.add(className);

    return () => {
      document.body.className = document.body.className
        .split(' ')
        .filter(c => !c.startsWith('atmo-') && c !== 'revealing' && c !== 'revealed')
        .join(' ');
    };
  }, [location.pathname]);

  return null;
}
