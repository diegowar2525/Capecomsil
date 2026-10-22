import { useSyncExternalStore } from 'react';

const subscribe = (listener) => {
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
};

const getLocation = () => {
    const path = window.location.hash.slice(1).split('?')[0].replace(/\/+$/, '');
    return path || '/dashboard';
};

// Rutas hash: funcionan al recargar incluso en hosting estático sin reescrituras.
export function useLocation() {
    return useSyncExternalStore(subscribe, getLocation, () => '/dashboard');
}
