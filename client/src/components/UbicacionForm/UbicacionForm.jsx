import { CatalogosInlineForm } from '../CatalogoConectado/CatalogosInlineForm.jsx';
import { api as provincias } from '../../modules/provincias/services/provincias.api.js';
import { api as ciudades } from '../../modules/ciudades/services/ciudades.api.js';
const descriptors = [
    { name: 'id_provincia', label: 'Provincia', api: provincias },
    { name: 'id_ciudad', label: 'Ciudad', api: ciudades, parent: 'id_provincia', parentLabel: 'una provincia' }
];
export function UbicacionForm(props) {
    return <CatalogosInlineForm {...props} descriptors={descriptors} />;
}
