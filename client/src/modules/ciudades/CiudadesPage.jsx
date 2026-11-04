import { filters } from './ciudades.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './ciudades.fields.js';
import { columns } from './ciudades.columns.js';
import { page } from './ciudades.config.js';
import { api } from './services/ciudades.api.js';
import { prepare } from './domain/ciudades.js';
import { useCiudades } from './hooks/useCiudades.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_ciudad' };

export function CiudadesPage() {
    const controller = useCiudades();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
