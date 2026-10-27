import { routes } from './routes.jsx';
import { useAuth } from '../modules/auth/hooks/useAuth.js';
import { puedeVerRuta } from './routePermissions.js';

export function AppRoutes({ path }) {
    const { permisos } = useAuth();
    const route = routes.find((item) => item.path === path);
    if (!route) {
        return (
            <section>
                <h1>Página no encontrada</h1>
                <a href="#/dashboard">Volver al inicio</a>
            </section>
        );
    }
    const { Component } = route;
    if (!puedeVerRuta(route, permisos)) return <section><h1>Acceso restringido</h1><p>No tienes permiso para consultar esta página.</p></section>;
    return <Component key={path} />;
}
