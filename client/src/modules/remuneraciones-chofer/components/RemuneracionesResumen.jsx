import { useEffect, useState } from 'react';
import { api } from '../services/remuneraciones-chofer.api.js';

const dinero = value => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
export function RemuneracionesResumen({ params, data = [], loading, error }) {
    const [cobertura, setCobertura] = useState(null);
    const [fallo, setFallo] = useState('');
    useEffect(() => {
        const abort = new AbortController();
        api.cobertura(params, abort.signal).then(value => { if (!abort.signal.aborted) { setCobertura(value); setFallo(''); } })
            .catch(error => { if (!abort.signal.aborted) setFallo(error.message); });
        return () => abort.abort();
    }, [params, data]);
    if (loading || error) return null;
    const sum = key => data.reduce((total, row) => total + Number(row[key] ?? 0), 0);
    return <section className="remuneraciones-resumen" aria-label="Resumen del período">
        <dl>
            <div><dt>Total calculado del período</dt><dd>{dinero(sum('total'))}</dd></div>
            <div><dt>Distribuido en viajes</dt><dd>{dinero(sum('costo_asignado'))}</dd></div>
            <div><dt>Sin distribuir en viajes</dt><dd>{dinero(sum('costo_sin_asignar'))}</dd></div>
        </dl>
        {fallo && <p role="alert">No se pudo comprobar si el período está completo: {fallo}</p>}
        {cobertura && !cobertura.fecha_inicio_trabajo && <p role="alert">Completa la fecha de inicio de trabajo en el catálogo de choferes para activar la generación automática. El total puede estar incompleto.</p>}
        {cobertura?.dias_pendientes > 0 && <p role="alert">Hay {cobertura.dias_pendientes} días pendientes de generar. El total es parcial. Comprueba que exista configuración de remuneración vigente para esas fechas; el sistema los completará en el próximo ciclo.</p>}
        {cobertura && params.fecha_hasta > cobertura.hasta_procesable && <p>La generación automática cubre hasta {cobertura.hasta_procesable}. Los días posteriores aún no están completos.</p>}
    </section>;
}
