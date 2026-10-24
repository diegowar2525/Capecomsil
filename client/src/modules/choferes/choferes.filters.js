import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"tipo_remuneracion","label":"Remuneración","options":[{"value":"DIARIO_FIJO","label":"Diario fijo"},{"value":"DIA_TRABAJADO","label":"Día trabajado"}]}
];
