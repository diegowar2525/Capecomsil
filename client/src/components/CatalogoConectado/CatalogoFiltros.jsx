import { useId } from 'react';
import { opcionesFiltro } from '../../domain/catalogoFiltros.js';

function FilterField({ filter, data, state, id }) {
    return <label className="form-group" htmlFor={id}>
        <span className="form-label">{filter.label}</span>
        {filter.type === 'text' || filter.type === 'number'
            ? <input id={id} type={filter.type} min={filter.type === 'number' ? 0 : undefined} step={filter.type === 'number' ? 'any' : undefined}
                className="form-control" value={state.values[filter.name] ?? ''}
                onChange={(event) => state.change(filter.name, event.target.value)} />
            : <select id={id} className="form-select" value={state.values[filter.name] ?? ''}
                onChange={(event) => state.change(filter.name, event.target.value)}>
                <option value="">Todos</option>
                {opcionesFiltro(filter, data).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>}
    </label>;
}

export function CatalogoFiltros({ title, data, filters, state, loading, error, refreshDisabled, onRefresh }) {
    const id = useId();
    const primary = filters.filter((filter) => filter.name === 'estado');
    const additional = filters.filter((filter) => filter.name !== 'estado');
    const additionalCount = additional.filter((filter) => state.values[filter.name] !== undefined && state.values[filter.name] !== '').length;
    const orderLabel = `Orden actual: ID ${state.order === 'asc' ? 'ascendente' : 'descendente'}. Cambiar a ${state.order === 'asc' ? 'descendente' : 'ascendente'}`;
    return <div className="catalogo-filtros" role="group" aria-label={`Filtros de ${title}`}>
        <div className="catalogo-filtros-toolbar">
            <label className="form-group catalogo-search" htmlFor={`${id}-search`}>
                <span className="form-label">Buscar</span>
                <input id={`${id}-search`} type="search" className="form-control" placeholder="Buscar registro…"
                    value={state.search} onChange={(event) => state.setSearch(event.target.value)} />
            </label>
            {primary.map((filter) => <FilterField key={filter.name} filter={filter} data={data} state={state} id={`${id}-${filter.name}`} />)}
            <button type="button" className="btn btn-outline catalogo-order" title={orderLabel} aria-label={orderLabel}
                onClick={() => state.setOrder(state.order === 'asc' ? 'desc' : 'asc')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d={state.order === 'asc' ? 'M6 19V5m-4 4 4-4 4 4' : 'M6 5v14m-4-4 4 4 4-4'} />
                    <path d="M13 6h3m-3 6h5m-5 6h8" />
                </svg>
            </button>
        </div>
        {additional.length > 0 && <details className="catalogo-filtros-more">
            <summary>Más filtros{additionalCount ? ` (${additionalCount} activos)` : ''}</summary>
            <div className="catalogo-filtros-grid">{additional.map((filter) =>
                <FilterField key={filter.name} filter={filter} data={data} state={state} id={`${id}-${filter.name}`} />
            )}</div>
        </details>}
        <div className="toolbar-filters">
            <div className="record-actions">
                <button type="button" className="btn btn-outline" onClick={state.reset}>Limpiar filtros</button>
                <button type="button" className="btn btn-outline" disabled={loading || refreshDisabled} onClick={onRefresh}>Actualizar listado</button>
            </div>
            {!loading && !error && <span role="status">{state.visible.length} de {data.length} registros</span>}
        </div>
    </div>;
}
