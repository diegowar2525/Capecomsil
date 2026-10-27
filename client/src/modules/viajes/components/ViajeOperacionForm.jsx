import { useEffect, useRef, useState } from 'react';
import { ViajeForm } from './ViajeForm.jsx';
import { FormField } from '../../../components/FormField/FormField.jsx';
export function ViajeOperacionForm({ id, registro, catalogos, guardar, onSaved, onBusy, action }) {
 const [motivo, setMotivo] = useState('');
 const [saving, setSaving] = useState(false);
 const busy = useRef(false);
 useEffect(() => { onBusy(saving); }, [saving, onBusy]);
 const save = async data => {
  if (busy.current) return;
  if (registro && !motivo.trim()) throw new Error('Indique el motivo de modificación.');
  busy.current = true; setSaving(true);
  try {
   const tramos = data.tramos.map(tramo => {
    const original = registro?.tramos?.find(row => row.orden === tramo.orden && row.id_trayecto === tramo.id_trayecto);
    return original ? { ...tramo, id_tramo_viaje: original.id_tramo_viaje } : tramo;
   });
   await guardar(registro?.id_viaje, { ...data, tramos, ...(registro ? { version: registro.version, motivo: motivo.trim() } : {}) });
   onSaved(action.id);
  } finally { busy.current = false; setSaving(false); }
 };
 return <ViajeForm id={id} catalogos={catalogos} initialViaje={registro} onPrepare={save} saving={saving} externalSubmit>
  {registro && <FormField name="motivo" label="Motivo de modificación" type="textarea" required maxLength={150} value={motivo} onChange={event => setMotivo(event.target.value)} />}
 </ViajeForm>;
}
