# Retenciones y recargos
Aplicar `037_liquidaciones_recargos.sql` después de la migración 036, antes de
iniciar el backend actualizado. Agrega el detalle de recargos y la tasa aplicada.
No modifica importes históricos ni recalcula documentos preparados/confirmados.
Los borradores anteriores recalculan la retención al guardarlos; si corresponde
retención y aún no se guardaron, la preparación devuelve un mensaje para hacerlo.
Probada en un esquema aislado. No aplicada a la base habitual por el asistente.
