import { seleccion, rangoImporte } from '../../domain/filtrosOperativos.js';

export const filters = [seleccion('nombre','Producto'), seleccion('unidad_medida','Unidad'), ...rangoImporte('stock_actual','Existencias'), ...rangoImporte('stock_minimo','Stock mínimo')];
