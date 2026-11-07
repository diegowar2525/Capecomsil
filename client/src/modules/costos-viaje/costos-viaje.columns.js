const dinero = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
export const columns = [
    {
        "key": "id_costo",
        "label": "ID"
    },
    {
        "key": "id_viaje",
        "label": "N° Viaje"
    },
    {
        "key": "tipo_costo",
        "label": "Tipo de costo"
    },
    {
        "key": "valor",
        render: row => dinero.format(Number(row.valor ?? 0)),
        "label": "Valor"
    },
    {
        "key": "descripcion",
        "label": "Descripción"
    }
];
