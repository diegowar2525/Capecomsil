import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/gasolineras.api.js';

export function useGasolineras() {
    return useCatalogo(api, 'id_gasolinera');
}
