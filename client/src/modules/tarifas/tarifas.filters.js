import { seleccion, rangoFechas, rangoImporte } from '../../domain/filtrosOperativos.js';
import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [filtroEstado, seleccion('id_gasolinera','Gasolinera','nombre_gasolinera'), seleccion('id_terminal','Terminal','nombre_terminal'), ...rangoFechas('fecha_inicio'), ...rangoImporte('valor_por_galon','Valor por galón')];
