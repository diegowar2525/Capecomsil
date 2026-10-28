import { rangoFechas, rangoImporte } from '../../domain/filtrosOperativos.js';

export const filters = [...rangoFechas('fecha_inicio'), ...rangoImporte('importe_diario','Importe diario'), ...rangoImporte('adicional_dia_especial','Adicional')];
