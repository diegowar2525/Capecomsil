import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { servicioInicial } from '../domain/formulario.js';

export function FacturaMantenimientoForm({ field, factura, trabajo, change, saving, catalogos }) {
    const values = factura ?? {};
    const servicio = {...servicioInicial(trabajo),...values.detalles?.[0],tipo_concepto:'SERVICIO',descripcion:trabajo ?? ''};
    const conceptos = field.fields.find(item=>item.name === 'detalles');
    const setFactura = next => change({target:{name:'factura',value:next}});
    const changeHeader = event => setFactura({...values,[event.target.name]:event.target.value});
    const changeServicio = event => setFactura({...values,detalles:[{...servicio,[event.target.name]:event.target.value},...(values.detalles ?? []).slice(1)]});
    const serviceFields = conceptos.fields.filter(item=>item.name !== 'id_producto').map(item=>({
        ...item, disabled:item.name==='tipo_concepto',readOnly:item.name==='descripcion'
    }));
    return <fieldset className="form-section" disabled={saving}>
        <legend>Factura</legend>
        <CatalogoForm fields={field.fields.filter(item=>item.name !== 'detalles')} values={values} change={changeHeader} saving={saving} catalogos={catalogos} />
        <fieldset className="form-section">
            <legend>Servicio del trabajo</legend>
            <p>La descripción se completa desde «Trabajo realizado». Introduce el precio y el impuesto según la factura.</p>
            <CatalogoForm fields={serviceFields} values={servicio} change={changeServicio} saving={saving} catalogos={catalogos} />
        </fieldset>
        <CatalogoForm fields={[{...conceptos,name:'adicionales',label:'Conceptos adicionales (opcional)',minRows:0,fields:conceptos.fields}]}
            values={{adicionales:(values.detalles ?? []).slice(1)}} saving={saving} catalogos={catalogos}
            change={event=>setFactura({...values,detalles:[servicio,...event.target.value]})} />
    </fieldset>;
}
