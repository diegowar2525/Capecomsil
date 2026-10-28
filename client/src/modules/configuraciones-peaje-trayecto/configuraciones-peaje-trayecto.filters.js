import { seleccion, rangoFechas, rangoImporte } from '../../domain/filtrosOperativos.js';

export const filters = [seleccion('id_trayecto','Trayecto','nombre_trayecto'), ...rangoFechas('fecha_inicio'), ...rangoImporte('importe')];
