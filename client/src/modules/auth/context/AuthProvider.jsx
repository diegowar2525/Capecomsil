import { useEffect, useRef, useState } from 'react';
import { AuthContext } from './auth.context.js';
import { consultarSesion } from '../services/auth.api.js';

const empty = { usuario: null, permisos: [], loading: false, error: '' };
export function AuthProvider({ children }) {
    const [state, setState] = useState({ ...empty, loading: true });
    const [revision, setRevision] = useState(0);
    const pending = useRef(null);
    const establecerSesion = () => {
        pending.current?.abort();
        setState(empty);
    };
    useEffect(() => {
        const expire = () => establecerSesion();
        window.addEventListener('sesion-expirada', expire);
        return () => window.removeEventListener('sesion-expirada', expire);
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        pending.current = controller;
        consultarSesion(controller.signal).then((session) => {
            if (!controller.signal.aborted) setState({ ...session, loading: false, error: '' });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ ...empty, error: error.status === 401 ? '' : error.message });
        });
        return () => controller.abort();
    }, [revision]);
    const recargar = () => {
        pending.current?.abort();
        setState({ ...empty, loading: true });
        setRevision(value => value + 1);
    };
    const actualizarUsuario = (usuario) => setState(previous =>
        previous.usuario?.id_usuario === usuario.id_usuario ? { ...previous, usuario } : previous);
    return <AuthContext.Provider value={{ ...state, recargar, establecerSesion, actualizarUsuario }}>{children}</AuthContext.Provider>;
}
