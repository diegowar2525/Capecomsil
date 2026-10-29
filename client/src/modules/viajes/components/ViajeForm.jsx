
import { Plus } from 'lucide-react';

import { FormNotice } from '../../../components/FormNotice/FormNotice.jsx';
import { DestinoFinalForm } from './DestinoFinalForm.jsx';
import { useViajeForm } from '../hooks/useViajeForm.js';
import { ViajeCabecera } from './ViajeCabecera.jsx';
import { EntregaForm } from './EntregaForm.jsx';
import { RecorridoPreview } from './RecorridoPreview.jsx';

export function ViajeForm({
    catalogos = {},
    onPrepare,
    initialViaje,
    id,
    saving,
    children,
    externalSubmit = false
}) {
    const form = useViajeForm(catalogos, onPrepare, initialViaje);

    const submit = (event) => {
        event.preventDefault();
        form.preparar();
    };

    return (
        <form
            id={id}
            className="viaje-form"
            onSubmit={submit}
        >
            <fieldset
                className="viaje-form-wrapper"
                disabled={saving}
            >
                <ViajeCabecera
                    cabecera={form.cabecera}
                    origen={form.origen}
                    lugares={form.lugares}
                    opcionesVehiculos={form.opcionesVehiculos}
                    opcionesChoferes={form.opcionesChoferes}
                    onCabecera={form.cambiarCabecera}
                    onOrigen={form.setOrigen}
                />

                {form.sinTerminales && (
                    <FormNotice>
                        Registre un terminal de carga antes de crear viajes.
                    </FormNotice>
                )}

                {form.paradas.map((parada, index) => (
                    <EntregaForm
                        key={parada.key}
                        parada={parada}
                        index={index}
                        totalEntregas={form.paradas.length}
                        origenTramo={form.nombre(
                            form.recorrido[index].origen
                        )}
                        terminalCarga={form.nombre(form.origen)}
                        opcionesGasolineras={form.opcionesGasolineras}
                        opcionesProductos={form.opcionesProductos}
                        onDestino={(value) =>
                            form.cambiarDestino(parada.key, value)
                        }
                        onProducto={(key, campo, value) =>
                            form.cambiarProducto(
                                parada.key,
                                key,
                                campo,
                                value
                            )
                        }
                        onAgregarProducto={() =>
                            form.agregarProducto(parada.key)
                        }
                        onQuitarProducto={(key) =>
                            form.quitarProducto(parada.key, key)
                        }
                        onMover={(direccion) =>
                            form.moverEntrega(index, direccion)
                        }
                        onQuitar={() =>
                            form.quitarEntrega(parada.key)
                        }
                    />
                ))}

                <div className="viaje-agregar-entrega">
                    <button
                        type="button"
                        className="btn-add btn-add-block"
                        onClick={form.agregarEntrega}
                    >
                        <Plus size={18} />
                        Agregar entrega
                    </button>
                </div>

                <DestinoFinalForm agregarFinal={form.agregarFinal} destinoFinal={form.destinoFinal}
                    lugares={form.lugares} onAgregarFinal={form.setAgregarFinal} onDestinoFinal={form.setDestinoFinal} />

                <RecorridoPreview
                    recorrido={form.recorrido}
                    nombre={form.nombre}
                    onSeleccionar={form.seleccionarTrayecto}
                />

                {form.error && (
                    <FormNotice variant="error">{form.error}</FormNotice>
                )}

                {children}

                {onPrepare && !externalSubmit && (
                    <button
                        type="submit"
                        className="btn btn-primary"
                    >
                        Validar recorrido
                    </button>
                )}
            </fieldset>
        </form>
    );
}
