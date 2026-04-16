import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeAtmoMap = {
  '/': { cls: 'atmo-landing', img: '/assets/bg-glow-figure.jpg' },
  '/home': { cls: 'atmo-home', img: '/assets/bg-glow-figure.jpg' },
  '/circles': { cls: 'atmo-circles', img: '/assets/bg-colorful-back.jpg' },
  '/profile': { cls: 'atmo-profile', img: '/assets/bg-glow-figure.jpg' },
  '/companion': { cls: 'atmo-companion', img: '/assets/bg-dancer.jpg' },
  '/hub': { cls: 'atmo-hub', img: '/assets/bg-dancer.jpg' },
  '/assessment': { cls: 'atmo-assessment', img: null },
  '/settings/data': { cls: 'atmo-home', img: '/assets/bg-glow-figure.jpg' },
  '/onboarding': { cls: 'atmo-companion', img: '/assets/bg-dancer.jpg' },
  '/signup': { cls: 'atmo-companion', img: '/assets/bg-dancer.jpg' },
};

export default function AtmosphericBg() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let entry = routeAtmoMap[path];
    if (!entry && path.startsWith('/circles/')) entry = routeAtmoMap['/circles'];
    if (!entry) entry = routeAtmoMap['/home'];

    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('atmo-') && c !== 'revealing' && c !== 'revealed')
      .join(' ');
    document.body.classList.add(entry.cls);
    document.body.style.setProperty('--atmo-img', entry.img ? `url(${entry.img})` : 'none');

    return () => {
      document.body.className = document.body.className
        .split(' ')
        .filter(c => !c.startsWith('atmo-') && c !== 'revealing' && c !== 'revealed')
        .join(' ');
    };
  }, [location.pathname]);

  return null;
}
