import { filters } from './empresas.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './empresas.fields.js';
import { columns } from './empresas.columns.js';
import { page } from './empresas.config.js';
import { api } from './services/empresas.api.js';
import { prepare } from './domain/empresas.js';
import { useEmpresas } from './hooks/useEmpresas.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_empresa' };

export function EmpresasPage() {
    const controller = useEmpresas();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
