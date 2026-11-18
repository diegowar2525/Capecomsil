# 041 — Empresas y facturación agrupada

Aplicar las migraciones anteriores hasta 040 y después ejecutar 041_empresas_facturacion_agrupada.sql sobre la base elegida. El script usa una transacción. Una base nueva utiliza schema.sql, que ya incluye este cambio; no ejecutar 041 nuevamente sobre ella.

La migración no fue aplicada automáticamente a la base de trabajo. Respaldar antes de aplicarla sobre datos que se quieran conservar.

## Conversión

- Crea empresa y relaciona las gasolineras con ella.
- Agrupa gasolineras por RUC no vacío. Sin RUC, crea una empresa separada por estación.
- Usa el nombre de una estación como razón social provisional: revisar y corregir desde Empresas / Clientes.
- Conserva facturas existentes y convierte su liquidación en una asociación en factura_liquidacion.
- Reemplaza factura.id_liquidacion por factura.id_empresa y la tabla de asociaciones.
- Valida una o más liquidaciones confirmadas de la misma empresa, importes agregados y una sola factura vigente por liquidación.
- Conserva cobros y anulación; no reparte los cobros entre estaciones.

Actualizar servidor y frontend junto con la migración, porque cambió el contrato de creación de facturas a id_empresa + id_liquidaciones.

La columna antigua gasolinera.ruc permanece por compatibilidad. Las consultas y formularios usan el RUC de empresa. Las altas/ediciones por API requieren empresa; el esquema permite gasolineras sin empresa transitoriamente para cargas heredadas, que no podrán facturarse hasta asociarlas.

## Revisión posterior

```sql
SELECT e.id_empresa, e.nombre, e.ruc, g.id_gasolinera, g.nombre AS gasolinera
FROM empresa e LEFT JOIN gasolinera g USING (id_empresa)
ORDER BY e.id_empresa, g.id_gasolinera;
```

No agrega documentos históricos sin liquidación ni ejecuta la importación de Excel.
