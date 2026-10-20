import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';
import { Modal } from '../../components/Modal/Modal';

export function Viajes({ viajes = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columns = [
        { key: 'guia', label: 'Guía Remisión' },
        { key: 'fecha', label: 'Fecha Salida' },
        { key: 'chofer', label: 'Chofer' },
        { key: 'vehiculo', label: 'Tanquero' },
        { key: 'terminal', label: 'Terminal Origen' },
        { key: 'gasolinera', label: 'Destino (Cliente)' },
        { key: 'producto', label: 'Producto' },
        { key: 'galones', label: 'Galones' },
        { key: 'estado', label: 'Estado' },
    ];

    return (
        <div>
            <PageHeader
                title="Gestión de Viajes"
                subtitle="Control de despachos desde terminales hacia estaciones de servicio"
                actionLabel="Registrar Viaje"
                onAction={() => setIsModalOpen(true)}
            />

            <div className="toolbar-filters">
                <input
                    type="search"
                    className="search-input"
                    placeholder="Buscar por guía, placa o chofer..."
                />
                <select className="form-select">
                    <option value="">Todos los estados</option>
                    <option value="programado">Programado</option>
                    <option value="en_ruta">En Ruta</option>
                    <option value="entregado">Entregado</option>
                    <option value="liquidado">Liquidado</option>
                </select>
            </div>

            <DataTable columns={columns} data={viajes} />

            <Modal
                isOpen={isModalOpen}
                title="Nuevo Viaje"
                onClose={() => setIsModalOpen(false)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary">Guardar Viaje</button>
                    </>
                }
            >
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
            </Modal>
        </div>
    );
}