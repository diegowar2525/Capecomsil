export function CatalogoDetalle({ columns, fields, registro }) {
    const campos = [...columns, ...fields.filter((field) => !['rows', 'group'].includes(field.type) && !field.multiple && !columns.some((column) => column.key === field.name))
        .map((field) => ({ key: field.name, label: field.label }))];
    return <dl className="record-detail">{campos.map(({ key, label }) => <div key={key}>
        <dt>{label}</dt><dd>{typeof registro[key] === 'boolean' ? (registro[key] ? 'Activo' : 'Inactivo') : registro[key] ?? '—'}</dd>
    </div>)}</dl>;
}
