import { useEffect, useState } from 'react';

export function useCatalogo(api, rowKey) {
    const [state, setState] = useState({ data: [], loading: true, error: '' });
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        api.listar(controller.signal).then((data) => {
            if (!Array.isArray(data)) throw new Error('El servidor no devolvió un listado válido.');
            if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ data: [], loading: false, error: error.message });
        });
        return () => controller.abort();
    }, [api, revision]);
    const recargar = () => {
        setState({ data: [], loading: true, error: '' });
        setRevision((value) => value + 1);
    };
    const guardar = async (id, data) => {
        const registro = id ? await api.actualizar(id, data) : await api.crear(data);
        setState((previous) => ({ ...previous, data: id
            ? previous.data.map((item) => item[rowKey] === id ? registro : item)
            : [registro, ...previous.data] }));
        return registro;
    };
    const eliminar = async (id, registro) => {
        await api.eliminar(id, registro);
        setState((previous) => ({ ...previous, data: previous.data.filter((item) => item[rowKey] !== id) }));
    };
    const ejecutar = (accion, id, values) => api.ejecutar(accion, id, values);
    return { ...state, recargar, guardar, eliminar, ejecutar };
}
