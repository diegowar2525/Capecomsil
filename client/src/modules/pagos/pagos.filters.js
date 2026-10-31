import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [estadoOperacion(false), seleccion('id_gasolinera','Gasolinera','nombre_gasolinera'), seleccion('id_factura','Factura','numero_factura'), seleccion('forma_pago','Forma de pago'), ...rangoFechas('fecha_pago'), ...rangoImporte('monto')];
