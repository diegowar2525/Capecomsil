import { seleccion, rangoFechas, rangoImporte } from '../../domain/filtrosOperativos.js';

export const filters = [seleccion('id_chofer','Chofer','nombre_chofer'), ...rangoFechas('fecha'), ...rangoImporte('total','Total')];
