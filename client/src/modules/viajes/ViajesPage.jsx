import { ViajeForm } from './components/ViajeForm.jsx';
import { columns } from './viajes.columns.js';
import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';
import { Modal } from '../../components/Modal/Modal';

export function Viajes({ viajes = [], catalogos = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);


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
                    placeholder="Buscar por número de viaje, placa o chofer..."
                />
                <select className="form-select">
                    <option value="">Todos los estados</option>
                    <option value="REGISTRADO">Registrado</option>
                    <option value="ANULADO">Anulado</option>
                </select>
            </div>

            <DataTable rowKey="id_viaje" columns={columns} data={viajes} />

            <Modal
                isOpen={isModalOpen}
                title="Nuevo Viaje"
                onClose={() => setIsModalOpen(false)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-primary" disabled title="Conexión con la API pendiente">Guardar Viaje</button>
                    </>
                }
            >
                <ViajeForm catalogos={catalogos} />
            </Modal>
        </div>
    );
}
