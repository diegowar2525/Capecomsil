# Seed de desarrollo extraído del Excel

Fuente: `ENERO -2026-new.xlsm`. Se leyó sin modificar ni ejecutar macros.

| Entidad | Registros |
|---|---:|
| Terminal | 5 |
| Gasolinera | 17 |
| Vehículo | 8 |
| Chofer | 7 |
| Tarifa | 42 |
| Trayecto | 248 (66 del Excel + 182 entre gasolineras) |

## Criterios de carga

- Ejecutar una vez sobre una base vacía. La transacción aborta si ya hay catálogos. No modifica el esquema ni borra datos.
- Terminales y tarifas: DATOS!G3:AL21. Solo terminales identificables y precios positivos explícitos. Se omite TRONCAL - P INCA porque podría ser una variante de ruta, no otro terminal.
- Fechas de tarifa: del 1 de enero al 31 de diciembre de 2026 para pruebas, por solicitud del usuario. El archivo no contiene fechas contractuales de vigencia; la extensión hasta diciembre no procede del Excel. TRANS contiene operaciones de enero; sus 12 pares con tarifa positiva coinciden con DATOS.
- Gasolineras: DATOS!B5:F21 y nombres adicionales de reportes. Se normalizan espacios; no se reconstruyen nombres de filas vacías. Nombres de reportes históricos se conservan para pruebas sin asegurar actividad actual.
- Vehículos: DATOS!AS5:AT12. Solo placa y capacidad; no se inventan marca, modelo ni año.
- Choferes: siete nombres de TRANS!E4:E330; documentos PENDIENTE-* autorizados por el usuario. Se usa DIARIO_FIJO por remuneración fija diaria confirmada, sin incorporar importes al chofer.
- Proveedores: TEDASA y CEPSA, CLIENTES!G3:G4. Categorías, cinco productos de inventario y cuatro combustibles se conservan como ejemplos del seed previo.
- Agente de retención: SI/NO de DATOS se convierte a booleano. Para estaciones presentes solo en reportes se usa false como valor provisional del esquema, pendiente de confirmar.
- C de DATOS contiene razones sociales y algunos nombres personales: no se copia indiscriminadamente como representante legal.
- Trayectos: mitad de cada distancia positiva de ida/vuelta, en ambos sentidos, con advertencia en observacion (estimación de prueba autorizada). Ceros/vacíos no se convierten en distancias. Manta repite 130 km en el catálogo; se conserva como 65 km por sentido para pruebas, no como distancia verificada.
- El Excel no aporta distancias entre gasolineras. Se agregan 182 trayectos investigados externamente entre 14 estaciones ubicadas; tres siguen pendientes. Fuentes, método y limitaciones en [TRAYECTOS_GASOLINERAS.md](TRAYECTOS_GASOLINERAS.md).
- No se importan viajes ni TRAMO_VIAJE, porque TRANS son entregas sin identificador confiable de viaje físico.

## RUC compartidos pendientes

El esquema exige gasolinera.ruc UNIQUE. Para no asignar el RUC arbitrariamente a una sucursal, todos los establecimientos con ese RUC compartido quedan con NULL. Antes de uso real conviene revisar la relación entre establecimiento y titular fiscal.

| RUC normalizado | Establecimientos |
|---|---|
| 1291783313001 | BBHY SILVAN 1, BABA SILVAN 2 |
| 0993385138001 | 1PETRILLO, 2PETRILLO, 2JIPIJAPA, 3JIPIJAPA |

## Estaciones adicionales sin ficha completa

- SANTA MARTHA: TRANS!C4:C330. Sin RUC/dirección confirmados.
- COCHANCAY: PRODUC  GENERAL!L5. Sin RUC/dirección confirmados.
- RIRCAY: PRODUC  GENERAL!X5. Sin RUC/dirección confirmados.
- MA. DEL CISNE: RESPALDO FACTURA!E4. Sin RUC/dirección confirmados.

SANTA MARTHA tiene tarifa 0 en TRANS; no se importa como transporte gratuito. COCHANCAY y RIRCAY aparecen en cabeceras de reportes, pero no se asignan a las filas sin nombre de DATOS. MA. DEL CISNE no se fusiona con KM. 48 sin confirmación.
