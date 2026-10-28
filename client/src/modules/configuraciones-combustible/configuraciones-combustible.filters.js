import { rangoFechas, rangoImporte } from '../../domain/filtrosOperativos.js';

export const filters = [...rangoFechas('fecha_inicio'), ...rangoImporte('precio_por_galon','Precio por galón'), ...rangoImporte('consumo_galones_km','Consumo')];
