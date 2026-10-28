import { seleccion, rangoFechas } from '../../domain/filtrosOperativos.js';

export const filters = [seleccion('descripcion','Descripción'), ...rangoFechas('fecha')];
