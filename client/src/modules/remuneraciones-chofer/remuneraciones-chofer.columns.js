const dinero = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
export const columns = [
    {
        "key": "id_remuneracion_chofer",
        "label": "Código"
    },
    {
        "key": "nombre_chofer",
        "label": "Chofer"
    },
    {
        "key": "fecha",
        "label": "Fecha"
    },
    {
        "key": "total",
        render: row => dinero.format(Number(row.total ?? 0)),
        "label": "Total"
    },
    {
        "key": "costo_asignado",
        render: row => dinero.format(Number(row.costo_asignado ?? 0)),
        "label": "Distribuido en viajes"
    },
    {
        "key": "costo_sin_asignar",
        render: row => dinero.format(Number(row.costo_sin_asignar ?? 0)),
        "label": "Sin distribuir en viajes"
    }
];
