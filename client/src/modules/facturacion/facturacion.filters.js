import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [estadoOperacion(true), seleccion('id_empresa','Empresa','nombre_empresa'), seleccion('estado_cobro','Estado de cobro'), seleccion('vencida','Vencida'), ...rangoImporte('saldo','Saldo'), ...rangoFechas('fecha_emision'), ...rangoImporte('valor_neto')];
