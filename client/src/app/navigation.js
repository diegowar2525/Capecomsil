// El menú se deriva del registro de rutas, sin duplicar destinos ni etiquetas.
export function getNavigation(routes) {
    return routes.reduce((groups, route) => {
        if (!route.section) return groups;
        let group = groups.find((item) => item.section === route.section);
        if (!group) {
            group = { section: route.section, items: [] };
            groups.push(group);
        }
        group.items.push({ path: route.path, label: route.label });
        return groups;
    }, []);
}
