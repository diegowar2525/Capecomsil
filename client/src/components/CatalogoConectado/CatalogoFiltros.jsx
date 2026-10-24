import { useId } from 'react';
import { opcionesFiltro } from '../../domain/catalogoFiltros.js';

export function CatalogoFiltros({ title, data, filters, state, loading, error, refreshDisabled, onRefresh }) {
    const id = useId();
    return <div className="catalogo-filtros" role="group" aria-label={`Filtros de ${title}`}>
        <div className="catalogo-filtros-grid">
            <label className="form-group" htmlFor={`${id}-search`}>
                <span className="form-label">Buscar</span>
                <input id={`${id}-search`} type="search" className="form-control" placeholder="Buscar registro…"
                    value={state.search} onChange={(event) => state.setSearch(event.target.value)} />
            </label>
            {filters.map((filter) => <label className="form-group" key={filter.name} htmlFor={`${id}-${filter.name}`}>
                <span className="form-label">{filter.label}</span>
                {filter.type === 'text'
                    ? <input id={`${id}-${filter.name}`} className="form-control" value={state.values[filter.name] ?? ''}
                        onChange={(event) => state.change(filter.name, event.target.value)} />
                    : <select id={`${id}-${filter.name}`} className="form-select" value={state.values[filter.name] ?? ''}
                        onChange={(event) => state.change(filter.name, event.target.value)}>
                        <option value="">Todos</option>
                        {opcionesFiltro(filter, data).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>}
            </label>)}
            <label className="form-group" htmlFor={`${id}-order`}>
                <span className="form-label">Orden por ID</span>
                <select id={`${id}-order`} className="form-select" value={state.order} onChange={(event) => state.setOrder(event.target.value)}>
                    <option value="desc">Descendente (mayor primero)</option>
                    <option value="asc">Ascendente (menor primero)</option>
                </select>
            </label>
        </div>
        <div className="toolbar-filters">
            <div className="record-actions">
                <button type="button" className="btn btn-outline" onClick={state.reset}>Limpiar filtros</button>
                <button type="button" className="btn btn-outline" disabled={loading || refreshDisabled} onClick={onRefresh}>Actualizar listado</button>
            </div>
            {!loading && !error && <span role="status">{state.visible.length} de {data.length} registros</span>}
        </div>
    </div>;
}
