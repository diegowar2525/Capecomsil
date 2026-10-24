import { filters } from './gasolineras.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './gasolineras.fields.js';
import { columns } from './gasolineras.columns.js';
import { page } from './gasolineras.config.js';
import { api } from './services/gasolineras.api.js';
import { prepare } from './domain/gasolineras.js';
import { useGasolineras } from './hooks/useGasolineras.js';
import { actions } from './gasolineras.actions.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_gasolinera', actions };

export function GasolinerasPage() {
    const controller = useGasolineras();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
