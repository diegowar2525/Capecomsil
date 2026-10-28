import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [estadoOperacion(), ...rangoFechas('fecha_hora'), seleccion('id_vehiculo','Vehículo','placa'), seleccion('id_proveedor','Proveedor','nombre_proveedor'), ...rangoImporte('galones','Galones'), ...rangoImporte('monto')];
