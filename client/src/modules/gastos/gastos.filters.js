import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [estadoOperacion(), ...rangoFechas('fecha'), seleccion('id_vehiculo','Vehículo','placa'), seleccion('id_proveedor','Proveedor','nombre_proveedor'), seleccion('tipo_gasto','Tipo de gasto','nombre_tipo_gasto'), seleccion('id_viaje','Viaje'), ...rangoImporte('monto')];
