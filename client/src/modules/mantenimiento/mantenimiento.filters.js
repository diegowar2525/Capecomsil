import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [
    estadoOperacion(),
    ...rangoFechas('fecha_inicio'),
    seleccion('id_vehiculo', 'Vehículo', 'placa'),
    seleccion('id_proveedor',
        'Proveedor',
        'nombre_proveedor'),
    seleccion('clase', 'Clase de trabajo'),
    seleccion('tipo', 'Trabajo realizado'),
    ...rangoImporte('monto')
];
