import { FormField } from '../../../components/FormField/FormField.jsx';
import { useViajeForm } from '../hooks/useViajeForm.js';
import { ViajeCabecera } from './ViajeCabecera.jsx';
import { EntregaForm } from './EntregaForm.jsx';
import { RecorridoPreview } from './RecorridoPreview.jsx';

export function ViajeForm({ catalogos = {}, onPrepare, initialViaje }) {
    const form = useViajeForm(catalogos, onPrepare, initialViaje);
    const submit = (event) => {
        event.preventDefault();
        form.preparar();
    };
    return (
        <form className="viaje-form" onSubmit={submit}>
            <ViajeCabecera cabecera={form.cabecera} origen={form.origen} lugares={form.lugares}
                opcionesVehiculos={form.opcionesVehiculos} opcionesChoferes={form.opcionesChoferes}
                onCabecera={form.cambiarCabecera} onOrigen={form.setOrigen} />
            {form.sinTerminales && <p role="status">Los catálogos aún no están conectados. El guardado permanece deshabilitado.</p>}
            {form.paradas.map((parada, index) => (
                <EntregaForm key={parada.key} parada={parada} index={index} totalEntregas={form.paradas.length}
                    origenTramo={form.nombre(form.recorrido[index].origen)} terminalCarga={form.nombre(form.origen)}
                    opcionesGasolineras={form.opcionesGasolineras} opcionesProductos={form.opcionesProductos}
                    onDestino={(value) => form.cambiarDestino(parada.key, value)}
                    onProducto={(key, campo, value) => form.cambiarProducto(parada.key, key, campo, value)}
                    onAgregarProducto={() => form.agregarProducto(parada.key)}
                    onQuitarProducto={(key) => form.quitarProducto(parada.key, key)}
                    onMover={(direccion) => form.moverEntrega(index, direccion)}
                    onQuitar={() => form.quitarEntrega(parada.key)} />
            ))}
            <button type="button" className="btn btn-outline" onClick={form.agregarEntrega}>Agregar entrega</button>
            <FormField name="agregar_final" label="Agregar destino después de la última entrega" type="checkbox"
                checked={form.agregarFinal} onChange={(event) => form.setAgregarFinal(event.target.checked)} />
            {form.agregarFinal ? <FormField name="destino_final" label="Destino final adicional" type="select"
                options={form.lugares} required value={form.destinoFinal} onChange={(event) => form.setDestinoFinal(event.target.value)} />
                : <p>El viaje termina en la última entrega.</p>}
            <RecorridoPreview recorrido={form.recorrido} nombre={form.nombre} onSeleccionar={form.seleccionarTrayecto} />
            {form.error && <p role="alert">{form.error}</p>}
            {onPrepare && <button type="submit" className="btn btn-primary">Validar recorrido</button>}
        </form>
    );
}
