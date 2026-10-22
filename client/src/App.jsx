import { AppLayout } from './layouts/AppLayout.jsx';
import { AppRoutes } from './app/AppRoutes.jsx';
import { routes } from './app/routes.jsx';
import { getNavigation } from './app/navigation.js';
import { useLocation } from './app/useLocation.js';

const navigation = getNavigation(routes);

export function App() {
    const path = useLocation();
    return (
        <AppLayout navigation={navigation} activePath={path}>
            <AppRoutes path={path} />
        </AppLayout>
    );
}

export default App;
