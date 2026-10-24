
export const crudActions = [
    {
        id: 'detail',
        label: 'Ver detalle',
        icon: 'eye',
        readOnly: true
    },
    {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
        useFields: true
    },
    {
        id: 'delete',
        label: 'Eliminar',
        icon: 'trash',
        message: 'Se solicitará eliminar este registro. El servidor comprobará si tiene dependencias.'
    }
];
