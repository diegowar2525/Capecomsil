import { CatalogoForm } from '../CatalogoConectado/CatalogoForm.jsx';

export function UbicacionForm({ fields, form, catalogos, saving }) {
    const ciudades = (catalogos.id_ciudad ?? []).filter(option =>
        String(option.registro.id_provincia) === String(form.values.id_provincia));
    const change = event => {
        if (event.target.name === 'id_provincia') form.change({ target: { name: 'id_ciudad', value: '' } });
        form.change(event);
    };
    return <>
        <p role="status">{!form.values.id_provincia
            ? 'Selecciona primero una provincia para ver sus ciudades.'
            : ciudades.length === 0
                ? 'Esta provincia no tiene ciudades registradas. Añádelas desde Catálogos → Ciudades, seleccionando su provincia, y vuelve a abrir este formulario.'
                : 'La lista de ciudades corresponde a la provincia seleccionada.'}</p>
        <CatalogoForm fields={fields} values={form.values} change={change} saving={saving}
            catalogos={{ ...catalogos, id_ciudad: ciudades }} />
    </>;
}
