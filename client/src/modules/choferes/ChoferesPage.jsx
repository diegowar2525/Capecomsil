import { filters } from './choferes.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './choferes.fields.js';
import { columns } from './choferes.columns.js';
import { page } from './choferes.config.js';
import { api } from './services/choferes.api.js';
import { prepare } from './domain/choferes.js';
import { useChoferes } from './hooks/useChoferes.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_chofer' };

export function ChoferesPage() {
    const controller = useChoferes();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
