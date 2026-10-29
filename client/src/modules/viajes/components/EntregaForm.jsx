
import {
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    MapPin,
    Fuel,
    Package
} from 'lucide-react';

import { FormItemCard } from '../../../components/FormItemCard/FormItemCard.jsx';
import { FormField } from '../../../components/FormField/FormField.jsx';

export function EntregaForm({
    parada,
    index,
    totalEntregas,
    origenTramo,
    terminalCarga,
    opcionesGasolineras,
    opcionesProductos,
    onDestino,
    onProducto,
    onAgregarProducto,
    onQuitarProducto,
    onMover,
    onQuitar
}) {
    return (
        <fieldset className="viaje-entrega">
            <legend>Entrega {index + 1}</legend>

            <div className="viaje-entrega-content">
                <div className="viaje-info">
                    <MapPin size={16} />
                    <span className="viaje-info-label">
                        Origen del tramo:
                    </span>
                    <span className="viaje-info-value">
                        {origenTramo}
                    </span>
                </div>

                <FormField
                    name={`destino-${parada.key}`}
                    label="Gasolinera de destino"
                    type="select"
                    options={opcionesGasolineras}
                    required
                    value={parada.id_gasolinera}
                    onChange={(event) =>
                        onDestino(event.target.value)
                    }
                />

                <div className="viaje-info">
                    <Fuel size={16} />
                    <span className="viaje-info-label">
                        Terminal de carga:
                    </span>
                    <span className="viaje-info-value">
                        {terminalCarga}
                    </span>
                </div>

                <div className="viaje-productos-section">
                    <div className="viaje-productos-heading">
                        <Package size={17} />
                        <span>Productos transportados</span>
                    </div>

                    {parada.productos.map((producto, productoIndex) => (
                        <FormItemCard key={producto.key} title={`Producto ${productoIndex + 1}`} actions={

                            <button
                                type="button"
                                className="btn-icon btn-icon-danger"
                                disabled={parada.productos.length === 1}
                                onClick={() =>
                                    onQuitarProducto(producto.key)
                                }
                                aria-label={`Quitar producto ${productoIndex + 1}`}
                                title="Quitar producto"
                            >
                                <Trash2 size={17} />
                            </button>}>
                            <div className="form-grid viaje-producto-fields">
                                <FormField
                                    name={`producto-${producto.key}`}
                                    label="Producto transportado"
                                    type="select"
                                    options={opcionesProductos}
                                    required
                                    value={producto.id_producto_transportado}
                                    onChange={(event) =>
                                        onProducto(
                                            producto.key,
                                            'id_producto_transportado',
                                            event.target.value
                                        )
                                    }
                                />

                                <FormField
                                    name={`galones-${producto.key}`}
                                    label="Galones"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={producto.galones}
                                    onChange={(event) =>
                                        onProducto(
                                            producto.key,
                                            'galones',
                                            event.target.value
                                        )
                                    }
                                />
                            </div>
                        </FormItemCard>
                    ))}

                    <button
                        type="button"
                        className="btn-add"
                        onClick={onAgregarProducto}
                    >
                        <Plus size={17} />
                        Agregar producto
                    </button>
                </div>

                <div className="viaje-entrega-footer">
                    <div className="viaje-entrega-order">
                        <span className="viaje-footer-label">
                            Orden de entrega
                        </span>

                        <button
                            type="button"
                            className="btn-icon"
                            disabled={index === 0}
                            onClick={() => onMover(-1)}
                            title="Subir entrega"
                            aria-label={`Subir entrega ${index + 1}`}
                        >
                            <ArrowUp size={17} />
                        </button>

                        <button
                            type="button"
                            className="btn-icon"
                            disabled={index === totalEntregas - 1}
                            onClick={() => onMover(1)}
                            title="Bajar entrega"
                            aria-label={`Bajar entrega ${index + 1}`}
                        >
                            <ArrowDown size={17} />
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn-remove"
                        disabled={totalEntregas === 1}
                        onClick={onQuitar}
                    >
                        <Trash2 size={16} />
                        Quitar entrega
                    </button>
                </div>
            </div>
        </fieldset>
    );
}
