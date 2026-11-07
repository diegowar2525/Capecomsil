# Reapertura de liquidaciones
Aplicar después de 035. Permite PREPARADA → BORRADOR, conservando entregas, importes y reservas. Limpia fecha_envio de la cabecera al reabrir; el historial conserva las fechas de las transiciones realizadas por la API desde esta actualización, su usuario y versión. No reconstruye cambios anteriores.

POST /api/liquidaciones/:id/reabrir recibe {version}, requiere liquidaciones.editar y solo admite PREPARADA. Confirmadas y anuladas no vuelven a borrador. Preparar de nuevo revalida entregas y totales. GET /:id incluye historial. El borrado de un borrador elimina también su historial.
