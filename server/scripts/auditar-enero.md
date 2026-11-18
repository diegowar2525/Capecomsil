# Auditoría previa de enero de 2026

Correcciones aprobadas: CHEQUES I5 → 2026-01-15; M7 → 2026-02-05. Exportadas con valores originales a correcciones_confirmadas.json y pagos_corregidos.csv (subconjunto pendiente de vincular facturas). GASTO MECHITA fila58/comprobante1663 usa cinco días; fila87/comprobante1685 conserva $5 íntegros como viático. Ninguna corrección modifica el XLSM fuente. gastos_origen.csv conserva el reparto sin completar; gastos.csv contiene las propuestas aprobadas.

Para viáticos combinados con duración explícita (X/POR N DIAS o viernes y sábado), la regla aprobada separa $12 por día y el sobrante como peaje. Se mantiene pendiente la asociación a fechas de trabajo; la fecha del desembolso no se cambia. Una duración no indicada no se infiere por semejanza de importes. Si el importe es menor al viático calculado no se generan peajes negativos.

Reglas confirmadas: ESPINOZA usa DIA_TRABAJADO; los otros seis choferes DIARIO_FIJO. SUELDO y ANTICIPO son pagos/adelantos, no costos adicionales: se excluyen de gastos.csv y se conservan en pagos_chofer_omitidos.csv y gastos_origen.csv. No se eliminan del Excel. El resumen distingue el total fuente de los gastos preparados. Peajes combinados cero/ausentes se preparan en cero por autorización; valores positivos menores de $12 requieren revisión.

Santa Martha: las filas TRANS 29,30,45,46,47,48,81,82,83 fueron confirmadas como anuladas/no concretadas. Se conservan sus cantidades de origen como referencia histórica, con estado ANULADO y sin inventar fecha de anulación. No generan entregas disponibles, producción, kilómetros realizados ni remuneración por día trabajado. Los gastos reales se mantienen para revisión: anular un viaje no demuestra que se haya devuelto el desembolso.

El resumen distingue totales documentados del Excel de actividad realizada. Un importador posterior debe respetar esa distinción y no crear primero viajes vigentes para anularlos después, pues podría disparar cálculos automáticos indebidos.

`python auditar-enero.py "ruta/ENERO -2026-new.xlsm" --salida "directorio-local"`

Solo lectura del XLSM con biblioteca estándar Python. No ejecuta macros, recalcula fórmulas, importa SQL ni llama a la API. Produce CSV de viajes, trayectos, gastos, catálogos e incidencias; JSON de resumen y filas financieras para revisión. Guardar resultados fuera de Git: contienen datos comerciales/personales.

Cada fila TRANS se conserva como un viaje con clave estable `ENERO-2026:TRANS:fila`. El SHA256 identifica el archivo analizado; un futuro importador debe comprobarlo y mantener una tabla de correspondencia con restricción única para garantizar idempotencia. Las claves en un CSV por sí solas no impiden duplicados en BD.

Las distancias se obtienen del catálogo DATOS y se dividen entre ida y vuelta. No se usa como distancia de catálogo el kilometraje prorrateado de TRANS. Si falta distancia no se inventa; se registra incidencia. Los kilómetros propuestos suman solo filas con trayecto encontrado.

Los valores de fórmulas son sus cachés guardadas en Excel. Se verifica galones × tarifa contra transporte con tolerancia de un centavo. Se conservan importes originales en staging; los totales se redondean a dos decimales. No se recalculan costos históricos con las configuraciones actuales.

Las hojas de resumen, plantillas, cheques y respaldos no son transacciones automáticamente importables. `finanzas_revision.json` es extracción para revisión, no instrucciones de importación. Los tipos de remuneración y el importe histórico de $34,51 diarios están confirmados. Sueldos y anticipos ya están excluidos. Siguen pendientes las excepciones de cobertura y la conciliación financiera.

## Conciliación reproducible

`python conciliar-enero.py "ruta/ENERO -2026-new.xlsm" --salida "directorio-local"`

Ejecuta la auditoría y genera `CONCILIACION.md`, empresas propuestas, cobertura diaria de viáticos, facturas de clientes y pagos de proveedores para revisión. Comprueba los totales acordados de viajes, galones, transporte y gastos. No conecta a la base de datos. El importe histórico queda en choferes.csv; vehiculos.csv incluye placas reconocidas de gastos aunque no tengan viajes.

La cobertura conserva la fecha original del desembolso; usa fechas explícitas en observaciones y bloques consecutivos aprobados. Detecta coberturas superpuestas y días sin viajes, sin borrar desembolsos. Confirmado el 16/11/2026: comprobante 1626 de ESPINOZA cubre 2 y 3 de enero ($24 viáticos + $30 peajes); comprobante 1653 de PEREZ cubre domingo 11 ($12 + $28), conservando desembolso el 12. Peajes se consignan una sola vez por desembolso, no en cada día.

Los duplicados confirmados de cheques 816 (filas 5/11) y 817 (6/12) se separan en pagos_proveedores_duplicados_omitidos.csv. Se mantienen los originales 5 y 6 en la propuesta; las copias 11 y 12 no se suman como nuevos pagos. Se comprueba que el total omitido sea $2.043. Los demás posibles duplicados requieren revisión.

Los posibles duplicados de cheques se señalan, no se eliminan. La conciliación financiera usa CHEQUES; REGISTRO CHEQUES está oculta en este archivo y no se utiliza como otra fuente de pagos. Facturas anuladas sin identificación suficiente y movimientos de bancarización quedan por revisar. Las salidas son propuestas, no un importador terminado.

Si existe `peajes_bd.json` en la salida, resume la instantánea de configuración previamente consultada. No realiza reparto con ceros provisionales ni asigna un gasto de varios días a una fecha inventada.
