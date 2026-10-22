import { Dashboard } from '../modules/dashboard/DashboardPage.jsx';
import { Viajes } from '../modules/viajes/ViajesPage.jsx';
import { CostosViajePage } from '../modules/costos-viaje/CostosViajePage.jsx';
import { LiquidacionesPage } from '../modules/liquidaciones/LiquidacionesPage.jsx';
import { FacturacionPage } from '../modules/facturacion/FacturacionPage.jsx';
import { PagosPage } from '../modules/pagos/PagosPage.jsx';
import { FacturasProveedoresPage } from '../modules/facturas-proveedores/FacturasProveedoresPage.jsx';
import { PagosProveedoresPage } from '../modules/pagos-proveedores/PagosProveedoresPage.jsx';
import { GastosPage } from '../modules/gastos/GastosPage.jsx';
import { MantenimientoPage } from '../modules/mantenimiento/MantenimientoPage.jsx';
import { VehiculosPage } from '../modules/vehiculos/VehiculosPage.jsx';
import { ChoferesPage } from '../modules/choferes/ChoferesPage.jsx';
import { GasolinerasPage } from '../modules/gasolineras/GasolinerasPage.jsx';
import { TerminalesPage } from '../modules/terminales/TerminalesPage.jsx';
import { ProductosPage } from '../modules/productos/ProductosPage.jsx';
import { ProveedoresPage } from '../modules/proveedores/ProveedoresPage.jsx';

export const routes = [
    { path: '/dashboard', label: "Dashboard", section: "General", Component: Dashboard },
    { path: '/viajes', label: "Viajes", section: "Operaciones", Component: Viajes },
    { path: '/costos-viaje', label: "Costos de Viaje", section: "Operaciones", Component: CostosViajePage },
    { path: '/liquidaciones', label: "Liquidaciones", section: "Operaciones", Component: LiquidacionesPage },
    { path: '/mantenimiento', label: "Mantenimiento", section: "Operaciones", Component: MantenimientoPage },
    { path: '/facturacion', label: "Facturación Clientes", section: "Finanzas y Facturación", Component: FacturacionPage },
    { path: '/pagos', label: "Cobros / Pagos", section: "Finanzas y Facturación", Component: PagosPage },
    { path: '/facturas-proveedores', label: "Facturas Proveedores", section: "Finanzas y Facturación", Component: FacturasProveedoresPage },
    { path: '/pagos-proveedores', label: "Pagos Proveedores", section: "Finanzas y Facturación", Component: PagosProveedoresPage },
    { path: '/gastos', label: "Gastos Operativos", section: "Finanzas y Facturación", Component: GastosPage },
    { path: '/vehiculos', label: "Vehículos / Tanqueros", section: "Catálogos", Component: VehiculosPage },
    { path: '/choferes', label: "Choferes", section: "Catálogos", Component: ChoferesPage },
    { path: '/gasolineras', label: "Gasolineras / Clientes", section: "Catálogos", Component: GasolinerasPage },
    { path: '/terminales', label: "Terminales de Carga", section: "Catálogos", Component: TerminalesPage },
    { path: '/productos', label: "Productos (Combustibles)", section: "Catálogos", Component: ProductosPage },
    { path: '/proveedores', label: "Proveedores", section: "Catálogos", Component: ProveedoresPage },
];
