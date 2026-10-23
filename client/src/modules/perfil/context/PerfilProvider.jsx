import { useEffect, useState } from 'react';
import { PerfilContext } from './perfil.context.js';
import { consultarPerfil, actualizarPerfil } from '../services/perfil.api.js';

export function PerfilProvider({ children }) {
    const [state, setState] = useState({ usuario: null, loading: true, error: '' });
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        consultarPerfil(controller.signal).then((usuario) => {
            if (!controller.signal.aborted) setState({ usuario, loading: false, error: '' });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ usuario: null, loading: false, error: error.message });
        });
        return () => controller.abort();
    }, [revision]);
    const recargar = () => {
        setState({ usuario: null, loading: true, error: '' });
        setRevision((value) => value + 1);
    };
    const guardar = async (data) => {
        try {
            const usuario = await actualizarPerfil(data);
            setState({ usuario, loading: false, error: '' });
            return usuario;
        } catch (error) {
            if (error.status === 401) setState({ usuario: null, loading: false, error: error.message });
            throw error;
        }
    };
    return <PerfilContext.Provider value={{ ...state, recargar, guardar }}>{children}</PerfilContext.Provider>;
}
