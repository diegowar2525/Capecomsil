import { useEffect, useState } from 'react';
import { consultarVehiculo } from '../services/vehiculos.api.js';

export function useVehiculo(id) {
    const [state, setState] = useState({ vehiculo: null, loading: Boolean(id), error: '' });
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        consultarVehiculo(id, controller.signal).then((vehiculo) => {
            if (!controller.signal.aborted) setState({ vehiculo, loading: false, error: '' });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ vehiculo: null, loading: false, error: error.message });
        });
        return () => controller.abort();
    }, [id]);
    return state;
}
