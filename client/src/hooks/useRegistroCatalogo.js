import { useEffect, useState } from 'react';

export function useRegistroCatalogo(api, id, action) {
    const [state, setState] = useState({ loading: true, error: '', registro: null, catalogos: {}, extra: null });
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        const editable = action === 'create' || action === 'edit';
        Promise.all([
            id ? api.consultar(id, controller.signal) : null,
            editable && api.opciones ? api.opciones(controller.signal) : {},
            api.relacionados ? api.relacionados(action, id, controller.signal) : null
        ]).then(([registro, catalogos, extra]) => {
            if (!controller.signal.aborted) setState({ registro, catalogos, extra, loading: false, error: '' });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ registro: null, catalogos: {}, extra: null, loading: false, error: error.message });
        });
        return () => controller.abort();
    }, [api, id, action, revision]);
    const reintentar = () => {
        setState((previous) => ({ ...previous, loading: true, error: '' }));
        setRevision((value) => value + 1);
    };
    return { ...state, reintentar };
}
