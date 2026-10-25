import { SesionGate } from './modules/login/components/SesionGate.jsx';
import { PerfilProvider } from './modules/perfil/context/PerfilProvider.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AppRoutes } from './app/AppRoutes.jsx';
import { routes } from './app/routes.jsx';
import { getNavigation } from './app/navigation.js';
import { useLocation } from './app/useLocation.js';

const navigation = getNavigation(routes);

export function App() {
    const path = useLocation();
    return (
        <PerfilProvider><SesionGate>
            <AppLayout navigation={navigation} activePath={path}>
                <AppRoutes path={path} />
            </AppLayout>
        </SesionGate></PerfilProvider>
    );
}

export default App;



