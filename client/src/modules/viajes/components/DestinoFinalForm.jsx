import { useId } from 'react';
import { Info } from 'lucide-react';
import { FormField } from '../../../components/FormField/FormField.jsx';
import { SwitchField } from '../../../components/SwitchField/SwitchField.jsx';

export function DestinoFinalForm({ agregarFinal, destinoFinal, lugares, onAgregarFinal, onDestinoFinal }) {
    const contentId = useId();
    return <div className="viaje-destino-final">
        <SwitchField name="agregar_final" label="Destino final adicional"
            description="Agregar un destino después de completar todas las entregas."
            checked={agregarFinal} onChange={event => onAgregarFinal(event.target.checked)} aria-controls={contentId} />
        <div id={contentId}>
            {agregarFinal ? <div className="viaje-destino-final-content">
                <FormField name="destino_final" label="Destino final adicional" type="select"
                    options={lugares} required value={destinoFinal} onChange={event => onDestinoFinal(event.target.value)} />
            </div> : <div className="viaje-destino-final-hint">
                <Info size={15} aria-hidden="true" /><span>El viaje termina en la última entrega.</span>
            </div>}
        </div>
    </div>;
}
