import { useEffect, useMemo, useState } from 'react';
import { CatalogoConectado } from './CatalogoConectado.jsx';
import { CatalogoForm } from './CatalogoForm.jsx';
import { useCatalogo } from '../../hooks/useCatalogo.js';
import { useForm } from '../../hooks/useForm.js';
import { prepararCampos, valoresIniciales } from '../../domain/catalogo.js';

function Resultado({ definition, params, toolbar }) {
    const api = useMemo(() => ({ ...definition.api, listar: signal => params ? definition.api.buscar(params, signal) : Promise.resolve([]) }), [definition.api, params]);
    const controller = useCatalogo(api, definition.rowKey);
    return <CatalogoConectado definition={definition} controller={{ ...controller, toolbar }} />;
}
export function ConsultaCatalogo({ definition, fields }) {
    const [params, setParams] = useState(null);
    const [options, setOptions] = useState({});
    const [error, setError] = useState('');
    useEffect(() => {
        const abort = new AbortController();
        definition.api.opciones?.(abort.signal, 'search').then(setOptions).catch(failure => { if (!abort.signal.aborted) setError(failure.message); });
        return () => abort.abort();
    }, [definition.api]);
    const form = useForm({ initialValues: valoresIniciales(fields), prepare: values => prepararCampos(fields, values), onSubmit: async values => setParams(values) });
    const toolbar = <form className="consulta-form" onSubmit={form.submit}>
        <CatalogoForm fields={fields} values={form.values} change={form.change} catalogos={options} saving={form.saving} />
        {(error || form.error) && <p role="alert">{error || form.error}</p>}
        <button className="btn btn-primary" type="submit">Consultar</button>
        {!params && <p role="status">Seleccione los criterios y pulse Consultar para cargar los registros.</p>}
    </form>;
    return <Resultado key={JSON.stringify(params)} definition={definition} params={params} toolbar={toolbar} />;
}
