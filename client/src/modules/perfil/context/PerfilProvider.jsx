import { PerfilContext } from './perfil.context.js';
import { actualizarPerfil } from '../services/perfil.api.js';
import { useAuth } from '../../auth/hooks/useAuth.js';

export function PerfilProvider({ children }) {
    const { usuario, loading, error, recargar, actualizarUsuario } = useAuth();
    const guardar = async (data) => {
        const actualizado = await actualizarPerfil(data);
        actualizarUsuario(actualizado);
        return actualizado;
    };
    return <PerfilContext.Provider value={{ usuario, loading, error, recargar, guardar }}>{children}</PerfilContext.Provider>;
}
