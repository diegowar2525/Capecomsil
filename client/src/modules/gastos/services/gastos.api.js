import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones, listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/gastos';
export const api = {
    ...crearCatalogoApi(path),
    listar: signal => listarPaginas(path, {}, signal),
    opciones: async signal => {
        const options = await cargarOpciones({tipo_gasto:['/api/tipos-gasto','codigo','nombre'],id_vehiculo:['/api/vehiculos','id_vehiculo','placa'],id_viaje:['/api/viajes','id_viaje', row => 'Viaje '+row.id_viaje+' · '+row.placa+' · '+row.fecha_inicio],id_proveedor:['/api/proveedores','id_proveedor','nombre']},signal);
        options.tipo_gasto = options.tipo_gasto.filter(option => option.registro.estado && option.value !== 'COMBUSTIBLE');
        return options;
    },
    ejecutar: (action,id,data) => {
        if(action !== 'annul') throw new Error('Acción no admitida.');
        return requestJson(path+'/'+id+'/anular',{method:'POST',data});
    }
};
export const consultarViaticos = ({fecha},signal) => listarPaginas('/api/informes/viaticos',{fecha_desde:fecha,fecha_hasta:fecha},signal);
