import { routes } from './routes.jsx';

export function AppRoutes({ path }) {
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
    return <Component key={path} />;
}
