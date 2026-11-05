import { useEffect, useState } from 'react';
import { resumenApi } from '../services/resumen.api.js';
export function useResumen(view, mes) {
    const [state, setState] = useState({ loading: true, data: null, error: '' });
    const [version, setVersion] = useState(0);
    useEffect(() => {
        const abort = new AbortController();
        (view === 'mensual' ? resumenApi.mensual(mes, abort.signal) : resumenApi.cuentas(abort.signal))
            .then(data => { if (!abort.signal.aborted) setState({ loading: false, data, error: '' }); })
            .catch(error => { if (!abort.signal.aborted) setState({ loading: false, data: null, error: error.message }); });
        return () => abort.abort();
    }, [view, mes, version]);
    return { ...state, refresh: () => { setState({ loading: true, data: null, error: '' }); setVersion(value => value + 1); } };
}
