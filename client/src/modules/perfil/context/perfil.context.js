import { createContext } from 'react';

export const PerfilContext = createContext({ usuario: null, loading: true, error: '', recargar: () => { }, guardar: async () => { throw new Error('Perfil no disponible'); } });
