import { seleccion, rangoFechas } from '../../domain/filtrosOperativos.js';

export const filters = [seleccion('id_gasolinera','Gasolinera','nombre_gasolinera'), seleccion('modalidad','Modalidad'), ...rangoFechas('fecha_inicio')];
