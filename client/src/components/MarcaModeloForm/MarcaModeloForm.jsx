import { Selector } from './Selector.jsx';
import { useRef, useState } from 'react';
import { CatalogoForm } from '../CatalogoConectado/CatalogoForm.jsx';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { marcasApi, modelosApi, cargarMarcasModelos } from '../../services/marcas-modelos.api.js';
import './marca-modelo.css';

export function MarcaModeloForm({fields,form,catalogos,saving,fotoSelector,ambito,onBusy,registro}) {
    const busy = useRef(false);
    const [options,setOptions] = useState(catalogos);
    const [error,setError] = useState('');
    const [message,setMessage] = useState('');
    const {permisos} = useAuth();
    const set = (name,value)=>form.change({target:{name,value}});
    const marca = form.values.id_marca;
    const modelos = (options.id_modelo ?? []).filter(row=>String(row.registro.id_marca)===String(marca));
    const run = async operation => {
        if (busy.current) return false;
        busy.current = true;
        setError('');setMessage('');onBusy(true);
        try { await operation(); setOptions({...catalogos,...await cargarMarcasModelos(ambito)});setMessage('Catálogo actualizado. Guarda el formulario para aplicar la selección.');return true; }
        catch(error){setError(error.message);return false;}
        finally{busy.current = false;onBusy(false);}
    };
    const pickMarca = value=>{set('id_marca',value);set('id_modelo','');};
    const selector = (name,label,rows,api,parent) => <Selector key={`${name}-${name==='id_modelo'?marca:''}`} label={label} rows={rows} value={form.values[name]} required={Boolean(fields.find(field=>field.name===name)?.required)} permisos={permisos} disabled={saving}
        parentReady={name==='id_marca' || Boolean(marca)} onSelect={name==='id_marca'?pickMarca:value=>set(name,value)}
        onCreate={nombre=>run(async()=>{const row=await api.crear({nombre,...parent});if(name==='id_marca')pickMarca(String(row[name]));else set(name,String(row[name]));})}
        onUpdate={(row,patch)=>run(()=>api.actualizar(row.value,{...row.registro,...patch}))}
        onDelete={row=>run(async()=>{await api.eliminar(row.value);if(name==='id_marca')pickMarca('');else set(name,'');})} />;
    return <>{fotoSelector}
        <CatalogoForm fields={fields.filter(field=>!['id_marca','id_modelo','imagen_url'].includes(field.name))} values={form.values} change={form.change} saving={saving} catalogos={catalogos} />
        <section className="marca-modelo" aria-label="Marca y modelo">
            {registro?.modelo_anterior && !registro.id_modelo && <p>Modelo anterior sin marca asociada: <strong>{registro.modelo_anterior}</strong>. Puedes completar su marca y modelo aquí.</p>}
            {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
            <div className="marca-modelo__grid">
                {selector('id_marca','Marca',options.id_marca ?? [],marcasApi,{ambito})}
                {selector('id_modelo','Modelo',modelos,modelosApi,{id_marca:marca})}
            </div>
        </section>
    </>;
}
