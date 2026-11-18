import { useRef, useState } from 'react';
import { CatalogoForm } from './CatalogoForm.jsx';
import { Selector } from '../MarcaModeloForm/Selector.jsx';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import '../MarcaModeloForm/marca-modelo.css';

// Cada descriptor conserva su propia API y, opcionalmente, una dependencia.
export function CatalogosInlineForm({ fields, form, catalogos, saving, onBusy, descriptors }) {
    const [options, setOptions] = useState(catalogos);
    const [error, setError] = useState('');
    const lock = useRef(false);
    const { permisos } = useAuth();
    const select = (name, value) => {
        form.change({ target: { name, value } });
        descriptors.filter(item => item.parent === name).forEach(item =>
            form.change({ target: { name: item.name, value: '' } }));
    };
    const run = async operation => {
        if (lock.current) return false;
        lock.current = true;
        onBusy?.(true);
        setError('');
        try {
            await operation();
            return true;
        } catch (error) {
            setError(error.message);
            return false;
        } finally {
            lock.current = false;
            onBusy?.(false);
        }
    };
    const remember = (item, row) => setOptions(previous => ({ ...previous,
        [item.name]: [...(previous[item.name] ?? []).filter(option => String(option.value) !== String(row[item.name])),
            { value: String(row[item.name]), label: row.nombre, registro: row }]
            .sort((a, b) => a.label.localeCompare(b.label))
    }));
    return <>
        {error && <p role="alert">{error}</p>}
        <CatalogoForm fields={fields} values={form.values} change={form.change} saving={saving} catalogos={catalogos}
            renderField={field => {
                const item = descriptors.find(item => item.name === field.name);
                if (!item) return null;
                const parentValue = item.parent ? form.values[item.parent] : null;
                const rows = (options[item.name] ?? []).filter(row => !item.parent || String(row.registro[item.parent]) === String(parentValue));
                return <Selector key={`${item.name}-${parentValue}`} label={item.label} rows={rows}
                    value={form.values[item.name]} required={field.required} permisos={permisos} disabled={saving}
                    parentReady={!item.parent || Boolean(parentValue)} parentLabel={item.parentLabel}
                    onSelect={value => select(item.name, value)}
                    onCreate={nombre => run(async () => {
                        const row = await item.api.crear({ nombre, ...(item.parent ? { [item.parent]: parentValue } : {}) });
                        remember(item, row);
                        select(item.name, String(row[item.name]));
                    })}
                    onUpdate={(row, patch) => run(async () => {
                        remember(item, await item.api.actualizar(row.value, { nombre: row.registro.nombre, estado: row.registro.estado,
                            ...(item.parent ? { [item.parent]: parentValue } : {}), ...patch }));
                    })}
                    onDelete={row => run(async () => {
                        await item.api.eliminar(row.value);
                        setOptions(previous => ({ ...previous, [item.name]: previous[item.name].filter(option => option.value !== row.value) }));
                        select(item.name, '');
                    })} />;
            }} />
    </>;
}
