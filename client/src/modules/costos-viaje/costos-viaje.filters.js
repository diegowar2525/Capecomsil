import { seleccion, rangoImporte } from '../../domain/filtrosOperativos.js';
export const filters = [seleccion('tipo_costo','Tipo de costo'), seleccion('descripcion','Descripción'), ...rangoImporte('valor')];
