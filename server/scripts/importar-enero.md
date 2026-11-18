# Ensayo de importación de enero de 2026

El comando solo admite bases `capecomsil_ensayo_enero_*` y rechaza DB_NAME. No borra bases, tablas ni registros. Usa credenciales de server/.env sin imprimirlas. Un fallo revierte esquema y carga mediante transacción; puede quedar una base vacía creada por el ensayo.

Preparar desde la raíz:

```powershell
python server/scripts/preparar-importacion-enero.py "ruta/ENERO -2026-new.xlsm" --salida .local-migracion/enero-2026-sin-descuento
```

Ejecutar desde server, dos veces para comprobar repetición:

```powershell
node scripts/importar-enero.js --base capecomsil_ensayo_enero_20261117 --datos ../.local-migracion/enero-2026-sin-descuento/importacion.json --crear
```

La primera ejecución instala database/schema.sql en una base vacía, sin seed ni desactivar validaciones. Carga catálogos, tarifas, recorridos, viajes, costos históricos, remuneraciones diarias, gastos, documentos históricos y movimientos financieros de enero. Cada inserción explícita tiene correspondencia en importacion_origen. Las asignaciones salariales se generan con recalcular_remuneracion; no se insertan de nuevo como gastos.

El lote guarda el hash del paquete y del libro. Una segunda ejecución del mismo lote verifica sin insertar; un paquete diferente o una base ajena al importador se rechaza. RESULTADO_IMPORTACION.json contiene totales, saldos y conteos reales comparables entre ejecuciones. No se admiten cambios silenciosos del libro aprobado.

## Alcance y límites

- La factura 133 pertenece a MAXFUEL y permanece histórica sin entregas ficticias. La 135 se reconstruye mediante el circuito normal con la entrega comprobada TRANS!111: única entrega Cadme de enero, 10.000 galones y $350. La liquidación confirmada retiene $3,50 y se vincula a la factura de $346,50. Se conservan fecha de emisión y cobro originales. La observación distingue las fechas de reconstrucción de eventos históricos desconocidos. Las referencias al libro quedan en importacion_origen y en el lote.
- La verificación consulta las entregas disponibles y exige que Cadme no aparezca. También intenta reutilizar la entrega dentro de un savepoint y exige el rechazo liquidacion_entrega_ocupada; el intento se revierte. Los conteos reales incluyen liquidacion, detalle_liquidacion y factura_liquidacion para comprobar idempotencia.
- Proveedores: documentos con pagos en enero, cuotas anteriores conocidas como saldo inicial, pagos posteriores excluidos. Los saldos son los de este conjunto documental al terminar enero, no una afirmación de deuda completa de toda la empresa.
- IESS conserva sus documentos CP como referencias históricas, sin inventar detalles de compra. Por decisión posterior, AREVALO queda sin descuento salarial: se conserva el pago de $120,71, la remuneración completa y se exige que importacion_descuento_chofer esté vacía.
- Se usa configuración histórica de combustible del libro. Si el prorrateo fuente es cero no se inventa consumo. Los desembolsos de combustible son gastos históricos y no crean abastecimientos.
- Remuneración base aprobada $34,51. No se añaden extras no documentados ni feriados inferidos. Configuraciones limitadas a enero para no extrapolar automáticamente importes históricos.
- No se crean usuarios, contraseñas ni permisos adicionales. No se cambia la conexión del servidor de la aplicación.
- Este comando no está habilitado para sustituir la base de producción. La promoción exige revisar los resultados y preparar respaldo/restauración por separado.

## Reemplazo autorizado de la base ficticia

El 17/11/2026 el usuario autorizó omitir el respaldo y descartar usuarios/configuraciones anteriores. `promover-enero.js` revisa exclusivamente el ensayo capecomsil_ensayo_enero_20261117 y el destino local capecomsildb. Sin argumento solo verifica; `--aplicar-reemplazo-autorizado` clona primero el ensayo, compara todas las tablas y secuencias, elimina el destino y renombra la copia. No se utiliza para incorporar datos a una base con información real ni para mezclar usuarios.

El resultado local queda en RESULTADO_REEMPLAZO.json. La creación del primer usuario se hace por el comando interactivo `npm run crear-jefe`, sin contraseñas en argumentos.
