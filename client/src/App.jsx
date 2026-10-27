import { AuthProvider } from './modules/auth/context/AuthProvider.jsx';
import { useAuth } from './modules/auth/hooks/useAuth.js';
import { puedeVerRuta } from './app/routePermissions.js';
import { SesionGate } from './modules/login/components/SesionGate.jsx';
import { PerfilProvider } from './modules/perfil/context/PerfilProvider.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AppRoutes } from './app/AppRoutes.jsx';
import { routes } from './app/routes.jsx';
import { getNavigation } from './app/navigation.js';
import { useLocation } from './app/useLocation.js';

function Panel() {
    const path = useLocation();
    const { permisos } = useAuth();
    const navigation = getNavigation(routes.filter(route => puedeVerRuta(route, permisos)));
    return <AppLayout navigation={navigation} activePath={path}><AppRoutes path={path} /></AppLayout>;
}

export function App() {
    return (
        <AuthProvider><PerfilProvider><SesionGate>
            <Panel />
        </SesionGate></PerfilProvider></AuthProvider>
    );
}

export default App;
