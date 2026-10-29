import { FormField } from '../../../components/FormField/FormField.jsx';

export function RecorridoPreview({ recorrido, nombre, onSeleccionar }) {
    return (
        <section className="viaje-recorrido" aria-label="Recorrido automático" aria-live="polite">
            <h3 className="viaje-recorrido-title">Recorrido automático</h3>
            <ol>{recorrido.map((tramo) => <li key={tramo.orden}>
                <p>{nombre(tramo.origen)} → {nombre(tramo.destino)}</p>
                {tramo.opciones.length > 1 && <FormField name={`trayecto-${tramo.orden}`} label="Ruta a utilizar" type="select" options={tramo.opciones.map((item) => ({ value: String(item.id_trayecto), label: `${item.nombre} (${item.kilometros} km)` }))} value={tramo.id_trayecto ? String(tramo.id_trayecto) : ''} onChange={(event) => onSeleccionar(tramo.clave, event.target.value)} />}
                {tramo.error ? <p>{tramo.error}</p> : <p>Trayecto: {tramo.opciones.find((item) => item.id_trayecto === tramo.id_trayecto)?.nombre}</p>}
            </li>)}</ol>
        </section>
    );
}
