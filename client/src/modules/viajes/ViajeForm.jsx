export function ViajeForm() {
    return (
        <form className="form-grid">
                    <div className="form-group">
                        <label className="form-label">N° Guía / Orden</label>
                        <input type="text" className="form-control" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha de Despacho</label>
                        <input type="date" className="form-control" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Vehículo / Tanquero</label>
                        <select className="form-select">
                            <option value="">Seleccionar unidad...</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Chofer Asignado</label>
                        <select className="form-select">
                            <option value="">Seleccionar chofer...</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Terminal de Carga</label>
                        <select className="form-select">
                            <option value="">Seleccionar terminal...</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Estación / Gasolinera Destino</label>
                        <select className="form-select">
                            <option value="">Seleccionar cliente...</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Producto</label>
                        <select className="form-select">
                            <option value="">Seleccionar combustible...</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cantidad (Galones)</label>
                        <input type="number" className="form-control" />
                    </div>
                </form>
    );
}
