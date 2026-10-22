import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './terminales.fields.js';
import { columns } from './terminales.columns.js';
import { page } from './terminales.config.js';

export function TerminalesPage() {
    return <CatalogoPage rowKey="id_terminal" {...page} columns={columns} fields={fields} />;
}
