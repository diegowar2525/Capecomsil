import { useState } from 'react';
import { filtrarOrdenarCatalogo } from '../domain/catalogoFiltros.js';

export function useCatalogoFiltros(data, columns, rowKey, filters) {
    const [search, setSearch] = useState('');
    const [values, setValues] = useState({});
    const [order, setOrder] = useState('asc');
    const change = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));
    const reset = () => { setSearch(''); setValues({}); setOrder('asc'); };
    const active = Boolean(search.trim() || Object.values(values).some((value) => value !== ''));
    const visible = filtrarOrdenarCatalogo(data, { columns, rowKey, filters, search, values, order });
    return { search, setSearch, values, change, order, setOrder, reset, active, visible };
}
