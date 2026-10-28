import { seleccion, rangoFechas, rangoImporte, estadoOperacion } from '../../domain/filtrosOperativos.js';
export const filters = [estadoOperacion(), ...rangoFechas('fecha_pago'), seleccion('id_proveedor','Proveedor','nombre_proveedor'), seleccion('id_factura_proveedor','Factura','numero_factura'), seleccion('forma_pago','Forma de pago'), ...rangoImporte('monto')];
