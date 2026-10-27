import { useEffect, useState } from 'react';

// Cancela consultas anteriores cuando cambia el período o la entidad seleccionada.
export function useOpcionesDependientes(load, key) {
    const [state, setState] = useState({ key: null, data: [], error: '' });
    useEffect(() => {
        if (!key) return;
        const abort = new AbortController();
        load(JSON.parse(key), abort.signal).then(data => {
            if (!abort.signal.aborted) setState({ key, data, error: '' });
        }).catch(error => { if (!abort.signal.aborted) setState({ key, data: [], error: error.message }); });
        return () => abort.abort();
    }, [load, key]);
    return key && key === state.key ? { ...state, loading: false } : { data: [], error: '', loading: Boolean(key) };
}
