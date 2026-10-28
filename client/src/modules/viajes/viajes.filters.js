import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [
    estadoOperacion(), 
    ...rangoFechas('fecha_inicio'), 
    seleccion('id_vehiculo', 'Vehículo', 'placa'), 
    seleccion('id_chofer', 'Chofer', 'nombre_chofer'), 
    ...rangoImporte('total_galones', 'Galones'), 
    ...rangoImporte('valor_transporte', 'Transporte')
];
