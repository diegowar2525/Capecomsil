import { createContext } from 'react';
export const AuthContext = createContext({ usuario: null, permisos: [], loading: true, error: '' });
