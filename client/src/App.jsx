import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './views/Dashboard/Dashboard';
import { Viajes } from './views/Viajes/Viajes';
import { CatalogoGenerico } from './views/CatalogoGenerico/CatalagoGenerico';

const VIEW_CONFIGS = {
  'costos-viaje': {
    title: 'Costos de Viaje',
    subtitle: 'Control de viáticos, peajes y consumo por ruta',
    actionLabel: 'Registrar Costo',
    columns: [
      { key: 'viaje', label: 'Viaje' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'monto', label: 'Monto' },
      { key: 'fecha', label: 'Fecha' },
    ],
  },
  liquidaciones: {
    title: 'Liquidaciones de Viajes',
    subtitle: 'Cierre operativo y cuadre de valores entregados vs. gastados',
    actionLabel: 'Nueva Liquidación',
    columns: [
      { key: 'codigo', label: 'N° Liquidación' },
      { key: 'chofer', label: 'Chofer' },
      { key: 'viaje', label: 'Viaje Asociado' },
      { key: 'anticipo', label: 'Anticipo' },
      { key: 'gastos', label: 'Gastos Justificados' },
      { key: 'saldo', label: 'Saldo a Liquidar' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  facturacion: {
    title: 'Facturación a Clientes',
    subtitle: 'Emisión y control de facturas por fletes de combustible',
    actionLabel: 'Nueva Factura',
    columns: [
      { key: 'numero', label: 'N° Factura' },
      { key: 'cliente', label: 'Gasolinera / Cliente' },
      { key: 'fecha', label: 'Fecha Emisión' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'total', label: 'Total' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  pagos: {
    title: 'Cobros y Pagos de Clientes',
    subtitle: 'Registro de abonos y cancelaciones de facturas emitidas',
    actionLabel: 'Registrar Cobro',
    columns: [
      { key: 'referencia', label: 'Referencia' },
      { key: 'factura', label: 'Factura' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'metodo', label: 'Método de Pago' },
      { key: 'monto', label: 'Monto' },
    ],
  },
  'facturas-proveedores': {
    title: 'Facturas de Proveedores',
    subtitle: 'Registro de compras de insumos, repuestos y servicios',
    actionLabel: 'Registrar Factura Compra',
    columns: [
      { key: 'numero', label: 'N° Documento' },
      { key: 'proveedor', label: 'Proveedor' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'total', label: 'Total' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  'pagos-proveedores': {
    title: 'Pagos a Proveedores',
    subtitle: 'Historial de desembolsos a proveedores',
    actionLabel: 'Registrar Pago',
    columns: [
      { key: 'comprobante', label: 'N° Comprobante' },
      { key: 'proveedor', label: 'Proveedor' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'monto', label: 'Monto' },
    ],
  },
  gastos: {
    title: 'Gastos Operativos',
    subtitle: 'Administración de egresos generales de operación',
    actionLabel: 'Nuevo Gasto',
    columns: [
      { key: 'categoria', label: 'Categoría' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'monto', label: 'Monto' },
    ],
  },
  mantenimiento: {
    title: 'Mantenimiento de Flota',
    subtitle: 'Control preventivo y correctivo de unidades',
    actionLabel: 'Registrar Mantenimiento',
    columns: [
      { key: 'vehiculo', label: 'Vehículo' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'taller', label: 'Taller / Proveedor' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'costo', label: 'Costo' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  vehiculos: {
    title: 'Vehículos / Tanqueros',
    subtitle: 'Catálogo de unidades de transporte y capacidades de carga',
    actionLabel: 'Nuevo Vehículo',
    columns: [
      { key: 'placa', label: 'Placa' },
      { key: 'marca', label: 'Marca / Modelo' },
      { key: 'capacidad', label: 'Capacidad (Gal)' },
      { key: 'compartimentos', label: 'Compartimentos' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  choferes: {
    title: 'Catálogo de Choferes',
    subtitle: 'Conductores habilitados para transporte de hidrocarburos',
    actionLabel: 'Nuevo Chofer',
    columns: [
      { key: 'identificacion', label: 'Cédula / ID' },
      { key: 'nombre', label: 'Nombres Completos' },
      { key: 'licencia', label: 'Tipo Licencia' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  gasolineras: {
    title: 'Gasolineras / Clientes',
    subtitle: 'Estaciones de servicio y puntos de descarga autorizados',
    actionLabel: 'Nueva Gasolinera',
    columns: [
      { key: 'ruc', label: 'RUC' },
      { key: 'nombre', label: 'Estación de Servicio' },
      { key: 'ciudad', label: 'Ciudad / Ruta' },
      { key: 'contacto', label: 'Contacto' },
    ],
  },
  terminales: {
    title: 'Terminales de Carga',
    subtitle: 'Centros de abastecimiento y despacho de combustible',
    actionLabel: 'Nueva Terminal',
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'nombre', label: 'Nombre Terminal' },
      { key: 'ubicacion', label: 'Ubicación' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  productos: {
    title: 'Productos (Combustibles)',
    subtitle: 'Tipos de derivados transportados (Extra, Ecopaís, Súper, Diésel)',
    actionLabel: 'Nuevo Producto',
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'nombre', label: 'Producto' },
      { key: 'tarifaBase', label: 'Tarifa Flete / Gal' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  proveedores: {
    title: 'Proveedores',
    subtitle: 'Talleres, suministros y servicios externos',
    actionLabel: 'Nuevo Proveedor',
    columns: [
      { key: 'ruc', label: 'RUC' },
      { key: 'razonSocial', label: 'Razón Social' },
      { key: 'rubro', label: 'Rubro / Especialidad' },
      { key: 'telefono', label: 'Teléfono' },
    ],
  },
};

export function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    if (activeView === 'dashboard') return <Dashboard />;
    if (activeView === 'viajes') return <Viajes />;

    const config = VIEW_CONFIGS[activeView];
    if (config) {
      return (
        <CatalogoGenerico
          key={activeView}
          title={config.title}
          subtitle={config.subtitle}
          actionLabel={config.actionLabel}
          columns={config.columns}
          fields={config.columns.map((c) => ({ name: c.key, label: c.label }))}
        />
      );
    }

    return <Dashboard />;
  };

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onSelectView={setActiveView} />
      <div className="main-container">
        <main className="view-content">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;