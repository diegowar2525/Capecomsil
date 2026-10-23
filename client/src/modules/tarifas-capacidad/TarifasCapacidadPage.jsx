import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './tarifas-capacidad.fields.js';
import { columns } from './tarifas-capacidad.columns.js';
import { page } from './tarifas-capacidad.config.js';
import { actions } from './tarifas-capacidad.actions.js';
import { filters } from './tarifas-capacidad.filters.js';

export function TarifasCapacidadPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}

