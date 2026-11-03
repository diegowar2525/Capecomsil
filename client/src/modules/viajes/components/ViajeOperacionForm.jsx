import { useEffect, useRef, useState } from 'react';
import { ViajeForm } from './ViajeForm.jsx';
export function ViajeOperacionForm({ id, registro, catalogos, guardar, onSaved, onBusy, action }) {
    const [saving, setSaving] = useState(false);
    const busy = useRef(false);
    useEffect(() => { onBusy(saving); }, [saving, onBusy]);
    const save = async data => {
        if (busy.current) return;
        busy.current = true; setSaving(true);
        try {
            const tramos = data.tramos.map(tramo => {
                const original = registro?.tramos?.find(row => row.orden === tramo.orden && row.id_trayecto === tramo.id_trayecto);
                return original ? { ...tramo, id_tramo_viaje: original.id_tramo_viaje } : tramo;
            });
            await guardar(registro?.id_viaje, { ...data, tramos, ...(registro ? { version: registro.version } : {}) });
            onSaved(action.id);
        } finally { busy.current = false; setSaving(false); }
    };
    return <ViajeForm id={id} catalogos={catalogos} initialViaje={registro} onPrepare={save} saving={saving} externalSubmit>
    </ViajeForm>;
}
