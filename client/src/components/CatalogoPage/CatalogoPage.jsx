import React, { useState } from 'react';
import { PageHeader } from '../PageHeader/PageHeader';
import { DataTable } from '../DataTable/DataTable';
import { Modal } from '../Modal/Modal';
import { FormField } from '../FormField/FormField.jsx';

export function CatalogoPage({ title, subtitle, actionLabel, columns = [], fields = [], rowKey = 'id' }) {
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

            <DataTable columns={columns} data={[]} rowKey={rowKey} />

            <Modal
                isOpen={isModalOpen}
                title={actionLabel}
                onClose={() => setIsModalOpen(false)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-primary" disabled title="Conexión con la API pendiente">Guardar</button>
                    </>
                }
            >
                <form className="form-grid">
                    {fields.map((field) => (
                        <FormField key={field.name} {...field} />
                    ))}
                </form>
            </Modal>
        </div>
    );
}
