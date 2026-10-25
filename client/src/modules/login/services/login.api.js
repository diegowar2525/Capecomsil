import { requestJson } from '../../../services/http.js';

export const iniciarSesion = (data) => requestJson('/api/auth/login', { method: 'POST', data });
export const cerrarSesion = () => requestJson('/api/auth/logout', { method: 'POST' });
export const cambiarPassword = (data) => requestJson('/api/auth/password', { method: 'PATCH', data });
