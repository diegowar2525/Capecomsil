import { requestJson } from '../../../services/http.js';

export const listarVehiculos = (signal) => requestJson('/api/vehiculos', { signal });
export const consultarVehiculo = (id, signal) => requestJson(`/api/vehiculos/${id}`, { signal });
export const crearVehiculo = (data) => requestJson('/api/vehiculos', { method: 'POST', data });
export const actualizarVehiculo = (id, data) => requestJson(`/api/vehiculos/${id}`, { method: 'PUT', data });
export const eliminarVehiculo = (id) => requestJson(`/api/vehiculos/${id}`, { method: 'DELETE' });
export const consultarKilometraje = (id, fecha, signal) => {
    const query = fecha ? `?${new URLSearchParams({ fecha_hasta: fecha })}` : '';
    return requestJson(`/api/vehiculos/${id}/kilometraje${query}`, { signal });
};

export const api = {
    listar: listarVehiculos,
    consultar: consultarVehiculo,
    crear: crearVehiculo,
    actualizar: actualizarVehiculo,
    eliminar: eliminarVehiculo,
    ejecutar: (action, id, values) => {
        if (action !== 'kilometraje') throw new Error('Acción no admitida.');
        return consultarKilometraje(id, values.fecha_hasta);
    }
};
