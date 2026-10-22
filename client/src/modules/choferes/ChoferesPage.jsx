import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './choferes.fields.js';
import { columns } from './choferes.columns.js';
import { page } from './choferes.config.js';

export function ChoferesPage() {
    return <CatalogoPage rowKey="id_chofer" {...page} columns={columns} fields={fields} />;
}
