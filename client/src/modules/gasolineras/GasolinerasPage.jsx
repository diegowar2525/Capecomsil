import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './gasolineras.fields.js';
import { columns } from './gasolineras.columns.js';
import { page } from './gasolineras.config.js';
import { actions } from './gasolineras.actions.js';

export function GasolinerasPage(props) {
    return <CatalogoPage rowKey="id_gasolinera" {...page} columns={columns} fields={fields} actions={actions} {...props} />;
}
