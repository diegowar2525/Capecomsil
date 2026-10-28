import { seleccion, rangoImporte } from '../../domain/filtrosOperativos.js';
import { filtroEstado } from '../../domain/catalogoFiltros.js';
export const filters = [filtroEstado, seleccion('id_vehiculo','Vehículo','placa'), seleccion('nombre','Plan'), seleccion('intervalo_km','Intervalo (km)'), seleccion('anticipacion_aviso_km','Anticipación (km)'), seleccion('situacion','Situación'), ...rangoImporte('kilometros_restantes','Kilómetros restantes')];
