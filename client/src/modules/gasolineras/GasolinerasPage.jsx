import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './gasolineras.fields.js';
import { columns } from './gasolineras.columns.js';
import { page } from './gasolineras.config.js';

export function GasolinerasPage() {
    return <CatalogoPage rowKey="id_gasolinera" {...page} columns={columns} fields={fields} />;
}
