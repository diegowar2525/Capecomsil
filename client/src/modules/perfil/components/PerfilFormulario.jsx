import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { fields } from '../perfil.fields.js';

export function PerfilFormulario({ form, saving, fotoSelector }) {
    return <div className="perfil-formulario">
        {fotoSelector}
        <section className="perfil-formulario__datos" aria-labelledby="perfil-datos-titulo">
            <h3 id="perfil-datos-titulo">Información personal</h3>
            <p>Así te identificarás dentro del sistema.</p>
            <CatalogoForm fields={fields.filter(field => field.name !== 'imagen_url')} values={form.values} change={form.change} saving={saving} />
        </section>
    </div>;
}
