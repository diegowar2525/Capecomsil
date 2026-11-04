import { filters } from './terminales.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './terminales.fields.js';
import { columns } from './terminales.columns.js';
import { page } from './terminales.config.js';
import { api } from './services/terminales.api.js';
import { prepare } from './domain/terminales.js';
import { useTerminales } from './hooks/useTerminales.js';

import { UbicacionForm } from '../../components/UbicacionForm/UbicacionForm.jsx';

const definition = {
    renderForm: props => <UbicacionForm {...props} fields={fields} />,
    detailFields: fields.filter(field => !['id_ciudad', 'id_provincia'].includes(field.name)), filters, fields, columns, page, api, prepare, rowKey: 'id_terminal' };

export function TerminalesPage() {
    const controller = useTerminales();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
