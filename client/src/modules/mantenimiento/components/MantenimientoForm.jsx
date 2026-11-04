import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { FacturaMantenimientoForm } from './FacturaMantenimientoForm.jsx';
import { servicioInicial } from '../domain/formulario.js';
import './planes-cumplidos.css';

export function MantenimientoForm({ form, registro, catalogos, saving, fields, action }) {
    const creando = action.id === 'create' || action.id === 'edit';
    const trabajo = creando ? form.values : registro;
    const permitePlanes = trabajo?.clase === 'PREVENTIVO';
    const finalizado = Boolean(creando || action.id === 'finish' ? form.values.fecha_fin : registro?.fecha_fin);
    const vinculados = new Set((registro?.cumplimientos ?? []).map(row => String(row.id_plan_mantenimiento_vehiculo)));
    const opciones = (catalogos.planes_cumplidos ?? []).filter(({ registro: plan, value }) =>
        plan.estado && String(plan.id_vehiculo) === String(trabajo?.id_vehiculo) && !vinculados.has(String(value)));
    const seleccion = form.values.planes_cumplidos ?? [];
    const formFields = fields.filter(field => !['planes_cumplidos','factura'].includes(field.name)).map(field => ({
        ...field,
        ...(field.name === 'modalidad_pago' && action.id === 'edit' && registro?.id_factura_proveedor ? {options:[{value:'EXISTENTE',label:'Con factura'},{value:'DIRECTO',label:'Sin factura'}]} : {}),
        disabled: action.id === 'edit' && (['modalidad_pago', 'id_factura_proveedor'].includes(field.name) || (registro?.id_factura_proveedor && field.name === 'id_proveedor')),
        required: field.name === 'id_proveedor' && form.values.modalidad_pago !== 'DIRECTO' ? true : field.required
    }));
    const change = event => {
        if (event.target.name === 'tipo') {
            const factura = form.values.factura ?? {};
            const servicio = {...servicioInicial(event.target.value),...factura.detalles?.[0],tipo_concepto:'SERVICIO',descripcion:event.target.value};
            form.change({target:{name:'factura',value:{...factura,detalles:[servicio,...(factura.detalles ?? []).slice(1)]}}});
        }
        if (['clase', 'id_vehiculo', 'fecha_fin'].includes(event.target.name)) {
            form.change({ target: { name: 'planes_cumplidos', value: [] } });
        }
        form.change(event);
    };
    return <>
        <CatalogoForm fields={formFields} values={form.values} change={change} saving={saving} catalogos={catalogos} />
        {creando && form.values.modalidad_pago === 'NUEVA' && <FacturaMantenimientoForm field={fields.find(field=>field.name==='factura')}
            factura={form.values.factura} trabajo={form.values.tipo} change={change} saving={saving} catalogos={catalogos} />}
        {creando && form.values.modalidad_pago === 'DIRECTO' && <p>El total se registra como gasto pagado en el día de inicio del mantenimiento.</p>}
        {creando && form.values.modalidad_pago === 'EXISTENTE' && <p>El importe del trabajo será el total de la factura seleccionada. Los abonos se registran en Pagos a proveedores.</p>}
        {permitePlanes && fields.some(field => field.name === 'planes_cumplidos') && <fieldset className="planes-cumplidos" disabled={saving}>
            <legend>Vincular planes realizados{action.id === 'fulfill' ? '' : ' (opcional)'}</legend>
            <p>Marca únicamente las tareas realizadas en este trabajo. Al guardar se actualizará el próximo vencimiento del plan.</p>
            {!trabajo.id_vehiculo ? <p>Selecciona primero el vehículo.</p> : !finalizado ? <p>Podrás vincular los planes cuando indiques la fecha de finalización.</p> : <>
                {!opciones.length && <p role="status">No hay planes activos pendientes de vincular para este vehículo.</p>}
                <div className="planes-cumplidos__lista">{opciones.map(({ value, registro: plan }) => <label key={value} className="planes-cumplidos__opcion">
                    <input type="checkbox" checked={seleccion.includes(String(value))} onChange={event => form.change({
                        target: {
                            name: 'planes_cumplidos', value: event.target.checked ? [...seleccion, String(value)] : seleccion.filter(id => id !== String(value))
                        }
                    })} />
                    <span><strong>{plan.nombre}</strong><small>{plan.placa} · Cada {Number(plan.intervalo_km).toLocaleString('es-EC')} km</small></span>
                </label>)}</div>
                <p role="status">{seleccion.length} planes seleccionados</p>
            </>}
        </fieldset>}
    </>;
}
