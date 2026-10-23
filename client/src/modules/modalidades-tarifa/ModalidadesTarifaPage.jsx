import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './modalidades-tarifa.fields.js';
import { columns } from './modalidades-tarifa.columns.js';
import { page } from './modalidades-tarifa.config.js';
import { actions } from './modalidades-tarifa.actions.js';
import { filters } from './modalidades-tarifa.filters.js';

export function ModalidadesTarifaPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}

