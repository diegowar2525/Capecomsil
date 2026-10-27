import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/viajes.api.js';
export const useViajes = () => useCatalogo(api, 'id_viaje');
