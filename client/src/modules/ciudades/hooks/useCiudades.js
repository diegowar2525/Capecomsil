import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/ciudades.api.js';

export function useCiudades() {
    return useCatalogo(api, 'id_ciudad');
}
