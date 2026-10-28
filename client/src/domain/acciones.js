export function accionDisponible(action, row, permisos = []) {
    return (!action.permission || permisos.includes(action.permission))
        && (!action.states || action.states.includes(row?.estado))
        && (!action.requiresFinished || Boolean(row?.fecha_fin))
        && (!action.requiresOpen || !row?.fecha_fin)
        && (!action.available || action.available(row));
}

const iconosPrincipales = { detail: 'eye', edit: 'pencil', delete: 'trash', annul: 'ban' };

// Mantiene la misma organización en todos los módulos, sin cambiar sus operaciones.
export function organizarAcciones(actions, resource = 'catalogos', single = false) {
    const operaciones = { detail: 'consultar', edit: 'editar', delete: 'eliminar', annul: 'anular' };
    return actions.map(action => ({
        ...action,
        permission: action.permission ?? (single ? undefined : `${resource}.${operaciones[action.id] ?? 'consultar'}`),
        ...(iconosPrincipales[action.id] ? { icon: iconosPrincipales[action.id] } : {}),
        ...(!action.global && !action.parent && !iconosPrincipales[action.id] ? { parent: 'detail' } : {})
    }));
}

export function accionesDeFila(actions, row, permisos) {
    const disponibles = actions.filter(action => !action.global && !action.parent && accionDisponible(action, row, permisos));
    return [disponibles.find(action => action.id === 'detail'),
        disponibles.find(action => action.id === 'edit'),
        disponibles.find(action => action.id === 'annul') ?? disponibles.find(action => action.id === 'delete')].filter(Boolean);
}
