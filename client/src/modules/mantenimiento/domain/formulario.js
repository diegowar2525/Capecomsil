export const servicioInicial = (descripcion = '') => ({
    tipo_concepto: 'SERVICIO', descripcion, cantidad: '1', precio_unitario: '', descuento: '0', porcentaje_impuesto: ''
});

export const indicarOpcionales = (fields, values = {}) => fields.map(field => {
    const required = Boolean(field.required || (field.requiredWhen && values[field.requiredWhen.field] === field.requiredWhen.value));
    const optional = !required && !['group','rows'].includes(field.type);
    return {...field, required,
        label: optional && !field.label.includes('(opcional)') ? `${field.label} (opcional)` : field.label,
        ...(field.fields ? {fields: indicarOpcionales(field.fields,values[field.name] ?? {})} : {})
    };
});
