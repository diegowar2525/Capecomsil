import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [estadoOperacion(true), seleccion('id_gasolinera','Gasolinera','nombre_gasolinera'), seleccion('estado_cobro','Estado de cobro'), seleccion('vencida','Vencida'), ...rangoImporte('saldo','Saldo'), ...rangoFechas('fecha_emision'), ...rangoImporte('valor_neto')];
