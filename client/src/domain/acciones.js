export function accionDisponible(action, row, permisos = []) {
    return (!action.permission || permisos.includes(action.permission))
        && (!action.states || action.states.includes(row?.estado))
        && (!action.requiresFinished || Boolean(row?.fecha_fin))
        && (!action.requiresOpen || !row?.fecha_fin)
        && (!action.available || action.available(row));
}
