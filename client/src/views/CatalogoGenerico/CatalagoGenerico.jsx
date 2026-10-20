import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';
import { Modal } from '../../components/Modal/Modal';

export function CatalogoGenerico({ title, subtitle, actionLabel, columns = [], fields = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <PageHeader
                title={title}
                subtitle={subtitle}
                actionLabel={actionLabel}
                onAction={() => setIsModalOpen(true)}
            />

            <div className="toolbar-filters">
                <input
                    type="search"
                    className="search-input"
                    placeholder="Buscar registro..."
                />
            </div>

            <DataTable columns={columns} data={[]} />

            <Modal
                isOpen={isModalOpen}
                title={actionLabel}
                onClose={() => setIsModalOpen(false)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary">Guardar</button>
                    </>
                }
            >
                <form className="form-grid">
                    {fields.map((field) => (
                        <div key={field.name} className="form-group">
                            <label className="form-label">{field.label}</label>
                            <input type={field.type || 'text'} className="form-control" />
                        </div>
                    ))}
                </form>
            </Modal>
        </div>
    );
}