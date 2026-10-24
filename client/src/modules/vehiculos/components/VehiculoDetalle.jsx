import { columns } from '../vehiculos.columns.js';

export function VehiculoDetalle({ vehiculo, campos = [...columns, { key: 'imagen_url', label: 'URL de imagen' }] }) {
    return <dl className="record-detail">{campos.map(({ key, label }) => <div key={key}>
        <dt>{label}</dt><dd>{typeof vehiculo[key] === 'boolean' ? (vehiculo[key] ? 'Activo' : 'Inactivo') : vehiculo[key] ?? '—'}</dd>
    </div>)}</dl>;
}
