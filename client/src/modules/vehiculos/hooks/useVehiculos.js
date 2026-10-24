import { useEffect, useState } from 'react';
import { listarVehiculos, crearVehiculo, actualizarVehiculo, eliminarVehiculo, consultarKilometraje } from '../services/vehiculos.api.js';

export function useVehiculos() {
    const [state, setState] = useState({ data: [], loading: true, error: '' });
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        listarVehiculos(controller.signal).then((data) => {
            if (!Array.isArray(data)) throw new Error('El servidor no devolvió una lista de vehículos válida.');
            if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ data: [], loading: false, error: error.message });
        });
        return () => controller.abort();
    }, [revision]);

    const recargar = () => {
        setState({ data: [], loading: true, error: '' });
        setRevision((value) => value + 1);
    };
    const aplicarCambio = (action, vehiculo) => {
        setState((previous) => ({
            ...previous,
            data: action === 'delete'
                ? previous.data.filter((item) => item.id_vehiculo !== vehiculo.id_vehiculo)
                : action === 'create' ? [vehiculo, ...previous.data]
                    : previous.data.map((item) => item.id_vehiculo === vehiculo.id_vehiculo ? vehiculo : item)
        }));
    };
    const guardar = async (id, data) => {
        const vehiculo = id ? await actualizarVehiculo(id, data) : await crearVehiculo(data);
        aplicarCambio(id ? 'edit' : 'create', vehiculo);
        return vehiculo;
    };
    const eliminar = async (id) => {
        const { vehiculo } = await eliminarVehiculo(id);
        aplicarCambio('delete', vehiculo);
        return vehiculo;
    };
    const kilometraje = (id, fecha) => consultarKilometraje(id, fecha);
    return { ...state, recargar, guardar, eliminar, kilometraje };
}
