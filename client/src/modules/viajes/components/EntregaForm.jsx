import { FormField } from '../../../components/FormField/FormField.jsx';

export function EntregaForm({ parada, index, totalEntregas, origenTramo, terminalCarga, opcionesGasolineras, opcionesProductos, onDestino, onProducto, onAgregarProducto, onQuitarProducto, onMover, onQuitar }) {
    return (
                <fieldset>
                    <legend>Entrega {index + 1}</legend>
                    <p>Origen del tramo: {origenTramo}</p>
                    <FormField name={`destino-${parada.key}`} label="Gasolinera de destino" type="select" options={opcionesGasolineras} required value={parada.id_gasolinera} onChange={(event) => onDestino(event.target.value)} />
                    <p>Terminal de carga del combustible: {terminalCarga}</p>
                    {parada.productos.map((producto) => (
                        <div className="form-grid" key={producto.key}>
                            <FormField name={`producto-${producto.key}`} label="Producto transportado" type="select" options={opcionesProductos} required value={producto.id_producto_transportado} onChange={(event) => onProducto(producto.key, 'id_producto_transportado', event.target.value)} />
                            <FormField name={`galones-${producto.key}`} label="Galones" type="number" min="0.01" step="0.01" required value={producto.galones} onChange={(event) => onProducto(producto.key, 'galones', event.target.value)} />
                            <button type="button" className="btn btn-outline" disabled={parada.productos.length === 1} onClick={() => onQuitarProducto(producto.key)}>Quitar producto</button>
                        </div>
                    ))}
                    <div className="viaje-form-actions">
                        <button type="button" className="btn btn-outline" onClick={onAgregarProducto}>Agregar producto</button>
                        <button type="button" className="btn btn-outline" disabled={index === 0} onClick={() => onMover(-1)}>Subir entrega</button>
                        <button type="button" className="btn btn-outline" disabled={index === totalEntregas - 1} onClick={() => onMover(1)}>Bajar entrega</button>
                        <button type="button" className="btn btn-outline" disabled={totalEntregas === 1} onClick={onQuitar}>Quitar entrega</button>
                    </div>
                </fieldset>
    );
}
