import { seleccion, rangoFechas, estadoOperacion } from '../../domain/filtrosOperativos.js';

export const filters = [estadoOperacion(true), seleccion('numero_comprobante','Comprobante'), ...rangoFechas('fecha_recepcion')];
