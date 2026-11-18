# RUC compartido entre gasolineras

Retira la unicidad del RUC exclusivamente en gasolinera. Las estaciones siguen identificadas por id_gasolinera; tarifas, entregas y liquidaciones conservan esa relación. No se fusionan estaciones y no se modifica la unicidad del RUC de proveedores. El RUC sigue siendo obligatorio en la API de gasolineras.

Aplicar 040_gasolineras_ruc_compartido.sql sobre una base existente. No aplicada durante la preparación del Excel.
