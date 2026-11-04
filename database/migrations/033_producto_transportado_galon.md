# 033 — Unidad de productos transportados

Aplicar una vez a una base existente. El esquema de instalación nueva ya incluye la restricción.

Unifica galón/galon/galones (sin distinguir mayúsculas) como `galón`. Si encuentra otra unidad, cancela toda la migración para revisar los datos; no convierte cantidades.

POST/PUT de productos transportados acepta omitir unidad_medida (usa galón) o enviar las variantes anteriores, que normaliza. Otras unidades producen 400. El formulario muestra la unidad fija en creación y edición. Los productos de inventario conservan sus propias unidades.
