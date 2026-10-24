import { useId } from 'react';

export function CatalogoPaginacion({ state, disabled }) {
    const id = useId();
    const { currentPage, totalPages, pageSize, from, to, total } = state.pagination;
    return <nav className="catalogo-pagination" aria-label="Paginación del catálogo">
        <label htmlFor={id}>Por página
            <select id={id} className="form-select" value={pageSize} disabled={disabled}
                onChange={(event) => state.setPageSize(event.target.value)}>
                {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
        </label>
        <span role="status">{from}–{to} de {total} · Página {currentPage} de {totalPages}</span>
        <div className="record-actions">
            <button type="button" className="btn btn-outline" disabled={disabled || currentPage === 1} onClick={() => state.setPage(1)} aria-label="Primera página">«</button>
            <button type="button" className="btn btn-outline" disabled={disabled || currentPage === 1} onClick={() => state.setPage(currentPage - 1)} aria-label="Página anterior">‹</button>
            <button type="button" className="btn btn-outline" disabled={disabled || currentPage === totalPages} onClick={() => state.setPage(currentPage + 1)} aria-label="Página siguiente">›</button>
            <button type="button" className="btn btn-outline" disabled={disabled || currentPage === totalPages} onClick={() => state.setPage(totalPages)} aria-label="Última página">»</button>
        </div>
    </nav>;
}
