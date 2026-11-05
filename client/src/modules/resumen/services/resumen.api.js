import { requestJson } from '../../../services/http.js';
export const resumenApi = {
    mensual: (mes, signal) => requestJson(`/api/informes/resumen-mensual?mes=${encodeURIComponent(mes)}`, { signal }),
    cuentas: signal => requestJson('/api/informes/cuentas-por-cobrar', { signal })
};
