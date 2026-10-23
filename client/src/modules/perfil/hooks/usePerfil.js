import { useContext } from 'react';
import { PerfilContext } from '../context/perfil.context.js';

export function usePerfil() {
    return useContext(PerfilContext);
}
