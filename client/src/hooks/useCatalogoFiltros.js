import { useState } from 'react';
import { filtrarOrdenarCatalogo, paginarCatalogo } from '../domain/catalogoFiltros.js';

export function useCatalogoFiltros(data, columns, rowKey, filters) {
    const [search, updateSearch] = useState('');
    const [values, setValues] = useState({});
    const [order, updateOrder] = useState('asc');
    const [page, setPage] = useState(1);
    const [pageSize, updatePageSize] = useState(10);
    const setSearch = (value) => { updateSearch(value); setPage(1); };
    const setOrder = (value) => { updateOrder(value); setPage(1); };
    const setPageSize = (value) => { updatePageSize(Number(value)); setPage(1); };
    const change = (name, value) => { setValues((previous) => ({ ...previous, [name]: value })); setPage(1); };
    const reset = () => { updateSearch(''); setValues({}); updateOrder('asc'); setPage(1); };
    const count = Object.values(values).filter((value) => value !== '').length;
    const active = Boolean(search.trim() || count);
    const visible = filtrarOrdenarCatalogo(data, { columns, rowKey, filters, search, values, order });
    const pagination = paginarCatalogo(visible, page, pageSize);
    return { search, setSearch, values, change, order, setOrder, reset, active, count, visible, pagination, setPage, setPageSize };
}
