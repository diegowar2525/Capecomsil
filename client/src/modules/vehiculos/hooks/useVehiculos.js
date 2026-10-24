import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/vehiculos.api.js';

export function useVehiculos() {
    return useCatalogo(api, 'id_vehiculo');
}
