import { useEffect, useState } from 'react';
import { api } from '../services/remuneraciones-chofer.api.js';

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
    return <section className="remuneraciones-resumen" aria-label="Resumen del período">

        {fallo && <p role="alert">No se pudo comprobar si el período está completo: {fallo}</p>}
        {cobertura?.choferes_sin_fecha > 0 && <p role="alert">Completa la fecha de inicio de trabajo en el catálogo de choferes para activar la generación automática. El total puede estar incompleto.</p>}
        {cobertura?.dias_pendientes > 0 && <p role="alert">Hay {cobertura.dias_pendientes} días pendientes de generar. El total es parcial. Comprueba que exista configuración de remuneración vigente para esas fechas; el sistema los completará en el próximo ciclo.</p>}
        {cobertura && params.fecha_hasta > cobertura.hasta_procesable && <p>La generación automática cubre hasta {cobertura.hasta_procesable}. Los días posteriores aún no están completos.</p>}
    </section>;
}
