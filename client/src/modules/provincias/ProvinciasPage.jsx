import { filters } from './provincias.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './provincias.fields.js';
import { columns } from './provincias.columns.js';
import { page } from './provincias.config.js';
import { api } from './services/provincias.api.js';
import { prepare } from './domain/provincias.js';
import { useProvincias } from './hooks/useProvincias.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_provincia' };

export function ProvinciasPage() {
    const controller = useProvincias();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
